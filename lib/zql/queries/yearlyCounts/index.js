export function yearlyCounts (resource, request, queries) {    
    const constraint = queries.createTmp ? true : false;
    return makeSql(resource.name, constraint);
}

function makeSql(resourceName, constraint=false) {
    const select = `SELECT
    strftime('%Y', treatments.checkinTime/1000, 'unixepoch') AS year,
    Count(DISTINCT images.id) AS num_of_images,
    Count(DISTINCT treatments.id) AS num_of_treatments,
    Count(DISTINCT species.id) AS num_of_species,
    Count(DISTINCT journals.id) AS num_of_journals`;

    const fromImages = `FROM
    images
    JOIN treatments ON images.treatments_id = treatments.id`;

    const fromTreatments = `FROM
    treatments
    LEFT JOIN images ON treatments.id = images.treatments_id`;

    const fromJoin = `JOIN species ON treatments.species_id = species.id
    JOIN journals ON treatments.journals_id = journals.id`;

    const groupby = `GROUP BY year
ORDER BY year ASC`;

    const where = `WHERE 
    treatments.id IN (SELECT treatments_id FROM tmp)
`;

    const sql = [ select ];

    if (resourceName === 'images') {
        sql.push(fromImages);
    }
    else if (resourceName === 'treatments') {
        sql.push(fromTreatments);
    }

    sql.push(fromJoin);

    if (constraint) {
        sql.push(where);
    }

    sql.push(groupby);
    return sql.join('\n');
}