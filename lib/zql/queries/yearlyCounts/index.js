export const yearlyCounts = (constraints) => {
    
    const constraint = constraints.length
        ? 'WHERE treatments.id IN (SELECT treatments_id FROM tmp)'
        : '';

    return `SELECT 
    strftime(
        '%Y', 
        treatments.checkinTime/1000, 
        'unixepoch'
    ) AS year, 
    Count(DISTINCT images.id) AS num_of_images,
    Count(DISTINCT treatments.id) AS num_of_treatments,
    Count(DISTINCT species.id) AS num_of_species,
    Count(DISTINCT journals.id) AS num_of_journals
FROM 
    images  
    JOIN treatments ON images.treatments_id = treatments.id 
    JOIN species ON treatments.species_id = species.id  
    JOIN journals ON treatments.journals_id = journals.id
${constraint}
GROUP BY year
ORDER BY year ASC`
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ');
}