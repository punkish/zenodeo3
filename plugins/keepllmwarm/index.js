import fp from 'fastify-plugin';
import ollama from 'ollama';

async function keepLlmWarm(fastify, opts) {
    const models = opts.models;

    // Default 30 mins
    const interval = opts.interval || 30 * 60 * 1000;

    const keepModelsWarm = async () => {
        fastify.zlog.info('🌡️  Ollama: Starting keep-warm cycle...');
        
        for (const model of models) {
            try {

                // We use a tiny prompt and -1 keep_alive to lock it in VPS RAM
                await ollama.generate({
                    model,
                    prompt: '', 
                    keep_alive: -1, 
                    options: { num_predict: 1 }
                });
                fastify.zlog.info(`✅ Ollama: ${model} is warm and locked in RAM.`);
            } 
            catch (err) {
                fastify.zlog.error(`❌ Ollama: Failed to warm ${model}: ${err.message}`);
            }
        }
    };

    // Run once when the server is ready
    fastify.addHook('onReady', async () => {

        // Do NOT await this; let it run in the background 
        // so the server can finish booting.
        keepModelsWarm(); 
        
        // Set the recurring interval
        const timer = setInterval(keepModelsWarm, interval);

        // Clean up
        fastify.addHook('onClose', (instance, done) => {
            clearInterval(timer);
            done();
        });
    });
}

export default fp(keepLlmWarm);