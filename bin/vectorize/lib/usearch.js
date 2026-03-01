// src/indexers/usearch.js
// Adapter for unum-cloud/usearch — HNSW index persisted to a .usearch file.
//
// npm install usearch
//
// Keys in the usearch index are treatment_chunks.id integers (BigInt).
// Multiple chunks from the same treatment share the same treatment_id but have
// distinct chunk_ids, so search() may return the same treatment multiple times;
// deduplication is handled by the Searcher layer.
//
// Two open modes:
//   readOnly: false (default) — index.load()  — reads entire file into RAM,
//                               supports add()/save(). Used by the indexer.
//   readOnly: true            — index.view()  — memory-maps the file, returns
//    

import { Index } from 'usearch';
import fs from 'fs';
import path from 'path';
import { USEARCH, USEARCH_INDEX_PATH, VECTOR_DIM } from './config.js';
import { logger } from './logger.js';

export class UsearchIndexer {
    /**
     * @param {object}  opts
     * @param {boolean} [opts.readOnly=false]
     *   true  → view() (memory-mapped, instant open, read-only)
     *   false → load() (full read into RAM, supports writes)
     */
    constructor({ readOnly = false } = {}) {
        this.readOnly = readOnly;
        this.index = new Index({
            metric:          USEARCH.metric,
            dimensions:      VECTOR_DIM,
            connectivity:    USEARCH.connectivity,
            expansionAdd:    USEARCH.expansionAdd,
            expansionSearch: USEARCH.expansionSearch,
        });

        if (fs.existsSync(USEARCH_INDEX_PATH)) {

            if (readOnly) {
                logger.info(`[usearch] Viewing index (memory-mapped) from ${USEARCH_INDEX_PATH}`);
                this.index.view(USEARCH_INDEX_PATH);
            } 
            else {
                logger.info(`[usearch] Loading index into RAM from ${USEARCH_INDEX_PATH}`);
                this.index.load(USEARCH_INDEX_PATH);
            }

        } 
        else {

            if (readOnly) {
                throw new Error(`[usearch] No index found at ${USEARCH_INDEX_PATH} — run the indexer first.`);
            }

            logger.info('[usearch] Creating new index');
            fs.mkdirSync(path.dirname(USEARCH_INDEX_PATH), { recursive: true });
        }
    }

    /**
     * @param {number}       chunkId
     * @param {Float32Array} vector
     */
    add(chunkId, vector) {
        if (this.readOnly) throw new Error('[usearch] Cannot add to a read-only (viewed) index.');
        this.index.add(BigInt(chunkId), vector);
    }

    /**
     * Remove a key from the index if it exists.
     * Safe to call on a key that isn't present — contains() guards the remove.
     * @param {number} chunkId
     */
    remove(chunkId) {
        if (this.readOnly) throw new Error('[usearch] Cannot remove from a read-only (viewed) index.');
        const key = BigInt(chunkId);
        if (this.index.contains(key)) this.index.remove(key);
    }

    /**
     * Idempotent batch insert — removes any existing entry for each key before
     * adding. This prevents "Duplicate keys not allowed" errors when resuming
     * a run that was interrupted mid-treatment during Stage 3.
     * @param {Array<{chunkId: number, vector: Float32Array}>} items
     */
    addBatch(items) {
        for (const { chunkId, vector } of items) {
            this.remove(chunkId);
            this.add(chunkId, vector);
        }
    }

    /**
     * @param {Float32Array} vector
     * @param {number}       topK
     * @returns {{ chunkId: number, distance: number }[]}
     */
    search(vector, topK = 10) {
        const result = this.index.search(vector, topK);

        const keys      = result.keys      ?? result[0];
        const distances = result.distances ?? result[1];

        if (!keys || !distances) {
            throw new TypeError(
                `usearch.search() returned unexpected shape: ${JSON.stringify(Object.keys(result))}`
            );
        }

        return Array.from(keys).map((key, i) => ({
            chunkId:  Number(key),
            distance: distances[i],
        }));
    }

    persist() {
        if (this.readOnly) return;
        this.index.save(USEARCH_INDEX_PATH);
        //logger.info(`[usearch] Index saved to ${USEARCH_INDEX_PATH}`);
    }

    close() {
        this.persist();
    }
}
