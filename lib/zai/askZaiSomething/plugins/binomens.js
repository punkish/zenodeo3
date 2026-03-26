import { sqlRunner } from '../../../dataFromZenodeo.js';
import { toBigrams } from '../utils/tokenizer.js';

export default {
    name: 'binomen',
    enabled: true,
    weight: 3,

    async run({ fastify, question, debug }) {
        const bigrams = toBigrams(question);

        const sql = `
            SELECT DISTINCT binomen 
            FROM binomens 
            WHERE LOWER(binomen) IN (@bigrams)
        `;

        const runparams = { bigrams };
        const { result, runtime } = sqlRunner(fastify, sql, runparams, 'all');

        const binomens = result ? result.map(r => r.binomen.toLowerCase()) : [];
        fastify.zlog.info(`Found ${binomens.length} binomens in ${runtime} ms`);
    
        return {
            binomens,
            debug: { 
                detectBinomens: { 
                    sql: utils.formatSql(sql, runparams), 
                    runtime 
                } 
            }
        };
    }
};