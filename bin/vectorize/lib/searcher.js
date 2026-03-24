// src/search/index.js
// Unified search API.
//
// Usage:
//   import { Searcher } from './src/search/index.js';
//   const s = new Searcher(db);
//   await s.init();
//
//   // Query any single index:
//   const results = await s.search('What does Laephotis botswanae eat?', {
//       index: 'usearch',   // 'sqliteVec' | 'sqliteVector' | 'usearch' | 'zvec'
//       topK:  5,
//   });
//
//   // Or query all enabled indexes and compare:
//   const comparison = await s.searchAll('cockroaches in southern India', { topK: 5 });
//
//   s.close();

import { getTreatments } from '../../../lib/dataFromZenodeo.js';
import { embed } from './embedder.js';
import { SqliteVecIndexer }    from './sqlite-vec.js';
import { SqliteVectorIndexer } from './sqlite-vector.js';
import { UsearchIndexer }      from './usearch.js';
//import { ZvecIndexer }         from './zvec.js';
import { INDEXES } from './config.js';
import { Config } from '@punkish/zconfig';
const config = new Config().settings;

export class Searcher {

    /**
     * @param {import('better-sqlite3').Database} db
     *   Pass an existing open DB connection, or omit to open DB_PATH.
     */
    constructor(db = null) {
        this.db = db;
        this._adapters = {};
        const sql = getTreatments({ forSomething: true, byChunkIds: true });
        this._getChunk = this.db.prepare(sql);
    }

    /**
     * Initialise whichever index adapters are enabled in config.
     * Call once before searching.
     */
    init() {
        if (INDEXES.sqliteVec) this._adapters.sqliteVec = new SqliteVecIndexer(this.db);
        if (INDEXES.sqliteVector) this._adapters.sqliteVector = new SqliteVectorIndexer(this.db);
        if (INDEXES.usearch) this._adapters.usearch = new UsearchIndexer({ readOnly: true });
        if (INDEXES.zvec) this._adapters.zvec = new ZvecIndexer();
        return this;
    }

    /**
     * Search a single named index.
     *
     * @param {string}  queryText
     * @param {object}  opts
     * @param {string}  opts.index   Index name: 'sqliteVec' | 'sqliteVector' | 'usearch' | 'zvec'
     * @param {number}  [opts.topK=5]
     * @param {boolean} [opts.dedup=true]   Deduplicate by treatments_id
     * @returns {Promise<SearchResult[]>}
     */
    async search(queryText, { index, topK=5, dedup=true } = {}) {
        const adapter = this._adapters[index];
        if (!adapter) throw new Error(`Index "${index}" is not enabled or not initialized.`);

        const vector = await embed(queryText);

        // Retrieve more candidates than needed when deduplicating
        const candidates = adapter.search(vector, dedup ? topK * 4 : topK);
        return this._resolve(candidates, topK, dedup, adapter._cosineKey ?? index);
    }

    /**
     * Search all enabled indexes and return results keyed by index name.
     *
     * @param {string} queryText
     * @param {object} opts
     * @param {number} [opts.topK=5]
     * @returns {Promise<Record<string, SearchResult[]>>}
     */
    async searchAll(queryText, { topK=5 } = {}) {
        const vector = await embed(queryText);
        const out = {};

        for (const [name, adapter] of Object.entries(this._adapters)) {
            const candidates = adapter.search(vector, topK * 4);
            out[name] = this._resolve(candidates, topK, true, name);
        }
        
        return out;
    }

    /**
     * Resolve raw chunk-level results to treatment rows, optionally deduping.
     *
     * @param {{ chunkId: number, distance: number }[]} candidates
     * @param {number}  topK
     * @param {boolean} dedup
     * @param {string}  indexName   For score normalisation hint
     * @returns {SearchResult[]}
     */
    _resolve(candidates, topK, dedup, indexName) {
        const seen    = new Set();
        const results = [];

        for (const { chunkId, distance } of candidates) {
            const row = this._getChunk.get(chunkId);
            if (!row) continue;

            if (dedup && seen.has(row.treatments_id)) continue;
            seen.add(row.treatments_id);

            // Normalise to a [0, 1] similarity score.
            // usearch cosine distance = 1 - similarity, so invert.
            // sqlite-vec cosine distance is the same.
            // sqlite-vector returns distance (lower = better).
            // Adjust if a backend uses a different convention.
            const score = Math.max(0, 1 - distance);

            results.push({
                score,
                treatments_id: row.treatments_id,
                treatmentId:  row.treatmentId,
                zenodoDep: row.zenodoDep,
                treatmentTitle: row.treatmentTitle,
                treatmentAuthor: row.treatmentAuthor,
                articleTitle: row.articleTitle,
                articleAuthor: row.articleAuthor,
                articleDOI: row.articleDOI,
                journalYear: row.journalYear,
                journalTitle: row.journalTitle,
                publicationDate: row.publicationDate,
                status: row.status,
                genus: row.genus,
                species: row.species,
                chunkId,
                chunk_text: row.chunk_text,
                fulltext: row.fulltext,
                speciesDesc: row.speciesDesc,
                index: indexName,
            });

            if (results.length >= topK) break;
        }

        return results.sort((a, b) => b.score - a.score);
    }

    close() {
        for (const adapter of Object.values(this._adapters)) adapter.close?.();
    }
}

/**
 * @typedef {object} SearchResult
 * @property {number} score          Cosine similarity [0, 1] (higher = more relevant)
 * @property {string} treatmentId    treatments.treatmentId (the public UUID)
 * @property {number} treatment_id   treatments.id (internal integer PK)
 * @property {number} genus_id
 * @property {number} species_id
 * @property {number} chunkId        treatment_chunks.id that matched
 * @property {string} index          Name of the index that produced this result
 */
