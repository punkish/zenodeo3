import pLimit from 'p-limit';
import { Config } from '@punkish/zconfig';
const config = new Config().settings;
import Zlogger from '../../../../../zlogger/index.js';
import { connect } from '../db/dbconn.js';
import ollama from 'ollama';
const logger = new Zlogger(config.newbug.logger);

const db = connect({
    dbconfig:  config.newbug.database,
    logger
});

// max parallel Ollama calls at a time
const CONCURRENCY = 4;

// number of rows to load from SQLite per batch
const BATCH_SIZE = 100;

// concurrency limiter for Ollama
const llmLimit = pLimit(CONCURRENCY);

// ENSURES SQLITE WRITES ARE SYNCHRONOUS
// (only one doSomethingWithResponse() runs at a time)
const writeLimit = pLimit(1);

const models = {
    'qwen06': 'qwen3:0.6b',
    'qwen4b': 'qwen3:4b-instruct',
    'gemma1b': 'gemma3:1b-it-qat',
    'llama': 'llama3.2:latest',
    'llama1b': 'llama3.2:1b',
    'phi3': 'phi3:mini'
};

function createTempTable(db) {
    logger.info('Creating a temp table of treatments without summaries');
    const start = new Date();

    db.exec(`
        CREATE TEMP TABLE t_no_sum AS
            SELECT 
                t.id AS id,
                t.treatmentId AS treatmentId, 
                t.fulltext AS fulltext,
                g.genus AS genus, 
                s.species AS species
            FROM 
                treatments t
                JOIN genera g ON t.genera_id = g.id
                JOIN species s ON t.species_id = s.id
            WHERE 
                t.rank = 'species' 
                AND t.genera_id IS NOT NULL
                AND t.genera_id != 18 
                AND t.species_id IS NOT NULL
                AND t.species_id != 2
                AND NOT EXISTS (
                    SELECT 1
                    FROM zai.speciesDescriptions z
                    WHERE z.treatmentId = t.treatmentId
                )
            ORDER BY id ASC;
    `);
    const count = db.prepare('SELECT Count(*) AS c FROM t_no_sum').get().c;
    const end = new Date();
    const time = end - start;
    logger.info(`The temp table with ${count} rows created in: ${time}ms`);

    // Select the smallest ID from the temp table
    const minId = db.prepare(`SELECT Min(id) AS minId FROM t_no_sum`).get().minId;

    return { minId, count };
}

async function answerFromZai(question, fulltext, treatmentId) {

    try {
        const response = await ollama.chat({
            model: models.qwen06,
            messages: [
                {
                    role: 'system',
                    content: `You are a helpful assistant. Answer based only on the given context.\n\nContext:\n${fulltext}`
                },
                {
                    role: 'user',
                    content: `Based on the above context, ${question}`
                }
            ]
        });

        return response;
    }
    catch(error) {
        logger.error(`${treatmentId}\t${question}`);
        return false;
    }

}

// fetch a batch of rows
function getTreatmentBatch(startId, size) {
    return db.prepare(`
        SELECT id, treatmentId, fulltext, genus, species
        FROM t_no_sum
        WHERE id >= @start
        LIMIT @size;
    `).all({ start: startId, size });
}

// must remain synchronous
async function safeWrite({
    insert, 
    treatmentId, 
    speciesDesc,
    models_id,
    genus,
    species
}) {
    return writeLimit(() => insert.run({ 
        treatmentId, 
        speciesDesc,
        models_id,
        genus,
        species
    }));
}

let duration = 0;

async function processAllTreatments(startId=1, count) {
    const insert = db.prepare(`
        INSERT INTO binomensView (
            treatmentId, 
            speciesDesc, 
            models_id, 
            genus, 
            species
        )
        VALUES (
            @treatmentId, 
            @speciesDesc, 
            @models_id, 
            @genus, 
            @species
        );
    `)

    let nextId = startId;
    let counter = 1;
    let start = process.hrtime.bigint();
    let duration = 0;

    while (true) {

        logger.info(`Fetching batch starting at ID ${nextId}...`);

        const batch = getTreatmentBatch(nextId, BATCH_SIZE);
        if (batch.length === 0) {
            logger.info("No more rows. Done.");
            break;
        }

        const left = count - (counter * batch.length);
        counter++;

        // create a set of LLM tasks (concurrency-limited)
        const tasks = batch.map(row =>
            llmLimit(async () => {
                const question = `Describe ${row.genus} ${row.species}`;
                const fulltext = row.fulltext;
                const treatmentId = row.treatmentId;

                const response = await answerFromZai(
                    question, fulltext, treatmentId
                );

                if (response) {
                    const speciesDesc = response.message.content.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

                    const response_duration = Number(
                        (response.total_duration * 1e-6).toFixed(0)
                    );
                    duration += response_duration;

                    // force serialized SQLite writes
                    await safeWrite({
                        insert, 
                        treatmentId, 
                        speciesDesc,
                        models_id: 1,
                        genus: row.genus,
                        species: row.species
                    }); 
                }

            })
        );

        // wait for the whole batch to complete
        await Promise.all(tasks);

        // advance to next batch
        nextId = batch[batch.length - 1].id + 1;
        const end = process.hrtime.bigint();
        duration = Number(end - start) * 1e-6;
        logger.info(`${counter}: Processed ${batch.length} rows in ${duration} ms (${(duration/batch.length).toFixed(0)} ms/row)`);
        
        logger.info(`${counter}: ${left} remaining`);
        start = process.hrtime.bigint();
    }
}

const { minId, count } = createTempTable(db);

processAllTreatments(minId, count).catch(err => {
    logger.error("Fatal error:", err);
});