export const yearlyCounts = (resource) => {

    if (resource === 'images') {
        return `WITH t(year, num_of_records) AS (
            SELECT 
                strftime(
                    '%Y', 
                    treatments.checkinTime/1000, 
                    'unixepoch'
                ) AS year, 
                Count(DISTINCT images.id) AS num_of_records 
            FROM images JOIN treatments ON images.treatments_id = treatments.id 
            WHERE treatments.id IN (SELECT treatments_id FROM tmp)
            GROUP BY year
            ORDER BY year ASC
        )
        SELECT 
            Row_number() OVER (ORDER BY year) AS row_num,
            year, 
            num_of_records,
            Sum(num_of_records) OVER (ORDER BY year) AS cum_count
        FROM t`
    }
    else if (resource === 'treatments') {
        return `WITH t(year, num_of_records) AS (
            SELECT 
                strftime(
                    '%Y', 
                    treatments.checkinTime/1000, 
                    'unixepoch'
                ) AS year, 
                Count(treatments.id) AS num_of_records 
            FROM treatments  
            WHERE treatments.id IN (SELECT treatments_id FROM tmp)
            GROUP BY year
            ORDER BY year ASC
        )
        SELECT 
            Row_number() OVER (ORDER BY year) AS row_num,
            year, 
            num_of_records,
            Sum(num_of_records) OVER (ORDER BY year) AS cum_count
        FROM t`;
    }
    else if (resource === 'species') {
        return `WITH t(year, num_of_records) AS (
            SELECT 
                strftime('%Y', treatments."checkinTime"/1000, 'unixepoch') AS year, 
                Count(DISTINCT species."id") AS num_of_records 
            FROM treatments JOIN species  
                ON treatments.species_id = species.id 
            WHERE treatments.id IN (SELECT treatments_id FROM tmp)
            GROUP BY year
            ORDER BY year ASC
        )
        SELECT 
            Row_number() OVER (ORDER BY year) AS row_num,
            year, 
            num_of_records,
            Sum(num_of_records) OVER (ORDER BY year) AS cum_count
        FROM t`
    }
    else if (resource === 'journals') {
        return `WITH t(year, num_of_records) AS (
            SELECT 
                strftime('%Y', treatments."checkinTime"/1000, 'unixepoch') AS year, 
                Count(DISTINCT journals."id") AS num_of_records 
            FROM treatments JOIN journals  
                ON treatments.journals_id = journals.id 
            WHERE treatments.id IN (SELECT treatments_id FROM tmp)
            GROUP BY year
            ORDER BY year ASC
        )
        SELECT 
            Row_number() OVER (ORDER BY year) AS row_num,
            year, 
            num_of_records,
            Sum(num_of_records) OVER (ORDER BY year) AS cum_count
        FROM t`
    }
    else if (resource === 'materialCitations') {
        return `WITH t(year, num_of_records) AS (
            SELECT 
                strftime('%Y', treatments."checkinTime"/1000, 'unixepoch') AS year, 
                Count(materialCitations."id") AS num_of_records 
            FROM treatments JOIN materialCitations  
                ON treatments.id = materialCitations.treatments_id 
            WHERE treatments.id IN (SELECT treatments_id FROM tmp)
            GROUP BY year
            ORDER BY year ASC
        )
        SELECT 
            Row_number() OVER (ORDER BY year) AS row_num,
            year, 
            num_of_records,
            Sum(num_of_records) OVER (ORDER BY year) AS cum_count
        FROM t`
    }
}