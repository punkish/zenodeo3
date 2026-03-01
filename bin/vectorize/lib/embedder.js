// src/embedder/index.js
// Generates embeddings via a local Ollama instance.
// Returns Float32Array vectors, ready for all four index backends.

import { OLLAMA_BASE_URL, EMBED_MODEL } from './config.js';

/**
 * Embed a single text string.
 *
 * @param {string} text
 * @returns {Promise<Float32Array>}
 */
export async function embed(text) {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ model: EMBED_MODEL, prompt: text }),
    });

    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Ollama HTTP ${res.status}: ${body}`);
    }

    const { embedding } = await res.json();
    return new Float32Array(embedding);
}

/**
 * Embed an array of texts with bounded concurrency.
 *
 * @param {string[]}  texts
 * @param {number}    concurrency
 * @returns {Promise<Float32Array[]>}
 */
export async function embedBatch(texts, concurrency = 1) {
    const results = new Array(texts.length);
    let next = 0;

    async function worker() {
        while (next < texts.length) {
            const i = next++;
            results[i] = await embed(texts[i]);
        }
    }

    await Promise.all(Array.from({ length: concurrency }, worker));
    return results;
}
