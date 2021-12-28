'use strict'

const Database = require('better-sqlite3')
const config = require('config')
const DB = {
    treatments: new Database(config.get('db.treatments')),
    etlStats: new Database(config.get('db.etlStats')),
    queryStats: new Database(config.get('db.queryStats'))
}

// const stmt2 = "INSERT INTO vlocations (treatmentId, materialsCitationId, _shape) SELECT treatments.treatmentId, materialsCitationId, '[[' || longitude || ',' || latitude || '],[' || longitude || ',' || latitude || '],[' || longitude || ',' || latitude || '],[' || longitude || ',' || latitude || ']]' AS _shape FROM treatments JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId WHERE latitude != '' AND longitude != ''"



const populateVlocationsGeopoly = function() {
    //DB.treatments.prepare("DROP TABLE vlocations").run()
    //DB.treatments.prepare("CREATE VIRTUAL TABLE vlocations USING geopoly(treatmentId, materialsCitationId)").run()

    const ins = "INSERT INTO vlocations (treatmentId, materialsCitationId, _shape) VALUES (@treatmentId, @materialsCitationId, @_shape)"
    const sin = DB.treatments.prepare(ins)

    //const sel = "SELECT treatmentId, materialsCitationId, longitude, latitude FROM materialsCitations WHERE latitude != '' AND longitude != ''"
    const sel = "SELECT treatmentId, materialsCitationId, latitude, longitude FROM materialsCitations WHERE materialsCitationId IN ('3B1B3CEA1D309D67D1A07AD2FB96CCFF','BCB9851FFFA2FFC0AB3E78F2FB3D7524','BCB9851FFFA2FFC0ABB67956FB4E75A2','BCB9851FFFA2FFC0ABCD7A0DFAB276DA','BCB9851FFFA2FFC0AA3E7A80FB3D76B6')"
    const s = DB.treatments.prepare(sel).all()
    
    for (const row of s) {
        const lat = row.latitude.toString().slice(-1) === '°' ? Number(row.latitude.toString().slice(0, -1)) : row.latitude
        const lng = row.longitude.toString().slice(-1) === '°' ? Number(row.longitude.toString().slice(0, -1)): row.longitude
        const _shape = `[[${lng},${lat}],[${lng},${lat}],[${lng},${lat}],[${lng},${lat}]]`
        const treatmentId = row.treatmentId
        const materialsCitationId = row.materialsCitationId

        try {
            sin.run({ treatmentId, materialsCitationId, _shape })
        }
        catch (error) {
            //console.log(error)
            console.log(`${treatmentId},${materialsCitationId},${_shape}`)
        }
    }

}

populateVlocationsGeopoly()
// const shapes = DB.treatments.prepare(stmt3).all()
// //const j = shapes.length
// for (let i = 0; i < 5; i++) {
//     console.log(shapes[i])
// }

// DB.treatments.prepare(stmt2).run()
// const c = DB.treatments.prepare(stmt1).get().c
// console.log(c)

const populateVlocsRtree = function() {
    const stmt = "DROP TABLE vlocs"

    const stmt0 = `CREATE VIRTUAL TABLE vlocs USING rtree(
        id,                         -- primary key
        minX, maxX,                 -- X coordinate
        minY, maxY,                 -- Y coordinate
        +materialsCitationId TEXT,
        +treatmentId TEXT
     )`

     const stmt4 = "INSERT INTO vlocs(minX, maxX, minY, maxY, materialsCitationId, treatmentId) SELECT longitude, longitude, latitude, latitude, materialsCitationId, treatmentId FROM materialsCitations WHERE latitude != '' AND longitude != ''"

     const stmt1 = "SELECT Count(*) AS c FROM vlocs"

     DB.treatments.prepare(stmt).run()
     DB.treatments.prepare(stmt0).run()
     DB.treatments.prepare(stmt4).run()
     const c = DB.treatments.prepare(stmt1).get().c
     console.log(c)
}


const findErrors = function() {
    const stmt3 = "SELECT treatmentId, materialsCitationId, latitude, longitude FROM materialsCitations WHERE latitude != '' AND longitude != ''"

    const s = DB.treatments.prepare(stmt3)
    
    for (const row of s.iterate()) {
        const lat = row.latitude.toString().slice(-1) === '°' ? true : false
        const lng = row.longitude.toString().slice(-1) === '°' ? true: false

        if (lat && lng) {
            console.log(`${row.treatmentId}\t${row.materialsCitationId}\t${row.latitude}\t${row.longitude}`)
        }

        else if (lat) {
            console.log(`${row.treatmentId}\t${row.materialsCitationId}\t${row.latitude}\t****`)
        }

        else if (lng) {
            console.log(`${row.treatmentId}\t${row.materialsCitationId}\t****\t${row.longitude}`)
        }        
    }
}

//findErrors()


