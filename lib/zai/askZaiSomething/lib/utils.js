// ─────────────────────────────────────────────────────────────────────────────
// SSE helpers
//
// These two small functions are the only place that knows about the SSE wire
// format.  Everything else calls sendEvent() or sendToken() — keeping the rest
// of the code independent of the transport.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Write one SSE frame to the HTTP response stream.
 *
 * @param {import('http').ServerResponse} raw  - reply.raw from Fastify
 * @param {string}  type                       - SSE event name
 * @param {unknown} payload                    - will be JSON-serialised as the data field
 */
function sendEvent(raw, type, payload) {
    
    // SSE spec: each field on its own line, frame terminated by blank line.
    raw.write(`event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`);
}

/**
 * Convenience wrapper for the hot path: streaming LLM tokens.
 * Uses the "token" event type so clients can filter efficiently.
 *
 * @param {import('http').ServerResponse} raw
 * @param {string} delta - one incremental token from the LLM
 */
function sendToken(raw, delta) {
    sendEvent(raw, 'token', { delta });
}

export { sendEvent, sendToken }