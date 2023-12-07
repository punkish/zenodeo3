'use strict';

import { initDb } from '../dbconn.js';
const db = initDb();
//const queries = db.queries;

import { validate } from './queryMaker/utils.js';
import { 
    mainQueries, 
    facetQueries, 
    relatedQueries, 
    statsQueries,
    termFreqQueries
} from './queries/index.js';

const zql = ({ resource, params }) => {
    
    // 
    // validated params are different from the params submitted via the REST 
    // query, so we save the original params for use later
    //
    const origParams = JSON.parse(JSON.stringify(params));
    params = validate({ resource, params });
    
    // 
    // if validation failed, no params are returned, so return false
    // 
    if (!params) return false;

    const { 
        runparams, 
        count, 
        full
    } = mainQueries({ resource, params, origParams });

    // 
    // the result datastructure to be returned
    //
    const result = {
        queries: {
            count
            
            //*****************************/
            // the following will be created as requested
            //*****************************/
            // full,
            // related: {},
            // facets: {},
            // stats: {}
        },

        runparams
    };

    if (full) result.queries.full = full;
    // if (stats) result.queries.stats = stats;
    // if (termFreq) result.queries.termFreq = termFreq;

    //  
    // get stats only if explicitly requested
    //
    if (params.stats) {
        result.queries.stats = statsQueries(resource);
    }

    //  
    // get term frequency only if explicitly requested
    //
    if (params.termFreq) {
        result.queries.termFreq = termFreqQueries(resource);
    }

    //  
    // get related records only if explicitly requested
    //
    if (params.relatedRecords) {

        // 
        // related records make sense only for a single treatment  
        // 
        if (resource === 'treatments' && ('treatmentId' in params)) {
            result.queries.related = {};

            const treatmentId = params.treatmentId;
            const relatedResources = [
                'bibRefCitations',
                'figureCitations',
                'materialCitations',
                'treatmentCitations',
                'treatmentAuthors'
            ];
        
            relatedResources.forEach(resource => {
                const params = { treatmentId };
                const sql = relatedQueries({ resource, params });
                result.queries.related[resource] = sql;
            });
        }
    }

    // 
    // get facets only if explicitly requested
    //
    if (params.facets) {
        result.queries.facets = facetQueries(resource);
    }

    return { 
        queries: result.queries, 
        runparams 
    };
}

/**
 * preZql() is used only when testing zql from the command line or via a 
 * testing framework such as jest or tap. preZql() converts the querystring 
 * to URLSearchParams, which is what zql() expects.
 */
const preZql = ({ resource, searchparams }) => {
    const params = {};
    const sp = new URLSearchParams(searchparams);

    //
    // https://stackoverflow.com/a/67111094/183692
    // Set will return only unique keys()
    //
    new Set([...sp.keys()])
        .forEach(key => {
            params[key] = sp.getAll(key).length > 1 
            
                //
                // get multiple values 
                //
                ? sp.getAll(key) 
                
                //
                // get single value 
                //
                : sp.get(key);
        });
        
    // @ts-ignore
    const { queries, runparams } = zql({ resource, params });
    return { queries, runparams };
}

export { zql, preZql }