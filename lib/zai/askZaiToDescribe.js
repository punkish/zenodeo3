import { sqlRunner, getTreatments } from '../dataFromZenodeo.js';
import { formatSql } from '../utils.js';
import { addImagesToTreatments } from './lib/index.js';

/**
 * @param {Object} fastify - An instance of Fastify.
 * @param {string} genus - Genus.
 * @param {string} species - Species.
 */
function askZaiToDescribe(fastify, genus, species) {
    const { response, debugInfo } = getSpeciesDesc(fastify, genus, species);

    if (response.treatments.length) {
        const removeField = 'speciesDesc';
        const { treatments, debug: imagesDebug } = addImagesToTreatments(
            fastify, 
            removeField, 
            response.treatments
        );

        return {
            response: { ...response, treatments },
            debugInfo: { ...debugInfo, images: imagesDebug }
        };
    }

    return { response, debugInfo };
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