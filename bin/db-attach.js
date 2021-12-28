'use strict'

const config = require('config')

/* 
 * prepare and connect to the database
 *
 * ATTACH external databases
 * https://github.com/JoshuaWise/better-sqlite3/issues/102#issuecomment-369468174
 * 
 */
const Database = require('better-sqlite3')
const db = new Database(config.get('db.treatments'))
db.prepare(`ATTACH DATABASE '${config.get('db.materialsCitations')}' AS materialsCitations`).run()
db.prepare(`ATTACH DATABASE '${config.get('db.treatmentAuthors')}' AS treatmentAuthors`).run()
db.prepare(`ATTACH DATABASE '${config.get('db.treatmentCitations')}' AS treatmentCitations`).run()
db.prepare(`ATTACH DATABASE '${config.get('db.figureCitations')}' AS figureCitations`).run()
db.prepare(`ATTACH DATABASE '${config.get('db.bibRefCitations')}' AS bibRefCitations`).run()
db.prepare(`ATTACH DATABASE '${config.get('db.gbifcollections')}' AS gbifcollections`).run()
db.prepare(`ATTACH DATABASE '${config.get('db.facets')}' AS facets`).run()

const test = function() {
    const sql = `
    SELECT 
        collectionCode, 
        collectionCodeCount 
    FROM (
        SELECT 
            materialsCitations.collectionCodes.collectionCode AS collectionCode, 
            Count(materialsCitations.collectionCodes.collectionCode) AS collectionCodeCount 
        FROM 
            treatments 
            JOIN materialsCitations.materialsCitations mc ON treatments.treatmentId = mc.treatmentId 
            JOIN materialsCitations.materialsCitations_x_collectionCodes mxc ON mc.materialsCitationId = mxc.materialsCitationId 
            JOIN materialsCitations.collectionCodes mcc ON mxc.collectionCode = mcc.collectionCode 
            LEFT JOIN gbifcollections.institutions gbc ON gbc.collectionCode = institution_code 
        WHERE mc.collectionCode != '' 
        GROUP BY mc.collectionCodes.collectionCode 
        HAVING collectionCodeCount > 50 
        ORDER BY collectionCodeCount DESC LIMIT 50
    ) AS t 
    ORDER BY mc.collectionCodes.collectionCode ASC`

    const res = db.prepare(sql).all()
    console.log(res)
}

test()