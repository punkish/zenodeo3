// How can I get multiple counts with one SQL query?
// https://stackoverflow.com/a/12789493/183692

export const termFreqQuery = `SELECT 
        journalYear, 
        Count(doc) AS total,
        Sum(
            CASE 
                WHEN images.httpUri IS NOT NULL 
                THEN 1 
                ELSE 0 
            END
        ) AS withImages
    FROM 
        treatmentsFtvins JOIN 
        treatments ON treatmentsFtvins.doc = treatments.id LEFT JOIN 
        images ON treatmentsFtvins.doc = images.treatments_id
    WHERE journalYear != '' AND term = @q
    GROUP BY journalYear
    ORDER BY journalYear ASC`.replace(/\n/g, ' ').replace(/\s+/g, ' ');