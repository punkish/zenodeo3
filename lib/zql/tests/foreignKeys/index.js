export const sampleQueries = [
    {
        desc: `count`,
        input: {
            resource: 'genera',
            searchparams: 'cols='
        },
        output: {
            "queries": {
                "count": `SELECT Count(*) AS num_of_records FROM genera`,

                "full": null
            },
            "runparams": {},
            "num_of_records": 85480
        }
    },

    {
        desc: 'genus',
        input: {
            resource: 'genera',
            searchparams: 'genus=tet*'
        },
        output: {
            "queries": {
                "count": `SELECT Count(*) AS num_of_records FROM genera`,

                "full": null
            },
            "runparams": {},
            "num_of_records": 85480
        }
    }
]