// lib/zai/askZaiSomething/lib/reranker.js
import fs from 'fs';
import path from 'path';
import * as ort from 'onnxruntime-node';
import { Tokenizer } from '@huggingface/tokenizers';

let session = null;
let tokenizer = null;

const MODEL_DIR = path.resolve('./ranker_cache/bge-reranker-base');
const ONNX_MODEL_PATH = path.join(MODEL_DIR, 'onnx', 'model_quantized.onnx');
const TOKENIZER_JSON_PATH = path.join(MODEL_DIR, 'tokenizer.json');

/**
 * Lazy-load the tokenizer from JSON file
 */
async function loadTokenizer() {
    if (!tokenizer) {
        if (!fs.existsSync(TOKENIZER_JSON_PATH)) {
            throw new Error(`Tokenizer JSON file missing at ${TOKENIZER_JSON_PATH}`);
        }
        const tokenizerData = JSON.parse(fs.readFileSync(TOKENIZER_JSON_PATH, 'utf-8'));
        tokenizer = new Tokenizer(tokenizerData);
    }
    return tokenizer;
}

/**
 * Lazy-load the ONNX reranker model
 */
async function loadModel() {
    if (!session) {
        if (!fs.existsSync(ONNX_MODEL_PATH)) {
            throw new Error(`ONNX model file missing at ${ONNX_MODEL_PATH}`);
        }
        session = await ort.InferenceSession.create(ONNX_MODEL_PATH, {
            executionProviders: ['cpuExecutionProvider']
        });
    }
    return session;
}

/**
 * Rerank documents given a question using BGE ONNX reranker
 * @param {string} question
 * @param {Array<{fulltext: string}>} docs
 * @returns {Array} docs with added `score` field, sorted descending
 */
export async function rerank(question, docs) {

    if (!Array.isArray(docs) || docs.length === 0) {
        return [];
    }

    const tokenizer = await loadTokenizer();
    const session = await loadModel();
    const rankedDocs = [];

    for (let i = 0; i < docs.length; i++) {
        const doc = docs[i];
        const text = `${question} [SEP] ${doc.fulltext.slice(0, 1500)}`;

        // Encode text using tokenizer
        const encoded = tokenizer.encode(text);

        if (!encoded.ids || !encoded.attentionMask) {
            throw new Error('Tokenizer failed to produce ids or attentionMask');
        }

        // Convert to ONNX tensors
        const inputIds = new ort.Tensor(
            'int64',
            BigInt64Array.from(encoded.ids.map(x => BigInt(x))),
            [1, encoded.ids.length]
        );

        const attentionMask = new ort.Tensor(
            'int64',
            BigInt64Array.from(encoded.attentionMask.map(x => BigInt(x))),
            [1, encoded.attentionMask.length]
        );

        // Run ONNX model
        const output = await session.run({
            input_ids: inputIds,
            attention_mask: attentionMask
        });

        if (!output.hasOwnProperty('logits')) {
            throw new Error('ONNX output missing logits');
        }

        const score = output.logits.data[0];
        rankedDocs.push({ ...doc, score });
    }

    // Sort descending by score
    rankedDocs.sort((a, b) => { return b.score - a.score; });

    return rankedDocs;
}