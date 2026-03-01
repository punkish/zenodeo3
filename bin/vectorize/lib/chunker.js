// src/chunker/index.js
// Splits treatment fulltext into overlapping chunks using LangChain's
// RecursiveCharacterTextSplitter.

import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { CHUNK_SIZE, CHUNK_OVERLAP } from './config.js';

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize:    CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
});

/**
 * Split a treatment's fulltext into an array of strings.
 * Returns [] for null/empty input.
 *
 * @param {string|null} text
 * @returns {Promise<string[]>}
 */
export async function chunkText(text) {
    if (!text || text.trim().length === 0) return [];
    return splitter.splitText(text);
}
