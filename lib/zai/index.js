//import ollama from 'ollama';
import { stopwords } from './lib/stopwords.js';
//import { removeStopWords, cleanText, mySnippet } from "./lib/dbFuncs.js";
import { pull } from "langchain/hub";
import { ChatOllama } from '@langchain/ollama';

function prepareSearchTerms(question) {
    const re = /(\?|\.)$/;

    // remove trailing question mark or period
    if (re.test(question)) {
        question = question.slice(0, -1);
    }

    const searchTerms = question
        .split(/ /)
        .filter(word => word.length > 2)
        .filter(word => !stopwords.includes(word.toLowerCase()))
        .join(' OR ');

    return searchTerms
}

async function askZai({ fastify, question, model }) {
    const searchTerms = prepareSearchTerms(question);
    const fts = ftsSearch({ fastify, searchTerms });
    
    if (fts.count > 0) {

        // reply.raw.setHeader('Access-Control-Allow-Origin', '*');
        // reply.raw.writeHead(200, { 'Content-Type': 'application/json' });
        // reply.raw.write(JSON.stringify({ count: result.count }));

        const sources = fts.sources;
        const context = sources.map(s => s.fulltext).join('\n');
        const answer = await answerFromZai({ question, context, model });
        sources.forEach(s => delete s.fulltext);
        //const reference = res.map(r => delete r.fulltext && r);
        //reference.images = result.images;
        
        return { 
            fts,
            answer
        }
        // reply.raw.write(JSON.stringify({ answer }));
        // reply.raw.end();
    }
    else {
        return { 
            fts
        }
    }
}

function ftsSearch({ fastify, searchTerms }) {
    const fts = {};

    fts.count = fastify.betterSqlite3.prepare(`
        SELECT Count(*) AS count
        FROM treatmentsFts f JOIN treatments t ON f.rowid = t.id
        WHERE f.fulltext MATCH @searchTerms`).get({ searchTerms}).count
    
    if (fts.count) {
        fts.sources = fastify.betterSqlite3.prepare(`
            SELECT 
                t.id AS treatments_id,
                t.treatmentId,
                t.zenodoDep,
                t.treatmentTitle, 
                t.articleTitle,
                t.articleAuthor,
                t.articleDOI,
                t.publicationDate,
                t.fulltext
            FROM 
                treatmentsFts f 
                JOIN treatments t ON f.rowid = t.id
                JOIN images i ON t.id = i.treatments_id
            WHERE f.fulltext MATCH @searchTerms
            ORDER BY f.rank
            LIMIT 1`).all({ searchTerms });

        fts.sources.forEach(s => {
            s.images = fastify.betterSqlite3.prepare(`
                SELECT httpUri, captionText
                FROM images
                WHERE treatments_id = @treatmentId`).all({ 
                    treatmentId: s.treatments_id 
                })
        })
    }

    return fts
}

async function vecSearch({ dbObj, searchTerm, colorize }) {
    
}

async function answerFromZai({ question, context, model = 'qwen3:0.6b' }) {
    const promptTemplate = await pull("rlm/rag-prompt");
    const messages = await promptTemplate.invoke({
        question,
        context
    });

    const llm = new ChatOllama({
        //model: 'llama3.2:latest',
        //model: 'qwen3:0.6b',
        //model: 'gemma3:1b-it-qat',
        model,
        temperature: 0
    });
    const answer = await llm.invoke(messages);
    return answer.content;
}

export { askZai }