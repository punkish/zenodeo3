// lib/zai/askZaiSomething/lib/context.js
import { sqlRunner, getTreatments } from '../../../dataFromZenodeo.js';
import { formatSql } from '../../../utils.js';
import { addImagesToTreatments } from '../../lib/index.js';
import { subsetVectorSearch } from './vectorSubsetSearch.js';

/**
 * Get the context for LLM based on the question
 * Performs:
 *   1. Detect binomens & authors
 *   2. Fetch treatments via SQL if binomens/authors found
 *   3. Otherwise, run FTS5 search → get candidate treatments
 *   4. Run vector search restricted to candidate chunks
 */
async function getContext(fastify, question, reply) {

    // Step 1 — detect special tokens such as bigrams and treatmentAuthors

    // Step 1.a - convert question to bigrams[]
    const bigrams = questionToBigramsQuery(question);
    const binomens = detectBigrams(fastify, bigrams, reply);
    const treatmentAuthors = detectTreatmentAuthors(fastify, bigrams, reply);

    let candidateTreatments = [];

    // Step 2 — treatments via binomens/authors
    if (binomens.length || treatmentAuthors.length) {
        candidateTreatments = getTreatmentsByTokens(fastify, binomens, treatmentAuthors, reply);
    }

    // Step 3 — fallback: generic FTS5 → candidate treatments
    else {
        fastify.zlog.info('No binomens/authors detected → running generic FTS5 search');

        // Remove any trailing '?' as it will break FTS search
        if (question.slice(-1) === '?') {
            question = question.substring(0, question.length - 1);
        }

        // Convert the question to an OR query
        const query = question.split(/ /).join(' OR ');

        const searchSql = `
            SELECT DISTINCT 
                t.id AS treatments_id, 
                fts.rank AS rank
            FROM 
                treatmentsFts fts
                JOIN treatment_chunks tc ON fts.rowid = tc.id
                JOIN treatments t ON tc.treatments_id = t.id
            WHERE fts.fulltext MATCH @query
            ORDER BY rank 
            LIMIT @limit
        `;

        const runparams = { query, limit: 100 };
        const { result, runtime } = sqlRunner(fastify, searchSql, runparams, 'all');
        fastify.zlog.info(`FTS5 search found ${result.length} treatments in ${runtime} ms`);

        candidateTreatments = result.map(r => r.treatments_id);
    }

    // Step 4 — subset vector search if needed
    let vectorResults = [];

    if (candidateTreatments.length) {
        const start = Date.now();
        fastify.zlog.info(`Running subset vector search on ${candidateTreatments.length} candidate treatments`);

        vectorResults = await subsetVectorSearch(
            fastify,
            question,
            64,
            candidateTreatments
        );

        // Map results to treatment structure with chunk_text
        // remove duplicates based on treatmentId
        reply.response.treatments = Array.from(
            new Map(
                vectorResults.map(v => [
                    v.treatmentId,
                    {
                        treatments_id: v.treatments_id,
                        treatmentId: v.treatmentId,
                        zenodoDep: v.zenodoDep,
                        treatmentTitle: v.treatmentTitle,
                        treatmentAuthor: v.treatmentAuthor,
                        articleTitle: v.articleTitle,
                        articleAuthor: v.articleAuthor,
                        journalYear: v.journalYear,
                        journalTitle: v.journalTitle,
                        publicationDate: v.publicationDate,
                        status: v.status,
                        genus: v.genus,
                        species: v.species,
                        fulltext: v.fulltext,
                        speciesDesc: v.speciesDesc,
                        score: v.score,
                    }
                ])
            ).values()
        );
        const took = Date.now() - start;
        fastify.zlog.info(`vector search took ${took} ms`);
    }

    // Step 5 — assemble LLM context
    let context;
    
    if (reply.response.treatments.length) {
        context = assembleContext(reply.response.treatments, question);
        const removeField = 'fulltext';
        addImagesToTreatments(fastify, removeField, reply);
    }

    return context;
}

/**
 * Convert question → bigrams suitable for token matching
 */
function questionToBigramsQuery(question) {
    const tokens = question
        .toLowerCase()

        // replace everything that is not a letter or space with a space
        .replace(/[^a-z\s]/g, ' ')
        .split(/\s+/)

        // remove anything that is not a word
        .filter(Boolean);

    const bigrams = [];
    for (let i = 0; i < tokens.length - 1; i++) {
        bigrams.push(`'${tokens[i]} ${tokens[i + 1]}'`);
    }
    return bigrams;
}

/**
 * Detect tokens (binomens or authors)
 */
function detectBigrams(fastify, bigrams, reply) {
    const sql = `
        SELECT DISTINCT binomen 
        FROM binomens 
        WHERE LOWER(binomen) IN (@bigrams)
    `;

    const runparams = { bigrams };
    const { result, runtime } = sqlRunner(fastify, sql, runparams, 'all');

    if (result) {
        const binomens = result.map(r => r.binomen.toLowerCase());
        fastify.zlog.info(`Found ${binomens.length} binomens in ${runtime} ms`);
        reply.debugInfo[`detectBinomens`] = { sql, runtime };

        return binomens;
    }
}

function detectTreatmentAuthors(fastify, bigrams, reply) {
    const sql = `
        SELECT DISTINCT treatmentAuthor
        FROM treatmentAuthors ta
            JOIN treatments t ON ta.treatments_id = t.id
        WHERE LOWER(treatmentAuthor) IN (@bigrams)
    `;

    const runparams = { bigrams };
    const { result, runtime } = sqlRunner(fastify, sql, runparams, 'all');

    if (result) {
        const treatmentAuthors = result.map(r => r.treatmentAuthor.toLowerCase());
        fastify.zlog.info(`Found ${treatmentAuthors.length} treatmentAuthors in ${runtime} ms`);
        reply.debugInfo[`detectTreatmentAuthors`] = { sql, runtime };

        return treatmentAuthors;
    }
}

/**
 * Retrieve treatments for detected binomens/authors
 */
function getTreatmentsByTokens(fastify, binomens, treatmentAuthors, reply) {
    let sql;
    const runparams = { limit: 10 };

    if (binomens.length) {
        sql = getTreatments({ byBinomens: true });
        runparams.binomens = binomens;
    }

    if (treatmentAuthors.length) {
        sql = getTreatments({ byTreatmentAuthors: true });
        runparams.treatmentAuthors = treatmentAuthors;
    }

    sql += ` LIMIT @limit`;

    const { result, runtime } = sqlRunner(fastify, sql, runparams, 'all');
    
    if (result) {
        reply.debugInfo.getTreatmentsByTokens = { sql, runtime };
        return result;
    }
    else {
        return [];
    }
}

function assembleContext(treatments, question) {
    const documents = treatments.map((treatment, index) => {
        return `
### Document ${index + 1}
---
**Title:** ${treatment.treatmentTitle} 
**Species:** ${treatment.genus} ${treatment.species}
**Status:** ${treatment.status}
**Treatment Author:** ${treatment.treatmentAuthor}

**Published in Article:** ${treatment.articleTitle}
**Article Author:** ${treatment.articleAuthor}
**Publication Date:** ${treatment.publicationDate}

**Document Text:** ${treatment.fulltext}
---  `;
        }).join('\n');

    const context = `
You are a scientific research assistant specializing in biological taxonomy and entomology. Your task is to answer the question shown below using only the provided research documents.
---  
Strict Rules
1.	Use only the information contained in the provided documents.
2.	Do not use outside knowledge.
3.	If a difference cannot be determined from the documents, state: "The provided documents don’t contain this information."
4.	Every claim must cite the document number (e.g., Document 1, Document2).
5.  If a claim cannot be directly supported by the text of a document, do not include it in the answer.
6.  Use only the most relevant documents. Do not attempt to combine all documents if some are unrelated.
7.	Use scientific terminology where appropriate.
8.	Prefer diagnostic and morphological differences.
9.  Do NOT provide resources for further reading and research.
10. Do NOT ask follow-up questions or prompt the user for further input. End your response when you have answered the question.
11. Never end your response with a question. 
12. Never suggest further topics to explore. 
13. Never invite the user to ask more.
---  
Step-by-Step Method (Follow in Order)

Step 1 — Extract Evidence from each document, including key biological traits such as:
•	Body size, shape and Coloration
•	Head and Genital morphology
•	Pronotum, Wing and Antennal structures
•	Other diagnostic characters
•	Geographic distribution
---  
Step 2 — Study the Species, focusing on:
•	Morphological differences
•	Size differences
•	Structural anatomy differences
•	Coloration differences
•	Distribution differences
•	Taxonomic differences
---  
Step 3 — Produce the Final Answer using a structured format such as:
•	Taxonomy
•	Body size
•	Morphology
•	Coloration
•	Diagnostic anatomical structures
•	Geographic distribution

Each statement must include a document citation.
---  
Question: ${question}
---  
### Context Documents

*Note: Documents are ordered by estimated relevance, with Document 1 being the most relevant.*

${documents}
    `;

    return context;
}


export { getContext };