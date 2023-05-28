export const inserts = {
    insertTreatments_images: (db) => db.prepare(
        `INSERT INTO treatments_images (
            treatments_id,
            images_id
        )
        VALUES (
            @treatments_id,
            @images_id
        )
        ON CONFLICT (treatments_id, images_id)
        DO NOTHING`
    )
};