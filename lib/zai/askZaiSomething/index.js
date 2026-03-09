import ollama from 'ollama';
// import { stopwords } from './stopwords.js';
// import { replaceWithSpace, remove } from './punctuations.js';
import { sqlRunner } from '../../dataFromZenodeo.js';
import { formatSql } from '../../utils.js';
import { 
    detectBinomens, 
    getTreatmentsByBinomen,
    assembleContext
} from './lib/index.js';
import { addImagesToTreatments } from '../lib/index.js';
//import { Searcher } from '../../../bin/vectorize/lib/searcher.js';

// available models
// 'deepseek-r1:1.5b',
// 'qwen3:0.6b',
// 'qwen2.5:7b',
// 'gemma3:1b-it-qat',
// 'llama3.2:latest',
// 'llama3.2:1b'
async function askZaiSomething(fastify, question, model='gemma3:1b-it-qat') {

    // This is what we will send back
    const reply = { response: {}, debugInfo: {} };
    const context = await getContext(fastify, question, reply);
    
    if (context) {
        const res = await answerFromZai(
            fastify,
            context, 
            question,
            model,
            reply
        );

        if (res) return reply;
    }
    else {
        return 'error'
    }
    
}

async function getContext(fastify, question, reply) {
    const binomens = detectBinomens(fastify, question, reply);

    if (binomens.length) {
        fastify.zlog.info(`found binomens: ${JSON.stringify(binomens)}`);

        reply.response.treatments = binomens.map(binomen => {
            const treatments = getTreatmentsByBinomen(fastify, binomen, reply);
            return { binomen, treatments };
        });
    }
    else {
        fastify.zlog.info(`no binomens found… initiating vector search`);
        fastify.zsearch.init();
        const vectorResult = await fastify.zsearch.search(question, {
            index: 'usearch',
            topK: 10
        });
        fastify.zsearch.close();
        
        // Group treatments by binomens
        reply.response.treatmentsByBinomens = Object.values(
            vectorResult.reduce((acc, { genus, species, ...rest }) => {
                const binomen = `${genus} ${species}`;

                if (!acc[binomen]) {
                    acc[binomen] = { binomen, treatments: [] };
                }

                acc[binomen].treatments.push(rest);
                return acc;
            }, {})
        );
    }

    let context;

    if (reply.response.treatmentsByBinomens.length) {
        const treatmentsByBinomens = reply.response.treatmentsByBinomens;
        context = assembleContext(treatmentsByBinomens, question);
        const removeField = 'fulltext';
        addImagesToTreatments(fastify, question, removeField, reply);
    }
    else {
        context = undefined;
    }
    
    return context;
    
}

function buildTreatmentsFtsQry({ searchTerms, detectedBinomens = [] }) {
    const normalized = searchTerms
        .toLowerCase()
        .replace(/[^a-z\s]/g, ' ')
        .split(/\s+/)
        .filter(Boolean);

    const looseTerms = normalized.join(' ');

    if (!detectedBinomens.length) {
        // No binomen detected → plain relevance search
        return looseTerms;
    }

    const phraseBoost = detectedBinomens
        .map(b => `"${b}"`)
        .join(' OR ');

    return `${phraseBoost} OR (${looseTerms})`;
}

function getFtsCount({ fastify, treatmentsFtsQry, response, debugInfo }) {

    // First, let's find out the total number of treatments
    // MATCHing the searchTerms
    const sql = `
    SELECT Count(*) AS count
    FROM treatmentsFts  
    WHERE fulltext MATCH @query
    `;
    const runparams = { query: treatmentsFtsQry };
    const { result, runtime } = sqlRunner({
        fastify,
        sql,
        runparams,
        returnRows: 'one'
    });

    fastify.zlog.info(`treatments FTS count: ${result.count}`);
    response.ftsCount = result.count || 0;
    debugInfo.ftsCount = { 
        sql: formatSql(sql, runparams), 
        runtime
    }

    return result.count;
}

function getFtsDetails({ fastify, treatmentsFtsQry, response, debugInfo }) {
    fastify.zlog.info('getting context');
    
    // We retrieve information on the top-ranked treatment 
    // MATCHing treatmentsFtsQry.
    let sql = `
        SELECT 
            t.id AS treatments_id,
            t.treatmentId,
            t.zenodoDep,
            t.treatmentTitle, 
            t.articleTitle,
            t.articleAuthor,
            t.articleDOI,
            t.publicationDate,
            t.status,
            t.journalYear,
            j.journalTitle,
            t.fulltext
        FROM 
            treatmentsFts f 
            JOIN treatments t ON f.rowid = t.id
            JOIN journals j ON t.journals_id = j.id 
        WHERE 
            f.fulltext MATCH @query
        ORDER BY f.rank
        LIMIT 3`;

    const runparams = { query: treatmentsFtsQry };
    const { result, runtime } = sqlRunner({
        fastify,
        sql,
        runparams,
        returnRows: 'many'
    });

    debugInfo.getFtsDetails = { 
        sql: formatSql(sql, runparams), 
        runtime
    }

    const topRanked = result;
    fastify.zlog.info(`topRanked: ${topRanked.length} treatments`);

    sql = `
    SELECT httpUri, captionText
    FROM images
    WHERE treatments_id = @query`;
    
    debugInfo.images = {};
    const context = topRanked.map((record, index) => {

        // For each treatment found (in reality, only one, because 
        // of the LIMIT 1 used above), we find related images, and
        // we also get its fulltext to be used as context
        const tmp = `Document ${index + 1}:
Article Title: ${record.articleTitle} 
Publication Date: ${record.publicationDate}
Article Body: ${record.fulltext}

---
    `;

        // remove fulltext from the record because it needlessly inflates
        // the JSON to be returned
        delete record.fulltext;
        const treatments_id = record.treatments_id;
        const runparams = { query: treatments_id };
        const { result, runtime } = sqlRunner({
            fastify,
            sql,
            runparams,
            returnRows: 'many'
        });

        record.images = result;
        debugInfo.images[treatments_id] = {
            sql: formatSql(sql, runparams), 
            runtime 
        }

        return tmp;
    }).join('\n\n');

    response.topRanked = topRanked;
    return context;
}

async function answerFromZai(fastify, context, question, model, reply) {
    fastify.zlog.info(`Getting answer for: ${question}`);

    try {
        const response = await ollama.chat({
            model,
            messages: [
                { role: 'system', content: context },
                { role: 'user', content: question }
            ],
            options: {
                num_ctx: 2048,
                num_thread: 8,
                temperature: 0.1
            }
        });
            
        // strip <think>, if present
        reply.response.answer = response.message
            .content
            .replace(/<think>[\s\S]*?<\/think>/g, '').trim();
        reply.response.model = model;
        
        // total_duration is in nanoseconds, so
        // multiply by 0.000001 to convert to ms
        reply.debugInfo.answerFromZai = {
            question,
            runtime: Number((response.total_duration * 1e-6).toFixed(0))
        }

        return true;
    }
    catch(error) {
        fastify.zlog.error(`question: ${question}`);
        fastify.zlog.error(error);
        return false;
    }

}

export { askZaiSomething }