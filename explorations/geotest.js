import Database from 'better-sqlite3';
const db = new Database('geo.sqlite');
import Chance from 'chance';
const chance = Chance();

/*

    Y
    |                      maxX (lng)
    |                      maxY (lat)
    |         +-----------+
    |         |           |
    |         |           |
    |         |           |
    |         +-----------+
    |     minX (lng)
    |     minY (lat)
    |
    +--------------------------> X
*/

const createTables = () => {
    db.prepare(`CREATE TABLE IF NOT EXISTS t (
        id INTEGER PRIMARY KEY,
        longitude REAL,
        latitude REAL,
        desc TEXT,
        validGeo BOOLEAN GENERATED ALWAYS AS (
            typeof(longitude) = 'real' AND 
            abs(longitude) <= 180 AND 
            typeof(latitude) = 'real' AND 
            abs(latitude) <= 90
        ) STORED
    )`).run();

    db.prepare(`CREATE VIRTUAL TABLE IF NOT EXISTS tr USING rtree (
        id,
        minX, maxX,
        minY, maxY,
        +t_id
    )`).run();

    db.prepare(`CREATE VIRTUAL TABLE IF NOT EXISTS tg USING geopoly (t_id)`).run();

    db.prepare(`CREATE TRIGGER IF NOT EXISTS aftInsT
    AFTER INSERT ON t
    WHEN new.validGeo = 1
    BEGIN

        -- insert new entry in the rtree table
        INSERT INTO tr (
            minX, maxX, minY, maxY,
            t_id
        )
        SELECT 
            json_extract(g, '$[0][0]') AS minX, 
            json_extract(g, '$[2][0]') AS maxX,
            json_extract(g, '$[0][1]') AS minY,
            json_extract(g, '$[2][1]') AS maxY,
            id
        FROM (
            SELECT
                geopoly_json(
                    geopoly_bbox(
                        geopoly_regular(
                            new.longitude, 
                            new.latitude, 
                            abs(5/(40075017*cos(new.latitude)/360)),
                            4
                        )
                    )
                ) AS g,
                new.id AS id
        );

        -- insert new entry in the geopoly table
        INSERT INTO tg (
            _shape,
            t_id
        ) 
        VALUES (

            -- shape
            geopoly_bbox(
                geopoly_regular(
                    new.longitude, 
                    new.latitude, 
                    abs(5/(40075017*cos(new.latitude)/360)),
                    4
                )
            ),
            new.id
        );
    END;`).run();
}

/*
VALUES (

            -- minX
            json_extract(
                geopoly_json(
                    geopoly_bbox(
                        geopoly_regular(
                            new.longitude, 
                            new.latitude, 
                            abs(5/(40075017*cos(new.latitude)/360)),
                            4
                        )
                    )
                ), 
                '$[0][0]'
            ),

            -- maxX
            json_extract(
                geopoly_json(
                    geopoly_bbox(
                        geopoly_regular(
                            new.longitude, 
                            new.latitude, 
                            abs(5/(40075017*cos(new.latitude)/360)),
                            4
                        )
                    )
                ), 
                '$[2][0]'
            ),

            -- minY
            json_extract(
                geopoly_json(
                    geopoly_bbox(
                        geopoly_regular(
                            new.longitude, 
                            new.latitude, 
                            abs(5/(40075017*cos(new.latitude)/360)),
                            4
                        )
                    )
                ), 
                '$[0][1]'
            ),

            -- maxY
            json_extract(
                geopoly_json(
                    geopoly_bbox(
                        geopoly_regular(
                            new.longitude, 
                            new.latitude, 
                            abs(5/(40075017*cos(new.latitude)/360)),
                            4
                        )
                    )
                ), 
                '$[2][1]'
            )
*/

const loadTable = () => {
    const stm = db.prepare(`INSERT INTO t (longitude, latitude, desc) 
    VALUES (@longitude, @latitude, @desc)`);

    // insert 100 random points
    const data = [...Array(1000).keys()].map(i => {
        return {
            longitude: chance.floating({ min: -30, max: 30, fixed: 5 }),
            latitude : chance.floating({ min: -20, max: 20, fixed: 5 }),
            desc     : chance.sentence({ words: 5 })
        }
    });

    for (const row of data) {
        stm.run(row);
    }

    // add some duplicates
    // const duplicates = [
    //     data[5],  // 6
    //     data[28], // 29
    //     data[3]   // 4
    // ];

    // for (const row of duplicates) {
    //     const { id } = stm.get(row);
    //     console.log(id);
    // }
    
}

const geopolyRegular = (longitude, latitude, R, N) => {
    return `geopoly_regular(
        ${longitude}, 
        ${latitude}, 
        abs(${R}/(40075017*cos(${latitude})/360)), 
        ${N} 
    )`
};

const jsonExt = (pos, longitude, latitude, R, N) => {
    const corners = {
        minX: '$[0][0]',
        maxX: '$[2][0]',
        minY: '$[0][1]',
        maxY: '$[2][1]'
    };

    return `json_extract(
        geopoly_json(
            geopoly_bbox(
                ${geopolyRegular(longitude, latitude, R, N)}
            )
        ), 
        '${corners[pos]}'
    )`;
};

const selectData = () => {
    const obj = {
        latitude: 0,
        longitude: 0,
        R: 111319.458 * 1,
        N: 4
    };

    const resTr = db.prepare(`SELECT t.id, t.longitude, t.latitude, t.desc  
    FROM t JOIN tr ON t.id = tr.t_id 
    WHERE 
        minX BETWEEN 
            ${jsonExt('minX', '@longitude', '@latitude', '@R', '@N')} AND 
            ${jsonExt('maxX', '@longitude', '@latitude', '@R', '@N')} AND 
        minY BETWEEN 
            ${jsonExt('minY', '@longitude', '@latitude', '@R', '@N')} AND 
            ${jsonExt('maxY', '@longitude', '@latitude', '@R', '@N')}`)
        .all(obj);

    const resTg = db.prepare(`SELECT t.id, t.longitude, t.latitude, t.desc 
    FROM t JOIN tg ON t.id = tg.t_id
    WHERE geopoly_within(
        tg._shape,
        geopoly_bbox(
            ${geopolyRegular('@longitude', '@latitude', '@R', '@N')}
        )
    )`).all(obj);

    console.log('rtree\n', resTr, '\ngeopoly\n', resTg);
}

const selectSome = () => {
    const res = db.prepare(`SELECT * FROM t LIMIT 10`).all();
    console.log(res);
}

// createTables();
// loadTable();
selectData();
//selectSome();