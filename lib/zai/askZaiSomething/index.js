import { getContext } from './lib/context.js';
import { llmRouter, local } from './lib/llmRouter.js';
import { sendEvent, sendToken } from './lib/utils.js';

// ─────────────────────────────────────────────────────────────────────────────
// Route handler: The route handler now sets SSE headers and delegates to
// askZaiSomething(), which writes events directly to the reply stream.
// The handler must NOT return a value — Fastify owns the response from here.
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
// askZaiSomething: accepts `reply` and streams events instead of returning a 
// value. Events emitted (in order):
//   status  { step: 'context',   message: 'Building context…' }
//   status  { step: 'context',   treatments: N }      — after getContext
//   token   { delta: '…' }                        — repeated for each LLM token
//   done    { answer, model, treatments, debugInfo }  — final frame
//   error   { message }                               — only on failure
//
// Returns the assembled result object { answer, model, treatments, debugInfo } 
// after the stream ends, instead of returning nothing.  This allows 
// streamAskZaiSomething to cache it.
//
// raw.end() is still called here — the cache write in the caller happens after.
// ─────────────────────────────────────────────────────────────────────────────
async function askZaiSomething(fastify, question, reply) {
    const raw = reply.raw;
    const isMultiLingual = fastify.zconfig.zai.multilingual ?? true;
    let originalLanguage = 'en';
    let wasTranslated = false;
    let originalQuestion = question;

    if (isMultiLingual) {

        // Step 1: normalize to English for retrieval + generation
        const res = await normalizeQuestion(fastify, question, raw);
        question = res.englishQuestion;
        originalLanguage = res.originalLanguage;
        wasTranslated = res.wasTranslated;
    }

    const contextResult = await getContext(fastify, question, raw);

    if (!contextResult) {
        sendEvent(raw, 'error', { message: 'No relevant documents found.' });
        raw.end();
        return null; // send null for cache check
    }

    const { context, treatments, debugInfo: contextDebug } = contextResult;
    //let message = 'Generating answer';
    //if (wasTranslated) message += '…';
    sendEvent(raw, 'status', { step: 'answer', message: 'Generating answer' });

    const answerResult = await answerFromZai(fastify, context, question, raw, !wasTranslated);

    if (!answerResult) {
        sendEvent(raw, 'error', { message: 'LLM did not return an answer.' });
        raw.end();
        return null;
    }

    const res = answerResult;
    let answer = res.answer;
    const canonicalAnswer = answer; // English, pre-translation
    const model = res.model;
    const answerDebug = res.answerDebug;

    // Step 4: translate answer back if needed
    if (wasTranslated) {
        answer = await localizeAnswer(fastify, answer, originalLanguage, raw);
    }

    const fullResult = {
        answer,
        model,
        treatments,
        debugInfo: { 
            ...contextDebug, 
            ...answerDebug,
            originalLanguage,
            wasTranslated,
            ...(wasTranslated && { 
                originalQuestion, 
                englishQuestion: question,
                canonicalAnswer // ← the English answer
            })
        }
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
// answerFromZai: streams tokens via sendToken() and resolves with the full 
// assembled answer string so callers can still use it (e.g. for the "done" 
// frame).
// ─────────────────────────────────────────────────────────────────────────────
async function answerFromZai(fastify, context, question, raw, streamTokens=true) {
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

                // Only stream tokens to the client on the English path.
                // On the non-English path we accumulate silently and send
                // the translated answer in the done event instead.
                if (streamTokens) sendToken(raw, delta);
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
 
        return { answer, model, answerDebug: debug };
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
            null // no caching
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

/**
 * Detects the language of `question`. If not English, translates it.
 * Returns { englishQuestion, originalLanguage, wasTranslated }.
 * On failure, returns the original question with wasTranslated: false.
 */
// In normalizeQuestion — add back the status events and coerce wasTranslated
async function normalizeQuestion(fastify, question, raw) {
    try {
        sendEvent(raw, 'status', { step: 'language', message: 'Detecting language' });

        // Step 1: detect only
        const prompt = `Determine the language this text is written in. If the text language is not english, translate it into english. Reply with a JSON containing only the following two keys: { "originalLanguage": <BCP-47 language tag, examples: "en", "de", "fr", "es">, "englishVersion": <translated text> }

TEXT: ${question}`;

        const { 
            originalLanguage, 
            englishVersion 
        } = await callLangModel(fastify, prompt);

        // guard against prose bleed
        // const originalLanguage = detectedLanguage.trim()
        //     .toLowerCase()
        //     .slice(0, 5); 

        // if (originalLanguage === 'en') {
        //     return { 
        //         englishQuestion: question, 
        //         originalLanguage: 'en', 
        //         wasTranslated: false 
        //     };
        // }

        // Step 2: translate only — model can focus entirely on the translation
//         sendEvent(raw, 'status', {
//             step: 'language',
//             message: `Translating from ${originalLanguage}`,
//         });
//         fastify.zlog.info(`Translating from "${originalLanguage}"`);

//         const translatePrompt = `Translate the following text to English. Reply with only the translated text, nothing else.

// TEXT: ${question}`;

        //const englishQuestion = await callLangModel(fastify, translatePrompt);

        return {
            originalLanguage,
            englishQuestion: englishQuestion.trim(),
            wasTranslated: originalLanguage === 'en' ? false : true,
        };
    }
    catch (err) {
        fastify.zlog.warn('Language detection failed, using original question');
        fastify.zlog.warn(err);
        return { 
            englishQuestion: question, 
            originalLanguage: 'en', 
            wasTranslated: false 
        };
    }
}

/**
 * If the answer was generated from a translated question, translate it back.
 * Returns the answer string; on failure returns the English answer.
 */
async function localizeAnswer(fastify, answer, originalLanguage, raw) {
    sendEvent(raw, 'status', { 
        step: 'language', 
        message: `Translating answer to ${originalLanguage}` 
    });
    fastify.zlog.info(`Translating answer to ${originalLanguage}`);

    try {
        const prompt = `Translate the following text to ${originalLanguage}. Reply with only the translated text, nothing else.

TEXT: ${answer}`;

        const messages = [{ role: 'user', content: prompt }];
        const options = { temperature: 0 };
        const stream = await llmRouter(fastify, messages, options, { stream: true });

        let result = '';
        for await (const chunk of stream) {
            const delta = chunk.message?.content ?? '';
            if (delta) {
                result += delta;
                sendToken(raw, delta);  // ← stream translation tokens to client
            }
        }

        return result.trim();
    } 
    catch (err) {
        fastify.zlog.warn('Translation failed, returning English answer');
        fastify.zlog.warn(err);
        return answer;
    }
}

/**
 * Runs a single-turn prompt through the lang model and returns the full
 * assembled response string. Always uses the LANG model, never streams
 * to the client.
 */
async function callLangModel(fastify, prompt) {
    const { llm_lang_model: LANG } = fastify.zconfig.zai;
    const messages = [{ role: 'user', content: prompt }];
    const options = { temperature: 0 };

    try {
        const stream = await local(fastify, LANG, messages, options);
        let result = '';
        for await (const chunk of stream) {
            result += chunk.message?.content ?? '';
        }
        return result.trim();
    }
    catch (err) {
        fastify.zlog.error(`failed (model=${LANG}): ${err?.message}`);
        throw err; // re-throw so callers' fallbacks still trigger
    }
}

export {
    askZaiSomething, 
    isAskZaiSomethingRequest, 
    handleAskZaiSomethingWithCache 
}