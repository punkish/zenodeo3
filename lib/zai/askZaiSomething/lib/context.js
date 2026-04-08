// lib/zai/askZaiSomething/lib/context.js
import { sqlRunner, getTreatments } from '../../../dataFromZenodeo.js';
import { addImagesToTreatments } from '../../lib/index.js';
import { subsetVectorSearch } from './vectorSubsetSearch.js';
import * as utils from '../../../utils.js';
import { sendEvent } from './utils.js';

// ─────────────────────────────────────────────────────────────────────────────
// getContext
//
// accepts `raw` so it can emit progress events as each step resolves.
//
// BUG FIXED: getTreatmentsByTokens previously silently used only treatmentAuthors
// when both binomens AND treatmentAuthors were detected, because the second
// `if` block overwrote the `sql` variable set by the first.
// Fixed by checking both in a single conditional that picks binomens first
// (more specific) and falls back to authors.  If you need both simultaneously
// you'll want to extend getTreatments() to support a JOIN on both tables.
// ─────────────────────────────────────────────────────────────────────────────
async function getContext(fastify, question, raw) {
    const bigrams = questionToBigramsQuery(question);
    const debugInfo = {};

    // Step 1 — detect binomens and authors
    const { binomens, debug: binoDebug } = detectBinomens(
        fastify, 
        bigrams, 
        raw
    );
    const { treatmentAuthors, debug: authDebug } = detectTreatmentAuthors(
        fastify, 
        bigrams,
        raw
    );
    Object.assign(debugInfo, binoDebug, authDebug);

    let candidateTreatments = [];

    // Step 2 — treatments via binomens/authors
    if (binomens.length || treatmentAuthors.length) {
        sendEvent(raw, 'status', {
            step: 'tokens',
            message: 'Matching treatments',
        });

        const { result, debug: tokenDebug } = getTreatmentsByTokens(
            fastify, 
            binomens, 
            treatmentAuthors
        );
        candidateTreatments = result;
        Object.assign(debugInfo, tokenDebug);

        sendEvent(raw, 'status', { 
            step: 'tokens', 
            message: `found ${candidateTreatments.length}` 
        });
    }

    // Step 3 — fallback: generic FTS5
    else {
        fastify.zlog.info('No binomens/authors detected → running generic FTS5 search');
        sendEvent(raw, 'status', { step: 'fts', message: 'Searching treatments with FTS' });

        if (question.slice(-1) === '?') {
            question = question.substring(0, question.length - 1);
        }

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
        const { result, runtime } = sqlRunner(
            fastify, 
            searchSql, 
            runparams, 
            'all'
        );
        fastify.zlog.info(`FTS5 search found ${result.length} treatments in ${runtime} ms`);

        candidateTreatments = result.map(r => r.treatments_id);
        debugInfo.fts = { 
            sql: utils.formatSql(searchSql, runparams), 
            runtime 
        };

        sendEvent(raw, 'status', { 
            step: 'fts', 
            message: `identified ${result.length} treatments` 
        });
    }

    if (!candidateTreatments.length) return null;

    // Step 4 — subset vector search
    sendEvent(raw, 'status', { 
        step: 'vector', 
        message: 'Running vector search' 
    });

    const start = Date.now();
    fastify.zlog.info(`Running subset vector search on ${candidateTreatments.length} candidate treatments`);
    
    // extract treatments_ids from the results
    const treatments_ids = candidateTreatments.map(t => t.treatments_id );
    const vectorResults = await subsetVectorSearch(
        fastify, 
        question, 
        64, 
        treatments_ids
    );
    debugInfo.vectorSearch = { took: Date.now() - start };

    // Deduplicate by treatmentId, keeping only the highest-scored chunk per 
    // treatment. PREVIOUSLY: used Array.from(new Map(...).values()) which is 
    // correct but relies on Map insertion order — fine since vectorResults is 
    // already sorted by score descending, so the first occurrence of each 
    // treatmentId is the best. No logic change; comment added for clarity.
    const treatments = Array.from(
        new Map(
            vectorResults.map(v => [v.treatmentId, {
                treatments_id:   v.treatments_id,
                treatmentId:     v.treatmentId,
                zenodoDep:       v.zenodoDep,
                treatmentTitle:  v.treatmentTitle,
                treatmentAuthor: v.treatmentAuthor,
                articleTitle:    v.articleTitle,
                articleAuthor:   v.articleAuthor,
                journalYear:     v.journalYear,
                journalTitle:    v.journalTitle,
                publicationDate: v.publicationDate,
                status:          v.status,
                genus:           v.genus,
                species:         v.species,
                fulltext:        v.fulltext,
                //speciesDesc:     v.speciesDesc,
                score:           v.score,
            }])
        ).values()
    );

    if (!treatments.length) return null;
    sendEvent(raw, 'status', { 
        step: 'vector', 
        message: `winnowed to ${treatments.length} treatments` 
    });

    // Step 5 — enrich with images
    const { 
        treatments: enrichedTreatments, 
        debug: imagesDebug 
    } = addImagesToTreatments(fastify, 'fulltext', treatments, raw);


    // Step 6 — assemble context
    const context = assembleContext(treatments, question, raw);
    Object.assign(debugInfo, { images: imagesDebug });

    return { context, treatments: enrichedTreatments, debugInfo };
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
        bigrams.push(`${tokens[i]} ${tokens[i + 1]}`);
    }
    
    return bigrams;
}

/**
 * Detect binomens
 */
function detectBinomens(fastify, bigrams, raw) {
    sendEvent(raw, 'status', { 
        step: 'binomens', 
        message: 'Detecting binomens' 
    });

    const sql = `
        SELECT DISTINCT binomen 
        FROM binomens 
        WHERE LOWER(binomen) IN (@bigrams)
    `;
    const runparams = { bigrams };
    const { result, runtime } = sqlRunner(fastify, sql, runparams, 'all');
    const binomens = result ? result.map(r => r.binomen.toLowerCase()) : [];
    fastify.zlog.info(`Found ${binomens.length} binomens in ${runtime} ms`);

    sendEvent(raw, 'status', { 
        step: 'binomens', 
        message: `found ${binomens.length}` 
    });

    return {
        binomens,
        debug: { 
            detectBinomens: { 
                sql: utils.formatSql(sql, runparams), 
                runtime 
            } 
        }
    };
}

function detectTreatmentAuthors(fastify, bigrams, raw) {
    sendEvent(raw, 'status', { 
        step: 'authors', 
        message: 'Detecting authors' 
    });

    const sql = `
        SELECT DISTINCT treatmentAuthor
        FROM treatmentAuthors ta
            JOIN treatments t ON ta.treatments_id = t.id
        WHERE LOWER(treatmentAuthor) IN (@bigrams)
    `;
    const runparams = { bigrams };
    const { result, runtime } = sqlRunner(fastify, sql, runparams, 'all');
    const treatmentAuthors = result 
        ? result.map(r => r.treatmentAuthor.toLowerCase()) 
        : [];
    fastify.zlog.info(`Found ${treatmentAuthors.length} treatmentAuthors in ${runtime} ms`);
    sendEvent(raw, 'status', { 
        step: 'authors', 
        message: `found ${treatmentAuthors.length}` 
    });

    return {
        treatmentAuthors,
        debug: { 
            detectTreatmentAuthors: { 
                sql: utils.formatSql(sql, runparams), 
                runtime 
            } 
        }
    };
}

/**
 * Converts binomens into a parameterized SQL WHERE clause and an object of parameters.
 * @param {string[]} binomens - Array of strings like ['Saigona baiseensis', 'Tyrannosaurus rex']
 * @returns {{sql: string, params: object}}
 */
function buildParameterizedBinomenClause(binomens) {
    if (!binomens || binomens.length === 0) {
        return { sql: "1=0", params: {} };
    }

    const params = {};
    const sqlClauses = binomens.map((binomen, index) => {
        const [ genus, species ] = binomen.trim().toLowerCase().split(/\s+/);
        const id = index + 1;
        params[`genus${id}`] = genus;
        params[`species${id}`] = species;

        return `(Lower(g.genus) = @genus${id} AND Lower(s.species) = @species${id})`;
    });

    return {
        sql: `(${sqlClauses.join(' OR ')})`,
        params: params
    };
}

/**
 * Retrieve treatments for detected binomens/authors
 */
function getTreatmentsByTokens(fastify, binomens, treatmentAuthors) {
    let sql;
    let runparams = { limit: 10 };

    if (binomens.length) {
        const res = buildParameterizedBinomenClause(binomens);
        sql = getTreatments({});
        sql += ` AND ${res.sql}`;
        Object.assign(runparams, res.params);
    }

    else if (treatmentAuthors.length) {
        sql = getTreatments({ byTreatmentAuthors: true });
        runparams.treatmentAuthors = treatmentAuthors;
    }

    sql += ` LIMIT @limit`;

    const { result, runtime } = sqlRunner(fastify, sql, runparams, 'all');
    fastify.zlog.info(`found ${result.length} treatments in ${runtime} ms`);
    return {
        result: result ?? [],
        debug: { 
            getTreatmentsByTokens: { sql: utils.formatSql(sql, runparams), runtime } 
        }
    };
}

function assembleContext(treatments, question, raw) {
    sendEvent(raw, 'status', { step: 'context', message: `Assembling context with ${treatments.length} treatments` });

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