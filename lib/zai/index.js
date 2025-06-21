//import ollama from 'ollama';
import { stopwords } from './lib/stopwords.js';
import { replaceWithSpace, remove } from './lib/punctuations.js';
//import { removeStopWords, cleanText, mySnippet } from "./lib/dbFuncs.js";
import { pull } from "langchain/hub";
import { ChatOllama } from '@langchain/ollama';
import { sqlRunner } from '../dataFromZenodeo.js';
import { formatSql } from '../utils.js';
import { getDataFromZenodeo } from '../dataFromZenodeo.js';
import { Config } from '@punkish/zconfig';
const config = new Config().settings;
const logOpts = JSON.parse(JSON.stringify(config.zlogger));
logOpts.name = 'LIB:ZAI:INDEX';
import Zlogger from '@punkish/zlogger';
const log = new Zlogger(logOpts);

async function askZai({ request, fastify, queryType }) {
    const self = 'askZai';

    // The data to be returned looks like this
    //
    // {
    //     "response": {},
    //     "debugInfo": {}
    // }
    const question = request.query.heyzai;
    const qords = question.split(' ');

    // If the first word is 'describe', the following words may be 
    // a species binomen
    if (qords[0].toLowerCase() === 'describe') {
        let [ genus, species ] = qords.slice(1);

        if (species.slice(-1) === '?') {
            species = species.substring(0, species.length - 1);
        }

        return askZaiToDescribe({ 
            request, 
            genus, 
            species,
            fastify,
            queryType
        });
    }
    else {
        return await askZaiSomethingElse({ 
            fastify, 
            question, 
            model: request.query.model || 'llama1b'
        });
    }
}

function askZaiToDescribe({ request, genus, species, fastify, queryType }) {
    // The data to be returned looks like this
    //
    // {
    //     "response": {
    //         "question": "Describe Leprosoma olcesii"
    //         "answer": "Leprosoma olcesii is…"
    //     },
    //     "debugInfo": {}
    // }

    const binomen = `${genus} ${species}`;
    const question = `Describe ${binomen}`;
    fastify.zlog.info(fastify.zlog.prefix(), `question: ${question}`);
    const response = {
        question
    }

    delete request.query.heyzai;
    request.query.genus = `eq(${genus})`;
    request.query.species = `eq(${species})`;
    request.query.summary = `ne(NULL)`;
    request.query.cols = [
        'treatmentId',
        'zenodoDep',
        'treatmentTitle', 
        'articleTitle',
        'articleAuthor',
        'articleDOI',
        'publicationDate',
        'status',
        'summary'
    ];
    const res = getDataFromZenodeo({ 
        request, 
        resource: 'treatments', 
        fastify,
        queryType
    });
    const debugInfo = res.debugInfo;

    if (res.response.records) {
        debugInfo.images = {};
        const sql = `
            SELECT httpUri, captionText
            FROM images
            WHERE treatments_id = @treatments_id
        `;
        const formattedSql = formatSql(sql);

        res.response.records.forEach((record, index) => {

            // As a default, save the summary of the first record 
            // as the answer
            if (index === 0) {
                response.answer = record.summary;
            }

            // Update the answer with the summary of the record 
            // that is marked as a new species
            if (record.status === 'sp. nov.') {
                response.answer = record.summary;
            }

            const treatments_id = record.treatments_id;
            const runparams = { treatments_id };

            const { result, runtime } = sqlRunner({
                sql,
                runparams,
                fastify,
                returnRows: 'many'
            });
            
            record.images = result;
            debugInfo.images[treatments_id] = { 
                sql: formattedSql, 
                runtime 
            }

        })

        response.count = res.response.records.length;
        response.records = res.response.records;
    }

    return { response, debugInfo }
}

// function getImages({ fastify, records, debugInfo, cb }) {
//     const sql = `
//         SELECT httpUri, captionText
//         FROM images
//         WHERE treatments_id = @treatmentId
//     `;

//     const formattedSql = formatSql(sql);
//     debugInfo.images = {};

//     records.forEach((record, index) => {
//         cb({ record });
        
//         const treatmentId = record.treatments_id;
//         const runparams = { treatmentId };

//         const { result, runtime } = sqlRunner({
//             sql,
//             runparams,
//             fastify,
//             returnRows: 'many'
//         });

//         record.images = result;
//         debugInfo.images[treatmentId] = { sql: formattedSql, runtime }
//     });

//     return { result: records, debugInfo }
// }

async function askZaiSomethingElse({ fastify, question, model }) {
    const fn = 'askZaiSomethingElse >';

    // The data to be returned looks like this
    //
    // {
    //     "response": {
    //         "question": "How is Leprosoma olcesii different from other spe…"
    //         "ftsSearch": {},
    //         "answer": "Leprosoma olcesii is different from other species o…"
    //     },
    //     "debugInfo": {}
    // }

    log.info(`${fn} question: ${question}`);
    const response = {
        question
    }

    // First, we do a FTS using the question
    const { ftsSearch, context, debugInfo } = getFtsSearch({ 
        fastify, 
        question 
    });

    response.ftsSearch = ftsSearch;

    if (context) {

        // If FTS finds papers, we create a context for the question
        // by using the fulltext of the top-ranked paper

        // reply.raw.setHeader('Access-Control-Allow-Origin', '*');
        // reply.raw.writeHead(200, { 'Content-Type': 'application/json' });
        // reply.raw.write(JSON.stringify({ count: result.count }));
        //const context = records.map(s => s.fulltext).join('\n');
        const { answer, runtime } = await answerFromZai({ 
            question, 
            context: response.context, 
            model 
        });

        response.answer = answer;
        debugInfo.zai = { question, runtime }
        //records.forEach(r => delete r.fulltext);
        //const reference = res.map(r => delete r.fulltext && r);
        //reference.images = result.images;
        
        // reply.raw.write(JSON.stringify({ answer }));
        // reply.raw.end();
    }

    return { response, debugInfo }
}

function prepareSearchTerms(question) {

    // remove trailing question mark or period
    const re = /(\?|\.)$/;

    if (re.test(question)) {
        question = question.slice(0, -1);
    }

    const searchTerms = question

        // replace punctuations with space
        .replace(replaceWithSpace, ' ')

        // split the question into words
        .split(/ /)

        // remove words 2 characters or smaller
        .filter(word => word.length > 2)

        // remove stopwords
        .filter(word => !stopwords.includes(word.toLowerCase()))

    return searchTerms
}

function getFtsSearch({ fastify, question }) {
    const fn = 'getFtsSearch >';

    // The data to be returned looks like this
    //
    // {
    //     "searchTerms": [ "Leprosoma", "olcesii", "species" ],
    //     "count": 534577,
    //     "topRanked": [
    //         {
    //             "treatments_id": 1040865,
    //             "treatmentId": "03F24E6BFFF66379FF09FA7D4C1BA978",
    //             "zenodoDep": "",
    //             "treatmentTitle": "Leprosoma olcesii Fairmaire 1886",
    //             "articleTitle": "Taxonomic notes on the genus Lepr…",
    //             "articleAuthor": "Gapon, D. A.",
    //             "articleDOI": "10.31610/zsr/2010.19.2.272",
    //             "publicationDate": "2010-12-30",
    //             "status": "",
    //             "summary": null,
    //             "images": [
    //                 {
    //                     "httpUri": "https://zenodo.org/record/1553…",
    //                     "captionText": "Fig. 8. Staurinidia crucicu…"
    //                 }
    //             ]
    //         }
    //     ]
    // }

    const searchTerms = prepareSearchTerms(question);
    log.info(`${fn} searchTerms: ${searchTerms}`);

    // To return
    const ftsSearch = {
        searchTerms
    };

    // First, let's find out the total number of treatments
    // MATCHing the searchTerms
    const sql = `
    SELECT Count(*) AS count
    FROM treatmentsFts f JOIN treatments t ON f.rowid = t.id
    WHERE f.fulltext MATCH @searchTerms
    `;

    const runparams = { 
        searchTerms: searchTerms.join(' OR ') 
    };

    const { result, runtime } = sqlRunner({
        sql,
        runparams,
        fastify,
        returnRows: 'one'
    });

    ftsSearch.count = result.count;
    log.info(`${fn} treatments FTS count: ${result.count}`);

    let context;
    const debugInfo = {
        ftsSearch: { 
            sql: formatSql(sql), 
            runparams,
            runtime 
        }
    }

    if (ftsSearch.count) {

        // We retrieve information on the top-ranked treatment 
        // MATCHing the searchTerms. For now, we retrieve only
        // one treatment (using LIMIT 1 in the sql below), 
        // but we retrieve it as an array of treatments in case 
        // we want to expand the LIMIT in the future
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
                t.summary,
                t.fulltext
            FROM 
                treatmentsFts f 
                JOIN treatments t ON f.rowid = t.id
                JOIN images i ON t.id = i.treatments_id
            WHERE f.fulltext MATCH @searchTerms
            ORDER BY f.rank
            LIMIT 1
            `;

        const { result, runtime } = sqlRunner({
            sql,
            runparams,
            fastify,
            returnRows: 'many'
        });

        ftsSearch.topRanked = result;

        debugInfo.topRanked = { sql: formatSql(sql), runtime };
        debugInfo.images = {};
        sql = `
            SELECT httpUri, captionText
            FROM images
            WHERE treatments_id = @treatments_id
        `;
        const formattedSql = formatSql(sql);

        ftsSearch.topRanked.forEach(record => {

            // For each treatment found (in reality, only one, because 
            // of the LIMIT 1 used above), we find related images, and
            // we also get its fulltext to be used as context
            context += record.fulltext + '\n';
            delete record.fulltext;
            const treatments_id = record.treatments_id;
            const runparams = { treatments_id };

            const { result, runtime } = sqlRunner({
                sql,
                runparams,
                fastify,
                returnRows: 'many'
            });

            record.images = result;
            debugInfo.images[treatments_id] = { 
                sql: formattedSql, 
                runtime 
            }
        })
    }

    return { 
        ftsSearch, 
        context, 
        debugInfo 
    }
}

async function vecSearch({ dbObj, searchTerm, colorize }) {
    
}

async function answerFromZai({ question, context, model }) {
    const promptTemplate = await pull("rlm/rag-prompt");
    const messages = await promptTemplate.invoke({
        question,
        context
    });

    const models = {
        'qwen': 'qwen3:0.6b',
        'gemma': 'gemma3:1b-it-qat',
        'llama': 'llama3.2:latest',
        'llama1b': 'llama3.2:1b'
    }

    const llm = new ChatOllama({
        model: models[model],
        temperature: 0
    });
    const answer = await llm.invoke(messages);

    // runtime is in nanoseconds, so
    // multiply by 0.000001 to convert to ms
    const ns = answer.response_metadata.total_duration;
    const s = Math.round(ns / 1e9);
    const ms = ((ns % 1e9) / 1e6).toFixed(2);

    return { 
        answer: answer.content, 
        runtime: `${s}s ${ms}ms`
    }
}

export { askZai }