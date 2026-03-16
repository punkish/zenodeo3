import { getContext } from './lib/context.js';
import { llmRouter } from './lib/llmRouter.js';

async function askZaiSomething(fastify, question) {

    // This is what we will send back
    const reply = { response: {}, debugInfo: {} };
    const context = await getContext(fastify, question, reply);
    
    if (context) {
        const res = await answerFromZai(fastify, context, question, reply);
        return res ? reply : undefined;
    }
    else {
        return undefined;
    }
    
}

async function answerFromZai(fastify, context, question, reply) {
    const start = Date.now();

    fastify.zlog.info(`Getting answer for: ${question}`);
    const options = { num_ctx: 2048, num_thread: 8, temperature: 0 };
    const messages = [
        { role: "system", content: context },
        { role: "user", content: question }
    ];

    let model;

    try {
        const response = await llmRouter(fastify, messages, options);

        // strip <think>, if present
        const content = response?.message?.content || '';

        if (content) {
            reply.response.answer = content
                .replace(/<think>[\s\S]*?<\/think>/g, '')
                .trim();
        }
        else {
            reply.response.answer = '';
        }

        reply.response.model = model;

        // total_duration is in nanoseconds, so
        // multiply by 0.000001 to convert to ms
        reply.debugInfo.answerFromZai = {
            question,
            model,
            runtime: response?.total_duration
                ? Number((response.total_duration * 1e-6).toFixed(0))
                : Date.now() - start
        }

        return true;
    }
    catch(error) {
        fastify.zlog.error(`question: ${question}`);
        fastify.zlog.error(`error: ${error?.message}`);
        fastify.zlog.error(`stack: ${JSON.stringify(error?.stack, null, 4)}`);
        
        return false;
    }

}

export { askZaiSomething }