// src/indexers/sqlite-vec.js
// Adapter for asg017/sqlite-vec — brute-force KNN inside SQLite.
//
// npm install sqlite-vec
//
// The vec0 virtual table is keyed on chunk_id (INTEGER PRIMARY KEY).
// Quantization is controlled by config.SQLITE_VEC.quantization:
//   'f32'  — full precision, 768 * 4 = 3072 bytes/vector
//   'int8' — ~4x smaller, minimal accuracy loss on nomic-embed-text
//   'bit'  — 32x smaller, highest loss, not recommended for dense text

import * as sqliteVec from '@photostructure/sqlite-vec';
import { SQLITE_VEC, VECTOR_DIM } from './config.js';

const TABLE = SQLITE_VEC.table;
const QUANT = SQLITE_VEC.quantization;   // 'f32' | 'int8' | 'bit'
const SCHEMA = SQLITE_VEC.schema;

// Map config string → SQL column type used by vec0
const COLTYPE = { f32: 'float', int8: 'int8', bit: 'bit' };

export class SqliteVecIndexer {
    /** @param {import('better-sqlite3').Database} db */
    constructor(db) {
        sqliteVec.load(db);
        this.db = db;

        db.exec(`
            CREATE VIRTUAL TABLE IF NOT EXISTS ${SCHEMA}.${TABLE} USING vec0(
                chunk_id  INTEGER PRIMARY KEY,
                embedding ${COLTYPE[QUANT]}[${VECTOR_DIM}]
            )
        `);

        this._insert = db.prepare(`
            INSERT OR REPLACE INTO ${SCHEMA}.${TABLE}(chunk_id, embedding) 
            VALUES (?, ?)
        `);

        this._search = db.prepare(`
            SELECT chunk_id, distance
            FROM   ${SCHEMA}.${TABLE}
            WHERE  embedding MATCH ?
              AND  k = ?
            ORDER BY distance
        `);
    }

    /**
     * Add a single vector.
     * @param {number}       chunkId  - treatment_chunks.id
     * @param {Float32Array} vector
     */
    add(chunkId, vector) {
        const buf = QUANT === 'f32'
            ? vector.buffer
            : sqliteVec.serialize(vector, QUANT);   // built-in quantization helper
        this._insert.run(chunkId, buf);
    }

    /**
     * Batch-insert vectors inside a transaction for speed.
     * @param {Array<{chunkId: number, vector: Float32Array}>} items
     */
    addBatch(items) {
        const insertMany = this.db.transaction(() => {
            for (const { chunkId, vector } of items) this.add(chunkId, vector);
        });
        insertMany();
    }

    /**
     * Find the nearest neighbours to a query vector.
     * @param {Float32Array} vector
     * @param {number}       topK
     * @returns {{ chunkId: number, distance: number }[]}
     */
    search(vector, topK = 10) {
        return this._search
            .all(vector.buffer, topK)
            .map(r => ({ chunkId: r.chunk_id, distance: r.distance }));
    }

    /** No external state to save — vec0 writes directly to SQLite. */
    persist() { /* no-op */ }

    close() { /* db lifecycle managed externally */ }
}
