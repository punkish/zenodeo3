import ollama from 'ollama';
import { getContext } from './lib/index.js';

// available models
// 'deepseek-r1:1.5b',
// 'qwen3:0.6b',
// 'qwen2.5:7b',
// 'gemma3:1b-it-qat',
// 'llama3.2:latest',
// 'llama3.2:1b'
async function askZaiSomething(fastify, question, model='llama3.2:latest') {

    // This is what we will send back
    const reply = { response: {}, debugInfo: {} };
    const context = await getContext(fastify, question, reply);
    
    if (context) {
        const res = await answerFromZai(
            fastify,
            context, 
            question,
            model,
            reply
        );

        
        if (res) {
            return reply;
        }
        else {
            return 'error'
        }
    }
    else {
        return 'error'
    }
    
}

async function answerFromZai(fastify, context, question, model, reply) {
    fastify.zlog.info(`Getting answer for: ${question}`);

    try {
        const response = await ollama.chat({
            model,
            messages: [
                { role: 'system', content: context },
                { role: 'user', content: question }
            ],
            options: {
                num_ctx: 2048,
                num_thread: 8,
                temperature: 0.1
            }
        });
            
        // strip <think>, if present
        reply.response.answer = response.message
            .content
            .replace(/<think>[\s\S]*?<\/think>/g, '').trim();
        reply.response.model = model;
        
        // total_duration is in nanoseconds, so
        // multiply by 0.000001 to convert to ms
        reply.debugInfo.answerFromZai = {
            question,
            runtime: Number((response.total_duration * 1e-6).toFixed(0))
        }

        return true;
    }
    catch(error) {
        fastify.zlog.error(`question: ${question}`);
        fastify.zlog.error(error);
        return false;
    }

}

export { askZaiSomething }