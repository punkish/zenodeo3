import ollama, { Ollama } from 'ollama';
import os from "os";
import { Config } from '@punkish/zconfig';
const config = new Config().settings;
const zai = config.zai;

const cloudClient = new Ollama({
    host: fastify.zconfig.zai.ollama_cloud_url,
    headers: {
        Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`
    }
});

function cloudModel(model) {
    return `${model}-cloud`
}

async function local(fastify, model, messages, options) {
    fastify.zlog.info(`using local model ${model}`);
    return ollama.chat({ model, messages, options })
}

async function cloud(fastify, model, messages, options) {
    fastify.zlog.info(`using cloud model ${model}`);
    return cloudClient.chat({
        model: cloudModel(model),
        messages,
        options
    })
}

function logLlmError(fastify, msg, err) {
    fastify.zlog.warn(msg);
    fastify.zlog.error(`error: ${err?.message}`);
    fastify.zlog.error(`stack: ${JSON.stringify(err?.stack, null, 4)}`);
}

export async function llmRouter(fastify, messages, options) {
    const LLM_FORCE = fastify.zconfig.zai.llm_force;
    const LLM_PRIMARY_MODEL = fastify.zconfig.zai.llm_primary_model;
    const LLM_FALLBACK_MODEL = fastify.zconfig.zai.llm_fallback_model;
    const IS_MAC = os.platform() === "darwin";
    
    fastify.zlog.info(`LLM router start (force=${LLM_FORCE})`);

    try {

        if (LLM_FORCE === "cloud") {
            return await cloud(fastify, LLM_PRIMARY_MODEL, messages, options);
        }

        if (LLM_FORCE === "local") {
            return await local(fastify, LLM_FALLBACK_MODEL, messages, options);
        }

        if (IS_MAC) {
            fastify.zlog.info("Mac detected → local preferred");

            try {
                return await local(fastify, LLM_FALLBACK_MODEL, messages, options);
            }
            catch (err) {
                logLlmError(fastify, "Local failed → cloud fallback", err);
                return await cloud(fastify, LLM_PRIMARY_MODEL, messages, options);
            }
        }

        // VPS
        fastify.zlog.info("Server detected → cloud preferred")

        try {
            return await cloud(fastify, LLM_PRIMARY_MODEL, messages, options);
        }
        catch (err) {
            logLlmError(fastify, "Cloud failed → local fallback", err);
            return await local(fastify, LLM_FALLBACK_MODEL, messages, options);
        }

    }
    catch (err) {
        logLlmError(fastify, "LLM router failure", err);
        throw err;
    }
}