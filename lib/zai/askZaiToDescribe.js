import { sqlRunner, getTreatments } from '../dataFromZenodeo.js';
import { formatSql } from '../utils.js';
import { addImagesToTreatments } from './lib/index.js';

/**
 * @param {Object} fastify - An instance of Fastify.
 * @param {string} genus - Genus.
 * @param {string} species - Species.
 */
function askZaiToDescribe(fastify, genus, species) {
    const reply = getSpeciesDesc(fastify, genus, species);

    if (reply.response.treatments.length) {
        const question = null;
        const removeField = 'speciesDesc';
        addImagesToTreatments(fastify, removeField, reply);
    }

    return reply;
}

function getSpeciesDesc(fastify, genus, species) {
    const sql = getTreatments({ byGenusSpecies: true })
    const runparams = { 
        genus: genus.toLowerCase(),
        species: species.toLowerCase()
    };
    
    const { result, runtime } = sqlRunner(fastify, sql, runparams, 'all');

    const newSpecies = result.find(r => r.status === 'sp. nov.');
    const response = {
        answer: newSpecies ? newSpecies.speciesDesc : result[0].speciesDesc,
        treatments: result,
        model: 'llama3.2:latest'
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