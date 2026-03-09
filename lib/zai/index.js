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

async function keepWarm(model) {
    try {
        await ollama.generate({
            model,
            prompt: 'ping',
            options: {
                num_predict: 1
            }
        })
        //console.log('Model kept warm')
    } 
    catch (err) {
        console.error(err)
    }
}

export { askZai }