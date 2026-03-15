import { sqlRunner } from '../../../dataFromZenodeo.js';
import { formatSql } from '../../../utils.js';
import { addImagesToTreatments } from '../../lib/index.js';

async function getContext(fastify, question, reply) {

    // Check if the question has any binomens or authors
    const bigrams = questionToBigramsQuery(question);
    let isBinomen = true;
    const binomens = identifyTokens(fastify, bigrams, isBinomen, reply);
    isBinomen = false;
    const treatmentAuthors = identifyTokens(fastify, bigrams, isBinomen, reply);

    // If any binomens or authors are found,
    // get treatments based on those
    if (binomens.length || treatmentAuthors.length) {
        reply.response.treatments = getTreatmentsByTokens(fastify, binomens, treatmentAuthors, reply);
    }

    // Since no binomens or authors were found,
    // we do a vector search
    else {
        fastify.zlog.info(`no binomens or treatmentAuthors found… initiating vector search`);
        fastify.zsearch.init();
        const vectorResult = await fastify.zsearch.search(question, {
            index: 'usearch',
            topK: 10
        });
        fastify.zsearch.close();
        
        // Group treatments by binomens
        // reply.response.treatments = Object.values(
        //     vectorResult.reduce((acc, { genus, species, ...rest }) => {
        //         const binomen = `${genus} ${species}`;

        //         if (!acc[binomen]) {
        //             acc[binomen] = { binomen, treatments: [] };
        //         }

        //         acc[binomen].treatments.push(rest);
        //         return acc;
        //     }, {})
        // );
        reply.response.treatments = vectorResult;
    }

    let context;

    if (reply.response.treatments.length) {
        context = assembleContext(reply.response.treatments, question);
        const removeField = 'fulltext';
        addImagesToTreatments(fastify, removeField, reply);
    }
    
    return context;
    
}

/**
 * @typedef {`${string} ${string}`} Binomen
 * @typedef {Binomen[]} binomens - An array of binomens.
 */
function identifyTokens(fastify, bigrams, isBinomen=true, reply) {
    const sql = isBinomen
        ? ` SELECT DISTINCT binomen AS token
            FROM binomens 
            WHERE LOWER(binomen) IN (${bigrams})`

        : ` SELECT DISTINCT treatmentAuthor AS token
            FROM 
                treatmentAuthors ta 
                JOIN treatments t ON ta.treatments_id = t.id 
            WHERE LOWER(treatmentAuthor) IN (${bigrams})`;
    
    const runparams = { bigrams };
    const returnRows = 'all';
    const { result, runtime } = sqlRunner(fastify, sql, runparams, returnRows);

    if (result) {
        const tokens = result.map(r => r.token);
        const tokenType = isBinomen ? 'Binomens' : 'TreatmentAuthors';
        fastify.zlog.info(`${tokenType}: ${JSON.stringify(tokens)}`);

        reply.debugInfo[`detect${tokenType}`] = {
            sql: formatSql(sql, runparams),
            runtime
        };

        return tokens.map(t => `'${t.toLowerCase()}'`);
    }
    else {
        return [];
    }

}

/**
 * @function getTreatmentsByTokens - Find binomens in the question.
 * @param {Object} fastify - An instance of Fastify.
 * @param {string} question - The question submiited by the user.
 * @param {Object} debugInfo - Debug info returned to user.
 * @returns {binomens}
 */
function getTreatmentsByTokens(fastify, binomens, treatmentAuthors, reply) {
    let sql = `
    SELECT DISTINCT 
        t.id AS treatments_id,
        t.treatmentId,
        t.zenodoDep,
        t.treatmentTitle,
        ta.treatmentAuthor,
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
        '' AS speciesDesc
    FROM 
        treatments t
        JOIN journals j ON t.journals_id = j.id 
        JOIN genera g ON t.genera_id = g.id
        JOIN species s ON t.species_id = s.id 
        JOIN treatmentAuthors ta ON t.id = ta.treatments_id 
    WHERE 
        1=1
    `;

    if (binomens.length) {
        sql += ` AND Lower(g.genus || ' ' || s.species) IN (${binomens})`;
    }

    if (treatmentAuthors.length) {
        sql += ` AND Lower(ta.treatmentAuthor) IN (${treatmentAuthors})`;
    }

    sql += ` LIMIT @limit`;

    const runparams = { binomens, treatmentAuthors, limit: 10 };
    const returnRows = 'all';
    const { result, runtime } = sqlRunner(fastify, sql, runparams, returnRows);

    if (result) {
        const treatments = result;

        reply.debugInfo.getTreatmentsByBinomensAndAuthors = {
            sql: formatSql(sql, runparams),
            runtime
        };

        return treatments;
    }
    else {
        return [];
    }
}

/**
 * @function questionToBigramsQuery - Find binomens in the question.
 * @param {string} question - The question submiited by the user.
 * @returns {string[]} bigrams - An array of bigrams.
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

function assembleContext(treatments, question) {
    const documents = treatments.map((treatment, index) => {
        return `
**Treatment Title ${index + 1}:** ${treatment.treatmentTitle} 
**Treatment Binomen:** ${treatment.genus} ${treatment.species}
**Status:** ${treatment.status}
**Treatment Author:** ${treatment.treatmentAuthor}
**Published in Article:** ${treatment.articleTitle}
**Article Author:** ${treatment.articleAuthor}
**Publication Date:** ${treatment.publicationDate}
**Document Body:** ${treatment.fulltext}
---`;
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

export { getContext }