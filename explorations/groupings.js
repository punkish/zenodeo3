groupings

SELECT 
    strftime('%Y', treatments."checkinTime"/1000, 'unixepoch') AS year, 
    Count(DISTINCT images."id") AS num_of_records 
FROM images JOIN treatments ON images.treatments_id = treatments.id 
GROUP BY year
ORDER BY year ASC;

SELECT 
    strftime('%Y', treatments."checkinTime"/1000, 'unixepoch') AS year, 
    strftime('%m', treatments."checkinTime"/1000, 'unixepoch') AS month,
    Count(DISTINCT images."id") AS num_of_records 
FROM images JOIN treatments ON images.treatments_id = treatments.id 
GROUP BY year, month
ORDER BY year, month ASC;

SELECT 
    strftime('%Y', treatments."checkinTime"/1000, 'unixepoch') AS year, 
    (strftime('%m', treatments."checkinTime"/1000, 'unixepoch') + 2) / 3 AS quarter,
    Count(DISTINCT images."id") AS num_of_records 
FROM images JOIN treatments ON images.treatments_id = treatments.id 
GROUP BY year, quarter
ORDER BY year, quarter ASC;

SELECT
    strftime('%Y', treatments."checkinTime"/1000, 'unixepoch') AS year, 
    (strftime('%m', treatments."checkinTime"/1000, 'unixepoch') + 2) / 3 AS quarter,
    Count(DISTINCT images."id") AS num_of_records 
FROM (
    SELECT DISTINCT strftime('%Y', treatments."checkinTime"/1000, 'unixepoch'), 
    (strftime('%m', treatments."checkinTime"/1000, 'unixepoch') + 2) / 3 
    FROM treatments
) as t
LEFT JOIN MyTable as r On (r.Date < t.Date)
Group By t.Date;

WITH t1(row_num, year, quarter, num_of_records) AS (
    WITH t(year, quarter, num_of_records) AS (
        SELECT 
            strftime('%Y', treatments."checkinTime"/1000, 'unixepoch') AS year, 
            (strftime('%m', treatments."checkinTime"/1000, 'unixepoch') + 2) / 3 AS quarter,
            Count(DISTINCT images."id") AS num_of_records 
        FROM images JOIN treatments ON images.treatments_id = treatments.id 
        GROUP BY year, quarter
        ORDER BY year, quarter ASC
    )
    SELECT 
        Row_number() OVER (ORDER BY year, quarter) AS row_num,
        year, 
        quarter, 
        num_of_records
    FROM t
)
SELECT 
    row_num, 
    year, 
    quarter, 
    num_of_records, 
    Sum(num_of_records) OVER (ORDER BY year, quarter) AS cum_count
FROM t1 
GROUP BY year, quarter, num_of_records;

WITH t1(row_num, year, quarter, num_of_records, cum_count) AS (
    WITH t(year, quarter, num_of_records) AS (
        SELECT 
            strftime('%Y', treatments."checkinTime"/1000, 'unixepoch') AS year, 
            (strftime('%m', treatments."checkinTime"/1000, 'unixepoch') + 2) / 3 AS quarter,
            Count(DISTINCT images."id") AS num_of_records 
        FROM images JOIN treatments ON images.treatments_id = treatments.id 
        GROUP BY year, quarter
        ORDER BY year, quarter ASC
    )
    SELECT 
        Row_number() OVER (ORDER BY year, quarter) AS row_num,
        year, 
        quarter, 
        num_of_records,
        Sum(num_of_records) OVER (ORDER BY year, quarter) AS cum_count
    FROM t
)
SELECT 
    row_num, 
    year, 
    quarter, 
    num_of_records, 
    cum_count
FROM t1;

-- year
WITH t(year, num_of_records) AS (
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
FROM t;

-- year, quarter
WITH t(year, quarter, num_of_records) AS (
    SELECT 
        strftime('%Y', treatments."checkinTime"/1000, 'unixepoch') AS year, 
        (strftime('%m', treatments."checkinTime"/1000, 'unixepoch') + 2) / 3 AS quarter,
        Count(DISTINCT images."id") AS num_of_records 
    FROM images JOIN treatments ON images.treatments_id = treatments.id 
    GROUP BY year, quarter
    ORDER BY year, quarter ASC
)
SELECT 
    Row_number() OVER (ORDER BY year, quarter) AS row_num,
    year, 
    quarter, 
    num_of_records,
    Sum(num_of_records) OVER (ORDER BY year, quarter) AS cum_count
FROM t;

-- treatments over the years
WITH t(year, num_of_records) AS (
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
FROM t;