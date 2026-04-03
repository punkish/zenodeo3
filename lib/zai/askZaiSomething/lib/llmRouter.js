import ollama, { Ollama } from 'ollama';

// ────────────────────────────────────────────────────────────
// Providers
// ────────────────────────────────────────────────────────────

async function local(fastify, model, messages, options) {
    fastify.zlog.info(`→ local (${model})`);
    return ollama.chat({ model, messages, options });
}

async function cloud_ollama(fastify, model, messages, options) {
    fastify.zlog.info(`→ cloud_ollama (${model})`);
    console.log(messages);

    const client = new Ollama({
        host: fastify.zconfig.zai.ollama_cloud_url,
        headers: {
            Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`
        }
    });

    return client.chat({
        model,
        messages,
        options
    });
}

async function cloud_macbook(fastify, model, messages, options) {
    const url = `${fastify.zconfig.zai.ollama_macbook_url}/api/chat`;
    fastify.zlog.info(`→ cloud_macbook (${model}) @ ${url}`);

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model,
            messages,
            options,
            stream: false
        })
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`macbook ${res.status}: ${text}`);
    }

    return res.json();
}

// ────────────────────────────────────────────────────────────
// Utils
// ────────────────────────────────────────────────────────────

function logLlmError(fastify, label, err) {
    fastify.zlog.warn(`✗ ${label} failed`);
    fastify.zlog.error(`error: ${err?.message}`);
}

// Try a provider safely
async function tryProvider(fastify, label, fn) {
    try {
        const res = await fn();
        if (!res) throw new Error("empty response");
        fastify.zlog.info(`✓ ${label} success`);
        return res;
    } 
    catch (err) {
        logLlmError(fastify, label, err);
        return null;
    }
}

// ────────────────────────────────────────────────────────────
// Router
// ────────────────────────────────────────────────────────────

export async function llmRouter(fastify, messages, options) {
    const {
        llm_force: FORCE,
        llm_primary_model: PRIMARY,
        llm_fallback_model: FALLBACK,
        llm_cloud_model: CLOUD,
    } = fastify.zconfig.zai;

    fastify.zlog.info(`LLM router start (force=${FORCE})`);

    // ── Forced modes ─────────────────────────────────────────

    if (FORCE === "cloud_ollama") {
        return cloud_ollama(fastify, CLOUD, messages, options);
    }

    if (FORCE === "cloud_macbook") {
        return cloud_macbook(fastify, PRIMARY, messages, options);
    }

    if (FORCE === "local") {
        return local(fastify, FALLBACK, messages, options);
    }

    // ── Cascading strategy ───────────────────────────────────
    // ── implemented if FORCE = none

    const providers = [
        {
            label: "cloud_ollama",
            fn: () => cloud_ollama(fastify, CLOUD, messages, options),
            enabled: false,
        },
        {
            label: "cloud_macbook",
            fn: () => cloud_macbook(fastify, PRIMARY, messages, options),
            enabled: true,
        },
        {
            label: "local",
            fn: () => local(fastify, FALLBACK, messages, options),
            enabled: true,
        }
    ];

    for (const p of providers) {
        
        if (p.enabled) {
            const result = await tryProvider(fastify, p.label, p.fn);
            
            if (result) {
                return result;
            }

        }
        
    }

    // ── Total failure ────────────────────────────────────────

    fastify.zlog.error("✗ All LLM providers failed");

    return {
        message: {
            role: "assistant",
            content: "Error: service not available."
        }
    };
}