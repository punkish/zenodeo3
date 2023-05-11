export const triggers = {
    // fc_afterInsert: `CREATE TRIGGER IF NOT EXISTS fc_afterInsert 
    // AFTER INSERT ON figureCitations 
    // BEGIN

    //     -- insert new entry into fulltext index
    //     INSERT INTO figureCitationsFts(
    //         rowid, 
    //         captionText
    //     ) 
    //     VALUES (
    //         new.id, 
    //         new.captionText
    //     );
    // END;`,

    // fc_afterInsert_images: `CREATE TRIGGER IF NOT EXISTS fc_afterInsert_images 
    // AFTER INSERT ON figureCitations 
    // WHEN new.httpUri != ''
    // BEGIN

    //     -- insert distinct httpUri into images
    //     INSERT INTO images (httpUri)
    //     VALUES (new.httpUri)
    //     ON CONFLICT (httpUri) 
    //     DO NOTHING;

    //     INSERT INTO figureCitationsXimages (figureCitations_id, images_id)
    //     VALUES (
    //         new.id,
    //         (SELECT id FROM images WHERE httpUri = new.httpUri)
    //     );
        
    // END;`,

    // fc_afterInsert_treatmentImage: `CREATE TRIGGER IF NOT EXISTS fc_afterInsert_treatmentImage 
    // AFTER INSERT ON figureCitations 
    // WHEN 
    //     new.httpUri != '' AND 
    //     new.httpUri NOT LIKE 'http://dx.doi.org%' AND 
    //     new.captionText != ''
    // BEGIN
    //     INSERT INTO treatmentImages (
    //         figureCitations_id, 
    //         httpUri, 
    //         captionText, 
    //         treatments_id
    //     )
    //     VALUES (
    //         new.id, 
    //         new.httpUri, 
    //         new.captionText,
    //         new.treatments_id
    //     )
    //     ON CONFLICT(httpUri) DO NOTHING;
    // END;`,

    // "delete" the old index from the fts table and add new index
    // fc_afterUpdate: `CREATE TRIGGER IF NOT EXISTS fc_afterUpdate 
    // AFTER UPDATE ON figureCitations 
    // BEGIN
    //     INSERT INTO figurecitationsFts(
    //         figurecitationsFts, 
    //         rowid, 
    //         captionText
    //     ) 
    //     VALUES(
    //         'delete', 
    //         old.id, 
    //         old.captionText
    //     );

    //     INSERT INTO figurecitationsFts(
    //         rowid, 
    //         captionText
    //     ) 
    //     VALUES (
    //         new.id, 
    //         new.captionText
    //     );
    // END;`,

    // "delete" the old index from the fts table
    // fc_afterDelete: `CREATE TRIGGER IF NOT EXISTS fc_afterDelete 
    // AFTER DELETE ON figureCitations 
    // BEGIN
    //     INSERT INTO figurecitationsFts(
    //         figurecitationsFts, 
    //         rowid, 
    //         captionText
    //     ) 
    //     VALUES(
    //         'delete', 
    //         old.id, 
    //         old.captionText
    //     );
    // END;`
}