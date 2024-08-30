import tap from 'tap';
import { zql, preZql } from './index.js';

// import { Config } from '@punkish/zconfig';
// const config = new Config().settings;
// const cronQueries = config.cronQueries;
// const queryParams = cronQueries.queryParams;
// const queries = cronQueries.queries;

//const tg = [];

// Object.keys(queries)
//     .forEach((resource) => {
//         const queryStringFrags = queries[resource];
//         const tests = queryStringFrags.map((qry, idx) => {
//             const searchparams = idx
//                 ? `${qry}&${queryParams}`
//                 : `cols=&cacheDuration=1`;

//             return {
//                 input: {
//                     resource,
//                     searchparams
//                 },
//                 wanted: {}
//             }
//         });

//         tg.push(...tests)
//     });

const tests = [

    // 0
    {
      input: { resource: 'images', searchparams: 'cols=&cacheDuration=1' },
      wanted: {
        queries: {
          dropTmp: false,
          createTmp: false,
          createIndex: false,
          count: 'SELECT Count(*) AS num_of_records FROM images',
          full: false
        },
        runparams: {}
      }
    },

    // 1
    {
      input: {
        resource: 'images',
        searchparams: 'family=Formicidae&yearlyCounts=true&page=1&size=30&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=httpUri&cols=caption'
      },
      wanted: {
        queries: {
          dropTmp: 'DROP TABLE IF EXISTS tmp',
          createTmp: 'CREATE TEMP TABLE tmp AS SELECT images.id AS images_id, images.httpUri, images.captionText, treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.zenodoDep, treatments.articleTitle, treatments.articleAuthor, images.treatments_id FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN families ON treatments.families_id = families.id WHERE families.family LIKE @family ORDER BY images_id ASC',
          createIndex: 'CREATE INDEX ix_tmp_treatments_id ON tmp(treatments_id)',
          count: 'SELECT Count(DISTINCT images_id) AS num_of_records FROM tmp',
          full: 'SELECT * FROM tmp LIMIT 30 OFFSET 0',
          yearlyCounts: "SELECT strftime( '%Y', treatments.checkinTime/1000, 'unixepoch' ) AS year, Count(DISTINCT images.id) AS num_of_images, Count(DISTINCT treatments.id) AS num_of_treatments, Count(DISTINCT species.id) AS num_of_species, Count(DISTINCT journals.id) AS num_of_journals FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN species ON treatments.species_id = species.id JOIN journals ON treatments.journals_id = journals.id WHERE treatments.id IN (SELECT treatments_id FROM tmp) GROUP BY year ORDER BY year ASC"
        },
        runparams: { family: 'Formicidae%' }
      }
    },

    // 2
    {
      input: {
        resource: 'images',
        searchparams: 'class=Actinopterygii&yearlyCounts=true&page=1&size=30&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=httpUri&cols=caption'
      },
      wanted: {
        queries: {
          dropTmp: 'DROP TABLE IF EXISTS tmp',
          createTmp: 'CREATE TEMP TABLE tmp AS SELECT images.id AS images_id, images.httpUri, images.captionText, treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.zenodoDep, treatments.articleTitle, treatments.articleAuthor, images.treatments_id FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN classes ON treatments.classes_id = classes.id WHERE classes.class LIKE @class ORDER BY images_id ASC',
          createIndex: 'CREATE INDEX ix_tmp_treatments_id ON tmp(treatments_id)',
          count: 'SELECT Count(DISTINCT images_id) AS num_of_records FROM tmp',
          full: 'SELECT * FROM tmp LIMIT 30 OFFSET 0',
          yearlyCounts: "SELECT strftime( '%Y', treatments.checkinTime/1000, 'unixepoch' ) AS year, Count(DISTINCT images.id) AS num_of_images, Count(DISTINCT treatments.id) AS num_of_treatments, Count(DISTINCT species.id) AS num_of_species, Count(DISTINCT journals.id) AS num_of_journals FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN species ON treatments.species_id = species.id JOIN journals ON treatments.journals_id = journals.id WHERE treatments.id IN (SELECT treatments_id FROM tmp) GROUP BY year ORDER BY year ASC"
        },
        runparams: { class: 'Actinopterygii%' }
      }
    },

    // 3
    {
      input: {
        resource: 'images',
        searchparams: 'class=Arachnida&yearlyCounts=true&page=1&size=30&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=httpUri&cols=caption'
      },
      wanted: {
        queries: {
          dropTmp: 'DROP TABLE IF EXISTS tmp',
          createTmp: 'CREATE TEMP TABLE tmp AS SELECT images.id AS images_id, images.httpUri, images.captionText, treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.zenodoDep, treatments.articleTitle, treatments.articleAuthor, images.treatments_id FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN classes ON treatments.classes_id = classes.id WHERE classes.class LIKE @class ORDER BY images_id ASC',
          createIndex: 'CREATE INDEX ix_tmp_treatments_id ON tmp(treatments_id)',
          count: 'SELECT Count(DISTINCT images_id) AS num_of_records FROM tmp',
          full: 'SELECT * FROM tmp LIMIT 30 OFFSET 0',
          yearlyCounts: "SELECT strftime( '%Y', treatments.checkinTime/1000, 'unixepoch' ) AS year, Count(DISTINCT images.id) AS num_of_images, Count(DISTINCT treatments.id) AS num_of_treatments, Count(DISTINCT species.id) AS num_of_species, Count(DISTINCT journals.id) AS num_of_journals FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN species ON treatments.species_id = species.id JOIN journals ON treatments.journals_id = journals.id WHERE treatments.id IN (SELECT treatments_id FROM tmp) GROUP BY year ORDER BY year ASC"
        },
        runparams: { class: 'Arachnida%' }
      }
    },

    // 4
    {
      input: {
        resource: 'images',
        searchparams: 'class=Malacostraca&yearlyCounts=true&page=1&size=30&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=httpUri&cols=caption'
      },
      wanted: {
        queries: {
          dropTmp: 'DROP TABLE IF EXISTS tmp',
          createTmp: 'CREATE TEMP TABLE tmp AS SELECT images.id AS images_id, images.httpUri, images.captionText, treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.zenodoDep, treatments.articleTitle, treatments.articleAuthor, images.treatments_id FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN classes ON treatments.classes_id = classes.id WHERE classes.class LIKE @class ORDER BY images_id ASC',
          createIndex: 'CREATE INDEX ix_tmp_treatments_id ON tmp(treatments_id)',
          count: 'SELECT Count(DISTINCT images_id) AS num_of_records FROM tmp',
          full: 'SELECT * FROM tmp LIMIT 30 OFFSET 0',
          yearlyCounts: "SELECT strftime( '%Y', treatments.checkinTime/1000, 'unixepoch' ) AS year, Count(DISTINCT images.id) AS num_of_images, Count(DISTINCT treatments.id) AS num_of_treatments, Count(DISTINCT species.id) AS num_of_species, Count(DISTINCT journals.id) AS num_of_journals FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN species ON treatments.species_id = species.id JOIN journals ON treatments.journals_id = journals.id WHERE treatments.id IN (SELECT treatments_id FROM tmp) GROUP BY year ORDER BY year ASC"
        },
        runparams: { class: 'Malacostraca%' }
      }
    },

    // 5
    {
      input: {
        resource: 'images',
        searchparams: 'order=Coleoptera&yearlyCounts=true&page=1&size=30&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=httpUri&cols=caption'
      },
      wanted: {
        queries: {
          dropTmp: 'DROP TABLE IF EXISTS tmp',
          createTmp: 'CREATE TEMP TABLE tmp AS SELECT images.id AS images_id, images.httpUri, images.captionText, treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.zenodoDep, treatments.articleTitle, treatments.articleAuthor, images.treatments_id FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN orders ON treatments.orders_id = orders.id WHERE orders."order" LIKE @order ORDER BY images_id ASC',
          createIndex: 'CREATE INDEX ix_tmp_treatments_id ON tmp(treatments_id)',
          count: 'SELECT Count(DISTINCT images_id) AS num_of_records FROM tmp',
          full: 'SELECT * FROM tmp LIMIT 30 OFFSET 0',
          yearlyCounts: "SELECT strftime( '%Y', treatments.checkinTime/1000, 'unixepoch' ) AS year, Count(DISTINCT images.id) AS num_of_images, Count(DISTINCT treatments.id) AS num_of_treatments, Count(DISTINCT species.id) AS num_of_species, Count(DISTINCT journals.id) AS num_of_journals FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN species ON treatments.species_id = species.id JOIN journals ON treatments.journals_id = journals.id WHERE treatments.id IN (SELECT treatments_id FROM tmp) GROUP BY year ORDER BY year ASC"
        },
        runparams: { order: 'Coleoptera%' }
      }
    },

    // 6
    {
      input: {
        resource: 'images',
        searchparams: 'captionText=phylogeny&yearlyCounts=true&page=1&size=30&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=httpUri&cols=caption'
      },
      wanted: {
        queries: {
          dropTmp: 'DROP TABLE IF EXISTS tmp',
          createTmp: 'CREATE TEMP TABLE tmp AS SELECT images.id AS images_id, images.httpUri, images.captionText, treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.zenodoDep, treatments.articleTitle, treatments.articleAuthor, images.treatments_id FROM images JOIN imagesFts ON images.id = imagesFts.rowid JOIN treatments ON images.treatments_id = treatments.id WHERE imagesFts.captionText MATCH @captionText ORDER BY images_id ASC',
          createIndex: 'CREATE INDEX ix_tmp_treatments_id ON tmp(treatments_id)',
          count: 'SELECT Count(DISTINCT images_id) AS num_of_records FROM tmp',
          full: 'SELECT * FROM tmp LIMIT 30 OFFSET 0',
          yearlyCounts: "SELECT strftime( '%Y', treatments.checkinTime/1000, 'unixepoch' ) AS year, Count(DISTINCT images.id) AS num_of_images, Count(DISTINCT treatments.id) AS num_of_treatments, Count(DISTINCT species.id) AS num_of_species, Count(DISTINCT journals.id) AS num_of_journals FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN species ON treatments.species_id = species.id JOIN journals ON treatments.journals_id = journals.id WHERE treatments.id IN (SELECT treatments_id FROM tmp) GROUP BY year ORDER BY year ASC"
        },
        runparams: { captionText: 'phylogeny', cssClass: 'hilite', sides: 50 }
      }
    },

    // 7
    {
      input: {
        resource: 'images',
        searchparams: 'q=phylogeny&termFreq=true&yearlyCounts=true&page=1&size=30&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=httpUri&cols=caption'
      },
      wanted: {
        queries: {
          dropTmp: 'DROP TABLE IF EXISTS tmp',
          createTmp: 'CREATE TEMP TABLE tmp AS SELECT images.id AS images_id, images.httpUri, images.captionText, treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.zenodoDep, treatments.articleTitle, treatments.articleAuthor, images.treatments_id FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN treatmentsFts ON treatments.id = treatmentsFts.rowid WHERE treatmentsFts.fulltext MATCH @q ORDER BY images_id ASC',
          createIndex: 'CREATE INDEX ix_tmp_treatments_id ON tmp(treatments_id)',
          count: 'SELECT Count(DISTINCT images_id) AS num_of_records FROM tmp',
          full: 'SELECT * FROM tmp LIMIT 30 OFFSET 0',
          termFreq: "SELECT journalYear, Count(doc) AS total, Sum( CASE WHEN images.httpUri IS NOT NULL THEN 1 ELSE 0 END ) AS withImages FROM treatmentsFtvins JOIN treatments ON treatmentsFtvins.doc = treatments.id LEFT JOIN images ON treatmentsFtvins.doc = images.treatments_id WHERE journalYear != '' AND term = @q GROUP BY journalYear ORDER BY journalYear ASC",
          yearlyCounts: "SELECT strftime( '%Y', treatments.checkinTime/1000, 'unixepoch' ) AS year, Count(DISTINCT images.id) AS num_of_images, Count(DISTINCT treatments.id) AS num_of_treatments, Count(DISTINCT species.id) AS num_of_species, Count(DISTINCT journals.id) AS num_of_journals FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN species ON treatments.species_id = species.id JOIN journals ON treatments.journals_id = journals.id WHERE treatments.id IN (SELECT treatments_id FROM tmp) GROUP BY year ORDER BY year ASC"
        },
        runparams: { q: 'phylogeny', cssClass: 'hilite', sides: 50 }
      }
    },

    // 8
    {
      input: {
        resource: 'images',
        searchparams: 'q=phylogeny AND plantae&yearlyCounts=true&page=1&size=30&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=httpUri&cols=caption'
      },
      wanted: {
        queries: {
          dropTmp: 'DROP TABLE IF EXISTS tmp',
          createTmp: 'CREATE TEMP TABLE tmp AS SELECT images.id AS images_id, images.httpUri, images.captionText, treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.zenodoDep, treatments.articleTitle, treatments.articleAuthor, images.treatments_id FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN treatmentsFts ON treatments.id = treatmentsFts.rowid WHERE treatmentsFts.fulltext MATCH @q ORDER BY images_id ASC',
          createIndex: 'CREATE INDEX ix_tmp_treatments_id ON tmp(treatments_id)',
          count: 'SELECT Count(DISTINCT images_id) AS num_of_records FROM tmp',
          full: 'SELECT * FROM tmp LIMIT 30 OFFSET 0',
          yearlyCounts: "SELECT strftime( '%Y', treatments.checkinTime/1000, 'unixepoch' ) AS year, Count(DISTINCT images.id) AS num_of_images, Count(DISTINCT treatments.id) AS num_of_treatments, Count(DISTINCT species.id) AS num_of_species, Count(DISTINCT journals.id) AS num_of_journals FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN species ON treatments.species_id = species.id JOIN journals ON treatments.journals_id = journals.id WHERE treatments.id IN (SELECT treatments_id FROM tmp) GROUP BY year ORDER BY year ASC"
        },
        runparams: { q: 'phylogeny AND plantae', cssClass: 'hilite', sides: 50 }
      }
    },

    // 9
    {
      input: {
        resource: 'images',
        searchparams: 'journalTitle=eq(European Journal of Taxonomy)&yearlyCounts=true&page=1&size=30&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=httpUri&cols=caption'
      },
      wanted: {
        queries: {
          dropTmp: 'DROP TABLE IF EXISTS tmp',
          createTmp: 'CREATE TEMP TABLE tmp AS SELECT images.id AS images_id, images.httpUri, images.captionText, treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.zenodoDep, treatments.articleTitle, treatments.articleAuthor, images.treatments_id FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN journals ON treatments.journals_id = journals.id WHERE journals.journalTitle = @journalTitle ORDER BY images_id ASC',
          createIndex: 'CREATE INDEX ix_tmp_treatments_id ON tmp(treatments_id)',
          count: 'SELECT Count(DISTINCT images_id) AS num_of_records FROM tmp',
          full: 'SELECT * FROM tmp LIMIT 30 OFFSET 0',
          yearlyCounts: "SELECT strftime( '%Y', treatments.checkinTime/1000, 'unixepoch' ) AS year, Count(DISTINCT images.id) AS num_of_images, Count(DISTINCT treatments.id) AS num_of_treatments, Count(DISTINCT species.id) AS num_of_species, Count(DISTINCT journals.id) AS num_of_journals FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN species ON treatments.species_id = species.id JOIN journals ON treatments.journals_id = journals.id WHERE treatments.id IN (SELECT treatments_id FROM tmp) GROUP BY year ORDER BY year ASC"
        },
        runparams: { journalTitle: 'European Journal of Taxonomy' }
      }
    },

    // 10
    {
      input: {
        resource: 'images',
        searchparams: 'articleDOI=10.11646/zootaxa.5284.3.7&yearlyCounts=true&page=1&size=30&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=httpUri&cols=caption'
      },
      wanted: {
        queries: {
          dropTmp: 'DROP TABLE IF EXISTS tmp',
          createTmp: 'CREATE TEMP TABLE tmp AS SELECT images.id AS images_id, images.httpUri, images.captionText, treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.zenodoDep, treatments.articleTitle, treatments.articleAuthor, images.treatments_id FROM images JOIN treatments ON images.treatments_id = treatments.id WHERE treatments.articleDOI LIKE @articleDOI ORDER BY images_id ASC',
          createIndex: 'CREATE INDEX ix_tmp_treatments_id ON tmp(treatments_id)',
          count: 'SELECT Count(DISTINCT images_id) AS num_of_records FROM tmp',
          full: 'SELECT * FROM tmp LIMIT 30 OFFSET 0',
          yearlyCounts: "SELECT strftime( '%Y', treatments.checkinTime/1000, 'unixepoch' ) AS year, Count(DISTINCT images.id) AS num_of_images, Count(DISTINCT treatments.id) AS num_of_treatments, Count(DISTINCT species.id) AS num_of_species, Count(DISTINCT journals.id) AS num_of_journals FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN species ON treatments.species_id = species.id JOIN journals ON treatments.journals_id = journals.id WHERE treatments.id IN (SELECT treatments_id FROM tmp) GROUP BY year ORDER BY year ASC"
        },
        runparams: { articleDOI: '10.11646/zootaxa.5284.3.7%' }
      }
    },

    // 11
    {
      input: {
        resource: 'images',
        searchparams: 'articleTitle=starts_with(Morphology and taxonomic assessment)&yearlyCounts=true&page=1&size=30&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=httpUri&cols=caption'
      },
      wanted: {
        queries: {
          dropTmp: 'DROP TABLE IF EXISTS tmp',
          createTmp: 'CREATE TEMP TABLE tmp AS SELECT images.id AS images_id, images.httpUri, images.captionText, treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.zenodoDep, treatments.articleTitle, treatments.articleAuthor, images.treatments_id FROM images JOIN treatments ON images.treatments_id = treatments.id WHERE treatments.articleTitle LIKE @articleTitle ORDER BY images_id ASC',
          createIndex: 'CREATE INDEX ix_tmp_treatments_id ON tmp(treatments_id)',
          count: 'SELECT Count(DISTINCT images_id) AS num_of_records FROM tmp',
          full: 'SELECT * FROM tmp LIMIT 30 OFFSET 0',
          yearlyCounts: "SELECT strftime( '%Y', treatments.checkinTime/1000, 'unixepoch' ) AS year, Count(DISTINCT images.id) AS num_of_images, Count(DISTINCT treatments.id) AS num_of_treatments, Count(DISTINCT species.id) AS num_of_species, Count(DISTINCT journals.id) AS num_of_journals FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN species ON treatments.species_id = species.id JOIN journals ON treatments.journals_id = journals.id WHERE treatments.id IN (SELECT treatments_id FROM tmp) GROUP BY year ORDER BY year ASC"
        },
        runparams: { articleTitle: 'Morphology and taxonomic assessment%' }
      }
    },

    // 12
    {
      input: {
        resource: 'images',
        searchparams: "geolocation=within(radius:10, units:'kilometers', lat:40.21, lng:-120.33)&yearlyCounts=true&page=1&size=30&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=httpUri&cols=caption"
      },
      wanted: {
        queries: {
          dropTmp: 'DROP TABLE IF EXISTS tmp',
          createTmp: 'CREATE TEMP TABLE tmp AS SELECT images.id AS images_id, images.httpUri, images.captionText, treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.zenodoDep, treatments.articleTitle, treatments.articleAuthor, images.treatments_id FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN materialCitations ON images.treatments_id = materialCitations.treatments_id JOIN materialCitationsRtree ON materialCitations.id = materialCitationsRtree.id WHERE materialCitationsRtree.minX >= @minX AND materialCitationsRtree.minY >= @minY AND materialCitationsRtree.maxX <= @maxX AND materialCitationsRtree.maxY <= @maxY ORDER BY images_id ASC',

          createIndex: 'CREATE INDEX ix_tmp_treatments_id ON tmp(treatments_id)',

          count: 'SELECT Count(DISTINCT images_id) AS num_of_records FROM tmp',

          full: 'SELECT * FROM tmp LIMIT 30 OFFSET 0',

          yearlyCounts: "SELECT strftime( '%Y', treatments.checkinTime/1000, 'unixepoch' ) AS year, Count(DISTINCT images.id) AS num_of_images, Count(DISTINCT treatments.id) AS num_of_treatments, Count(DISTINCT species.id) AS num_of_species, Count(DISTINCT journals.id) AS num_of_journals FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN species ON treatments.species_id = species.id JOIN journals ON treatments.journals_id = journals.id WHERE treatments.id IN (SELECT treatments_id FROM tmp) GROUP BY year ORDER BY year ASC"
        },
        runparams: { 
            minX: -120.44776082589335,             
            minY: 40.12006796362754,          
            maxX: -120.21223917410664,         
            maxY: 40.299932036372454
         }
      }
    },

    // 13
    {
      input: {
        resource: 'images',
        searchparams: 'class=Actinopterygii&publicationDate=since(2021-12-21)&yearlyCounts=true&page=1&size=30&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=httpUri&cols=caption'
      },
      wanted: {
        queries: {
          dropTmp: 'DROP TABLE IF EXISTS tmp',
          createTmp: 'CREATE TEMP TABLE tmp AS SELECT images.id AS images_id, images.httpUri, images.captionText, treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.zenodoDep, treatments.articleTitle, treatments.articleAuthor, images.treatments_id FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN classes ON treatments.classes_id = classes.id WHERE Unixepoch(treatments.publicationDate) >= Unixepoch(@publicationDate) AND classes.class LIKE @class ORDER BY images_id ASC',
          createIndex: 'CREATE INDEX ix_tmp_treatments_id ON tmp(treatments_id)',
          count: 'SELECT Count(DISTINCT images_id) AS num_of_records FROM tmp',
          full: 'SELECT * FROM tmp LIMIT 30 OFFSET 0',
          yearlyCounts: "SELECT strftime( '%Y', treatments.checkinTime/1000, 'unixepoch' ) AS year, Count(DISTINCT images.id) AS num_of_images, Count(DISTINCT treatments.id) AS num_of_treatments, Count(DISTINCT species.id) AS num_of_species, Count(DISTINCT journals.id) AS num_of_journals FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN species ON treatments.species_id = species.id JOIN journals ON treatments.journals_id = journals.id WHERE treatments.id IN (SELECT treatments_id FROM tmp) GROUP BY year ORDER BY year ASC"
        },
        runparams: {
            publicationDate: "2021-12-21",
            class: "Actinopterygii%"
        }
      }
    },

    // 14
    {
      input: {
        resource: 'images',
        searchparams: 'checkinTime=since(yesterday)&yearlyCounts=true&page=1&size=30&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=httpUri&cols=caption'
      },
      wanted: {
        queries: {
          dropTmp: 'DROP TABLE IF EXISTS tmp',
          createTmp: 'CREATE TEMP TABLE tmp AS SELECT images.id AS images_id, images.httpUri, images.captionText, treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.zenodoDep, treatments.articleTitle, treatments.articleAuthor, images.treatments_id FROM images JOIN treatments ON images.treatments_id = treatments.id WHERE treatments.checkinTime >= Unixepoch(@checkinTime) * 1000 ORDER BY images_id ASC',
          createIndex: 'CREATE INDEX ix_tmp_treatments_id ON tmp(treatments_id)',
          count: 'SELECT Count(DISTINCT images_id) AS num_of_records FROM tmp',
          full: 'SELECT * FROM tmp LIMIT 30 OFFSET 0',
          yearlyCounts: "SELECT strftime( '%Y', treatments.checkinTime/1000, 'unixepoch' ) AS year, Count(DISTINCT images.id) AS num_of_images, Count(DISTINCT treatments.id) AS num_of_treatments, Count(DISTINCT species.id) AS num_of_species, Count(DISTINCT journals.id) AS num_of_journals FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN species ON treatments.species_id = species.id JOIN journals ON treatments.journals_id = journals.id WHERE treatments.id IN (SELECT treatments_id FROM tmp) GROUP BY year ORDER BY year ASC"
        },
        runparams: { checkinTime: '2024-08-28' }
      }
    },

    // 15
    {
      input: {
        resource: 'images',
        searchparams: 'q=tyrannosaurus&authorityName=Osborn&yearlyCounts=true&page=1&size=30&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=httpUri&cols=caption'
      },
      wanted: {
        queries: {
          dropTmp: 'DROP TABLE IF EXISTS tmp',
          createTmp: 'CREATE TEMP TABLE tmp AS SELECT images.id AS images_id, images.httpUri, images.captionText, treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.zenodoDep, treatments.articleTitle, treatments.articleAuthor, images.treatments_id FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN treatmentsFts ON treatments.id = treatmentsFts.rowid WHERE treatmentsFts.fulltext MATCH @q AND treatments.authorityName LIKE @authorityName ORDER BY images_id ASC',
          createIndex: 'CREATE INDEX ix_tmp_treatments_id ON tmp(treatments_id)',
          count: 'SELECT Count(DISTINCT images_id) AS num_of_records FROM tmp',
          full: 'SELECT * FROM tmp LIMIT 30 OFFSET 0',
          yearlyCounts: "SELECT strftime( '%Y', treatments.checkinTime/1000, 'unixepoch' ) AS year, Count(DISTINCT images.id) AS num_of_images, Count(DISTINCT treatments.id) AS num_of_treatments, Count(DISTINCT species.id) AS num_of_species, Count(DISTINCT journals.id) AS num_of_journals FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN species ON treatments.species_id = species.id JOIN journals ON treatments.journals_id = journals.id WHERE treatments.id IN (SELECT treatments_id FROM tmp) GROUP BY year ORDER BY year ASC"
        },
        runparams: {
          q: 'tyrannosaurus',
          cssClass: 'hilite',
          sides: 50,
          authorityName: 'Osborn%'
        }
      }
    },

    // 16
    {
      input: {
        resource: 'images',
        searchparams: 'family=Agamidae&yearlyCounts=true&page=1&size=30&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=httpUri&cols=caption'
      },
      wanted: {
        queries: {
          dropTmp: 'DROP TABLE IF EXISTS tmp',
          createTmp: 'CREATE TEMP TABLE tmp AS SELECT images.id AS images_id, images.httpUri, images.captionText, treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.zenodoDep, treatments.articleTitle, treatments.articleAuthor, images.treatments_id FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN families ON treatments.families_id = families.id WHERE families.family LIKE @family ORDER BY images_id ASC',
          createIndex: 'CREATE INDEX ix_tmp_treatments_id ON tmp(treatments_id)',
          count: 'SELECT Count(DISTINCT images_id) AS num_of_records FROM tmp',
          full: 'SELECT * FROM tmp LIMIT 30 OFFSET 0',
          yearlyCounts: "SELECT strftime( '%Y', treatments.checkinTime/1000, 'unixepoch' ) AS year, Count(DISTINCT images.id) AS num_of_images, Count(DISTINCT treatments.id) AS num_of_treatments, Count(DISTINCT species.id) AS num_of_species, Count(DISTINCT journals.id) AS num_of_journals FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN species ON treatments.species_id = species.id JOIN journals ON treatments.journals_id = journals.id WHERE treatments.id IN (SELECT treatments_id FROM tmp) GROUP BY year ORDER BY year ASC"
        },
        runparams: { family: 'Agamidae%' }
      }
    },

    // 17
    {
      input: {
        resource: 'images',
        searchparams: 'q=moloch OR horridus&yearlyCounts=true&page=1&size=30&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=httpUri&cols=caption'
      },
      wanted: {
        queries: {
          dropTmp: 'DROP TABLE IF EXISTS tmp',
          createTmp: 'CREATE TEMP TABLE tmp AS SELECT images.id AS images_id, images.httpUri, images.captionText, treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.zenodoDep, treatments.articleTitle, treatments.articleAuthor, images.treatments_id FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN treatmentsFts ON treatments.id = treatmentsFts.rowid WHERE treatmentsFts.fulltext MATCH @q ORDER BY images_id ASC',
          createIndex: 'CREATE INDEX ix_tmp_treatments_id ON tmp(treatments_id)',
          count: 'SELECT Count(DISTINCT images_id) AS num_of_records FROM tmp',
          full: 'SELECT * FROM tmp LIMIT 30 OFFSET 0',
          yearlyCounts: "SELECT strftime( '%Y', treatments.checkinTime/1000, 'unixepoch' ) AS year, Count(DISTINCT images.id) AS num_of_images, Count(DISTINCT treatments.id) AS num_of_treatments, Count(DISTINCT species.id) AS num_of_species, Count(DISTINCT journals.id) AS num_of_journals FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN species ON treatments.species_id = species.id JOIN journals ON treatments.journals_id = journals.id WHERE treatments.id IN (SELECT treatments_id FROM tmp) GROUP BY year ORDER BY year ASC"
        },
        runparams: { q: 'moloch OR horridus', cssClass: 'hilite', sides: 50 }
      }
    },

    // 18
    {
      input: {
        resource: 'images',
        searchparams: 'q=decapoda&journalTitle=not_like(zootaxa)&yearlyCounts=true&page=1&size=30&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=httpUri&cols=caption'
      },
      wanted: {
        queries: {
          dropTmp: 'DROP TABLE IF EXISTS tmp',
          createTmp: 'CREATE TEMP TABLE tmp AS SELECT images.id AS images_id, images.httpUri, images.captionText, treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.zenodoDep, treatments.articleTitle, treatments.articleAuthor, images.treatments_id FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN treatmentsFts ON treatments.id = treatmentsFts.rowid JOIN journals ON treatments.journals_id = journals.id WHERE treatmentsFts.fulltext MATCH @q AND journals.journalTitle NOT LIKE @journalTitle ORDER BY images_id ASC',
          createIndex: 'CREATE INDEX ix_tmp_treatments_id ON tmp(treatments_id)',
          count: 'SELECT Count(DISTINCT images_id) AS num_of_records FROM tmp',
          full: 'SELECT * FROM tmp LIMIT 30 OFFSET 0',
          yearlyCounts: "SELECT strftime( '%Y', treatments.checkinTime/1000, 'unixepoch' ) AS year, Count(DISTINCT images.id) AS num_of_images, Count(DISTINCT treatments.id) AS num_of_treatments, Count(DISTINCT species.id) AS num_of_species, Count(DISTINCT journals.id) AS num_of_journals FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN species ON treatments.species_id = species.id JOIN journals ON treatments.journals_id = journals.id WHERE treatments.id IN (SELECT treatments_id FROM tmp) GROUP BY year ORDER BY year ASC"
        },
        runparams: {
          q: 'decapoda',
          cssClass: 'hilite',
          sides: 50,
          journalTitle: 'zootaxa'
        }
      }
    },

    // 19
    {
      input: {
        resource: 'images',
        searchparams: 'biome=savanna&yearlyCounts=true&page=1&size=30&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=httpUri&cols=caption'
      },
      wanted: {
        queries: {
          dropTmp: 'DROP TABLE IF EXISTS tmp',
          createTmp: 'CREATE TEMP TABLE tmp AS SELECT images.id AS images_id, images.httpUri, images.captionText, treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.zenodoDep, treatments.articleTitle, treatments.articleAuthor, images.treatments_id FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN materialCitations ON images.treatments_id = materialCitations.treatments_id JOIN geodata.biome_synonyms ON materialCitations.biomes_id = geodata.biome_synonyms.biomes_id WHERE biome_synonyms.biome_synonym LIKE @biome ORDER BY images_id ASC',
          createIndex: 'CREATE INDEX ix_tmp_treatments_id ON tmp(treatments_id)',
          count: 'SELECT Count(DISTINCT images_id) AS num_of_records FROM tmp',
          full: 'SELECT * FROM tmp LIMIT 30 OFFSET 0',
          yearlyCounts: "SELECT strftime( '%Y', treatments.checkinTime/1000, 'unixepoch' ) AS year, Count(DISTINCT images.id) AS num_of_images, Count(DISTINCT treatments.id) AS num_of_treatments, Count(DISTINCT species.id) AS num_of_species, Count(DISTINCT journals.id) AS num_of_journals FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN species ON treatments.species_id = species.id JOIN journals ON treatments.journals_id = journals.id WHERE treatments.id IN (SELECT treatments_id FROM tmp) GROUP BY year ORDER BY year ASC"
        },
        runparams: { biome: 'savanna%' }
      }
    },

    // 20
    {
      input: {
        resource: 'images',
        searchparams: 'biome=veld&yearlyCounts=true&page=1&size=30&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=httpUri&cols=caption'
      },
      wanted: {
        queries: {
          dropTmp: 'DROP TABLE IF EXISTS tmp',
          createTmp: 'CREATE TEMP TABLE tmp AS SELECT images.id AS images_id, images.httpUri, images.captionText, treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.zenodoDep, treatments.articleTitle, treatments.articleAuthor, images.treatments_id FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN materialCitations ON images.treatments_id = materialCitations.treatments_id JOIN geodata.biome_synonyms ON materialCitations.biomes_id = geodata.biome_synonyms.biomes_id WHERE biome_synonyms.biome_synonym LIKE @biome ORDER BY images_id ASC',
          createIndex: 'CREATE INDEX ix_tmp_treatments_id ON tmp(treatments_id)',
          count: 'SELECT Count(DISTINCT images_id) AS num_of_records FROM tmp',
          full: 'SELECT * FROM tmp LIMIT 30 OFFSET 0',
          yearlyCounts: "SELECT strftime( '%Y', treatments.checkinTime/1000, 'unixepoch' ) AS year, Count(DISTINCT images.id) AS num_of_images, Count(DISTINCT treatments.id) AS num_of_treatments, Count(DISTINCT species.id) AS num_of_species, Count(DISTINCT journals.id) AS num_of_journals FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN species ON treatments.species_id = species.id JOIN journals ON treatments.journals_id = journals.id WHERE treatments.id IN (SELECT treatments_id FROM tmp) GROUP BY year ORDER BY year ASC"
        },
        runparams: { biome: 'veld%' }
      }
    },

    // 21
    {
      input: {
        resource: 'images',
        searchparams: 'biome=pampas&yearlyCounts=true&page=1&size=30&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=httpUri&cols=caption'
      },
      wanted: {
        queries: {
          dropTmp: 'DROP TABLE IF EXISTS tmp',
          createTmp: 'CREATE TEMP TABLE tmp AS SELECT images.id AS images_id, images.httpUri, images.captionText, treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.zenodoDep, treatments.articleTitle, treatments.articleAuthor, images.treatments_id FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN materialCitations ON images.treatments_id = materialCitations.treatments_id JOIN geodata.biome_synonyms ON materialCitations.biomes_id = geodata.biome_synonyms.biomes_id WHERE biome_synonyms.biome_synonym LIKE @biome ORDER BY images_id ASC',
          createIndex: 'CREATE INDEX ix_tmp_treatments_id ON tmp(treatments_id)',
          count: 'SELECT Count(DISTINCT images_id) AS num_of_records FROM tmp',
          full: 'SELECT * FROM tmp LIMIT 30 OFFSET 0',
          yearlyCounts: "SELECT strftime( '%Y', treatments.checkinTime/1000, 'unixepoch' ) AS year, Count(DISTINCT images.id) AS num_of_images, Count(DISTINCT treatments.id) AS num_of_treatments, Count(DISTINCT species.id) AS num_of_species, Count(DISTINCT journals.id) AS num_of_journals FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN species ON treatments.species_id = species.id JOIN journals ON treatments.journals_id = journals.id WHERE treatments.id IN (SELECT treatments_id FROM tmp) GROUP BY year ORDER BY year ASC"
        },
        runparams: { biome: 'pampas%' }
      }
    },

    // 22
    {
      input: {
        resource: 'images',
        searchparams: 'biome=Tundra&yearlyCounts=true&page=1&size=30&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=httpUri&cols=caption'
      },
      wanted: {
        queries: {
          dropTmp: 'DROP TABLE IF EXISTS tmp',
          createTmp: 'CREATE TEMP TABLE tmp AS SELECT images.id AS images_id, images.httpUri, images.captionText, treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.zenodoDep, treatments.articleTitle, treatments.articleAuthor, images.treatments_id FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN materialCitations ON images.treatments_id = materialCitations.treatments_id JOIN geodata.biome_synonyms ON materialCitations.biomes_id = geodata.biome_synonyms.biomes_id WHERE biome_synonyms.biome_synonym LIKE @biome ORDER BY images_id ASC',
          createIndex: 'CREATE INDEX ix_tmp_treatments_id ON tmp(treatments_id)',
          count: 'SELECT Count(DISTINCT images_id) AS num_of_records FROM tmp',
          full: 'SELECT * FROM tmp LIMIT 30 OFFSET 0',
          yearlyCounts: "SELECT strftime( '%Y', treatments.checkinTime/1000, 'unixepoch' ) AS year, Count(DISTINCT images.id) AS num_of_images, Count(DISTINCT treatments.id) AS num_of_treatments, Count(DISTINCT species.id) AS num_of_species, Count(DISTINCT journals.id) AS num_of_journals FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN species ON treatments.species_id = species.id JOIN journals ON treatments.journals_id = journals.id WHERE treatments.id IN (SELECT treatments_id FROM tmp) GROUP BY year ORDER BY year ASC"
        },
        runparams: { biome: 'Tundra%' }
      }
    },

    // 23
    {
      input: {
        resource: 'images',
        searchparams: 'biome=Tropical and Subtropical Moist Broadleaf Forests&yearlyCounts=true&page=1&size=30&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=httpUri&cols=caption'
      },
      wanted: {
        queries: {
          dropTmp: 'DROP TABLE IF EXISTS tmp',
          createTmp: 'CREATE TEMP TABLE tmp AS SELECT images.id AS images_id, images.httpUri, images.captionText, treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.zenodoDep, treatments.articleTitle, treatments.articleAuthor, images.treatments_id FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN materialCitations ON images.treatments_id = materialCitations.treatments_id JOIN geodata.biome_synonyms ON materialCitations.biomes_id = geodata.biome_synonyms.biomes_id WHERE biome_synonyms.biome_synonym LIKE @biome ORDER BY images_id ASC',
          createIndex: 'CREATE INDEX ix_tmp_treatments_id ON tmp(treatments_id)',
          count: 'SELECT Count(DISTINCT images_id) AS num_of_records FROM tmp',
          full: 'SELECT * FROM tmp LIMIT 30 OFFSET 0',
          yearlyCounts: "SELECT strftime( '%Y', treatments.checkinTime/1000, 'unixepoch' ) AS year, Count(DISTINCT images.id) AS num_of_images, Count(DISTINCT treatments.id) AS num_of_treatments, Count(DISTINCT species.id) AS num_of_species, Count(DISTINCT journals.id) AS num_of_journals FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN species ON treatments.species_id = species.id JOIN journals ON treatments.journals_id = journals.id WHERE treatments.id IN (SELECT treatments_id FROM tmp) GROUP BY year ORDER BY year ASC"
        },
        runparams: { biome: 'Tropical and Subtropical Moist Broadleaf Forests%' }
      }
    },

    // 24
    {
      input: {
        resource: 'images',
        searchparams: 'biome=Mediterranean Forests, Woodlands and Scrub&yearlyCounts=true&page=1&size=30&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=httpUri&cols=caption'
      },
      wanted: {
        queries: {
          dropTmp: 'DROP TABLE IF EXISTS tmp',
          createTmp: 'CREATE TEMP TABLE tmp AS SELECT images.id AS images_id, images.httpUri, images.captionText, treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.zenodoDep, treatments.articleTitle, treatments.articleAuthor, images.treatments_id FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN materialCitations ON images.treatments_id = materialCitations.treatments_id JOIN geodata.biome_synonyms ON materialCitations.biomes_id = geodata.biome_synonyms.biomes_id WHERE biome_synonyms.biome_synonym LIKE @biome ORDER BY images_id ASC',
          createIndex: 'CREATE INDEX ix_tmp_treatments_id ON tmp(treatments_id)',
          count: 'SELECT Count(DISTINCT images_id) AS num_of_records FROM tmp',
          full: 'SELECT * FROM tmp LIMIT 30 OFFSET 0',
          yearlyCounts: "SELECT strftime( '%Y', treatments.checkinTime/1000, 'unixepoch' ) AS year, Count(DISTINCT images.id) AS num_of_images, Count(DISTINCT treatments.id) AS num_of_treatments, Count(DISTINCT species.id) AS num_of_species, Count(DISTINCT journals.id) AS num_of_journals FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN species ON treatments.species_id = species.id JOIN journals ON treatments.journals_id = journals.id WHERE treatments.id IN (SELECT treatments_id FROM tmp) GROUP BY year ORDER BY year ASC"
        },
        runparams: { biome: 'Mediterranean Forests, Woodlands and Scrub%' }
      }
    },

    // 25
    {
      input: {
        resource: 'images',
        searchparams: 'biome=Deserts and Xeric Shrublands&yearlyCounts=true&page=1&size=30&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=httpUri&cols=caption'
      },
      wanted: {
        queries: {
          dropTmp: 'DROP TABLE IF EXISTS tmp',
          createTmp: 'CREATE TEMP TABLE tmp AS SELECT images.id AS images_id, images.httpUri, images.captionText, treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.zenodoDep, treatments.articleTitle, treatments.articleAuthor, images.treatments_id FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN materialCitations ON images.treatments_id = materialCitations.treatments_id JOIN geodata.biome_synonyms ON materialCitations.biomes_id = geodata.biome_synonyms.biomes_id WHERE biome_synonyms.biome_synonym LIKE @biome ORDER BY images_id ASC',
          createIndex: 'CREATE INDEX ix_tmp_treatments_id ON tmp(treatments_id)',
          count: 'SELECT Count(DISTINCT images_id) AS num_of_records FROM tmp',
          full: 'SELECT * FROM tmp LIMIT 30 OFFSET 0',
          yearlyCounts: "SELECT strftime( '%Y', treatments.checkinTime/1000, 'unixepoch' ) AS year, Count(DISTINCT images.id) AS num_of_images, Count(DISTINCT treatments.id) AS num_of_treatments, Count(DISTINCT species.id) AS num_of_species, Count(DISTINCT journals.id) AS num_of_journals FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN species ON treatments.species_id = species.id JOIN journals ON treatments.journals_id = journals.id WHERE treatments.id IN (SELECT treatments_id FROM tmp) GROUP BY year ORDER BY year ASC"
        },
        runparams: { biome: 'Deserts and Xeric Shrublands%' }
      }
    },

    // 26
    {
      input: {
        resource: 'images',
        searchparams: 'biome=Temperate Grasslands, Savannas and Shrublands&yearlyCounts=true&page=1&size=30&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=httpUri&cols=caption'
      },
      wanted: {
        queries: {
          dropTmp: 'DROP TABLE IF EXISTS tmp',
          createTmp: 'CREATE TEMP TABLE tmp AS SELECT images.id AS images_id, images.httpUri, images.captionText, treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.zenodoDep, treatments.articleTitle, treatments.articleAuthor, images.treatments_id FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN materialCitations ON images.treatments_id = materialCitations.treatments_id JOIN geodata.biome_synonyms ON materialCitations.biomes_id = geodata.biome_synonyms.biomes_id WHERE biome_synonyms.biome_synonym LIKE @biome ORDER BY images_id ASC',
          createIndex: 'CREATE INDEX ix_tmp_treatments_id ON tmp(treatments_id)',
          count: 'SELECT Count(DISTINCT images_id) AS num_of_records FROM tmp',
          full: 'SELECT * FROM tmp LIMIT 30 OFFSET 0',
          yearlyCounts: "SELECT strftime( '%Y', treatments.checkinTime/1000, 'unixepoch' ) AS year, Count(DISTINCT images.id) AS num_of_images, Count(DISTINCT treatments.id) AS num_of_treatments, Count(DISTINCT species.id) AS num_of_species, Count(DISTINCT journals.id) AS num_of_journals FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN species ON treatments.species_id = species.id JOIN journals ON treatments.journals_id = journals.id WHERE treatments.id IN (SELECT treatments_id FROM tmp) GROUP BY year ORDER BY year ASC"
        },
        runparams: { biome: 'Temperate Grasslands, Savannas and Shrublands%' }
      }
    },

    // 27
    {
      input: {
        resource: 'images',
        searchparams: 'biome=Boreal Forests or Taiga&yearlyCounts=true&page=1&size=30&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=httpUri&cols=caption'
      },
      wanted: {
        queries: {
          dropTmp: 'DROP TABLE IF EXISTS tmp',
          createTmp: 'CREATE TEMP TABLE tmp AS SELECT images.id AS images_id, images.httpUri, images.captionText, treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.zenodoDep, treatments.articleTitle, treatments.articleAuthor, images.treatments_id FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN materialCitations ON images.treatments_id = materialCitations.treatments_id JOIN geodata.biome_synonyms ON materialCitations.biomes_id = geodata.biome_synonyms.biomes_id WHERE biome_synonyms.biome_synonym LIKE @biome ORDER BY images_id ASC',
          createIndex: 'CREATE INDEX ix_tmp_treatments_id ON tmp(treatments_id)',
          count: 'SELECT Count(DISTINCT images_id) AS num_of_records FROM tmp',
          full: 'SELECT * FROM tmp LIMIT 30 OFFSET 0',
          yearlyCounts: "SELECT strftime( '%Y', treatments.checkinTime/1000, 'unixepoch' ) AS year, Count(DISTINCT images.id) AS num_of_images, Count(DISTINCT treatments.id) AS num_of_treatments, Count(DISTINCT species.id) AS num_of_species, Count(DISTINCT journals.id) AS num_of_journals FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN species ON treatments.species_id = species.id JOIN journals ON treatments.journals_id = journals.id WHERE treatments.id IN (SELECT treatments_id FROM tmp) GROUP BY year ORDER BY year ASC"
        },
        runparams: { biome: 'Boreal Forests or Taiga%' }
      }
    },

    // 28
    {
      input: {
        resource: 'images',
        searchparams: 'biome=Temperate Conifer Forests&yearlyCounts=true&page=1&size=30&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=httpUri&cols=caption'
      },
      wanted: {
        queries: {
          dropTmp: 'DROP TABLE IF EXISTS tmp',
          createTmp: 'CREATE TEMP TABLE tmp AS SELECT images.id AS images_id, images.httpUri, images.captionText, treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.zenodoDep, treatments.articleTitle, treatments.articleAuthor, images.treatments_id FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN materialCitations ON images.treatments_id = materialCitations.treatments_id JOIN geodata.biome_synonyms ON materialCitations.biomes_id = geodata.biome_synonyms.biomes_id WHERE biome_synonyms.biome_synonym LIKE @biome ORDER BY images_id ASC',
          createIndex: 'CREATE INDEX ix_tmp_treatments_id ON tmp(treatments_id)',
          count: 'SELECT Count(DISTINCT images_id) AS num_of_records FROM tmp',
          full: 'SELECT * FROM tmp LIMIT 30 OFFSET 0',
          yearlyCounts: "SELECT strftime( '%Y', treatments.checkinTime/1000, 'unixepoch' ) AS year, Count(DISTINCT images.id) AS num_of_images, Count(DISTINCT treatments.id) AS num_of_treatments, Count(DISTINCT species.id) AS num_of_species, Count(DISTINCT journals.id) AS num_of_journals FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN species ON treatments.species_id = species.id JOIN journals ON treatments.journals_id = journals.id WHERE treatments.id IN (SELECT treatments_id FROM tmp) GROUP BY year ORDER BY year ASC"
        },
        runparams: { biome: 'Temperate Conifer Forests%' }
      }
    },

    // 29
    {
      input: {
        resource: 'images',
        searchparams: 'biome=Temperate Broadleaf and Mixed Forests&yearlyCounts=true&page=1&size=30&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=httpUri&cols=caption'
      },
      wanted: {
        queries: {
          dropTmp: 'DROP TABLE IF EXISTS tmp',
          createTmp: 'CREATE TEMP TABLE tmp AS SELECT images.id AS images_id, images.httpUri, images.captionText, treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.zenodoDep, treatments.articleTitle, treatments.articleAuthor, images.treatments_id FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN materialCitations ON images.treatments_id = materialCitations.treatments_id JOIN geodata.biome_synonyms ON materialCitations.biomes_id = geodata.biome_synonyms.biomes_id WHERE biome_synonyms.biome_synonym LIKE @biome ORDER BY images_id ASC',
          createIndex: 'CREATE INDEX ix_tmp_treatments_id ON tmp(treatments_id)',
          count: 'SELECT Count(DISTINCT images_id) AS num_of_records FROM tmp',
          full: 'SELECT * FROM tmp LIMIT 30 OFFSET 0',
          yearlyCounts: "SELECT strftime( '%Y', treatments.checkinTime/1000, 'unixepoch' ) AS year, Count(DISTINCT images.id) AS num_of_images, Count(DISTINCT treatments.id) AS num_of_treatments, Count(DISTINCT species.id) AS num_of_species, Count(DISTINCT journals.id) AS num_of_journals FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN species ON treatments.species_id = species.id JOIN journals ON treatments.journals_id = journals.id WHERE treatments.id IN (SELECT treatments_id FROM tmp) GROUP BY year ORDER BY year ASC"
        },
        runparams: { biome: 'Temperate Broadleaf and Mixed Forests%' }
      }
    },

    // 30
    {
      input: {
        resource: 'images',
        searchparams: 'biome=Montane Grasslands and Shrublands&yearlyCounts=true&page=1&size=30&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=httpUri&cols=caption'
      },
      wanted: {
        queries: {
          dropTmp: 'DROP TABLE IF EXISTS tmp',
          createTmp: 'CREATE TEMP TABLE tmp AS SELECT images.id AS images_id, images.httpUri, images.captionText, treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.zenodoDep, treatments.articleTitle, treatments.articleAuthor, images.treatments_id FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN materialCitations ON images.treatments_id = materialCitations.treatments_id JOIN geodata.biome_synonyms ON materialCitations.biomes_id = geodata.biome_synonyms.biomes_id WHERE biome_synonyms.biome_synonym LIKE @biome ORDER BY images_id ASC',
          createIndex: 'CREATE INDEX ix_tmp_treatments_id ON tmp(treatments_id)',
          count: 'SELECT Count(DISTINCT images_id) AS num_of_records FROM tmp',
          full: 'SELECT * FROM tmp LIMIT 30 OFFSET 0',
          yearlyCounts: "SELECT strftime( '%Y', treatments.checkinTime/1000, 'unixepoch' ) AS year, Count(DISTINCT images.id) AS num_of_images, Count(DISTINCT treatments.id) AS num_of_treatments, Count(DISTINCT species.id) AS num_of_species, Count(DISTINCT journals.id) AS num_of_journals FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN species ON treatments.species_id = species.id JOIN journals ON treatments.journals_id = journals.id WHERE treatments.id IN (SELECT treatments_id FROM tmp) GROUP BY year ORDER BY year ASC"
        },
        runparams: { biome: 'Montane Grasslands and Shrublands%' }
      }
    },

    // 31
    {
      input: {
        resource: 'images',
        searchparams: 'biome=Mangroves&yearlyCounts=true&page=1&size=30&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=httpUri&cols=caption'
      },
      wanted: {
        queries: {
          dropTmp: 'DROP TABLE IF EXISTS tmp',
          createTmp: 'CREATE TEMP TABLE tmp AS SELECT images.id AS images_id, images.httpUri, images.captionText, treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.zenodoDep, treatments.articleTitle, treatments.articleAuthor, images.treatments_id FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN materialCitations ON images.treatments_id = materialCitations.treatments_id JOIN geodata.biome_synonyms ON materialCitations.biomes_id = geodata.biome_synonyms.biomes_id WHERE biome_synonyms.biome_synonym LIKE @biome ORDER BY images_id ASC',
          createIndex: 'CREATE INDEX ix_tmp_treatments_id ON tmp(treatments_id)',
          count: 'SELECT Count(DISTINCT images_id) AS num_of_records FROM tmp',
          full: 'SELECT * FROM tmp LIMIT 30 OFFSET 0',
          yearlyCounts: "SELECT strftime( '%Y', treatments.checkinTime/1000, 'unixepoch' ) AS year, Count(DISTINCT images.id) AS num_of_images, Count(DISTINCT treatments.id) AS num_of_treatments, Count(DISTINCT species.id) AS num_of_species, Count(DISTINCT journals.id) AS num_of_journals FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN species ON treatments.species_id = species.id JOIN journals ON treatments.journals_id = journals.id WHERE treatments.id IN (SELECT treatments_id FROM tmp) GROUP BY year ORDER BY year ASC"
        },
        runparams: { biome: 'Mangroves%' }
      }
    },

    // 32
    {
      input: {
        resource: 'images',
        searchparams: 'biome=Flooded Grasslands and Savannas&yearlyCounts=true&page=1&size=30&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=httpUri&cols=caption'
      },
      wanted: {
        queries: {
          dropTmp: 'DROP TABLE IF EXISTS tmp',
          createTmp: 'CREATE TEMP TABLE tmp AS SELECT images.id AS images_id, images.httpUri, images.captionText, treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.zenodoDep, treatments.articleTitle, treatments.articleAuthor, images.treatments_id FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN materialCitations ON images.treatments_id = materialCitations.treatments_id JOIN geodata.biome_synonyms ON materialCitations.biomes_id = geodata.biome_synonyms.biomes_id WHERE biome_synonyms.biome_synonym LIKE @biome ORDER BY images_id ASC',
          createIndex: 'CREATE INDEX ix_tmp_treatments_id ON tmp(treatments_id)',
          count: 'SELECT Count(DISTINCT images_id) AS num_of_records FROM tmp',
          full: 'SELECT * FROM tmp LIMIT 30 OFFSET 0',
          yearlyCounts: "SELECT strftime( '%Y', treatments.checkinTime/1000, 'unixepoch' ) AS year, Count(DISTINCT images.id) AS num_of_images, Count(DISTINCT treatments.id) AS num_of_treatments, Count(DISTINCT species.id) AS num_of_species, Count(DISTINCT journals.id) AS num_of_journals FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN species ON treatments.species_id = species.id JOIN journals ON treatments.journals_id = journals.id WHERE treatments.id IN (SELECT treatments_id FROM tmp) GROUP BY year ORDER BY year ASC"
        },
        runparams: { biome: 'Flooded Grasslands and Savannas%' }
      }
    },

    // 33
    {
      input: {
        resource: 'images',
        searchparams: 'biome=Tropical and Subtropical Grasslands, Savannas and Shrublands&yearlyCounts=true&page=1&size=30&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=httpUri&cols=caption'
      },
      wanted: {
        queries: {
          dropTmp: 'DROP TABLE IF EXISTS tmp',
          createTmp: 'CREATE TEMP TABLE tmp AS SELECT images.id AS images_id, images.httpUri, images.captionText, treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.zenodoDep, treatments.articleTitle, treatments.articleAuthor, images.treatments_id FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN materialCitations ON images.treatments_id = materialCitations.treatments_id JOIN geodata.biome_synonyms ON materialCitations.biomes_id = geodata.biome_synonyms.biomes_id WHERE biome_synonyms.biome_synonym LIKE @biome ORDER BY images_id ASC',
          createIndex: 'CREATE INDEX ix_tmp_treatments_id ON tmp(treatments_id)',
          count: 'SELECT Count(DISTINCT images_id) AS num_of_records FROM tmp',
          full: 'SELECT * FROM tmp LIMIT 30 OFFSET 0',
          yearlyCounts: "SELECT strftime( '%Y', treatments.checkinTime/1000, 'unixepoch' ) AS year, Count(DISTINCT images.id) AS num_of_images, Count(DISTINCT treatments.id) AS num_of_treatments, Count(DISTINCT species.id) AS num_of_species, Count(DISTINCT journals.id) AS num_of_journals FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN species ON treatments.species_id = species.id JOIN journals ON treatments.journals_id = journals.id WHERE treatments.id IN (SELECT treatments_id FROM tmp) GROUP BY year ORDER BY year ASC"
        },
        runparams: {
          biome: 'Tropical and Subtropical Grasslands, Savannas and Shrublands%'
        }
      }
    },

    // 34
    {
      input: {
        resource: 'images',
        searchparams: 'biome=Tropical and Subtropical Dry Broadleaf Forests&yearlyCounts=true&page=1&size=30&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=httpUri&cols=caption'
      },
      wanted: {
        queries: {
          dropTmp: 'DROP TABLE IF EXISTS tmp',
          createTmp: 'CREATE TEMP TABLE tmp AS SELECT images.id AS images_id, images.httpUri, images.captionText, treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.zenodoDep, treatments.articleTitle, treatments.articleAuthor, images.treatments_id FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN materialCitations ON images.treatments_id = materialCitations.treatments_id JOIN geodata.biome_synonyms ON materialCitations.biomes_id = geodata.biome_synonyms.biomes_id WHERE biome_synonyms.biome_synonym LIKE @biome ORDER BY images_id ASC',
          createIndex: 'CREATE INDEX ix_tmp_treatments_id ON tmp(treatments_id)',
          count: 'SELECT Count(DISTINCT images_id) AS num_of_records FROM tmp',
          full: 'SELECT * FROM tmp LIMIT 30 OFFSET 0',
          yearlyCounts: "SELECT strftime( '%Y', treatments.checkinTime/1000, 'unixepoch' ) AS year, Count(DISTINCT images.id) AS num_of_images, Count(DISTINCT treatments.id) AS num_of_treatments, Count(DISTINCT species.id) AS num_of_species, Count(DISTINCT journals.id) AS num_of_journals FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN species ON treatments.species_id = species.id JOIN journals ON treatments.journals_id = journals.id WHERE treatments.id IN (SELECT treatments_id FROM tmp) GROUP BY year ORDER BY year ASC"
        },
        runparams: { biome: 'Tropical and Subtropical Dry Broadleaf Forests%' }
      }
    },

    // 35
    {
      input: {
        resource: 'images',
        searchparams: 'biome=Tropical and Subtropical Coniferous Forests&yearlyCounts=true&page=1&size=30&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=httpUri&cols=caption'
      },
      wanted: {
        queries: {
          dropTmp: 'DROP TABLE IF EXISTS tmp',
          createTmp: 'CREATE TEMP TABLE tmp AS SELECT images.id AS images_id, images.httpUri, images.captionText, treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.zenodoDep, treatments.articleTitle, treatments.articleAuthor, images.treatments_id FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN materialCitations ON images.treatments_id = materialCitations.treatments_id JOIN geodata.biome_synonyms ON materialCitations.biomes_id = geodata.biome_synonyms.biomes_id WHERE biome_synonyms.biome_synonym LIKE @biome ORDER BY images_id ASC',
          createIndex: 'CREATE INDEX ix_tmp_treatments_id ON tmp(treatments_id)',
          count: 'SELECT Count(DISTINCT images_id) AS num_of_records FROM tmp',
          full: 'SELECT * FROM tmp LIMIT 30 OFFSET 0',
          yearlyCounts: "SELECT strftime( '%Y', treatments.checkinTime/1000, 'unixepoch' ) AS year, Count(DISTINCT images.id) AS num_of_images, Count(DISTINCT treatments.id) AS num_of_treatments, Count(DISTINCT species.id) AS num_of_species, Count(DISTINCT journals.id) AS num_of_journals FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN species ON treatments.species_id = species.id JOIN journals ON treatments.journals_id = journals.id WHERE treatments.id IN (SELECT treatments_id FROM tmp) GROUP BY year ORDER BY year ASC"
        },
        runparams: { biome: 'Tropical and Subtropical Coniferous Forests%' }
      }
    },

    // 36
    {
      input: { resource: 'treatments', searchparams: 'cols=&cacheDuration=1' },
      wanted: {
        queries: {
          dropTmp: false,
          createTmp: false,
          createIndex: false,
          count: 'SELECT Count(*) AS num_of_records FROM treatments',
          full: false
        },
        runparams: {}
      }
    },

    // 37
    {
      input: { resource: 'species', searchparams: 'cols=&cacheDuration=1' },
      wanted: {
        queries: {
          dropTmp: false,
          createTmp: false,
          createIndex: false,
          count: 'SELECT Count(*) AS num_of_records FROM species',
          full: false
        },
        runparams: {}
      }
    },

    // 38
    {
      input: { resource: 'treatments', searchparams: 'page=1&size=30&q=agosti&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=journalTitle&termFreq=true&yearlyCounts=true' },
      wanted: {
        queries: {
          dropTmp: 'DROP TABLE IF EXISTS tmp',
          createTmp: 'CREATE TEMP TABLE tmp AS SELECT treatments.id AS treatments_id, treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.zenodoDep, treatments.articleTitle, treatments.articleAuthor, journals.journalTitle FROM treatments JOIN treatmentsFts ON treatments.id = treatmentsFts.rowid JOIN journals ON treatments.journals_id = journals.id WHERE treatmentsFts.fulltext MATCH @q ORDER BY treatments_id ASC',
          createIndex: 'CREATE INDEX ix_tmp_treatments_id ON tmp(treatments_id)',
          count: 'SELECT Count(DISTINCT treatments_id) AS num_of_records FROM tmp',
          full: 'SELECT * FROM tmp LIMIT 30 OFFSET 0',
          termFreq: "SELECT journalYear, Count(doc) AS total, Sum( CASE WHEN images.httpUri IS NOT NULL THEN 1 ELSE 0 END ) AS withImages FROM treatmentsFtvins JOIN treatments ON treatmentsFtvins.doc = treatments.id LEFT JOIN images ON treatmentsFtvins.doc = images.treatments_id WHERE journalYear != '' AND term = @q GROUP BY journalYear ORDER BY journalYear ASC",
          
          yearlyCounts: "SELECT strftime( '%Y', treatments.checkinTime/1000, 'unixepoch' ) AS year, Count(DISTINCT treatments.id) AS num_of_treatments, Count(DISTINCT images.id) AS num_of_images, Count(DISTINCT species.id) AS num_of_species, Count(DISTINCT journals.id) AS num_of_journals FROM treatments LEFT JOIN images ON treatments.id = images.treatments_id JOIN species ON treatments.species_id = species.id JOIN journals ON treatments.journals_id = journals.id WHERE treatments.id IN (SELECT treatments_id FROM tmp) GROUP BY year ORDER BY year ASC"
        },
        runparams: {
            q: "agosti",
            cssClass: "hilite",
            sides: 50
        }
      }
    },

    // 38
    {
      input: { resource: 'treatments', searchparams: 'page=1&size=30&class=Actinopterygii&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=journalTitle&yearlyCounts=true' },
      wanted: {
        queries: {
          dropTmp: 'DROP TABLE IF EXISTS tmp',
          createTmp: 'CREATE TEMP TABLE tmp AS SELECT treatments.id AS treatments_id, treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.zenodoDep, treatments.articleTitle, treatments.articleAuthor, journals.journalTitle FROM treatments JOIN journals ON treatments.journals_id = journals.id JOIN classes ON treatments.classes_id = classes.id WHERE classes.class LIKE @class ORDER BY treatments_id ASC',
          createIndex: 'CREATE INDEX ix_tmp_treatments_id ON tmp(treatments_id)',
          count: 'SELECT Count(DISTINCT treatments_id) AS num_of_records FROM tmp',
          full: 'SELECT * FROM tmp LIMIT 30 OFFSET 0',
          yearlyCounts: "SELECT strftime( '%Y', treatments.checkinTime/1000, 'unixepoch' ) AS year, Count(DISTINCT treatments.id) AS num_of_treatments, Count(DISTINCT images.id) AS num_of_images, Count(DISTINCT species.id) AS num_of_species, Count(DISTINCT journals.id) AS num_of_journals FROM treatments LEFT JOIN images ON treatments.id = images.treatments_id JOIN species ON treatments.species_id = species.id JOIN journals ON treatments.journals_id = journals.id WHERE treatments.id IN (SELECT treatments_id FROM tmp) GROUP BY year ORDER BY year ASC"
        },
        runparams: {
            class: "Actinopterygii%"
        }
      }
    },

    // 39
    {

      // searchparams: 'page=1&size=30&class=Actinopterygii&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=httpUri&cols=caption&cols=latitude&cols=longitude&yearlyCounts=true'

      input: { resource: 'images', searchparams: 'page=1&size=30&kingdom=foo&cols=httpUri&cols=treatments_id&cols=caption&yearlyCounts=true' },
      wanted: {
        queries: {
          dropTmp: 'DROP TABLE IF EXISTS tmp',
          createTmp: 'CREATE TEMP TABLE tmp AS SELECT images.id AS images_id, images.httpUri, images.captionText, images.treatments_id FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN kingdoms ON treatments.kingdoms_id = kingdoms.id WHERE kingdoms.kingdom LIKE @kingdom ORDER BY images_id ASC',
          createIndex: 'CREATE INDEX ix_tmp_treatments_id ON tmp(treatments_id)',
          count: 'SELECT Count(DISTINCT images_id) AS num_of_records FROM tmp',
          full: 'SELECT * FROM tmp LIMIT 30 OFFSET 0',
          yearlyCounts: "SELECT strftime( '%Y', treatments.checkinTime/1000, 'unixepoch' ) AS year, Count(DISTINCT images.id) AS num_of_images, Count(DISTINCT treatments.id) AS num_of_treatments, Count(DISTINCT species.id) AS num_of_species, Count(DISTINCT journals.id) AS num_of_journals FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN species ON treatments.species_id = species.id JOIN journals ON treatments.journals_id = journals.id WHERE treatments.id IN (SELECT treatments_id FROM tmp) GROUP BY year ORDER BY year ASC"
        },
        runparams: {
            kingdom: "foo%"
        }
      }
    },

    // 40
    {

      input: { resource: 'images', searchparams: 'page=1&size=30&collectionCode=MfN&refreshCache=true&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=httpUri&cols=caption&cols=latitude&cols=longitude&yearlyCounts=true' },
      wanted: {
        queries: {
          dropTmp: 'DROP TABLE IF EXISTS tmp',
          createTmp: 'CREATE TEMP TABLE tmp AS SELECT images.id AS images_id, images.httpUri, images.captionText, images.treatments_id FROM images JOIN materialCitations ON images.treatments_id = materialCitations.treatments_id JOIN materialCitations_collectionCodes ON materialCitations.id = materialCitations_collectionCodes.materialCitations_id JOIN collectionCodes ON materialCitations_collectionCodes.collectionCodes_id = collectionCodes.id WHERE collectionCodes.collectionCode LIKE @collectionCode ORDER BY images_id ASC',
          createIndex: 'CREATE INDEX ix_tmp_treatments_id ON tmp(treatments_id)',
          count: 'SELECT Count(DISTINCT images_id) AS num_of_records FROM tmp',
          full: 'SELECT * FROM tmp LIMIT 30 OFFSET 0',
          yearlyCounts: "SELECT strftime( '%Y', treatments.checkinTime/1000, 'unixepoch' ) AS year, Count(DISTINCT images.id) AS num_of_images, Count(DISTINCT treatments.id) AS num_of_treatments, Count(DISTINCT species.id) AS num_of_species, Count(DISTINCT journals.id) AS num_of_journals FROM images JOIN treatments ON images.treatments_id = treatments.id JOIN species ON treatments.species_id = species.id JOIN journals ON treatments.journals_id = journals.id WHERE treatments.id IN (SELECT treatments_id FROM tmp) GROUP BY year ORDER BY year ASC"
        },
        runparams: {
          collectionCode: "foo%"
        }
      }
    },
];

// tests.forEach((test, i) => {
//     if (i === 41) {
//       //tap.test(`test ${i}`, tap => {
//         const params = preZql(test.input.searchparams);
//         const found = zql({ resource: test.input.resource, params });
//         console.log(found)
//         // tap.same(found, test.wanted);
//         // tap.end();
//       //});
//     }
// });

const resource = 'images';
const searchparams = 'biome=pampas';
const params = preZql({ resource, searchparams });
const found = zql({ resource, params });
console.log(found)
