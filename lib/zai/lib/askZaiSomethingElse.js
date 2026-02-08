import ollama from 'ollama';
import { stopwords } from './stopwords.js';
import { replaceWithSpace, remove } from './punctuations.js';
import { sqlRunner } from '../../dataFromZenodeo.js';
import { formatSql, unFormatSql } from '../../utils.js';

async function askZaiSomethingElse({ fastify, question, model }) {

    // This is what we will send back
    const response = {};
    const debugInfo = {};
    const context = getContext({ fastify, question, response, debugInfo });
    
    if (context) {
        const { answer, runtime } = await answerFromZai({ 
            fastify,
            question, 
            context: response_context, 
            model
        });

        response.answer = answer;
        debugInfo.answerFromZai = { question, runtime };
        return { response, debugInfo }
    }

    return { response, debugInfo }
}

function getContext({ fastify, question, response, debugInfo }) {
    const questionWithoutPuncts = removeTrailingPuncts(question);
    fastify.zlog.info(`questionWithoutPuncts: ${questionWithoutPuncts}`);

    const searchTerms = removeStopWords(questionWithoutPuncts);
    fastify.zlog.info(`query: ${searchTerms}`);

    const bigrams = extractBigrams(searchTerms);
    fastify.zlog.info(bigrams);

    const binomensMatch = buildBinomensMatch(bigrams);
    fastify.zlog.info(`binomensMatch: ${binomensMatch}`);

    const detectedBinomens = detectBinomens({ 
        fastify, binomensMatch, debugInfo 
    });

    const treatmentsFtsQry = buildTreatmentsFtsQry({ query, detectedBinomens });
    fastify.zlog.info(`treatmentsFtsQry: ${treatmentsFtsQry}`);

    const ftsCount = getFtsCount({ fastify, treatmentsFtsQry, debugInfo });
    
    if (ftsCount) {
        const context = getFtsDetails({
            fastify, treatmentsFtsQry, response, debugInfo
        });
        fastify.zlog.info(`context: ${context}`);

        response.ftsCount = ftsCount;
        return context;
    }
    else {
        response.ftsCount = 0;
        return null;
    }
}

// remove trailing punctuation
function removeTrailingPuncts(question) {
    const re = /(\?|\.)$/;

    if (re.test(question)) {
        question = question.slice(0, -1);
    }

    return question;
}

// remove stopwords
function removeStopWords(query) {
    return query

        // replace punctuations with space
        .replace(replaceWithSpace, ' ')

        // split the query into words
        .split(/ /)

        // remove words 2 characters or smaller
        .filter(word => word.length > 2)

        // remove stopwords
        .filter(word => !stopwords.includes(word.toLowerCase()))

        // join back into a string
        .join(' ');
}

function extractBigrams(query) {
    const tokens = query
        .toLowerCase()
        .replace(/[^a-z\s]/g, ' ')
        .split(/\s+/)
        .filter(Boolean);

    const bigrams = [];
    for (let i = 0; i < tokens.length - 1; i++) {
        bigrams.push(`${tokens[i]} ${tokens[i + 1]}`);
    }

    return bigrams;
}

function buildBinomensMatch(bigrams) {
    return bigrams.map(b => `"${b}"`).join(" OR ");
}

function detectBinomens({ fastify, binomensMatch, debugInfo }) {
    const sql = `
    SELECT binomen, rank
    FROM binomens
    WHERE binomens MATCH @query
    ORDER BY rank
    LIMIT 1
    `;

    const { result, runtime } = sqlRunner({
        fastify,
        sql,
        runparams: { query: binomensMatch },
        returnRows: 'one'
    });

   //const binomens = result.map(r => r.binomen );
    const binomen = result.binomen;
    fastify.zlog.info(detectedBinomens);

    debugInfo.detectBinomens = {
        sql: unFormatSql(formatSql(sql, runparams)),
        runtime
    };

    return binomen;
}

function buildTreatmentsFtsQry({ query, detectedBinomens = [] }) {
    const normalized = query
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

function getFtsCount({ fastify, treatmentsFtsQry, debugInfo }) {

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

    debugInfo.ftsCount = { 
        sql: unFormatSql(formatSql(sql, runparams)), 
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
            z.speciesDesc,
            t.fulltext
        FROM 
            treatmentsFts f 
            JOIN treatments t ON f.rowid = t.id
            JOIN journals j ON t.journals_id = j.id 
            JOIN zai.speciesDescriptions z ON t.treatmentId = z.treatmentId 
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
        sql: unFormatSql(formatSql(sql, runparams)), 
        runtime
    }

    const topRanked = result;
    fastify.zlog.info(`topRanked: ${topRanked.length} treatments`);

    sql = `
    SELECT httpUri, captionText
    FROM images
    WHERE treatments_id = @query`;
    
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
            sql: unFormatSql(formatSql(sql, runparams)), 
            runtime 
        }

        return tmp;
    }).join('\n\n');

    response.topRanked = topRanked;
    return context;
}

async function answerFromZai({ fastify, question, context, model }) {
    const systemPrompt = `You are a scientific assistant specializing in biological research. Answer questions accurately based ONLY on the provided research papers.

Rules:
- If the answer is not in the context, say "The provided documents don't contain this information."
- Cite the document number when making claims (e.g., "According to Document 2…")
- Be concise but complete
- Use scientific terminology appropriately

Context Documents:
${context}`;

    try {
        const response = await ollama.chat({
            model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: question }
            ],
            options: {
                num_ctx: 2048,
                num_thread: 8,
                temperature: 0.1
            }
        });

        return {
            
            // strip <think>, if present
            answer: response.message
                .content
                .replace(/<think>[\s\S]*?<\/think>/g, '').trim(), 
            
            // total_duration is in nanoseconds, so
            // multiply by 0.000001 to convert to ms
            runtime: Number((response.total_duration * 1e-6).toFixed(0))
        }
    }
    catch(error) {
        fastify.zlog.error(`question: ${question}`);
        fastify.zlog.error(error);
        return false;
    }

}

export { askZaiSomethingElse }