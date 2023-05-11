export const inserts = {
    
    insertImages_figureCitations: (db) => db.prepare(
        `INSERT INTO images_figureCitations (
            images_id,
            figureCitations_id
        )
        VALUES (
            @images_id,
            @figureCitations_id
        )
        ON CONFLICT (images_id, figureCitations_id)
        DO NOTHING`
    )
};