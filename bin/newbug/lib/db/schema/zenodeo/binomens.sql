/* fts table for binomens */
CREATE VIRTUAL TABLE IF NOT EXISTS binomens USING fts5 (
    binomen, 
    tokenize='trigram'
);

CREATE TEMP VIEW IF NOT EXISTS binomensView AS 
    SELECT
        z.treatmentId,
        z.speciesDesc,
        z.models_id,
        g.genus,
        s.species
    FROM 
        treatments t
        JOIN genera g ON t.genera_id = g.id
        JOIN species s ON t.species_id = s.id 
        JOIN zai.speciesDescriptions z ON t.treatmentId = z.treatmentId 
        JOIN binomens b ON g.genus || ' ' || s.species = b.binomen;

CREATE TEMP TRIGGER IF NOT EXISTS binomensView_ii 
    INSTEAD OF INSERT ON binomensView
    BEGIN
        INSERT INTO speciesDescriptions (
            treatmentId, 
            speciesDesc, 
            models_id
        ) 
        VALUES (
            NEW.treatmentId, 
            NEW.speciesDesc, 
            1
        );

        -- Insert only if genus and species are both non-empty and 
        -- don't already exist in the binomens FTS table
        INSERT INTO binomens (binomen)
        SELECT  NEW.genus || ' ' || NEW.species
        WHERE   NEW.genus IS NOT NULL
            AND NEW.genus != ''
            AND NEW.species IS NOT NULL
            AND NEW.species != ''
            AND NOT EXISTS (
                SELECT 1
                FROM binomens
                WHERE binomen = NEW.genus || ' ' || NEW.species
            );
    END;

   