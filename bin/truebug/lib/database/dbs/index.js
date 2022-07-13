// const treatments = require('./treatments/treatments');
// const treatmentcitations = require('./treatments/treatmentcitations');
// const treatmentauthors = require('./treatments/treatmentauthors');
// const bibrefcitations = require('./treatments/bibrefcitations');
// const figurecitations = require('./treatments/figurecitations');
// const materialscitations = require('./treatments/materialscitations');
// const stats = require('./stats/stats');

const parts = {
    treatments: [
        require('./treatments/treatments'),
        require('./treatments/treatmentcitations'),
        require('./treatments/treatmentauthors'),
        require('./treatments/bibrefcitations'),
        require('./treatments/figurecitations'),
        require('./treatments/materialscitations'),
        require('./treatments/treatmentimages')
    ],
    stats: [
        require('./stats/stats')
    ]
}

const dbs = {};
for (let [db, value] of Object.entries(parts)) {
    dbs[db] = { tables: [], indexes: [] };

    value.forEach(d => {
        dbs[db].tables.push(...d.tables);
        dbs[db].indexes.push(...d.indexes);
    })
}

// const dbs = {
//     treatments: {
//         tables: [
//             treatments.tables,
//             treatmentcitations.tables,
//             treatmentauthors.tables,
//             bibrefcitations.tables,
//             figurecitations.tables,
//             materialscitations.tables,
//         ],

//         indexes: [
//             treatments.indexes,
//             treatmentcitations.indexes,
//             treatmentauthors.indexes,
//             bibrefcitations.indexes,
//             figurecitations.indexes,
//             materialscitations.indexes,
//         ]
//     },
//     stats : {
//         tables: [
//             stats.tables
//         ],
//         indexes: stats.indexes
//     },
//     // facets: {
//     //     tables: [],
//     //     indexes: []
//     // },
//     // gbifcollections: {
//     //     tables: [],
//     //     indexes: []
//     // }
// }

module.exports = dbs;