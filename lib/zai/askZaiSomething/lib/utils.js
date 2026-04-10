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

/**
 * Convert question → bigrams suitable for token matching
 */
function queryToBigrams(query) {
    const tokens = query
        .toLowerCase()

        // replace everything that is not a letter or space with a space
        .replace(/[^a-z\s]/g, ' ')
        .split(/\s+/)

        // remove anything that is not a word
        .filter(Boolean);

    const bigrams = [];

    for (let i = 0; i < tokens.length - 1; i++) {
        bigrams.push(`${tokens[i]} ${tokens[i + 1]}`);
    }
    
    return bigrams;
}

function intersectNonEmpty(arrays) {
    
    // 1. Remove all empty arrays first
    const nonEmptyArrays = arrays.filter(arr => arr && arr.length > 0);

    // 2. If no non-empty arrays exist, return an empty array
    if (nonEmptyArrays.length === 0) return [];

    // 3. Use reduce to find common elements across the remaining arrays
    return nonEmptyArrays.reduce((intersection, current) => {
        const currentSet = new Set(current); // Use a Set for O(1) lookup speed
        return intersection.filter(item => currentSet.has(item));
    });
}

export { sendEvent, sendToken, queryToBigrams, intersectNonEmpty }