import { sqlRunner } from '../../../dataFromZenodeo.js';
import { formatSql } from '../../../utils.js';

/**
 * @typedef {`${string} ${string}`} Binomen
 * @typedef {Binomen[]} binomens - An array of binomens.
 */

function ftsPhrasesToLike(input, column = "binomen") {
  const phrases = [...input.matchAll(/"([^"]+)"/g)].map(m => m[1]);
  const sql = phrases.map(() => `${column} LIKE ?`).join(" OR ");
  const params = phrases.map(p => `%${p}%`);
  return { sql, params };
}

/**
 * @function detectBinomens - Find binomens in the question.
 * @param {Object} fastify - An instance of Fastify.
 * @param {string} question - The question submiited by the user.
 * @param {Object} debugInfo - Debug info returned to user.
 * @returns {binomens}
 */
function detectBinomens(fastify, question, reply) {

    // Convert query to bigramsQuery
    /** @type {string} query - A query string. */
    const query = questionToBigramsQuery(question);
    
    // let sql = `
    // SELECT binomen
    // FROM binomens
    // WHERE 
    //     rowid NOT IN (323007, 406592, 456360) 
    //     AND rowid NOT IN (
    //         SELECT rowid 
    //         FROM binomens 
    //         WHERE binomen MATCH 'undetermined'
    //     )
    //     AND binomens MATCH @query 
    // `;

    const sql = `SELECT binomen FROM binomens WHERE LOWER(binomen) IN (${query})`;
    
    const runparams = { query };
    
    const returnRows = 'all';
    const { result, runtime } = sqlRunner(fastify, sql, runparams, returnRows);

    if (result) {
        const binomens = result.map(r => r.binomen);
        fastify.zlog.info(binomens);

        reply.debugInfo.detectBinomens = {
            sql: formatSql(sql, runparams),
            runtime
        };

        return binomens;
    }
    else {
        return [];
    }
    
}

/**
 * @function questionToBigramsQuery - Find binomens in the question.
 * @param {string} question - The question submiited by the user.
 * @returns {string} query - A query used in SQL to detect binomens.
 */
function questionToBigramsQueryOrig(question) {
    return question
        .toLowerCase()

        // replace everything that is not a letter or space with a space
        .replace(/[^a-z\s]/g, ' ')
        .split(/\s+/)

        // remove anything that is not a word
        .filter(Boolean)
        
        // return token pairs
        .map((token, i, arr) => { 
            while (i < (arr.length - 1)) {
                const nextToken = arr[i + 1];
                return `"${token} ${nextToken}"` 
            } 
        })

        // removed undefined (last bigram)
        .filter(Boolean)
        .join(' OR ');
}

function questionToBigramsQuery(question) {
    const tokens = question
        .toLowerCase()
        .replace(/[^a-z\s]/g, ' ')
        .split(/\s+/)
        .filter(Boolean);

    const bigrams = [];
    for (let i = 0; i < tokens.length - 1; i++) {
        bigrams.push(`'${tokens[i]} ${tokens[i + 1]}'`);
    }
    return bigrams;
}

/**
 * @function getTreatmentsByBinomen - Get top treatments for a specific binomen.
 * @param {Object} fastify - An instance of Fastify.
 * @param {Binomen[]} binomens - An array of binomens.
 * @param {number} limit - Max treatments to fetch.
 */
function getTreatmentsByBinomen(fastify, binomen, reply) {
    const [ genus, species ] = binomen.split(/\s+/);
    fastify.zlog.info(`getting treatments for ${genus} ${species}`);
    
    const sql = `
        SELECT 
            t.id AS treatments_id,
            t.treatmentId,
            t.zenodoDep,
            t.treatmentTitle,
            t.articleTitle,
             t.articleAuthor,
            t.articleDOI,
            t.journalYear,
            j.journalTitle,
            t.publicationDate,
            t.status,
            g.genus,
            s.species,
            '' AS chunk_text,
            t.fulltext,
            '' AS speciesDesc
        FROM 
            treatments t
            JOIN journals j ON t.journals_id = j.id 
            JOIN genera g ON t.genera_id = g.id
            JOIN species s ON t.species_id = s.id
        WHERE 
            g.genus = @genus 
            AND s.species = @species
        LIMIT @limit
    `;

    const runparams = { genus, species, limit: 3 };
    const returnRows = 'all';
    const { result, runtime } = sqlRunner(fastify, sql, runparams, returnRows);
    
    if (result) {
        const treatments = result;
        //fastify.zlog.info(`Found ${treatments.length} treatments for ${binomen}`);

        reply.debugInfo.getTreatmentsByBinomen = {
            sql: formatSql(sql, runparams),
            runtime
        };

        return treatments;
    }
    else {
        return [];
    }
}

function assembleContext(treatmentsByBinomens, question) {
    const documents = treatmentsByBinomens.map((binomenGroup, bidx) => {
        const { binomen, treatments } = binomenGroup;

        const doc = treatments.map((treatment, tidx) => {
            return `
**Document ${tidx + 1}:** ${treatment.articleTitle} 
**Publication Date:** ${treatment.publicationDate}
**Document Body:** ${treatment.fulltext}
---`;

        }).join('\n');

        return `
## **Binomen ${bidx + 1}:** ${binomen}
---
${doc}`;
    }).join('\n');

    const context = `
You are a scientific research assistant specializing in biological taxonomy and entomology. Your task is to answer the following question using only the provided research documents.
---  
Question: ${question}
---  
Strict Rules
1.	Use only the information contained in the provided documents.
2.	Do not use outside knowledge.
3.	If a difference cannot be determined from the documents, state: "The provided documents don’t contain this information."
4.	Every claim must cite the document number (e.g., Document 1, Document2).
5.	Use scientific terminology where appropriate.
6.	Prefer diagnostic and morphological differences.
7.  Do NOT provide resources for further reading and research.
7.  Do NOT ask follow-up questions or prompt the user for further input. End your response when you have answered the question.
8.  Never end your response with a question. Never suggest further topics to explore. Never invite the user to ask more.
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
## Context Documents
${documents}
    `;
    return context;
}

export { detectBinomens, getTreatmentsByBinomen, assembleContext }