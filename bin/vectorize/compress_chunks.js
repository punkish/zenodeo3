// compress_chunks.js
import Database from 'better-sqlite3';
import os from "os";
import zlib from "zlib";
import { Worker, isMainThread, parentPort, workerData } from "worker_threads";
import { fileURLToPath } from "url";
import path from "path";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
const DB_PATH = "./data/db/vectors/chunks_bakup.sqlite";

// switch to false for full run
const TEST_MODE = false;
const TEST_LIMIT = 2000;

const NUM_WORKERS = Math.max(1, os.cpus().length - 2);
const BATCH_SIZE = 2000;

const OUTPUT_TABLE = TEST_MODE
    ? "treatment_chunks_test"
    : "treatment_chunks_zipped";

//const dbRead = new Database(DB_PATH, { readonly: true });
const dbWrite = new Database(DB_PATH);

function optimizeDb(db) {

    //const OLD_DB = "chunks.sqlite";       // your current DB
    
    // output optimized DB
    const NEW_DB = "./data/db/vectors/chunks_optimized.sqlite"; 

    // Open new connection to old DB
    //const db = new Database(OLD_DB);

    // Set a larger page size (32 KB)
    db.pragma("page_size = 32768");

    // Optional: reduce synchronous to speed up vacuum
    db.pragma("synchronous = OFF");

    // Vacuum into new DB
    console.log("Vacuuming into new DB... this may take a few minutes");
    db.exec(`VACUUM INTO '${NEW_DB}'`);

    console.log("Done! Optimized DB written to", NEW_DB);

    db.close();
}

function testConnections(db) {
    const res = db.prepare('SELECT Count(*) AS num FROM treatment_chunks')
        .get();
    console.log(res);
}

function readChunk(db, id) {

    const row = db.prepare(`
        SELECT chunk_text
        FROM treatment_chunks_test
        WHERE id=?
    `).get(id);

    if (!row) return null;

    const res = zlib.inflateSync(row.chunk_text).toString("utf8");
    console.log(res);
}


function zipit() {

    // ================= WORKER THREAD =================
    if (!isMainThread) {

        const out = workerData.map(r => {

            const input =
            Buffer.isBuffer(r.chunk_text)
                ? r.chunk_text
                : Buffer.from(r.chunk_text);

            const compressed = zlib.deflateSync(input);

            return {
                ...r,
                chunk_text: compressed
            };
        });

        const transferList = out.map(r => r.chunk_text.buffer);

        parentPort.postMessage(out, transferList);

    }
    else {

        // ================= MAIN THREAD =================
        console.log("Workers:", NUM_WORKERS);
        console.log("Batch size:", BATCH_SIZE);
        console.log("Output table:", OUTPUT_TABLE);

        dbWrite.exec(`
PRAGMA journal_mode=WAL;
PRAGMA synchronous=OFF;
PRAGMA temp_store=MEMORY;
PRAGMA cache_size=-200000;
        `);

        dbWrite.exec(`
CREATE TABLE IF NOT EXISTS ${OUTPUT_TABLE} (
    id INTEGER PRIMARY KEY,

    -- REFERENCES treatments(id), not enforced because 
    -- treatments is in a different schema
    treatments_id INTEGER NOT NULL,

    -- immutable UUID, copied from treatments.treatmentId
    treatmentId TEXT NOT NULL,

    -- 0-based order within treatment
    chunk_index INTEGER NOT NULL,

    -- chunk_text is zipped and has to be viewed via a 
    -- read_chunks script
    chunk_text BLOB NOT NULL,
    token_estimate INTEGER,

    -- usearch vector index key = this row's id
    UNIQUE(treatments_id, chunk_index)
)
        `);

        const insertStmt = dbWrite.prepare(`
INSERT INTO ${OUTPUT_TABLE}
(id,treatments_id,treatmentId,chunk_index,chunk_text,token_estimate)
VALUES (?,?,?,?,?,?)
        `);

        const insertTxn = dbWrite.transaction((rows) => {
            for (const r of rows) {
                insertStmt.run(
                r.id,
                r.treatments_id,
                r.treatmentId,
                r.chunk_index,
                r.chunk_text,
                r.token_estimate
                );
            }
        });

        const selectStmt = dbRead.prepare(`
SELECT id,treatments_id,treatmentId,chunk_index,chunk_text,token_estimate
FROM treatment_chunks
${TEST_MODE ? `LIMIT ${TEST_LIMIT}` : ""}
        `);

        function runWorker(batch) {
            return new Promise((resolve, reject) => {

                const transferList = [];

                for (const r of batch) {
                if (Buffer.isBuffer(r.chunk_text)) {
                    transferList.push(r.chunk_text.buffer);
                }
                }

                const worker = new Worker(new URL(import.meta.url), {
                workerData: batch,
                transferList
                });

                worker.on("message", resolve);
                worker.on("error", reject);
                worker.on("exit", (code) => {
                if (code !== 0) reject(new Error("Worker exit " + code));
                });

            });
        }

        (async () => {

            let batch = [];
            let active = [];
            let processed = 0;

            console.log("Starting compression...");

            for (const row of selectStmt.iterate()) {

                batch.push({
                id: row.id,
                treatments_id: row.treatments_id,
                treatmentId: row.treatmentId,
                chunk_index: row.chunk_index,
                chunk_text: row.chunk_text.toString(),
                token_estimate: row.token_estimate
                });

                if (batch.length >= BATCH_SIZE) {

                active.push(runWorker(batch));
                batch = [];

                if (active.length >= NUM_WORKERS) {
                    const result = await active.shift();
                    insertTxn(result);
                    processed += result.length;

                    if (processed % 10000 === 0)
                    console.log("Processed", processed);
                }
                }
            }

            if (batch.length) active.push(runWorker(batch));

            for (const p of active) {
                const result = await p;
                insertTxn(result);
                processed += result.length;
            }

            console.log("Finished. Rows processed:", processed);

            if (!TEST_MODE) {
                console.log(`
Swap tables after verifying:

ALTER TABLE treatment_chunks RENAME TO treatment_chunks_old;
ALTER TABLE ${OUTPUT_TABLE} RENAME TO treatment_chunks;
DROP TABLE treatment_chunks_old;
        `);
            }

        })();
    }
}

//zipit();
//optimizeDb(dbWrite)