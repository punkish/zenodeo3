// Adapter for alibaba/zvec — Alibaba Proxima engine, in-process.
//
// npm install @zvec/zvec
//
// Supported platforms: Linux x86_64, Linux ARM64, macOS ARM64.
// The Node.js SDK (@zvec/zvec) mirrors the Python API shape, translated to
// camelCase. The core objects are:
//   CollectionSchema, VectorSchema, DataType  — define the collection structure
//   createAndOpen(path, schema)               — create or open a collection
//   open(path)                                — open an existing collection
//   Doc                                       — a document to insert
//   VectorQuery                               — a query to run
//
// zvec auto-persists all writes to the collection directory on disk.
// No explicit save/flush call is needed; close() is a no-op here.
//
// Resource governance (set in config.js ZVEC block):
//   optimizeThreads  — threads used during index build
//   queryThreads     — threads used during search
// Keep both low in production to avoid starving other processes on the VPS.
import pkg from '@zvec/zvec';
const {
    ZVecCollectionSchema,
    ZVecCreateAndOpen,
    ZVecOpen,
    ZVecDataType,
    ZVecIndexType,
    ZVecMetricType,
} = pkg;

import fs from 'fs';
import { logger } from '../../../lib/logger.js';
import { ZVEC, ZVEC_INDEX_PATH, VECTOR_DIM } from './config.js';

// Schema is fixed for the lifetime of the process — build it once.
const SCHEMA = new ZVecCollectionSchema({
    name: ZVEC.collectionName,
    vectors: [
        {
            name:       'embedding',
            dataType:   ZVecDataType.VECTOR_FP32,
            dimension:  VECTOR_DIM,
            indexParams: {
                indexType:  ZVecIndexType.HNSW,
                metricType: ZVecMetricType.COSINE,
            },
        },
    ],
});

export class ZvecIndexer {
    constructor() {
        if (fs.existsSync(ZVEC_INDEX_PATH)) {
            logger.info('[zvec] Opening existing collection at', ZVEC_INDEX_PATH);
            this.collection = ZVecOpen(ZVEC_INDEX_PATH);
        } else {
            logger.info('[zvec] Creating new collection at', ZVEC_INDEX_PATH);
            fs.mkdirSync(ZVEC_INDEX_PATH, { recursive: true });
            this.collection = ZVecCreateAndOpen(ZVEC_INDEX_PATH, SCHEMA);
        }
    }

    /**
     * @param {number}       chunkId
     * @param {Float32Array} vector
     */
    add(chunkId, vector) {
        this.collection.insert([{
            id:      String(chunkId),
            vectors: { embedding: Array.from(vector) },
        }]);
    }

    /**
     * @param {Array<{chunkId: number, vector: Float32Array}>} items
     */
    addBatch(items) {
        this.collection.insert(
            items.map(({ chunkId, vector }) => ({
                id:      String(chunkId),
                vectors: { embedding: Array.from(vector) },
            }))
        );
    }

    /**
     * @param {Float32Array} vector
     * @param {number}       topK
     * @returns {{ chunkId: number, distance: number }[]}
     */
    search(vector, topK = 10) {
        const results = this.collection.query({
            vectors: { embedding: Array.from(vector) },
            topk:    topK,
        });

        // zvec returns score in [0, 1] (higher = more similar for cosine).
        // Convert to distance to match the convention of the other adapters.
        return results.map(r => ({
            chunkId:  Number(r.id),
            distance: 1 - r.score,
        }));
    }

    /** zvec auto-persists on every insert; no explicit flush needed. */
    persist() { /* no-op */ }

    close() { /* no-op */ }
}