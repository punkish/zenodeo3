import { getWhere } from "../../queryMaker/index.js";
import { makeSql } from "./utils.js";

export function zaiSummaryQuery(resource, request) {
    const cols = [ 
        'treatments.id AS treatments_id', 
        'treatments.treatmentId', 
        'treatments.treatmentTitle', 
        'treatments.zenodoDep', 
        'treatments.articleTitle', 
        'treatments.articleAuthor', 
        'treatments.articleDOI', 
        'treatments.publicationDate AS publicationDate', 
        'treatments.status', 
        'zai.summary'
    ];
    const tables = [
        'treatments',
        'JOIN genera ON treatments.genera_id = genera.id',
        'JOIN species ON treatments.species_id = species.id',
        'JOIN zai.treatments AS zai ON treatments_id = zai.id'
    ];
    const constraints = [
        'genera.genus = @genus COLLATE NOCASE',
        'species.species = @species COLLATE NOCASE'
    ];
    const limit = 1;
    const { runparams } = getWhere(resource, request);

    return { 
        full: makeSql({ cols, tables, constraints, limit }), 
        runparams 
    }
}
