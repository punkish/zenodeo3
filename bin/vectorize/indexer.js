// indexer.js -- orig
// Three-stage pipeline — each stage is independently resumable and skipped
// when its output already exists:
//
//   Stage 1 — CHUNK:   split fulltext → treatment_chunks rows
//   Stage 2 — EMBED:   chunk text → Float32 vectors → chunk_vectors rows
//   Stage 3 — INDEX:   stored vectors → each enabled vector index
//
// embedding_progress.status tracks the furthest completed stage:
//   'pending'  → nothing done
//   'chunked'  → Stage 1 complete
//   'embedded' → Stage 2 complete (vectors stored in chunk_vectors)
//   'indexed'  → Stage 3 complete for all currently-enabled indexes
//   'error'    → last attempt failed; will be retried on next run
//
// Per-index forceRebuild (config.REBUILD.*) clears only that index's store
// and re-runs Stage 3 from chunk_vectors — no re-chunking or re-embedding.
//
// Usage:
//   node indexer.js              # process all pending / resume
//   node indexer.js --daily      # only recently added treatments
//   node indexer.js --rebuild    # full reset: wipe everything and start over

import fs from 'fs';
import path from 'path';
import { setTimeout as sleep } from 'timers/promises';
import cliProgress from 'cli-progress';
import colors from 'ansi-colors';
import { Config } from '@punkish/zconfig';
const config = new Config().settings;
import { logger } from '../../lib/logger.js';
import { DbConnection } from '../../lib/dbconn.js';

import {
    USEARCH_INDEX_PATH, ZVEC_INDEX_PATH, INDEXES, REBUILD, 
    DB_BATCH_SIZE, EMBED_CONCURRENCY, BATCH_PAUSE_MS
} from './lib/config.js';
import { chunkText }           from './lib/chunker.js';
import { embedBatch }          from './lib/embedder.js';
import { SqliteVecIndexer }    from './lib/sqlite-vec.js';
import { SqliteVectorIndexer } from './lib/sqlite-vector.js';
import { UsearchIndexer }      from './lib/usearch.js';
import { ZvecIndexer }         from './lib/zvec.js';

// ── Database ─────────────────────────────────────────────────────────────────
async function testConn(db) {
    const res = db.prepare('SELECT * FROM rowcounts').all();
    res.forEach(r => logger.info(`${r.tblname}: ${r.rows}`));
}

// ── Prepared statements ──────────────────────────────────────────────────────

function prepareStatements(db) {
    const SCHEMA = 'chunks';

    return {

        // Progress tracking
        markChunked: db.prepare(`
            UPDATE ${SCHEMA}.embedding_progress
            SET status = 'chunked', started_at = ?, error_msg = NULL
            WHERE treatments_id = ?
        `),
        markEmbedded: db.prepare(`
            UPDATE ${SCHEMA}.embedding_progress
            SET status = 'embedded', chunk_count = ?
            WHERE treatments_id = ?
        `),
        markIndexed: db.prepare(`
            UPDATE ${SCHEMA}.embedding_progress
            SET status = 'indexed', finished_at = ?
            WHERE treatments_id = ?
        `),
        markError: db.prepare(`
            UPDATE ${SCHEMA}.embedding_progress
            SET status = 'error', error_msg = ?, finished_at = ?
            WHERE treatments_id = ?
        `),

        // Chunk store
        getChunks: db.prepare(`
            SELECT id, chunk_text
            FROM   ${SCHEMA}.treatment_chunks
            WHERE  treatments_id = ?
            ORDER  BY chunk_index
        `),
        deleteChunks: db.prepare(`
            DELETE FROM ${SCHEMA}.treatment_chunks WHERE treatments_id = ?
        `),
        insertChunk: db.prepare(`
            INSERT OR REPLACE INTO ${SCHEMA}.treatment_chunks
                (treatments_id, treatmentId, chunk_index, chunk_text)
            VALUES (?, ?, ?, ?)
            RETURNING id
        `),

        // Vector store
        getVectors: db.prepare(`
            SELECT chunk_id, vector
            FROM   ${SCHEMA}.chunk_vectors
            WHERE  treatments_id = ?
            ORDER  BY chunk_id
        `),
        deleteVectors: db.prepare(`
            DELETE FROM ${SCHEMA}.chunk_vectors WHERE treatments_id = ?
        `),
        insertVector: db.prepare(`
            INSERT OR REPLACE INTO ${SCHEMA}.chunk_vectors (chunk_id, treatments_id, vector)
            VALUES (?, ?, ?)
        `),

        // Counts
        countByStatus: db.prepare(`
            SELECT COUNT(*) as n 
            FROM ${SCHEMA}.embedding_progress 
            WHERE status = ?
        `),
        countTotal: db.prepare(`
            SELECT COUNT(*) as n FROM ${SCHEMA}.embedding_progress
        `),

        // countPending: db.prepare(`
        //     SELECT COUNT(*) as n 
        //     FROM chunks.embedding_progress 
        //     WHERE status = 'pending'
        // `),
    };
}

// ── Stage 1: chunk ───────────────────────────────────────────────────────────
// Returns existing chunk rows if already chunked, otherwise chunks and saves.
// Returns null on error.

async function ensureChunks(treatment, stmts) {
    const existing = stmts.getChunks.all(treatment.id);
    if (existing.length > 0) return existing;   // already done — skip

    let texts;
    try {
        texts = await chunkText(treatment.fulltext);
    } 
    catch (err) {
        stmts.markError.run(
            `chunkError: ${err.message}`, 
            Date.now(), 
            treatment.id
        );
        return null;
    }

    if (texts.length === 0) return [];

    const writeChunks = stmts.insertChunk.database.transaction(() => {
        stmts.deleteChunks.run(treatment.id);
        return texts.map((text, i) =>
            stmts.insertChunk.get(treatment.id, treatment.treatmentId, i, text)
        );
    });

    try {
        const rows = writeChunks();
        return rows.map((row, i) => ({ id: row.id, chunk_text: texts[i] }));
    } 
    catch (err) {
        stmts.markError.run(
            `dbError: ${err.message}`, 
            Date.now(), 
            treatment.id
        );
        return null;
    }
}

// ── Stage 2: embed ───────────────────────────────────────────────────────────
// Returns stored vectors from chunk_vectors if all present, otherwise embeds
// and saves. forceReembed bypasses the cache check.
// Returns null on error.
async function ensureVectors(treatment, chunks, stmts) {
    if (!REBUILD.forceReembed) {
        const existing = stmts.getVectors.all(treatment.id);

        if (existing.length === chunks.length) {

            // All vectors already stored — deserialise BLOBs to Float32Arrays
            return existing.map(row => ({
                chunkId: row.chunk_id,
                vector:  new Float32Array(
                    row.vector.buffer
                        ? row.vector.buffer.slice(
                            row.vector.byteOffset,
                            row.vector.byteOffset + row.vector.byteLength
                          )
                        : row.vector
                ),
            }));
        }
    }

    let vectors;
    try {
        vectors = await embedBatch(chunks.map(c => c.chunk_text), EMBED_CONCURRENCY);
    } 
    catch (err) {
        stmts.markError.run(
            `embedError: ${err.message}`, 
            Date.now(), 
            treatment.id
        );
        return null;
    }

    const writeVectors = stmts.insertVector.database.transaction(() => {
        stmts.deleteVectors.run(treatment.id);

        for (let i = 0; i < chunks.length; i++) {
            stmts.insertVector.run(
                chunks[i].id,
                treatment.id,
                Buffer.from(vectors[i].buffer)
            );
        }
    });

    try {
        writeVectors();
    } catch (err) {
        stmts.markError.run(
            `vectorStoreError: ${err.message}`, 
            Date.now(), 
            treatment.id
        );
        return null;
    }

    return chunks.map((chunk, i) => ({ 
        chunkId: chunk.id, 
        vector: vectors[i] 
    }));
}

// ── Core: process one treatment through all three stages ─────────────────────

async function processTreatment(treatment, stmts, activeIndexers) {

    // Stage 1
    const chunks = await ensureChunks(treatment, stmts);
    if (chunks === null) return { ok: false, chunkCount: 0 };

    if (chunks.length === 0) {
        stmts.markIndexed.run(Date.now(), treatment.id);
        return { ok: true, chunkCount: 0 };
    }

    stmts.markChunked.run(Date.now(), treatment.id);

    // Stage 2
    const vectorItems = await ensureVectors(treatment, chunks, stmts);
    if (vectorItems === null) return { ok: false, chunkCount: chunks.length };
    stmts.markEmbedded.run(chunks.length, treatment.id);

    // Stage 3
    for (const [name, indexer] of Object.entries(activeIndexers)) {
        try {
            indexer.addBatch(vectorItems);
        } 
        catch (err) {
            logger.info(`[${name}] addBatch error for treatment ${treatment.id}: ${err.message}`);
        }
    }

    stmts.markIndexed.run(Date.now(), treatment.id);
    return { ok: true, chunkCount: chunks.length };
}

// ── Index-only rebuild from stored vectors ───────────────────────────────────
// Streams all rows from chunk_vectors in batches and inserts into one index.

function rebuildIndexFromVectors(name, indexer, db, bar) {
    let d = new Date().toISOString();
    bar.log(`${d} [${name}] Rebuilding from stored vectors…\n`);

    const BATCH_SIZE = 500;
    let batch  = [];
    let count  = 0;

    const flush = () => {
        if (batch.length === 0) return;
        indexer.addBatch(batch);
        count += batch.length;
        batch  = [];
    };

    const SCHEMA = 'chunks';
    const sql = `
        SELECT chunk_id, vector 
        FROM ${SCHEMA}.chunk_vectors 
        ORDER BY chunk_id
    `;

    for (const row of db.prepare(sql).iterate()) {
        batch.push({
            chunkId: row.chunk_id,
            vector:  new Float32Array(
                row.vector.buffer
                    ? row.vector.buffer.slice(
                        row.vector.byteOffset,
                        row.vector.byteOffset + row.vector.byteLength
                      )
                    : row.vector
            ),
        });

        if (batch.length >= BATCH_SIZE) flush();
    }
    flush();

    d = new Date().toISOString();
    bar.log(`${d} [${name}] Rebuilt ${count} vectors.\n`);
}

// ── Progress bar ─────────────────────────────────────────────────────────────

function createBar(total, alreadyDone) {

    // MultiBar is used instead of SingleBar because only MultiBar exposes
    // bar.log(), which prints lines above the bar without corrupting it.
    // We still only create one bar inside the container.
    const multi = new cliProgress.MultiBar({
        format:
            colors.cyan('{bar}') +
            ' {percentage}% | {value}/{total} treatments' +
            ' | elapsed: {duration_formatted}' +
            ' | ETA: {eta_formatted}' +
            ' | {chunksPerSec} chunks/s' +
            ' | errors: {errors}',
        barCompleteChar:   '█',
        barIncompleteChar: '░',
        hideCursor:        true,
        gracefulExit:      true,
        etaBuffer:         50,
        fps:               4,
    }, cliProgress.Presets.shades_classic);

    const bar = multi.create(
        total, 
        alreadyDone, 
        { errors: 0, chunksPerSec: '—' }
    );

    // Attach logger.info() directly on the bar object so call sites don't need to
    // distinguish between the container and the bar instance.
    bar.log = multi.log.bind(multi);

    // Expose stop() so callers can stop the whole container cleanly.
    bar.stopAll = multi.stop.bind(multi);
    return bar;
}


// ── Main ─────────────────────────────────────────────────────────────────────

async function run() {
    const args      = process.argv.slice(2);
    const isDaily   = args.includes('--daily');
    const isRebuild = args.includes('--rebuild');

    const db = new DbConnection({ logger }).getDb();
    const stmts = prepareStatements(db);
    const SCHEMA = 'chunks';

    // ── Full rebuild: wipe all pipeline state ──────────────────────────────
    if (isRebuild) {
        logger.info('--rebuild: wiping all pipeline state');
        const markPendingAll = `
            UPDATE ${SCHEMA}.embedding_progress 
            SET 
                status='pending', 
                started_at=NULL, 
                finished_at=NULL, 
                error_msg=NULL, 
                chunk_count=NULL
        `;
        const cleanTreatmentChunks = `DELETE FROM ${SCHEMA}.treatment_chunks`;
        const cleanChunkVectors = `DELETE FROM ${SCHEMA}.chunk_vectors`;

        db.prepare(markPendingAll).run();
        db.prepare(cleanTreatmentChunks).run();
        db.prepare(cleanChunkVectors).run();

        if (INDEXES.sqliteVec) {
            db.prepare(`DELETE FROM vec_treatments`).run();
        }

        if (INDEXES.sqliteVector) {
            db.prepare(`DELETE FROM svec_treatments`).run();
        }

        if (INDEXES.usearch && fs.existsSync(USEARCH_INDEX_PATH)) {
            fs.unlinkSync(USEARCH_INDEX_PATH);
        }

        if (INDEXES.zvec && fs.existsSync(ZVEC_INDEX_PATH)) {
            fs.rmSync(ZVEC_INDEX_PATH, { recursive: true, force: true });
        }
    }

    // Crashed 'chunked' rows: chunks exist but embed step was interrupted.
    // Reset to pending so they re-enter Stage 2 cleanly.
    const markPendingChunked = `
        UPDATE ${SCHEMA}.embedding_progress
        SET status = 'pending', started_at = NULL
        WHERE status = 'chunked'
    `;
    const markPendingErrored = `
        UPDATE ${SCHEMA}.embedding_progress 
        SET status = 'pending'
        WHERE status = 'error'
    `;

    db.prepare(markPendingChunked).run();
    db.prepare(markPendingErrored).run();

    // Build active indexers
    const active = {};

    if (INDEXES.sqliteVec) {
        active.sqliteVec = new SqliteVecIndexer(db);
    }

    if (INDEXES.sqliteVector) {
        active.sqliteVector = new SqliteVectorIndexer(db, { initIndex: false });
    }

    if (INDEXES.usearch) {
        active.usearch = new UsearchIndexer();
    }

    if (INDEXES.zvec) {
        active.zvec = new ZvecIndexer();
    }

    // ── Set up progress bar ────────────────────────────────────────────────
    const totalAll  = stmts.countTotal.get().n;
    const nPending  = stmts.countByStatus.get('pending').n;
    const nEmbedded = stmts.countByStatus.get('embedded').n;
    const bar = createBar(totalAll, totalAll - nPending - nEmbedded);

    // ── Per-index force-rebuild from stored vectors ────────────────────────
    for (const [name, on] of Object.entries(REBUILD)) {
        if (!on || name === 'forceReembed' || !active[name]) continue;

        bar.log(`${new Date().toISOString()} [${name}] forceRebuild=true — clearing index store\n`);

        if (name === 'usearch') {

            if (fs.existsSync(USEARCH_INDEX_PATH)) {
                fs.unlinkSync(USEARCH_INDEX_PATH);
            }

            active.usearch = new UsearchIndexer();
        }
        if (name === 'zvec') {

            if (fs.existsSync(ZVEC_INDEX_PATH)) {
                fs.rmSync(ZVEC_INDEX_PATH, { recursive: true, force: true });
            }

            active.zvec = new ZvecIndexer();
        }

        if (name === 'sqliteVec') {
            db.prepare(`DELETE FROM vec_treatments`).run();
        }

        if (name === 'sqliteVector') {
            db.prepare(`DELETE FROM svec_treatments`).run();
        }

        rebuildIndexFromVectors(name, active[name], db, bar);
    }

    // ── Handle forceReembed ────────────────────────────────────────────────
    if (REBUILD.forceReembed) {
        bar.log(`${new Date().toISOString()} forceReembed: clearing stored vectors, resetting to 'chunked'\n`);
        db.prepare(`DELETE FROM ${SCHEMA}.chunk_vectors`).run();
        db.prepare(`
            UPDATE ${SCHEMA}.embedding_progress 
            SET status='chunked' 
            WHERE status IN ('embedded','indexed')
        `).run();
    }

    // ── Main processing loop ───────────────────────────────────────────────
    const limitClause = isDaily
        ? `AND t.id IN (SELECT id FROM treatments ORDER BY id DESC LIMIT 20000)`
        : '';

    const pageQuery = db.prepare(`
        SELECT t.id, t.treatmentId, t.fulltext,
               p.status AS progress_status
        FROM   treatments t
        JOIN   ${SCHEMA}.embedding_progress p ON p.treatments_id = t.id
        WHERE  p.status IN ('pending', 'embedded')
        ${limitClause}
        ORDER BY t.id
        LIMIT ${DB_BATCH_SIZE}
    `);

    const workLeft = nPending + nEmbedded;
    logger.info(`Treatments: ${totalAll} total | ${workLeft} need work (${nPending} pending, ${nEmbedded} embed-only) | ${totalAll - workLeft} done`);

    if (workLeft === 0) {
        logger.info('Nothing to do.');
        bar.stopAll();
        db.close();
        return;
    }

    let processed   = 0;
    let errors      = 0;
    let totalChunks = 0;
    let lastSave    = Date.now();
    let throughputWindowChunks = 0;
    let throughputWindowStart  = Date.now();

    //                            mins
    //                             |
    //                             v
    const SAVE_INTERVAL_MS       = 30 * 60 * 1000;
    const THROUGHPUT_INTERVAL_MS = 10_000;

    function persistFileIndexes() {
        bar.log(`${new Date().toISOString()} Saving file-based indexes…\n`);

        for (const [name, idx] of Object.entries(active)) {
            try { 
                idx.persist(); 
            }
            catch (err) { 
                bar.log(`${new Date().toISOString()} [${name}] persist error: ${err.message}\n`); 
            }
        }

        lastSave = Date.now();
    }

    let stopping = false;
    process.on('SIGINT', () => {
        stopping = true;
        bar.stopAll();
        console.log('\nInterrupted — saving indexes before exit…');
        persistFileIndexes();
        db.close();
        process.exit(0);
    });

    while (!stopping) {
        const page = pageQuery.all();
        if (page.length === 0) break;

        for (const treatment of page) {
            if (stopping) break;

            let ok, chunkCount;

            if (treatment.progress_status === 'embedded') {

                // Stage 3 only — chunks and vectors already stored
                const vectorItems = stmts.getVectors.all(treatment.id)
                    .map(row => ({
                        chunkId: row.chunk_id,
                        vector:  new Float32Array(
                            row.vector.buffer
                                ? row.vector.buffer.slice(
                                    row.vector.byteOffset,
                                    row.vector.byteOffset + row.vector.byteLength
                                )
                                : row.vector
                        ),
                    }));

                for (const [name, indexer] of Object.entries(active)) {
                    try { 
                        indexer.addBatch(vectorItems); 
                    }
                    catch (err) { 
                        logger.info(`[${name}] addBatch error: ${err.message}`); 
                    }
                }
                stmts.markIndexed.run(Date.now(), treatment.id);
                ok = true; chunkCount = vectorItems.length;
            } 
            else {

                // Full pipeline: all three stages
                ({ ok, chunkCount } = await processTreatment(treatment, stmts, active));
            }

            ok ? (processed++, totalChunks += chunkCount, throughputWindowChunks += chunkCount)
               : errors++;

            const now = Date.now();
            let chunksPerSec = '—';

            if (now - throughputWindowStart >= THROUGHPUT_INTERVAL_MS) {
                const elapsed = (now - throughputWindowStart) / 1000;
                chunksPerSec = elapsed > 0 ? (throughputWindowChunks / elapsed).toFixed(1) : '—';
                throughputWindowChunks = 0;
                throughputWindowStart  = now;
            }

            bar.increment(1, { errors, chunksPerSec });
            const cond1 = now - lastSave > SAVE_INTERVAL_MS;
            const cond2 = (processed > 0 && processed % 10_000 === 0);

            if (cond1 || cond2) {
                persistFileIndexes();
            }
        }

        await sleep(BATCH_PAUSE_MS);
    }

    bar.stopAll();
    logger.info(`Done. ${processed} indexed, ${errors} errors, ${totalChunks} total chunks.`);

    if (active.sqliteVector) {
        logger.info('Finalizing sqlite-vector HNSW index…');
        active.sqliteVector.finalizeIndex();
    }

    persistFileIndexes();
    db.close();
}

run().catch(err => { console.error('Fatal:', err); process.exit(1); });