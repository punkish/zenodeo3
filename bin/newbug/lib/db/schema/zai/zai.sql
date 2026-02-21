CREATE TABLE speciesDescriptions (
    treatmentId TEXT NOT NULL PRIMARY KEY,
    speciesDesc TEXT NOT NULL,
    models_id INTEGER REFERENCES models(id)
);
CREATE TABLE models (
    id INTEGER PRIMARY KEY,
    model TEXT
);