import { getWhere } from "../../queryMaker/index.js";

export function zaiSummaryQuery(resource, request) {
    const full = `
    SELECT 
        treatments.id AS treatments_id, 
        treatments.treatmentId, 
        treatments.treatmentTitle, 
        treatments.zenodoDep, 
        treatments.articleTitle, 
        treatments.articleAuthor, 
        treatments.articleDOI, 
        treatments.publicationDate AS publicationDate, 
        treatments.status, 
        zai.summary 
    FROM 
        treatments 
        JOIN genera ON treatments.genera_id = genera.id 
        JOIN species ON treatments.species_id = species.id 
        JOIN zai.treatments AS zai ON treatments_id = zai.id
    WHERE 
        genera.genus = @genus COLLATE NOCASE
        AND species.species = @species COLLATE NOCASE
    LIMIT 1`;

    const { constraints, runparams } = getWhere(resource, request);
    return { full, runparams }
}
