import { getContext } from './lib/context.js';
import { llmRouter } from './lib/llmRouter.js';
import { sendEvent, sendToken } from './lib/utils.js';

// ─────────────────────────────────────────────────────────────────────────────
// Route handler
//
// CHANGED: The route handler now sets SSE headers and delegates to
// askZaiSomething(), which writes events directly to the reply stream.
// The handler must NOT return a value — Fastify owns the response from here.
//
// PREVIOUSLY: the handler returned the result of askZaiSomething() as a
// normal JSON response.  That is commented out below for reference.
// ─────────────────────────────────────────────────────────────────────────────

// HOW THIS WORKS — Server-Sent Events (SSE)
//
// SSE is a standard HTTP streaming protocol where the server pushes multiple
// events over a single long-lived HTTP connection.  Each event is a plain-text
// frame delimited by a blank line:
//
//   event: <type>\n
//   data: <json>\n
//   \n
//
// The client reads these with the browser's native EventSource API (or with 
// any fetch-based reader).  The connection closes when the server sends the 
// stream's end — here signalled by the "done" event.
//
// Event types emitted by this handler:
//   status  — progress updates (step name, counts)     — several per request
//   token   — one LLM output token as it arrives       — many per request
//   done    — final payload (treatments + full answer) — exactly once
//   error   — fatal error, connection closes after     — at most once

// ─────────────────────────────────────────────────────────────────────────────
// askZaiSomething
//
// CHANGED: accepts `reply` and streams events instead of returning a value.
//
// Events emitted (in order):
//   status  { step: 'context',   message: 'Building context…' }
//   status  { step: 'context',   treatments: N }      — after getContext
//   token   { delta: '…' }                        — repeated for each LLM token
//   done    { answer, model, treatments, debugInfo }   — final frame
//   error   { message }                               — only on failure

// CHANGED (from previous iteration): now returns the assembled result object
// { answer, model, treatments, debugInfo } after the stream ends, instead of
// returning nothing.  This allows streamAskZaiSomething to cache it.
//
// raw.end() is still called here — the cache write in the caller happens after.
// ─────────────────────────────────────────────────────────────────────────────
async function askZaiSomething(fastify, question, reply) {
    const raw = reply.raw;
    const contextResult = await getContext(fastify, question, raw);

    if (!contextResult) {
        sendEvent(raw, 'error', { message: 'No relevant documents found.' });
        raw.end();

        // send null for cache check
        return null;
    }

    const { context, treatments, debugInfo: contextDebug } = contextResult;
    sendEvent(raw, 'status', { step: 'answer', message: 'Generating answer' });

    const answerResult = await answerFromZai(fastify, context, question, raw);

    if (!answerResult) {
        sendEvent(raw, 'error', { message: 'LLM did not return an answer.' });
        raw.end();

        // send null for cache check
        return null;
    }

    const { answer, model, debug: answerDebug } = answerResult;

    const fullResult = {
        answer,
        model,
        treatments,
        debugInfo: { ...contextDebug, ...answerDebug },
    };

    // Send the done event (carries the full result so clients that missed
    // individual token events can still reconstruct the answer).
    sendEvent(raw, 'done', fullResult);
    raw.end();

    // return the full result, minus the debugInfo so the caller can cache it.
    return {
        answer,
        model,
        treatments
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// answerFromZai
//
// CHANGED: streams tokens via sendToken() and resolves with the full assembled
// answer string so callers can still use it (e.g. for the "done" frame).
//
// PREVIOUSLY: called llmRouter() and returned the complete response at once.
// The old single-shot call is preserved below as a comment.
//
// BUG FIXED: The <think>…</think> strip used to run on the complete string.
// It now runs on the assembled string after streaming, which is equivalent
// but explicit.
// ─────────────────────────────────────────────────────────────────────────────
 
async function answerFromZai(fastify, context, question, raw) {
    const start = Date.now();
    fastify.zlog.info(`Getting answer for: ${question}`);
 
    const options = {
        num_ctx: 2048,
        num_thread: 8,
        temperature: 0,
    };
 
    const messages = [
        { role: 'system', content: context },
        { role: 'user',   content: question },
    ];
 
    try {
 
        // llmRouter now returns an async iterator of chunk objects.
        // Each chunk has `{ message: { content: string }, model?, done? }`.
        const stream = await llmRouter(
            fastify, 
            messages, 
            options, 
            { stream: true }
        );
 
        let fullContent = '';
        let model;

        // total_duration is only present on the final Ollama chunk (done: 
        // true). We capture it here so the debug block below can use it.
        let totalDuration;
 
        for await (const chunk of stream) {

            // Capture the model name from the first chunk that carries it.
            if (!model && chunk.model) model = chunk.model;
 
            // Ollama sets done: true on the last chunk and includes timing 
            // fields. Capture total_duration from that final chunk.
            if (chunk.done && chunk.total_duration) {
                totalDuration = chunk.total_duration;
            }
 
            const delta = chunk.message?.content ?? '';
 
            if (delta) {
                fullContent += delta;

                // Emit each token immediately so the client sees it appear 
                // word-by-word.
                sendToken(raw, delta);
            }
        }
 
        // Strip reasoning traces emitted by thinking models (e.g. DeepSeek-R1).
        // Done on the complete string — partial <think> blocks mid-stream are
        // harmless because clients are expected to buffer tokens until "done".
        const answer = fullContent
            ? fullContent.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
            : '';
 
        const debug = {
            answerFromZai: {
                question,
                model,

                // Prefer Ollama's precise nanosecond timer; fall back to 
                // wall-clock for providers (e.g. cloud_macbook raw fetch) that 
                // don't emit it.
                runtime: totalDuration
                    ? Number((totalDuration * 1e-6).toFixed(0))
                    : Date.now() - start,
            },
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

// ─────────────────────────────────────────────────────────────────────────────
// isAskZaiSomethingRequest
//
// Mirrors the branching logic inside askZai() so routeHandler can detect the
// SSE path without calling into askZai() first.
//
// Returns true when:
//   • request.query.heyzai is present, AND
//   • the question is NOT a "describe <genus> <species>" command
//     (which routes to askZaiToDescribe, not askZaiSomething).
// ─────────────────────────────────────────────────────────────────────────────
function isAskZaiSomethingRequest(request) {
    const question = request.query.heyzai;
    if (!question) return false;

    const words = question.split(/ /);
    const isDescribe = words[0].toLowerCase() === 'describe' && words.length === 3;

    return !isDescribe;
}

// ─────────────────────────────────────────────────────────────────────────────
// handleAskZaiSomethingWithCache
//
// The new hybrid entry point for the askZaiSomething path.
//
// Cache HIT  → return the cached answer as a plain JSON response.
//              No SSE, no streaming — the client gets the full answer at once,
//              indistinguishable from any other cached API response.
//
// Cache MISS → set SSE headers, stream tokens to the client in real time,
//              AND accumulate the full answer in memory.  When the stream ends,
//              write the full result to cache so the next request hits.
//
// refreshCache → delete the cached entry, then treat as a cache miss.
// cache off   → always stream, never cache.
// ─────────────────────────────────────────────────────────────────────────────
async function handleAskZaiSomethingWithCache(fastify, resource, request, reply) {
    const question = request.query.heyzai;

    // ── Build the cache key the same way the rest of the system does ─────────
    // We reuse the existing queryObj shape so the cache namespace is shared
    // with non-streaming results (e.g. if askZaiToDescribe and askZaiSomething
    // could ever produce the same query string, they'd share a cache slot —
    // which is correct).
    const segment = resource.name;
    const isSemantic = request.queryType.isSemantic;
    const queryObj = {
        segment,
        query: request.queryForCache,
        isSemantic,

        // Semantic queries are cached forever (ttl -1), same as before.
        ...(isSemantic && { ttl: -1 }),
    };

    // ── Cache is OFF → always stream, never cache ────────────────────────────
    if (!fastify.zconfig.cache.on) {
        fastify.zlog.info('cache is off — streaming directly');
        await streamAskZaiSomething(
            fastify, 
            question, 
            reply, 

            /* no caching */
            null
        );
        return;
    }

    // ── refreshCache flag → evict then re-stream ─────────────────────────────
    if (request.query.refreshCache) {
        fastify.zlog.info('deleting cache entry before re-streaming');
        await fastify.cache.rm(queryObj);
    }

    // streamAskZaiSomething resolves with the full result object once the
    // stream ends. We pass queryObj so it can write to cache internally after
    // the stream completes.
    await streamAskZaiSomething(fastify, question, reply, queryObj);
}

// ─────────────────────────────────────────────────────────────────────────────
// streamAskZaiSomething
//
//
// @param {object}      fastify
// @param {string}      question    - the raw question string
// @param {object}      reply       - Fastify reply object
// @param {object|null} cacheTarget - queryObj to cache under, or null to skip
// ─────────────────────────────────────────────────────────────────────────────
async function streamAskZaiSomething(fastify, question, reply, cacheTarget) {
    const raw = reply.raw;

    // Set SSE headers — must happen before any write to raw.
    // Manually add headers if @fastify/cors is being bypassed
    const origin = reply.request.headers.origin;

    // 1. Echo the request's origin (if it's in your allowed list)
    if (origin) {
        raw.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    // 2. Add required CORS and SSE headers
    raw.setHeader('Access-Control-Expose-Headers', 'Content-Type');
    raw.setHeader('Content-Type', 'text/event-stream');
    raw.setHeader('Cache-Control', 'no-cache');
    raw.setHeader('Connection', 'keep-alive');
    raw.setHeader('X-Accel-Buffering', 'no');

    // 3. Immediately flush headers with a 200 OK
    raw.writeHead(200); 

    // askZaiSomething streams events and resolves with the full result so we
    // can cache it.  See index.js for the full implementation.
    //
    // The returned shape is:
    //   { answer, model, treatments, debugInfo }
    // or null on total failure.
    const result = await askZaiSomething(fastify, question, reply);

    // ── Cache the full result after the stream ends ──────────────────────────
    //
    // We write to cache AFTER raw.end() has been called inside askZaiSomething,
    // so the client is never blocked by the cache write.  The next request for
    // the same question will get a cache hit and skip streaming entirely.
    if (cacheTarget && result) {
        fastify.zlog.info('caching result after stream');
        cacheTarget.response = result;
        await fastify.cache.set(cacheTarget).catch(err => {

            // A cache write failure is non-fatal — log it and move on.
            fastify.zlog.error(`cache write failed: ${err?.message}`);
        });
    }
}

export { 
    askZaiSomething, 
    isAskZaiSomethingRequest, 
    handleAskZaiSomethingWithCache 
}