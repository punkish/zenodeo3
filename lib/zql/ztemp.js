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
const db = new Database(config.get('data.treatments'))
db.prepare(`ATTACH DATABASE '${config.get('data.collections')}' AS z3collections`).run()
db.prepare(`ATTACH DATABASE '${config.get('data.facets')}' AS z3facets`).run()

const sql = "SELECT collectionCodes.collectionCode, count FROM (SELECT collectionCodes.collectionCode, Count(collectionCodes.collectionCode) AS count FROM treatments JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId JOIN materialsCitationsXcollectionCodes ON materialsCitations.materialsCitationId = materialsCitationsXcollectionCodes.materialsCitationId JOIN collectionCodes ON materialsCitationsXcollectionCodes.collectionCode = collectionCodes.collectionCode LEFT JOIN z3collections.institutions ON collectionCodes.collectionCode = institution_code WHERE collectionCodes.collectionCode != '' GROUP BY collectionCodes.collectionCode HAVING count > 50 ORDER BY count DESC LIMIT 50) AS t ORDER BY collectionCodes.collectionCode ASC"

const res = db.prepare(sql).all()
console.log(res)