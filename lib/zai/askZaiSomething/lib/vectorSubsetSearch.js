// lib/zai/askZaiSomething/lib/vectorSubsetSearch.js
import { embed } from '../../../../bin/vectorize/lib/embedder.js';
import { sqlRunner } from '../../../dataFromZenodeo.js';

/**
 * Perform a vector search only on a subset of candidate treatments
 * @param {Object} usearchIndex - the memory-mapped usearch index
 * @param {Object} fastify - fastify instance with db connection
 * @param {string} queryText - the user query
 * @param {number} topK - number of top results to return
 * @param {number[]} candidateTreatmentIds - subset of treatment ids
 */
async function subsetVectorSearch(fastify, question, topK = 8, candidateTreatmentIds = []) {

    if (!candidateTreatmentIds.length) {
        return [];
    }

    // 1. Compute embedding for the query
    const queryVector = await embed(question);
    //const queryVector = embedding[0]; // assuming embedText returns array of arrays

    // 2. Retrieve chunkIds for candidate treatments
    //let placeholders = candidateTreatmentIds.map(() => '?').join(',');
    
    const whereClause = candidateTreatmentIds.map(id => {
        return ` tc.treatments_id = ${id}`
    }).join(' OR ');

    const sql = `
        SELECT
            tc.id AS chunkId,
            tc.treatments_id,
            tc.chunk_text,
            cv.vector
        FROM chunks.treatment_chunks tc
        JOIN chunks.chunk_vectors cv
            ON tc.id = cv.chunk_id
        WHERE ${whereClause}
    `;

    //placeholders = candidateTreatmentIds.join(',');
    const runparams = {};
    const returnRows = 'all';
    const { result } = sqlRunner(fastify, sql, runparams, returnRows);

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
            chunk_text: row.chunk_text,
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