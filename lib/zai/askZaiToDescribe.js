import { sqlRunner } from '../dataFromZenodeo.js';
import { formatSql } from '../utils.js';
import { addImagesToTreatments } from './lib/index.js';

/**
 * @param {Object} fastify - An instance of Fastify.
 * @param {string} genus - Genus.
 * @param {string} species - Species.
 */
function askZaiToDescribe(fastify, genus, species) {
    const reply = getSpeciesDesc(fastify, genus, species);

    if (reply.response.treatmentsByBinomens.length) {
        const question = null;
        const removeField = 'speciesDesc';
        addImagesToTreatments(fastify, question, removeField, reply);
    }

    return reply;
}

function getSpeciesDesc(fastify, genus, species) {
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

    const returnRows = 'all';
    const runparams = { genus, species };
    const { result, runtime } = sqlRunner(fastify, sql, runparams, returnRows);

    const newSpecies = result.find(r => r.status === 'sp. nov.');
    const response = {
        answer: newSpecies ? newSpecies.speciesDesc : result[0].speciesDesc,
        treatmentsByBinomens: [
            { binomen: `${genus} ${species}`, treatments: result }
        ]
    }

    const debugInfo = {
        getSpeciesDesc: { 
            sql: formatSql(sql, runparams), 
            runtime 
        }
    }

    return { response, debugInfo }
}

export { askZaiToDescribe }