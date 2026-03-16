import ollama, { Ollama } from 'ollama';
import os from "os";

const IS_MAC = os.platform() === "darwin";

const cloudClient = new Ollama({
    host: "https://ollama.com",
    headers: {
        // e809aa10e8664758b7bf435d9babe08f.oIaYUYXKOrfScd-bIlkZ7st0
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
    const LLM_FORCE = fastify.zconfig.llm.llm_force;
    const LLM_PRIMARY_MODEL = fastify.zconfig.llm.llm_primary_model;
    const LLM_FALLBACK_MODEL = fastify.zconfig.llm.llm_fallback_model;
    
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