// src/indexers/sqlite-vector.js
// Adapter for @sqliteai/sqlite-vector — HNSW-capable SQLite extension.
//
// npm install @sqliteai/sqlite-vector
//
// ⚠️  License: Elastic License 2.0
//     Free for internal/non-competitive use; contact sqliteai for commercial
//     managed-service deployment. Verify compliance for your use case.
//
// Architecture:
//   Vectors stored as BLOBs in an ordinary table (svec_treatments).
//   vector_init() builds the HNSW index in-place.
//   vector_quantize() applies product quantization for faster search.
//   vector_quantize_scan() performs the ANN query.
//import { connect } from '../../../lib/dbconn.js';
import { logger } from '../../../lib/logger.js';
import { getExtensionPath } from '@sqliteai/sqlite-vector';
import { SQLITE_VECTOR, VECTOR_DIM } from './config.js';

const TABLE = SQLITE_VECTOR.table;
const TYPE  = SQLITE_VECTOR.type;   // 'FLOAT32'
const SCHEMA = SQLITE_VECTOR.schema;

export class SqliteVectorIndexer {
    /**
     * @param {import('better-sqlite3').Database} db
     * @param {object} opts
     * @param {boolean} opts.initIndex  Whether to call vector_init() now
     *                                  (set false during bulk insert, call
     *                                   finalizeIndex() once when done)
     */
    constructor(db, { initIndex = true } = {}) {
        db.loadExtension(getExtensionPath());
        this.db = db;

        // Table is created by schema.sql; ensure it exists here as well
        db.exec(`
            CREATE TABLE IF NOT EXISTS ${SCHEMA}.${TABLE} (
                chunk_id  INTEGER PRIMARY KEY,
                embedding BLOB NOT NULL
            )
        `);

        this._insert = db.prepare(`
            INSERT OR REPLACE INTO ${SCHEMA}.${TABLE}(chunk_id, embedding)
            VALUES (?, vector_convert_f32(?))
        `);

        this._search = db.prepare(`
            SELECT t.chunk_id, v.distance
            FROM   ${SCHEMA}.${TABLE} AS t
            JOIN   vector_quantize_scan('${SCHEMA}.${TABLE}', 'embedding', ?, ?) AS v
                   ON t.chunk_id = v.rowid
        `);

        this._indexInitialized = false;
        if (initIndex) this._ensureIndex();
    }

    _ensureIndex() {
        if (this._indexInitialized) return;
        this.db.exec(`
            SELECT vector_init('${SCHEMA}.${TABLE}', 'embedding', 'type=${SQLITE_VECTOR.type},dimension=${VECTOR_DIM}')
        `);
        this._indexInitialized = true;
    }

    /**
     * Call once after bulk inserts to build/quantize the index.
     * Much faster than re-indexing after every insert.
     */
    finalizeIndex() {
        logger.info('[sqlite-vector] Finalizing index (vector_init + vector_quantize)…');
        this._ensureIndex();
        this.db.exec(`SELECT vector_quantize('${SCHEMA}.${TABLE}', 'embedding')`);
        logger.info('[sqlite-vector] Index finalized.');
    }

    /**
     * @param {number}       chunkId
     * @param {Float32Array} vector
     */
    add(chunkId, vector) {
        // Pass raw bytes; vector_convert_f32() normalises the format
        this._insert.run(chunkId, Buffer.from(vector.buffer));
    }

    addBatch(items) {
        const insertMany = this.db.transaction(() => {
            for (const { chunkId, vector } of items) this.add(chunkId, vector);
        });
        insertMany();
    }

    /**
     * @param {Float32Array} vector
     * @param {number}       topK
     * @returns {{ chunkId: number, distance: number }[]}
     */
    search(vector, topK = 10) {
        return this._search
            .all(Buffer.from(vector.buffer), topK)
            .map(r => ({ chunkId: r.chunk_id, distance: r.distance }));
    }

    persist() { /* stored in SQLite — no separate save needed */ }

    close() {}
}
