import ollama from 'ollama';
import { askZaiToDescribe } from './lib/askZaiToDescribe.js';
import { askZaiSomethingElse } from './lib/askZaiSomethingElse.js';

async function askZai({ fastify, request }) {

    // The data to be returned looks like this
    //
    // {
    //     "response": {},
    //     "debugInfo": {}
    // }
    const question = request.query.heyzai;
    fastify.zlog.info(`question: ${question}`);
    const qWords = question.split(' ');

    // If the first word is 'describe', the following words may be 
    // a species binomen
    if (qWords[0].toLowerCase() === 'describe') {
        const [ genus, species ] = qWords.slice(1);

        // Remove any trailing '?' because the request is a command,
        // not a question
        if (species.slice(-1) === '?') {
            species = species.substring(0, species.length - 1);
        }

        return askZaiToDescribe({ 
            fastify,
            request, 
            genus, 
            species
        });
    }
    else {

        // available models
        // 'deepseek-r1:1.5b',
        // 'qwen3:0.6b',
        // 'qwen2.5:7b',
        // 'gemma3:1b-it-qat',
        // 'llama3.2:latest',
        // 'llama3.2:1b'

        return await askZaiSomethingElse({ 
            fastify, 
            question, 
            model: request.query.model || 'deepseek-r1:1.5b'
        });
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