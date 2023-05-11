export const inserts = {
    insertImageGet_images_id: (db) => {
        const insert = db.prepare(`
INSERT INTO images (
    httpUri, 
    figureDoi,
    captionText, 
    treatments_id
)
VALUES (
    @httpUri, 
    @figureDoi,
    @captionText, 
    @treatments_id
)
ON CONFLICT (httpUri)
DO UPDATE SET
    captionText=excluded.captionText
`);

        const select = db.prepare(`
SELECT id  
FROM images
WHERE figureCitationId = ?`);

        return insertAndReturnFk({ insert, select });
    },

    insertImage: (db) => db.prepare(`
INSERT INTO images (
    httpUri, 
    figureDoi,
    captionText, 
    treatments_id
)
VALUES (
    @httpUri, 
    @figureDoi,
    @captionText, 
    @treatments_id
)
ON CONFLICT (httpUri)
DO UPDATE SET
    captionText=excluded.captionText
    `),
}