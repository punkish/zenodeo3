# Treatments Vector Index — Multi-Backend Benchmark

Modular pipeline that chunks, embeds, and indexes `treatments.fulltext` across four vector backends simultaneously, with a unified search API and benchmark runner.

---

## Architecture

```
treatments (SQLite)
       │
       ▼
  embedding_progress          ← per-treatment status, resumability
       │ pending
       ▼
  src/chunker/index.js        ← RecursiveCharacterTextSplitter (LangChain)
       │ chunks[]
       ▼
  treatment_chunks (SQLite)   ← persistent chunk store; chunk.id = index key
       │
       ▼
  src/embedder/index.js       ← nomic-embed-text via Ollama → Float32Array[768]
       │ vectors[]
       ├──────────────────────────────────────────────────────────┐
       ▼                                                          ▼
src/indexers/sqlite-vec.js           src/indexers/sqlite-vector.js
  vec0 virtual table (SQLite)          BLOB table + HNSW (SQLite)
  brute-force KNN                      @sqliteai/sqlite-vector
       │                                       │
       ▼                                       ▼
src/indexers/usearch.js              src/indexers/zvec.js
  HNSW .usearch file                   STUB — npm pkg not yet released
  unum-cloud/usearch                   alibaba/zvec (Python only, Feb 2026)
       │
       ▼
  src/search/index.js         ← unified Searcher class, queries any/all indexes
```

---

## Module responsibilities

| Module                 | Does |
|------------------------|---|
| `src/chunker/`         | Text → string[] via RecursiveCharacterTextSplitter |
| `src/embedder/`        | string → Float32Array via Ollama |
| `src/indexers/*`       | One file per backend; all expose `add()`, `addBatch()`, `search()`, `persist()` |
| `src/search/`          | Unified `Searcher`; embeds query, calls adapter, resolves to treatment rows |
| `indexer.js`           | Pipeline orchestrator; resumable, handles all four backends |
| `scripts/benchmark.js` | Latency + quality comparison across backends |
| `config.js`            | All tunables; per-environment + per-index on/off |
| `schema.sql`           | SQLite migration — run once |

---

## Setup

### 1. Install Ollama and pull the model

```bash
# macOS
brew install ollama && ollama serve &

# Ubuntu
curl -fsSL https://ollama.com/install.sh | sh
systemctl enable --now ollama

ollama pull nomic-embed-text
```

### 2. Apply schema

```bash
DB_PATH=/path/to/treatments.db npm run schema
# or:
sqlite3 /path/to/treatments.db < schema.sql
```

### 3. Install dependencies

```bash
npm install
```

> **sqlite-vector license:** `@sqliteai/sqlite-vector` uses the Elastic License 2.0.  
> Internal/personal use is fine; contact sqliteai for managed-service deployments.

### 4. Configure

Edit `config.js` or set environment variables:

```bash
# Enable/disable individual indexes
INDEX_SQLITE_VEC=true
INDEX_SQLITE_VECTOR=true
INDEX_USEARCH=true
INDEX_ZVEC=false          # not yet on npm

# Paths
DB_PATH=./data/treatments.db
USEARCH_INDEX_PATH=./data/indexes/treatments.usearch

# Environment (controls throughput defaults)
NODE_ENV=production       # or development
```

### 5. Index

```bash
# Initial bulk run (1.2M treatments — expect 20–35 hours)
tmux new -s indexer
node indexer.js

# Daily incremental (run via cron at 03:00)
node indexer.js --daily

# Full rebuild
node indexer.js --rebuild
```

---

## Searching

```js
import { Searcher } from './src/search/index.js';
import Database from 'better-sqlite3';

const db = new Database('./data/treatments.db', { readonly: true });
const searcher = new Searcher(db).init();

// Single index
const results = await searcher.search('Where does Laephotis botswanae roost?', {
    index: 'usearch',
    topK:  5,
});

// All indexes (for comparison / benchmarking)
const comparison = await searcher.searchAll('cockroaches in Southern India', { topK: 5 });

searcher.close();
```

Each result contains: `{ score, treatmentId, treatment_id, genus_id, species_id, chunkId, index }`.  
Feed `treatment_id` back into `SELECT fulltext FROM treatments WHERE id = ?` to get the context for your LLM.

---

## Benchmarking

```bash
node scripts/benchmark.js
# custom queries:
node scripts/benchmark.js --queries "bat roosting habitat" "termites tropics"
```

---

## Index comparison guide

| | sqlite-vec | sqlite-vector | usearch | zvec |
|---|---|---|---|---|
| **Algorithm** | Brute-force KNN | HNSW (ANN) | HNSW (ANN) | Proxima (ANN) |
| **Storage** | Inside .db | Inside .db | Separate .usearch file | Separate directory |
| **Node.js support** | ✅ stable | ✅ stable | ✅ stable | ⚠️ not yet on npm |
| **License** | MIT/Apache-2.0 | Elastic 2.0 | Apache-2.0 | Apache-2.0 |
| **Best for** | ≤ 500k vectors; simplicity | HNSW inside SQLite | Largest scale; best recall tuning | TBD |
| **Quantization** | f32 / int8 / bit | float32 / int8 | scalar (configurable) | fp32 / int8 |
| **Recall** | Exact (100%) | ~95-98% | ~95-98% | ~95-99% |

**Practical recommendation for 1.2M treatments × ~8 chunks = ~10M vectors:**
- Start with **usearch** — battle-tested HNSW, excellent Node.js support, best documentation.
- Add **sqlite-vec** as a second index. Its brute-force exact KNN is slower at 10M scale but can serve as a recall ground-truth for benchmark comparison.
- Enable **sqlite-vector** if you prefer keeping everything in one `.db` file.
- Revisit **zvec** once the npm package ships; its Proxima engine is likely the fastest of the four.

---

## zvec status

zvec (github.com/alibaba/zvec) was open-sourced in February 2026. As of this writing:
- Python bindings are published and working.
- A Node.js SDK is mentioned in the project roadmap and a Medium article references it, but no npm package has appeared yet.
- `src/indexers/zvec.js` is a fully-documented stub with the expected API shape.
- Set `INDEX_ZVEC=true` and `npm install zvec` once the package is published.

---

## Storage estimates

For 1.2M treatments × 8 chunks average × 768 dimensions:

| Format | Size per vector | Total (9.6M vectors) |
|---|---|---|
| float32 | 3,072 bytes | ~29 GB |
| int8 | 768 bytes | ~7.3 GB |
| binary | 96 bytes | ~0.9 GB |

usearch supports int8 quantization via `quantization` option. sqlite-vec supports `int8[768]` and `bit[768]` column types. Use int8 for a good accuracy/storage balance on nomic-embed-text.

chunk text itself (at ~512 chars avg per chunk): ~4.9 GB additional in treatment_chunks.

---

## Monitoring

```bash
# Overall progress
sqlite3 $DB_PATH "SELECT status, COUNT(*) FROM embedding_progress GROUP BY status;"

# Recent errors
sqlite3 $DB_PATH "
  SELECT t.treatmentId, p.error_msg
  FROM embedding_progress p
  JOIN treatments t ON t.id = p.treatment_id
  WHERE p.status = 'error'
  LIMIT 20;
"
```
