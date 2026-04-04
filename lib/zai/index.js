import { askZaiToDescribe } from './askZaiToDescribe.js';
import { askZaiSomething } from './askZaiSomething/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// askZai — unchanged except the askZaiSomething branch no longer sets SSE
// headers (that is now done in streamAskZaiSomething, called from routeHandler
// before askZai is ever reached).
//
// IMPORTANT: askZai is now only called for the askZaiToDescribe path — the
// askZaiSomething branch is intercepted in routeHandler before getResult()
// is ever called.  The else-branch below is kept for safety but should never
// be reached in normal operation.
// ─────────────────────────────────────────────────────────────────────────────

async function askZai(fastify, request, reply) {

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

        // Safety fallback: should not be reached because routeHandler 
        // intercepts this path before calling getResult() → askZai().
        fastify.zlog.warn('askZai reached askZaiSomething branch — this should not happen');
        await askZaiSomething(fastify, question, reply);
        return;
    }
}

export { askZai }