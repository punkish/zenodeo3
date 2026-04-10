import { sendEvent, queryToBigrams } from "../utils.js";
import { sqlRunner } from "../../../../dataFromZenodeo.js";
import { formatSql } from "../../../../utils.js";

function detectBinomens(fastify, bigrams, raw) {
    sendEvent(raw, 'status', { 
        step: 'binomens', 
        message: 'Detecting binomens' 
    });

    const sql = `
        SELECT DISTINCT Lower(Trim(binomen)) AS binomen
        FROM binomens 
        WHERE Lower(binomen) IN (@bigrams)
    `;
    const runparams = { bigrams };
    const { result, runtime } = sqlRunner(fastify, sql, runparams, 'all');
    const binomens = result ? result.map(r => r.binomen) : [];
    fastify.zlog.info(`Found ${binomens.length} binomens in ${runtime} ms`);

    sendEvent(raw, 'status', { 
        step: 'binomens', 
        message: `found ${binomens.length}` 
    });

    return {
        binomens,
        debugInfo: { 
            sql: formatSql(sql, runparams), 
            runtime
        }
    };
}

function identifyTreatmentsByBinomens(fastify, binomens, raw) {
    sendEvent(raw, 'status', { 
        step: 'binomens', 
        message: 'locating related treatments' 
    });

    // First, we build a sql clause with genus and species, and the 
    // params for running this query
    const runparams = {};
    const where = binomens.map((binomen, index) => {
        const [ genus, species ] = binomen.split(/\s+/);
        const id = index + 1;
        runparams[`genus${id}`] = genus;
        runparams[`species${id}`] = species;

        return `(Lower(g.genus) = @genus${id} AND Lower(s.species) = @species${id})`;
    }).join(' OR ');

    const sql = `
        SELECT t.id
        FROM treatments t
            JOIN genera g ON t.genera_id = g.id
            JOIN species s ON t.species_id = s.id
        WHERE ${where} 
        LIMIT 10
    `;

    const { result, runtime } = sqlRunner(fastify, sql, runparams, 'all');
    const treatments_ids = result ? result.map(r => r.id) : [];
    fastify.zlog.info(`Found ${treatments_ids.length} treatments in ${runtime} ms`);

    sendEvent(raw, 'status', { 
        step: 'binomens', 
        message: `identified ${result.length}` 
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
    name: 'binomens',
    enabled: true,
    run: function(fastify, question, raw) {
        
        // First, let's convert the query to bigrams
        const bigrams = queryToBigrams(question);

        // First, let's find out if any of the bigrams are really binomens
        const { 
            binomens, 
            debugInfo: debugDetectBinomens 
        } = detectBinomens(fastify, bigrams, raw);

        if (!binomens.length) {
            return { treatments_ids: [], debugDetectBinomens };
        }

        // Now that we have binomens, let's identify treatments for these
        const {
            treatments_ids, 
            debugInfo: debugIdentifyTreatmentsByBinomens 
        } = identifyTreatmentsByBinomens(fastify, binomens, raw);
        
        return {
            treatments_ids,
            debugDetectBinomens,
            debugIdentifyTreatmentsByBinomens
        }
    }
}