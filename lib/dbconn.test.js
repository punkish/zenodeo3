import tap from 'tap';

// const tests = [
//     {
//         i: { tableName: 'bibRefCitations', property: 'name' },
//         o: 'bibRefCitations'
//     },
//     {
//         i: { tableName: 'collectionCodes', property: 'name' },
//         o: 'collectionCodes'
//     },
//     {
//         i: { tableName: 'figureCitations', property: 'name' },
//         o: 'figureCitations'
//     },
//     {
//         i: { tableName: 'materialCitations', property: 'name' },
//         o: 'materialCitations'
//     },
//     {
//         i: { 
//             tableName: 'materialCitations_x_collectionCodes', 
//             property: 'name' 
//         },
//         o: 'materialCitations_x_collectionCodes'
//     },
//     {
//         i: { tableName: 'treatmentAuthors', property: 'name' },
//         o: 'treatmentAuthors'
//     },
//     {
//         i: { tableName: 'treatmentCitations', property: 'name' },
//         o: 'treatmentCitations'
//     },
//     {
//         i: { tableName: 'treatments', property: 'name' },
//         o: 'treatments'
//     },
//     {
//         i: { tableName: 'treatmentsFts', property: 'name' },
//         o: 'treatmentsFts'
//     }
// ]

// tap.test('get tableName and specified property', tap => {
//     tests.forEach(t => {
//         const tableName = t.i.tableName;
//         const property = t.i.property;
//         const output = t.o;

//         tap.equal(
//             ddu.getTable(tableName, property), 
//             output, 
//             `getTable('${tableName}', '${property}') is '${output}'`
//         );
//     });

//     tap.end();
// });

tap.equal(dirDoesNotExist())