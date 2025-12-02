import { Config } from '@punkish/zconfig';
const config = new Config().settings;
import Zlogger from '../../../../../zlogger/index.js';
import { connect } from '../db/dbconn.js';
import ollama from 'ollama'

function createTempTableTreatmentsWithoutSummaries(db) {
    console.log('Creating temp table of treatments without summaries');
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
                    FROM zai.treatmentSummaries z
                    WHERE z.treatmentId = t.treatmentId
                )
            ORDER BY id ASC;
    `);
    const count = db.prepare('SELECT Count(*) AS c FROM t_no_sum').get().c;
    const end = new Date();
    console.log(`The temp table with ${count} rows created in: ${end - start}ms`);

    // Select the smallest ID from the temp table
    return db.prepare(`SELECT Min(id) AS minId FROM t_no_sum`).get().minId;
}

// Select all main.treatments that are not present in zai.treatmentSummaries
function getTreatmentWithoutSummary(db, minId) {
    
    const res = db.prepare(`
        SELECT  id, treatmentId, fulltext, genus, species
        FROM    t_no_sum
        WHERE   id >= @minId 
        LIMIT   1;
    `).get({ minId });

    return res;
}

async function answerFromZai(question, fulltext, treatmentId) {
    //console.log(`          Asking zai: ${question}`);
    //const promptTemplate = await pull("rlm/rag-prompt");

    if (!fulltext) return;

    const models = {
        'qwen06': 'qwen3:0.6b',
        'qwen4b': 'qwen3:4b-instruct',
        'gemma1b': 'gemma3:1b-it-qat',
        'llama': 'llama3.2:latest',
        'llama1b': 'llama3.2:1b',
        'phi3': 'phi3:mini'
    };

    try {
        const systemContent = `You are a helpful assistant. ONLY answer based on the given context. The answer should be a single paragraph of 3-4 sentences.
        
        Context:
        ${fulltext}`;

        const response = await ollama.chat({
            model: models.qwen06,
            stream: false,
            messages: [
                { 
                    role: 'system', 
                    content: systemContent 
                },
                { 
                    role: 'user', 
                    content: `Based on the above context, ${question}` 
                }
            ],
            options: {
                reasoning: {
                    effort: "none"
                }
            }
        });
        return response;
    }
    catch (error) {
        console.error('-'.repeat(50));
        console.error(`treatmentId: ${treatmentId}`);
        console.error('-'.repeat(50));
        console.error(question);
        console.error('-'.repeat(50));
        console.error(fulltext);
        console.log(error);
        console.error('='.repeat(50));
        return false;
    }

}

function writeSummary(insert, treatmentId, summary) {
    //console.log(`writing summary for ${treatmentId}`);
    //process.stdout.write('.');
    insert.run({ treatmentId, summary })
}

const db = connect({
    dbconfig:  config.newbug.database,
    logger: new Zlogger(config.newbug.logger)
});
let minId = createTempTableTreatmentsWithoutSummaries(db);
console.log(`Starting summaries from treatment ${minId}`);
let counter = 1;
let duration = 0;

const insert = db.prepare(`
    INSERT INTO zai.treatmentSummaries (treatmentId, summary) 
    VALUES (@treatmentId, @summary);
`);

const bars = ['—', '\\', '|', '/'];
let bar = 0;

while (minId) {
    const { id, treatmentId, fulltext, genus, species } =  getTreatmentWithoutSummary(db, minId);
    
    if (id) {
        minId = id + 1;
        const question = `Describe ${genus} ${species}`;
        const response = await answerFromZai(question, fulltext, treatmentId);

        if (response) {

            const summary = response.message.content.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
            // console.log(`              Answer: ${summary}`)
            // console.log('-'.repeat(50));

            
            const response_duration = Number((response.total_duration * 1e-6).toFixed(0));
            duration += response_duration;
            //console.log(`took: ${response_duration} ms\n`);

            writeSummary(insert, treatmentId, summary);
            counter++;

            
            if (!(counter % 100)) {
                console.log(counter);
            }
            else {
                process.stdout.write("\r\x1b[K");
                process.stdout.write(String(bar));
                bar++;

                if (bar > 3) {
                    bar = 0;
                }
            }
        }

        // if (counter > num) {
        //     minId = false;
        // }
    }
    else {
        minId = false;
    }

}

console.log('\n', `${counter} queries took ${duration} ms`);