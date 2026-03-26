import { sqlRunner } from '../../../dataFromZenodeo.js';
import { toBigrams } from '../utils/tokenizer.js';

export default {
    name: 'treatmentAuthor',
    enabled: true,
    weight: 2,

    async run({ fastify, question }) {
        const bigrams = toBigrams(question);

        const sql = `
            SELECT DISTINCT treatmentAuthor
            FROM treatmentAuthors ta
                JOIN treatments t ON ta.treatments_id = t.id
            WHERE LOWER(treatmentAuthor) IN (@bigrams)
        `;
        const runparams = { bigrams };
        const { result, runtime } = sqlRunner(fastify, sql, runparams, 'all');
        const treatmentAuthors = result 
            ? result.map(r => r.treatmentAuthor.toLowerCase()) 
            : [];
        fastify.zlog.info(`Found ${treatmentAuthors.length} treatmentAuthors in ${runtime} ms`);
    
        return {
            treatmentAuthors,
            debug: { 
                detectTreatmentAuthors: { 
                    sql: utils.formatSql(sql, runparams), 
                    runtime 
                } 
            }
        };
    }
};