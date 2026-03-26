import { getContext } from './lib/context.js';
import { llmRouter } from './lib/llmRouter.js';

async function askZaiSomething(fastify, question) {
    const contextResult = await getContext(fastify, question);
    if (!contextResult) return undefined;

    const { context, treatments, debugInfo: contextDebug } = contextResult;
    const answerResult = await answerFromZai(fastify, context, question);
    if (!answerResult) return undefined;

    const { answer, model, debug: answerDebug } = answerResult;

    return {
        response: { answer, model, treatments },
        debugInfo: { ...contextDebug, ...answerDebug }
    };
}

async function answerFromZai(fastify, context, question) {
    const start = Date.now();
    fastify.zlog.info(`Getting answer for: ${question}`);

    const options = { 
        num_ctx: 2048, 
        num_thread: 8, 
        temperature: 0 
    };
    
    const messages = [
        { role: "system", content: context },
        { role: "user",   content: question }
    ];

    try {
        const response = await llmRouter(fastify, messages, options);
        const content = response?.message?.content || '';
        const model = response?.model;

        const answer = content
            ? content.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
            : '';

        const debug = {
            answerFromZai: {
                question,
                model,
                runtime: response?.total_duration
                    ? Number((response.total_duration * 1e-6).toFixed(0))
                    : Date.now() - start
            }
        };

        return { answer, model, debug };
    }
    catch (error) {
        fastify.zlog.error(`question: ${question}`);
        fastify.zlog.error(`error: ${error?.message}`);
        fastify.zlog.error(`stack: ${JSON.stringify(error?.stack, null, 4)}`);
        return null;
    }
}

export { askZaiSomething }