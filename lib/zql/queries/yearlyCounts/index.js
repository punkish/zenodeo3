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
        return `WITH t(year, num_of_records) AS (
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
        FROM t`
    }
}