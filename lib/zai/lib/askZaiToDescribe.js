import { sqlRunner } from '../../dataFromZenodeo.js';
import { formatSql } from '../../utils.js';

function askZaiToDescribe({ fastify, request, genus, species }) {
    
    // The data to be returned looks like this
    //
    // {
    //     "response": {
    //         "question": "Describe Leprosoma olcesii"
    //         "answer": "Leprosoma olcesii is…"
    //     },
    //     "debugInfo": {}
    // }
    // const question = `Describe ${genus} ${species}`;
    // fastify.zlog.info(`question: ${question}`);

    // This is what we will send back
    const response = {};
    const debugInfo = {};
    const sql = `
        SELECT 
            t.id AS treatments_id,
            t.treatmentId, 
            zenodoDep,
            treatmentTitle,
            articleTitle,
            articleAuthor,
            articleDOI,
            journalYear,
            j.journalTitle,
            publicationDate,
            status,
            speciesDesc 
        FROM 
            zai.speciesDescriptions z 
            JOIN treatments t ON z.treatmentId = t.treatmentId 
            JOIN journals j ON t.journals_id = j.id 
            JOIN genera g ON t.genera_id = g.id
            JOIN species s ON t.species_id = s.id
        WHERE 
            g.genus = @genus 
            AND s.species =  @species
    `;

    const res = sqlRunner({
        fastify,
        sql, 
        runparams: { genus, species }, 
        returnRows: 'many'
    });
    
    response.records = res.result;
    debugInfo.full = { 
        sql, 
        runtime: res.runtime
    }

    if (response.records) {
        debugInfo.images = {};
        const sql = `
            SELECT httpUri, captionText
            FROM images
            WHERE treatments_id = @treatments_id
        `;
        const formattedSql = formatSql(sql);

        response.records.forEach((record, index) => {

            // As a default, save the summary of the first record 
            // as the answer
            if (index === 0) {
                response.answer = record.speciesDesc;
            }

            // Update the answer with the summary of the record 
            // that is marked as a new species
            if (record.status === 'sp. nov.') {
                response.answer = record.speciesDesc;
            }

            const treatments_id = record.treatments_id;
            const { result, runtime } = sqlRunner({
                fastify,
                sql,
                runparams: { treatments_id },
                returnRows: 'many'
            });
            
            record.images = result;
            debugInfo.images[treatments_id] = { 
                sql: formattedSql, 
                runtime 
            }

        })

        response.count = response.records.length;
        //response.records = res.response.records;
    }

    return { response, debugInfo }
}

export { askZaiToDescribe }