export const triggers = {
    bc_afterInsert: `
CREATE TRIGGER IF NOT EXISTS bc_afterInsert 
AFTER INSERT ON bibRefCitations 
BEGIN

    --insert new entry in fulltext index
    INSERT INTO bibRefCitationsFts( refString ) 
    VALUES ( new.refString );
END;
    `,

    bc_afterUpdate: `
CREATE TRIGGER IF NOT EXISTS bc_afterUpdate
AFTER UPDATE ON bibRefCitations 
BEGIN

    -- "delete" the old index from the fts table
    INSERT INTO bibRefCitationsFts( bibRefCitationsFts, rowid, refString ) 
    VALUES( 'delete', old.id, old.refString );

    -- add the new index to the fts table
    INSERT INTO bibRefCitationsFts( rowid, refString ) 
    VALUES ( new.id, new.refString );
END;
    `,

    bc_afterDelete: `
CREATE TRIGGER IF NOT EXISTS bc_afterDelete 
AFTER DELETE ON bibRefCitations 
BEGIN

    -- "delete" the old index from the fts table
    INSERT INTO bibRefCitationsFts( bibRefCitationsFts, rowid, refString ) 
    VALUES( 'delete', old.id, old.refString );
END;
    `
}