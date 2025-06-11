export const triggers = {
    tr_afterInsertFts: `
CREATE TRIGGER IF NOT EXISTS tr_afterInsertFts 
    AFTER INSERT ON treatments 
    BEGIN

        -- insert new entry in fulltext index
        INSERT INTO treatmentsFts( fulltext ) 
        VALUES ( new.fulltext );

        INSERT INTO binomen (binomen)
        SELECT genera.genus || ' ' || species.species AS binomen 
        FROM 
            treatments
            JOIN genera ON treatments.genera_id = genera.id 
            JOIN species ON treatments.species_id = species.id 
        WHERE 
            genera.id = new.genera_id 
            AND species.id = new.species_id;
    END;`,

    tr_afterUpdate: `
CREATE TRIGGER IF NOT EXISTS tr_afterUpdate 
    AFTER UPDATE ON treatments 
    BEGIN

        -- "delete" the old index from the fts table
        INSERT INTO treatmentsFts( treatmentsFts, rowid, fulltext ) 
        VALUES( 'delete', old.id, old.fulltext );

        -- add the new index to the fts table
        INSERT INTO treatmentsFts( rowid, fulltext ) 
        VALUES ( new.id, new.fulltext );
    END;`,

    tr_afterInsertJournal: `
CREATE TRIGGER IF NOT EXISTS tr_afterInsertJournal 
    AFTER INSERT ON treatments 
    WHEN new.journals_id IS NOT NULL 
    BEGIN

        -- insert or update journals by year frequency
        INSERT INTO journalsByYears (
            journals_id, 
            journalYear, 
            num
        )
        VALUES (
            new.journals_id, 
            new.journalYear, 
            1
        )
        ON CONFLICT(journals_id, journalYear) 
        DO UPDATE SET num = num + 1;
    END;`,

    tr_afterDelete: `
CREATE TRIGGER IF NOT EXISTS tr_afterDelete 
    AFTER DELETE ON treatments 
    BEGIN

        -- update the count in the journals by year freq table
        UPDATE journalsByYears 
        SET num = num - 1
        WHERE 
            journals_id = old.journals_id AND 
            journalYear = old.journalYear;

        -- "delete" the old index from the fts table
        INSERT INTO treatmentsFts( treatmentsFts, rowid, fulltext ) 
        VALUES( 'delete', old.id, old.fulltext );
    END;`
}