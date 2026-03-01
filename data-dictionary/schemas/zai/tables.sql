CREATE TABLE IF NOT EXISTS speciesDescriptions (
    treatmentId TEXT NOT NULL PRIMARY KEY,
    speciesDesc TEXT NOT NULL,
    models_id INTEGER REFERENCES models(id)
);

CREATE TABLE IF NOT EXISTS models (
    id INTEGER PRIMARY KEY,
    model TEXT
);