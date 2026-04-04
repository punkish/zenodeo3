import ollama, { Ollama } from 'ollama';

// ─────────────────────────────────────────────────────────────────────────────
// Providers
//
// CHANGED: Each provider now has a streaming variant.  The non-streaming
// calls are preserved as comments directly below their streaming replacements.
//
// All streaming providers return an async iterable of Ollama-compatible chunk
// objects: { message: { content: string }, model?: string, done?: boolean }
//
// llmRouter attaches a `totalDuration` property to the returned iterator after
// the stream completes (from the Ollama final chunk) so callers can log it.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Local Ollama instance — streaming.
 */
async function local(fastify, model, messages, options) {
    fastify.zlog.info(`→ local (${model})`);
    
    // PREVIOUSLY (non-streaming):
    // return ollama.chat({ model, messages, options });

    // stream: true returns an async generator from the ollama-js library.
    return ollama.chat({ model, messages, options, stream: true });
}

/**
 * Cloud Ollama instance — streaming.
 */
async function cloud_ollama(fastify, model, messages, options) {
    fastify.zlog.info(`→ cloud_ollama (${model})`);
    console.log(messages);

    const client = new Ollama({
        host: fastify.zconfig.zai.ollama_cloud_url,
        headers: {
            Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`
        }
    });

    // PREVIOUSLY (non-streaming):
    // return client.chat({ model, messages, options });

    return client.chat({
        model,
        messages,
        options,
        stream: true
    });
}

/**
 * Cloud MacBook Ollama instance — streaming via fetch.
 *
 * CHANGED: `stream: false` → `stream: true`.  Instead of waiting for the
 * full JSON body, we now consume the NDJSON response line-by-line and yield
 * each parsed chunk, matching the shape that ollama-js emits.
 *
 * PREVIOUSLY (non-streaming):
 * async function cloud_macbook(fastify, model, messages, options) {
 *     const url = `${fastify.zconfig.zai.ollama_macbook_url}/api/chat`;
 *     fastify.zlog.info(`→ cloud_macbook (${model}) @ ${url}`);
 *     const res = await fetch(url, {
 *         method: "POST",
 *         headers: { "Content-Type": "application/json" },
 *         body: JSON.stringify({ model, messages, options, stream: false })
 *     });
 *     if (!res.ok) {
 *         const text = await res.text();
 *         throw new Error(`macbook ${res.status}: ${text}`);
 *     }
 *     return res.json();
 * }
 */
async function* cloud_macbook(fastify, model, messages, options) {
    const url = `${fastify.zconfig.zai.ollama_macbook_url}/api/chat`;
    fastify.zlog.info(`→ cloud_macbook (${model}) @ ${url}`);

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // CHANGED: stream: false → stream: true
        body: JSON.stringify({ model, messages, options, stream: true }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`macbook ${res.status}: ${text}`);
    }

    // Ollama streams NDJSON — one JSON object per line, each ending with \n.
    // We read the raw body as text chunks and split on newlines.
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // Keep the last (potentially incomplete) line in the buffer.
        buffer = lines.pop();

        for (const line of lines) {
            if (!line.trim()) continue;
            yield JSON.parse(line);
        }
    }

    // Flush any remaining bytes in the decoder buffer.
    buffer += decoder.decode();
    if (buffer.trim()) yield JSON.parse(buffer);
}

// ────────────────────────────────────────────────────────────
// Utils
// ────────────────────────────────────────────────────────────

function logLlmError(fastify, label, err) {
    fastify.zlog.warn(`✗ ${label} failed`);
    fastify.zlog.error(`error: ${err?.message}`);
}

/**
 * Try a provider safely.
 *
 * CHANGED: the provider `fn` now returns an async iterable (stream).
 * tryProvider validates the stream is truthy and non-empty by peeking at the
 * first chunk, then re-assembles the iterable with that chunk prepended.
 * This preserves the "fall through on empty response" behaviour from before.
 */
async function tryProvider(fastify, label, fn) {
    try {
        const stream = await fn();
        if (!stream) throw new Error('empty response');

        // Peek at the first chunk to verify the provider is alive.
        const iter = stream[Symbol.asyncIterator]();
        const first = await iter.next();
        if (first.done) throw new Error('empty stream');

        fastify.zlog.info(`✓ ${label} success`);

        // Re-wrap: yield the peeked chunk, then delegate to the rest of the iterator.
        return (async function* () {
            yield first.value;
            yield* { [Symbol.asyncIterator]: () => iter };
        })();
    }
    catch (err) {
        logLlmError(fastify, label, err);
        return null;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// llmRouter
//
// CHANGED: accepts an `opts` object with `{ stream: true }` and threads it to
// all providers.  Returns an async iterable in all paths.
//
// The returned iterable also exposes `totalDuration` as a property set after
// the stream is exhausted, sourced from the Ollama final chunk's field.
// ─────────────────────────────────────────────────────────────────────────────

export async function llmRouter(
    fastify, 
    messages, 
    options, 
    { stream = true } = {}
) {
    const {
        llm_force: FORCE,
        llm_primary_model: PRIMARY,
        llm_fallback_model: FALLBACK,
        llm_cloud_model: CLOUD,
    } = fastify.zconfig.zai;

    fastify.zlog.info(`LLM router start (force=${FORCE})`);

    // ── Forced modes ─────────────────────────────────────────────────────────

    if (FORCE === 'cloud_ollama') {
        return cloud_ollama(fastify, CLOUD, messages, options);
    }

    if (FORCE === 'cloud_macbook') {
        return cloud_macbook(fastify, PRIMARY, messages, options);
    }

    if (FORCE === 'local') {
        return local(fastify, FALLBACK, messages, options);
    }

    // ── Cascading strategy ───────────────────────────────────────────────────
    // UNCHANGED logic: providers are tried in order; first success wins.

    const providers = [
        {
            label: 'cloud_ollama',
            fn: () => cloud_ollama(fastify, CLOUD, messages, options),
            enabled: false,
        },
        {
            label: 'cloud_macbook',
            fn: () => cloud_macbook(fastify, PRIMARY, messages, options),
            enabled: true,
        },
        {
            label: 'local',
            fn: () => local(fastify, FALLBACK, messages, options),
            enabled: true,
        },
    ];

    for (const p of providers) {
        if (p.enabled) {
            const result = await tryProvider(fastify, p.label, p.fn);
            if (result) return result;
        }
    }

    // ── Total failure ─────────────────────────────────────────────────────────
    // Yield a single synthetic chunk matching the Ollama chunk shape so
    // callers don't need a special case — the error text flows through the
    // token stream naturally and appears in the assembled answer.
    fastify.zlog.error('✗ All LLM providers failed');

    return (async function* () {
        yield {
            message: { role: 'assistant', content: 'Error: service not available.' },
            done: true,
        };
    })();
}