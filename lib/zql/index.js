import { 
    mainQueries, 
    facetQueries, 
    relatedQueries, 
    statsQueries,
    termFreqQuery,
    yearlyCounts
} from './queries/index.js';

import { validate, getQueryType } from './z-utils/index.js';

const zql = ({ fastify, resource, params, queryType }) => {
    //const queryType = getQueryType({ resource, params });
    fastify.zlog.info(fastify.zlog.prefix(), queryType);

    const { 
        runparams, 
        dropTmp,
        createTmp,
        createIndex,
        count, 
        full
    } = mainQueries({ fastify, resource, params, queryType });

    // the result datastructure to be returned
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
            // termFreq: '',
            // yearlyCounts: '',
            // related: {},
            // facets: {},
            // stats: {}
        },

        runparams
    };

    // get stats only if explicitly requested
    if (params.stats) {
        result.queries.stats = statsQueries(resource);
    }

    // get term frequency only if explicitly requested
    if (params.termFreq) {
        result.queries.termFreq = termFreqQuery;
    }

    // get yearlyCounts counts only if explicitly requested
    if (params.yearlyCounts) {
        if (queryType.isDb !== 'resourceId') {
            result.queries.yearlyCounts = yearlyCounts({
                resource, 
                params
            });
        }
    }

    // get related records only if explicitly requested
    if (params.relatedRecords) {

        // related records make sense only for a single treatment  
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
const preZql = ({ resource, searchparams }) => {
    const params = {};
    const sp = new URLSearchParams(searchparams);

    // https://stackoverflow.com/a/67111094/183692
    // Set will return only unique keys()
    new Set([...sp.keys()])
        .forEach(key => {
            params[key] = sp.getAll(key).length > 1 
            
                // get multiple values 
                ? sp.getAll(key) 
                
                // get single value 
                : sp.get(key);
        });
        
    const validated_params = validate({ resource, params });
    
    // if validation failed, no params are returned, so return false
    if (!validated_params) return false;

    return validated_params;
}

export { zql, preZql }