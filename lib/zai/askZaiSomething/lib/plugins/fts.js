import { sendEvent } from "../utils.js";
import { sqlRunner } from "../../../../dataFromZenodeo.js";
import { formatSql } from "../../../../utils.js";

export const plugin = {
    name: 'fts',
    enabled: true,
    run: function(fastify, question, raw) {
        sendEvent(raw, 'status', { 
            step: 'fts', 
            message: 'Searching for treatments with FTS' 
        });
        
        if (question.slice(-1) === '?') {
            question = question.substring(0, question.length - 1);
        }

        const where = question.split(/ /).join(' OR ');
        const sql = `
            SELECT DISTINCT 
                t.id AS treatments_id, 
                fts.rank AS rank
            FROM 
                treatmentsFts fts
                JOIN treatment_chunks tc ON fts.rowid = tc.id
                JOIN treatments t ON tc.treatments_id = t.id
            WHERE fts.fulltext MATCH @where
            ORDER BY rank 
            LIMIT @limit
        `;

        const runparams = { where, limit: 100 };
        const { result, runtime } = sqlRunner(
            fastify, 
            sql, 
            runparams, 
            'all'
        );
        fastify.zlog.info(`FTS5 search found ${result.length} treatments in ${runtime} ms`);

        sendEvent(raw, 'status', { 
            step: 'fts', 
            message: `identified ${result.length} treatments` 
        });

        const treatments_ids = result.map(r => r.treatments_id);
        return {
            treatments_ids,
            debug: { 
                ftsDebug: {
                    sql: formatSql(sql, runparams), 
                    runtime
                }
            }
        }

        
    }
}