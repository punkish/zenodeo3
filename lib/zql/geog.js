'use strict'

const Database = require('better-sqlite3')
const db = new Database('/Users/punkish/Projects/zenodeo/data/treatments.sqlite')
const turf = require('@turf/turf')

const createLocGeoPoly = function() {
    // let sql = "DROP TABLE vlocations"
    // try {
    //     console.log("dropping table vlocations…")
    //     db.prepare(sql).run()
    // }
    // catch(error) {
    //     console.error(error)
    // }

    let sql = "CREATE VIRTUAL TABLE vlocations USING geopoly(treatmentId, materialsCitationId)"

    try {
        console.log("creating table vlocations…")
        db.prepare(sql).run()
    }
    catch(error) {
        console.error(error)
    }
}

const loadGeoPoly = function(delta) {

    const sql = `INSERT INTO vlocations (treatmentId, materialsCitationId, _shape) SELECT treatments.treatmentId, materialsCitationId, geopoly_regular(longitude, latitude, ${delta}, 3) AS _shape FROM treatments JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId WHERE latitude != '' AND longitude != ''`

    try {
        console.log("loading data into vlocations…")
        const recs = db.prepare(sql).run()
    }
    catch(error) {
        console.error(error)
    }
}

const selWithLoc = function() {
    const sql = "SELECT Count(*) AS count FROM treatments JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId WHERE latitude != ''AND longitude != ''"

    const records = db.prepare(sql2).get()
    console.log(records)
}

const selGeoPoly = function({ latitude, longitude, radius }) {
    //console.time("buffer")
    // const buffered = turf.buffer(
    //     turf.point([ longitude, latitude ]), 
    //     radius, 
    //     { units: 'kilometers' }
    // )

    // The buffer produces a multipolygon (even though it is a 
    // simple polygon, so it is represented by an array of array 
    // of coordinates. I have to use the one and only poly in 
    // that array. The following does the trick
    //const poly = JSON.stringify(buffered.geometry.coordinates[0])

    const start = process.hrtime();

    const elapsed_time = function(note) {
        
        // 3 decimal places
        const precision = 3

        // divide by a million to get nano to milli
        const elapsed = process.hrtime(start)[1] / 1000000

        // print message + time
        console.log(process.hrtime(start)[0] + " s, " + elapsed.toFixed(precision) + " ms - " + note)

        // reset the timer
        start = process.hrtime(); 
    }
    //console.timeEnd("buffer")

    console.time("geopoly")

    // const sql_poly = "SELECT geopoly_json(geopoly_regular(@longitude, @latitude, 0.1, 20)) AS poly"
    // const poly = db.prepare(sql_poly).get({ 
    //     longitude: longitude, 
    //     latitude: latitude
    // })
    // console.log(poly)
    

    const sql = "SELECT DISTINCT treatmentId FROM vlocations WHERE geopoly_within(_shape, geopoly_regular(@longitude, @latitude, 0.1, 20)) != 0"
    const records = db.prepare(sql).all({ 
        longitude: longitude, 
        latitude: latitude
    })
    console.log(`found ${records.length} treatments within ${radius} kms of ${latitude}, ${longitude}`)
    


    // const sql = "SELECT DISTINCT treatmentId FROM vlocations WHERE geopoly_within(_shape, geopoly_regular(@longitude, @latitude, @radius, 20)) != 0"

    
    // const records = db.prepare(sql).all({ 
    //     longitude: longitude, 
    //     latitude: latitude, 
    //     radius: radius 
    // })
    // console.log(`found ${records.length} treatments within ${radius} kms of ${latitude}, ${longitude}`)
    // console.log('-'.repeat(50))
    // for (let row in records) {
    //     console.log(records[row].treatmentId)
    // }
    // console.log('='.repeat(50))
    console.timeEnd("geopoly")
    
}

const selBbox = function({ latitude, longitude, radius }) {
    
    const min_latitude = latitude - radius
    const max_latitude = Number(latitude) + Number(radius)
    const min_longitude = longitude - radius
    const max_longitude = Number(longitude) + Number(radius)

    const sql = "SELECT DISTINCT treatments.treatmentId FROM treatments JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId WHERE latitude BETWEEN @min_latitude AND @max_latitude AND longitude BETWEEN @min_longitude AND @max_longitude"

    const box = { 
        min_latitude: min_latitude,
        max_latitude: max_latitude,
        min_longitude: min_longitude,
        max_longitude: max_longitude
    }

    console.log(box)

    console.time("selbox")
    const records = db.prepare(sql).all(box)
    console.log(`selBbox found: ${records.length}`)
    // console.log('-'.repeat(50))
    // for (let row in records) {
    //     console.log(records[row].treatmentId)
    // }
    // console.log('='.repeat(50))
    console.timeEnd("selbox")
}

// createLocGeoPoly()
// loadGeoPoly(0.0001)

selGeoPoly({ latitude: 0, longitude: 0, radius: 10 })
selBbox({ latitude: 0, longitude: 0, radius: 0.1 })


// SELECT DISTINCT treatmentId FROM vlocations WHERE geopoly_within(_shape, geopoly_regular(0, 0, 0.1, 20)) != 0;
// SELECT DISTINCT treatments.treatmentId FROM treatments JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId WHERE latitude BETWEEN -0.1 AND 0.1 AND longitude BETWEEN -0.1 AND 0.1