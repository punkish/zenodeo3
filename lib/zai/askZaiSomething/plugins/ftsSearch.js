import { sqlRunner } from '../../../dataFromZenodeo.js';

export default {
    name: 'ftsSearch',
    enabled: true,
    weight: 1,

    async run({ fastify, question }) {
        const query = question.replace(/\?/g, '').split(/\s+/).join(' OR ');

        const sql = `
            SELECT DISTINCT 
                t.id AS treatments_id, 
                fts.rank AS rank
            FROM 
                treatmentsFts fts
                JOIN treatment_chunks tc ON fts.rowid = tc.id
                JOIN treatments t ON tc.treatments_id = t.id
            WHERE fts.fulltext MATCH @query
            ORDER BY rank 
            LIMIT @limit
        `;
        const runparams = { query, limit: 100 };
        const { result, runtime } = sqlRunner(
            fastify, 
            searchSql, 
            runparams, 
            'all'
        );
        fastify.zlog.info(`FTS5 search found ${result.length} treatments in ${runtime} ms`);

        candidateTreatments = result.map(r => r.treatments_id);
        debugInfo.fts = { 
            sql: utils.formatSql(searchSql, runparams), 
            runtime 
        };
    }
};