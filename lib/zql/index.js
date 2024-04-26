'use strict';

// import { initDb } from '../dbconn.js';
// const db = initDb();

import { validate } from './queryMaker/utils.js';

import { 
    mainQueries, 
    facetQueries, 
    relatedQueries, 
    statsQueries,
    termFreqQueries,
    yearlyCounts
} from './queries/index.js';

import { getWhere } from './queryMaker/index.js';
import { ddutils } from "../../data-dictionary/utils/index-ng.js";
import { getQueryType } from './z-utils.js';


const zql = ({ resource, params }) => {
    
    // get resourceParams that can be used for mulitple operations
    const resourceParams = ddutils.getParams(resource);
    
    const getQueryStringSchema = ddutils.getQueryStringSchema(
        resource, 
        resourceParams
    );

    params = validate({ resource, params, getQueryStringSchema });
    
    // if validation failed, no params are returned, so return false
    // 
    if (!params) return false;

    const resourceId = resourceParams
        .filter(col => col.isResourceId)[0] || 'none';

    const queryType = getQueryType({ resource, params, resourceId });

    const { 
        runparams, 
        dropTmp,
        createTmp,
        createIndex,
        count, 
        full
    } = mainQueries({ 
        resource, params, resourceParams, queryType, resourceId 
    });

    // the result datastructure to be returned
    //
    const result = {
        queries: {
            dropTmp,
            createTmp,
            createIndex,
            count,
            full
            
            //*****************************/
            // the following will be created as requested
            //*****************************/
            // yearlyCounts: '',
            // related: {},
            // facets: {},
            // stats: {}
        },

        runparams
    };

    // get stats only if explicitly requested
    //
    if (params.stats) {
        result.queries.stats = statsQueries(resource);
    }

    // get term frequency only if explicitly requested
    //
    if (params.termFreq) {
        result.queries.termFreq = termFreqQueries(resource);
    }

    // get yearlyCounts counts only if explicitly requested
    //
    if (params.yearlyCounts) {

        if (queryType === 'bare' || queryType === 'normal') {
            const { constraints, runparams } = getWhere({ 
                resource, params, resourceParams, resourceId 
            });

            result.queries.yearlyCounts = yearlyCounts(constraints);
        }

    }

    // get related records only if explicitly requested
    //
    if (params.relatedRecords) {

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

// preZql() is used only when testing zql from the command line or via a 
// testing framework such as jest or tap. preZql() converts the querystring 
// to URLSearchParams, which is what zql() expects.
// 
const preZql = ({ resource, searchparams }) => {
    
    const params = {};
    const sp = new URLSearchParams(searchparams);

    // https://stackoverflow.com/a/67111094/183692
    // Set will return only unique keys()
    //
    new Set([...sp.keys()])
        .forEach(key => {
            params[key] = sp.getAll(key).length > 1 
            
                // get multiple values 
                //
                ? sp.getAll(key) 
                
                // get single value 
                //
                : sp.get(key);
        });
        
    // const { queries, runparams } = zql({ resource, params });
    // return { queries, runparams, params };
    return params;
}

export { zql, preZql }