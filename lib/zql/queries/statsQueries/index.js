import { ddutils } from "../../../../data-dictionary/utils/index.js";

export const statsQueries = ({ tables, constraints }) => {
    const entities = [
        { tb: 'treatments',         pk: 'treatmentId'         },
        { tb: 'materialCitations',  pk: 'materialCitationId'  },
        { tb: 'figureCitations',    pk: 'figureCitationId'    },
        { tb: 'treatmentCitations', pk: 'treatmentCitationId' },
        { tb: 'bibRefCitations',    pk: 'bibRefCitationId'    },
        { tb: 'treatmentAuthors',   pk: 'treatmentAuthorId'   }
    ];
    
    const stats = {
        charts: {}
    };

    for (let i = 0, j = entities.length; i < j; i++) {
        const tb = entities[i].tb;
        const pk = entities[i].pk;

        const t = JSON.parse(JSON.stringify(tables));
        const c = JSON.parse(JSON.stringify(constraints));
        
        if (tb !== 'treatments') {
            t.push(`JOIN ${tb} ON ${tb}.treatmentId = treatments.treatmentId`);
        }

        const obj = {
            columns: [ 
                'treatments.checkInYear', 
                `Count(DISTINCT ${tb}.${pk}) AS num` 
            ],
            tables: t,
            constraints: c,
            group: 1
        }

        stats.charts[tb] = getSql(obj);
    }

    /**
     * now lets make the SQL for locations
     */
    const t = JSON.parse(JSON.stringify(tables));
    const c = JSON.parse(JSON.stringify(constraints));
    
    /** 
     * We need to modify 'tables' but not the constraints.
     * 'tables' need to be modified *only* if they don't 
     * already contain 'materialCitations'
     */
    if (t.filter(e => e.search(/materialCitations/) === -1)) {

        /**
         * OK, t doesn't have 'materialCitations', but let's check 
         * if t has 'treatments' as that will provide a path to 
         * JOINing with 'materialCitations'
         */
        if (t.filter(e => e.search(/treatments/) > -1)) {
            t.push('JOIN materialCitations ON treatments.treatmentId = materialCitations.treatmentId');
        }
        else {

            /**
             * 't' doesn't have 'treatments', so we have to JOIN with 
             * 'materialCitations' via 'treatments' JOINed to the 
             * main resource table, that is, the first table in 't'
             */
            const { resourceId, resourceIdName } = ddutils.getResourceId;

            t.push(`JOIN treatments ON ${resourceId} = treatments.treatmentId`);
            t.push('JOIN materialCitations ON treatments.treatmentId = materialCitations.treatmentId');
        }
    }
    
    const obj = {
        columns: [
            'materialCitations.country',
            'Count(materialCitations.materialsCitationId) AS num'
        ],

        /**
         * remove duplicates from t
         * https://stackoverflow.com/a/15868720
         */
        tables: [ ...new Set(t) ],
        constraints: c,
        limit: 10,
        offset: 0,
        sortorder: [ 'num DESC' ],
        group: 'country'
    }

    stats.locations = getSql(obj);

    return stats;
}