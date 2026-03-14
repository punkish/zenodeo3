/* Tracks which treatments have been chunked and embedded */
CREATE TABLE IF NOT EXISTS embedding_progress (
    
    -- REFERENCES treatments(id), not enforced because 
    -- treatments is in a different schema
    treatments_id   INTEGER PRIMARY KEY,

    -- 'pending' | 'chunked' | 'embedded' | 'indexed' | 'error'
    status          TEXT NOT NULL DEFAULT 'pending',
    chunk_count     INTEGER,
    error_msg       TEXT,

    -- unix ms
    started_at      INTEGER,   
    finished_at     INTEGER
);

-- Chunk store ───────────────────────────────────────────────────────────────
-- chunk.id is the integer key used in all vector indexes.
-- treatmentId (the immutable public UUID from the source data) is stored
-- alongside treatment_id (the mutable SQLite-assigned integer PK) so that if
-- the treatments table is ever rebuilt and integer PKs are reassigned, the
-- chunks — and therefore the vector index keys — can be re-linked correctly
-- by joining on the stable treatmentId rather than the fragile integer id.
CREATE TABLE IF NOT EXISTS treatment_chunks (
    id INTEGER PRIMARY KEY,

    -- REFERENCES treatments(id), not enforced because 
    -- treatments is in a different schema
    treatments_id INTEGER NOT NULL,

    -- immutable UUID, copied from treatments.treatmentId
    treatmentId TEXT NOT NULL,

    -- 0-based order within treatment
    chunk_index INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    token_estimate INTEGER,

    -- usearch vector index key = this row's id
    UNIQUE(treatments_id, chunk_index)
);

-- ── Vector store (index-agnostic) ───────────────────────────────────────────
-- Stores raw Float32 vectors as BLOBs, keyed on chunk_id.
-- These are the source of truth for all index rebuilds — adding a new index
-- backend never requires re-running Ollama.
--
-- Storage: 768 dims × 4 bytes = 3072 bytes/vector.
-- At ~10M chunks: ~30 GB. Use VACUUM after bulk deletes to reclaim space.
CREATE TABLE IF NOT EXISTS chunk_vectors (
    chunk_id     INTEGER PRIMARY KEY REFERENCES treatment_chunks(id),

    -- REFERENCES treatments(id), not enforced because 
    -- treatments is in a different schema
    treatments_id INTEGER NOT NULL,
    vector       BLOB NOT NULL          -- raw IEEE 754 float32, little-endian
);