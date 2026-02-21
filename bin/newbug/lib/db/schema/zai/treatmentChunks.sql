-- Tracks which treatments have been chunked and embedded
CREATE TABLE IF NOT EXISTS embedding_progress (
    treatment_id    INTEGER PRIMARY KEY REFERENCES treatments(id),

    -- 'pending' | 'chunked' | 'embedded' | 'indexed' | 'error'
    status          TEXT NOT NULL DEFAULT 'pending',
    chunk_count     INTEGER,
    error_msg       TEXT,

    -- unix ms
    started_at      INTEGER,   
    finished_at     INTEGER
);

-- Stores each chunk and its metadata
CREATE TABLE IF NOT EXISTS treatment_chunks (
    id              INTEGER PRIMARY KEY,
    treatment_id    INTEGER NOT NULL REFERENCES treatments(id),

    -- 0-based order within treatment
    chunk_index     INTEGER NOT NULL,
    chunk_text      TEXT NOT NULL,
    token_estimate  INTEGER,

    -- usearch vector index key = this row's id
    UNIQUE(treatment_id, chunk_index)
);

-- Index to quickly find chunks for a treatment
CREATE INDEX IF NOT EXISTS idx_chunks_treatment ON treatment_chunks(treatment_id);

-- For resuming: find un-processed treatments fast
CREATE INDEX IF NOT EXISTS idx_progress_status ON embedding_progress(status);

-- Populate progress table for all existing treatments that haven't been 
-- processed
INSERT OR IGNORE INTO embedding_progress (treatment_id, status)
SELECT id, 'pending' FROM treatments;

-- Trigger: auto-insert new treatments into the progress queue
CREATE TRIGGER IF NOT EXISTS treatments_queue_embedding
    AFTER INSERT ON treatments
    BEGIN
        INSERT OR IGNORE INTO embedding_progress (treatment_id, status)
        VALUES (new.id, 'pending');
    END;