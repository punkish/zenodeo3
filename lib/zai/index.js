import ollama from 'ollama';
import { askZaiToDescribe } from './askZaiToDescribe.js';
import { askZaiSomething } from './askZaiSomething/index.js';

async function askZai({ fastify, request }) {

    // The data to be returned looks like this
    //
    // {
    //     "response": {},
    //     "debugInfo": {}
    // }
    const question = request.query.heyzai;
    fastify.zlog.info(`question: ${question}`);
    
    /** @type {string[]} queryWords - An array of words. */
    const queryWords = question.split(/ /);

    // If the first word is 'describe', the following words may be 
    // a species binomen
    if (queryWords[0].toLowerCase() === 'describe' && queryWords.length === 3) {
        const genus = queryWords[1];
        let species = queryWords[2];

        // Remove any trailing '?' because the request is a command,
        // not a question
        if (species.slice(-1) === '?') {
            species = species.substring(0, species.length - 1);
        }

        return askZaiToDescribe(fastify, genus, species);

        
    }
    else {
        const model = request.query.model ?? undefined;
        return await askZaiSomething(fastify, question, model);
    }
}

async function keepModelsWarm() {
    const models = [
        'qwen2.5:0.5b', 
        'qwen2.5:7b-instruct'
    ];
    
    for (const model of models) {
        try {
            console.log(`Setting keep-alive for ${model}...`);
            await ollama.generate({
                model,
                prompt: '', // No prompt needed just to load
                keep_alive: '60m', // Tell Ollama to keep it for 1 hour
                options: { num_predict: 1 } 
            });
        } catch (err) {
            console.error(`Failed to warm ${model}:`, err.message);
        }
    }
}

// Run immediately on startup
keepModelsWarm();

// Then run every 30 minutes to ensure they never expire
setInterval(keepModelsWarm, 30 * 60 * 1000);

export { askZai }