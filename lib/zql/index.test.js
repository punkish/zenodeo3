import tap from 'tap';
import { zql, preZql } from './index.js';

const tests = [
    {
        input: {
            resource: 'images',
            searchparams: 'page=1&size=30&class=Malacostraca&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=httpUri&cols=caption&yearlyCounts=true'
        },
        wanted: {
            queries: {
                dropTmp: 'DROP TABLE IF EXISTS tmp',

                createTmp: 'CREATE TEMP TABLE tmp AS SELECT images.id AS images_id, images.httpUri, images.captionText, treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.zenodoDep, treatments.articleTitle, treatments.articleAuthor, images.treatments_id FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN classes ON treatments.classes_id = classes.id WHERE classes.class LIKE @class ORDER BY images_id ASC',
    
                createIndex: 'CREATE INDEX ix_tmp_treatments_id ON tmp(treatments_id)',
    
                count: "SELECT Count(DISTINCT images_id) AS num_of_records FROM tmp",
        
                full: "SELECT * FROM tmp LIMIT 30 OFFSET 0",

                yearlyCounts: "SELECT strftime( '%Y', treatments.checkinTime/1000, 'unixepoch' ) AS year, Count(DISTINCT images.id) AS num_of_images, Count(DISTINCT treatments.id) AS num_of_treatments, Count(DISTINCT species.id) AS num_of_species, Count(DISTINCT journals.id) AS num_of_journals FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN species ON treatments.species_id = species.id JOIN journals ON treatments.journals_id = journals.id WHERE treatments.id IN (SELECT treatments_id FROM tmp) GROUP BY year ORDER BY year ASC"
            },
            
            runparams: {
                class: "Malacostraca%",
            }
        }
    }
];

tests.forEach((test, i) => {

    tap.test(`${test.input.resource} ${i}`, tap => {
        const params = preZql(test.input.searchparams);
        const found = zql({ resource: test.input.resource, params });
        tap.same(found, test.wanted);
        tap.end();
    });

});