-- Index to quickly find chunks for a treatment
CREATE INDEX IF NOT EXISTS idx_chunks_treatment ON treatment_chunks(treatments_id);
CREATE INDEX IF NOT EXISTS idx_chunks_treatmentId ON treatment_chunks(treatmentId);

-- For resuming: find un-processed treatments fast
CREATE INDEX IF NOT EXISTS idx_progress_status ON embedding_progress(status);
CREATE INDEX IF NOT EXISTS idx_vectors_treatment ON chunk_vectors(treatments_id);
CREATE INDEX IF NOT EXISTS idx_vectors_chunk ON chunk_vectors(chunk_id);
