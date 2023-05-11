export const triggers = {
    im_afterInsert: `
CREATE TRIGGER IF NOT EXISTS im_afterInsert 
AFTER INSERT ON images 
BEGIN

    --insert new entry in fulltext index
    INSERT INTO imagesFts( captionText ) 
    VALUES ( new.captionText );
END;
    `,

    im_afterUpdate: `
CREATE TRIGGER IF NOT EXISTS im_afterUpdate
AFTER UPDATE ON images 
BEGIN

    -- "delete" the old index from the fts table
    INSERT INTO imagesFts( imagesFts, rowid, captionText ) 
    VALUES( 'delete', old.id, old.captionText );

    -- add the new index to the fts table
    INSERT INTO imagesFts( rowid, captionText ) 
    VALUES ( new.id, new.captionText );
END;
    `,

    im_afterDelete: `
CREATE TRIGGER IF NOT EXISTS im_afterDelete 
AFTER DELETE ON images 
BEGIN

    -- "delete" the old index from the fts table
    INSERT INTO imagesFts( imagesFts, rowid, captionText ) 
    VALUES( 'delete', old.id, old.captionText );
END;
    `
}