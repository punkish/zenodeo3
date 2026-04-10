import { sendEvent, queryToBigrams } from "../utils.js";
import { sqlRunner } from "../../../../dataFromZenodeo.js";
import { formatSql } from "../../../../utils.js";

function IdentifyTreatmentsByTreatmentAuthors(fastify, bigrams, raw) {
    sendEvent(raw, 'status', { 
        step: 'treatmentAuthors', 
        message: 'Detecting treatment authors' 
    });

    // First, we build a sql clause for names to MATCH names loosely. 
    // For example, we want 'donat agosti' to MATCH 'donat agosti' or 
    // 'agosti, donat' (case-insensitive). Wrapping each bigram into  
    // parentheses allows such a match.
    // 
    // select treatmentAuthor 
    // from treatmentAuthorsFts 
    // where treatmentAuthor match '(jeremy gauthier) OR (donat agosti)';
    //
    // const ftsQuery = `(${bigram1}) OR (${bigram2}) OR (${bigram3})`;

    const runparams = bigrams.map(bigram => `(${bigram})`).join(' OR ');
    const sql = `
        SELECT treatments_id, treatmentAuthor
        FROM treatmentAuthorsFts 
        WHERE treatmentAuthor MATCH ?
    `;

    const { result, runtime } = sqlRunner(fastify, sql, runparams, 'all');
    const treatmentAuthors = new Map();
    const treatments_ids = [];
    
    if (result) {
        result.forEach(r => {
            treatmentAuthors.set(r.treatmentAuthor, 1);
            treatments_ids.push(r.treatments_id);
        });
    }

    fastify.zlog.info(`Found ${treatmentAuthors.size} authors of ${treatments_ids.length} treatments in ${runtime} ms`);
    
    sendEvent(raw, 'status', { 
        step: 'treatmentAuthors', 
        message: `found ${treatmentAuthors.size} authors of ${treatments_ids.length} treatments` 
    });
    
    return {
        treatments_ids,
        debugInfo: { 
            sql: formatSql(sql, runparams), 
            runtime
        }
    };
}

export const plugin = {
    name: 'treatmentAuthors',
    enabled: true,
    run: function(fastify, question, raw) {
        
        // First, let's convert the query to bigrams
        const bigrams = queryToBigrams(question);

        // Now that we have bigrams, let's identify treatments for these
        const { 
            treatments_ids, 
            debugInfo: debugIdentifyTreatmentsByTreatmentAuthors 
        } = IdentifyTreatmentsByTreatmentAuthors(fastify, bigrams, raw);
        
        return {
            treatments_ids,
            debugIdentifyTreatmentsByTreatmentAuthors
        }
    }
}