export const yearlyCounts = (resource) => {
    
    if (resource === 'images') {
        return `WITH t(year, num_of_records) AS (
            SELECT 
                strftime('%Y', treatments."checkinTime"/1000, 'unixepoch') AS year, 
                Count(DISTINCT images."id") AS num_of_records 
            FROM images JOIN treatments ON images.treatments_id = treatments.id 
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
        const sql_treatments = `WITH t(year, num_of_records) AS (
            SELECT 
                strftime('%Y', treatments."checkinTime"/1000, 'unixepoch') AS year, 
                Count(treatments."id") AS num_of_records 
            FROM treatments  
            GROUP BY year
            ORDER BY year ASC
        )
        SELECT 
            Row_number() OVER (ORDER BY year) AS row_num,
            year, 
            num_of_records,
            Sum(num_of_records) OVER (ORDER BY year) AS cum_count
        FROM t`;

        // const sql_articles = `WITH t(year, num_of_records) AS (
        //     SELECT 
        //         strftime('%Y', treatments."checkinTime"/1000, 'unixepoch') AS year, 
        //         Count(DISTINCT treatments.articleId) AS num_of_records 
        //     FROM treatments    
        //     GROUP BY year
        //     ORDER BY year ASC
        // )
        // SELECT 
        //     Row_number() OVER (ORDER BY year) AS row_num,
        //     year, 
        //     num_of_records,
        //     Sum(num_of_records) OVER (ORDER BY year) AS cum_count
        // FROM t`;

        //return { sql_treatments, sql_articles };
        return sql_treatments;
    }
    else if (resource === 'species') {
        return `WITH t(year, num_of_records) AS (
            SELECT 
                strftime('%Y', treatments."checkinTime"/1000, 'unixepoch') AS year, 
                Count(DISTINCT species."id") AS num_of_records 
            FROM treatments JOIN species  
                ON treatments.species_id = species.id   
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