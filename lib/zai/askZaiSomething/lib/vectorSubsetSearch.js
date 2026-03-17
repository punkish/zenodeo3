// lib/zai/askZaiSomething/lib/vectorSubsetSearch.js
import { embed } from '../../../../bin/vectorize/lib/embedder.js';
import { sqlRunner, getTreatments } from '../../../dataFromZenodeo.js';

/**
 * Perform a vector search only on a subset of candidate treatments
 * @param {Object} usearchIndex - the memory-mapped usearch index
 * @param {Object} fastify - fastify instance with db connection
 * @param {string} queryText - the user query
 * @param {number} topK - number of top results to return
 * @param {number[]} candidateTreatmentIds - subset of treatment ids
 */
async function subsetVectorSearch(fastify, question, topK=8, candidateTreatments) {
    
    // 1. Compute embedding for the query
    const queryVector = await embed(question);
    const sql = getTreatments({ byTreatments_Ids: true });
    const runparams = { 
        treatments_ids: candidateTreatments.map(c => c.treatments_id)
    };
    const { result } = sqlRunner(fastify, sql, runparams, 'all');

    if (!result?.length) {
        return [];
    }

    // 3. Build a small subset index of vectors & metadata
    const scored = [];

    for (const row of result) {

        const vec = blobToFloat32(row.vector);
        const score = cosineSimilarity(queryVector, vec);

        scored.push({
            chunkId: row.chunkId,
            treatments_id: row.treatments_id,
            treatmentId: row.treatmentId,
            zenodoDep: row.zenodoDep,
            treatmentTitle: row.treatmentTitle,
            treatmentAuthor: row.treatmentAuthor,
            articleTitle: row.articleTitle,
            articleAuthor: row.articleAuthor,
            articleAuthor: row.articleAuthor,
            journalYear: row.journalYear,
            journalTitle: row.journalTitle,
            publicationDate: row.publicationDate,
            status: row.status,
            genus: row.genus,
            species: row.species,
            chunk_text: row.chunk_text,
            fulltext: row.fulltext,
            speciesDesc: row.speciesDesc,
            score
        });

    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
}

function blobToFloat32(blob) {
    return new Float32Array(
        blob.buffer,
        blob.byteOffset,
        blob.byteLength / 4
    );
}

/**
 * Cosine similarity between two vectors
 */
function cosineSimilarity(a, b) {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export { subsetVectorSearch };