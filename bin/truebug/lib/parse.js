'use strict'

const fs = require('fs')
const path = require('path')

const progress = require('progress')
const cheerio = require('cheerio')
const chance = require('chance').Chance()

const config = require('config')
const DUMP = config.get('truebug.treatmentsDump')

const { timerFormat } = require('../../../lib/utils')

const { getSqlCols } = require('../../../data-dictionary/dd-utils')
const rearrangeFiles = require('./rearrange')

const {
    //createTables,
    insertData,
    loadFTS,
    // loadFTSTreatments,
    // loadFTSFigureCitations,
    // loadFTSBibRefCitations,
    buildIndexes,
    selCountOfTreatments
} = require('./database')

/*
 * One treatment has several attributes plus
 *      0 or more treatmentCitations
 *      0 or more treatmentAuthors
 *      0 or more materialCitations
 *      0 or more bibRefCitations
 *      0 or more figureCitations
 * 
 * The last three (materialCitations, bibRefCitations, and figureCitations) 
 * are similar to each other in that they contain only attributes from the 
 * XML tagged sections. So we can combine their extraction logic into a 
 * common function called 'parseSectionWithAttribs()'
 * 
 * The treatment data structure looks as follows
 * 
 * treatment = {
 *      treatment: {},
 *      treatmentCitations: [ {}, {}, … ],
 *      treatmentAuthors: [ {}, {}, … ],
 *      materialsCitations: [ {}, {}, … ],
 *      bibRefCitations: [ {}, {}, … ],
 *      figureCitations: [ {}, {}, … ]
 * }
 */

// used to store statistics after every transaction
// const extracted = {
//     treatments: 0,
//     treatmentCitations: 0,
//     treatmentAuthors: 0,
//     materialsCitations: 0,
//     figureCitations: 0,
//     bibRefCitations: 0
// }

const stats = function(treatments, endProc, parsed) {
    
    let i = 0;
    let j = treatments.length;

    parsed.treatments = parsed.treatments + j;

    for (; i < j; i++) {

        const treatment = treatments[i];

        if (treatment.treatmentCitations) {
            parsed.treatmentCitations = parsed.treatmentCitations + treatment.treatmentCitations.length;
        }

        if (treatment.treatmentAuthors) {
            parsed.treatmentAuthors = parsed.treatmentAuthors + treatment.treatmentAuthors.length;
        }

        if (treatment.materialsCitations) {
            parsed.materialsCitations = parsed.materialsCitations + treatment.materialsCitations.length;
        }

        if (treatment.collectionCodes) {
            parsed.collectionCodes = parsed.collectionCodes + treatment.collectionCodes.length;
        }

        if (treatment.figureCitations) {
            parsed.figureCitations = parsed.figureCitations + treatment.figureCitations.length;
        }

        if (treatment.bibRefCitations) {
            parsed.bibRefCitations = parsed.bibRefCitations + treatment.bibRefCitations.length;
        }

    }

    //return JSON.stringify(extracted, null, '\t');
};

const parseOne = function(treatmentId) {
    const xml = fs.readFileSync(`${DUMP}/${treatmentId + '.xml'}`, 'utf8');
    return cheerioparse(xml, treatmentId);    
};

// As to the deleted (or retired, or whatever) elements: they are marked with a deleted attribute bearing value true. In addition, they also have deleteUser, deleteTime, and deleteVersion attributes.

const parseTreatmentCitations = function($, treatmentId) {
    let tc = [];
    const trecitgroups = $('treatmentCitationGroup', 'subSubSection[type=reference_group]');
    
    if (trecitgroups.length) {
        
        let i = 0;
        let j = trecitgroups.length;

        for (; i < j; i++) {
            const trecitgroup = $(trecitgroups[i]);
            const taxonomicName = $('taxonomicName', trecitgroup);            
            let tname = Array.isArray(taxonomicName) ? taxonomicName[0] : taxonomicName;

            let tcPrefixArray = [];
            tcPrefixArray.push(tname.text().trim());
            tcPrefixArray.push(tname.attr('authorityName') + ',');
            tcPrefixArray.push(tname.attr('authorityYear'));

            let tcPrefix = tcPrefixArray.join(' ');
            
            const treatmentCitations = $('treatmentCitation', trecitgroup);

            let treatmentCitation;
            const l = treatmentCitations.length;
            if (l) {

                for (let k = 0; k < l; k++) {
                    treatmentCitation = tcPrefix;

                    const bib = $('bibRefCitation', treatmentCitations[k]);
                    if (k > 0) {
                        treatmentCitation += ' sec. ' + bib.text();
                    }

                    let deleted = 0;
                    if (bib.attr('deleted') && (bib.attr('deleted') === 'true')) {
                        deleted = 1;
                    }

                    tc.push({
                        treatmentCitationId: bib.attr('id') || chance.guid(),
                        treatmentId: treatmentId,
                        treatmentCitation: treatmentCitation,
                        refString: bib.attr('refString'),
                        updateVersion: bib.attr('updateVersion'),
                        deleted: deleted
                    });
                }
            }
            else {
                treatmentCitation = tcPrefix;

                const bib = $('bibRefCitation', treatmentCitations);
                if (bib) {
                    treatmentCitation += ' sec. ' + bib.text()
                }

                let deleted = 0;
                if (bib.attr('deleted') && (bib.attr('deleted') === 'true')) {
                    deleted = 1;
                }

                tc.push({
                    treatmentCitationId: bib.attr('id') || chance.guid(),
                    treatmentId: treatmentId,
                    treatmentCitation: treatmentCitation,
                    refString: bib.attr('refString'),
                    updateVersion: bib.attr('updateVersion'),
                    deleted: deleted
                });
            }
        }
        
    }

    return tc;

};

const parseTreatmentAuthors = function($, treatmentId) {
    const treaut = $('mods\\:mods mods\\:name[type=personal]');
    
    let ta = [];

    if (treaut.length) {
        for (let i = 0, j = treaut.length; i < j; i++) {
            const role = $('mods\\:role mods\\:roleTerm', treaut[i]).text();
            
            if (role === 'Author') {
                let deleted = 0;
                if ($('mods\\:namePart', treaut[i]).attr('deleted') && ($('mods\\:namePart', treaut[i]).attr('deleted') === 'true')) {
                    deleted = 1;
                }

                ta.push({
                    treatmentAuthorId: $('mods\\:namePart', treaut[i]).attr('id') || chance.guid(),
                    treatmentId: treatmentId,
                    treatmentAuthor: $('mods\\:namePart', treaut[i]).text() || '',
                    updateVersion: $('mods\\:namePart', treaut[i]).attr('updateVersion'),
                    deleted: deleted
                })
            }
        }
    }

    return ta;
};

const _parse = function($, elements, parts, partId, treatmentId) {
    const num = elements.length;
    let entries = [];

    const allCols = getSqlCols(parts)

    if (num) {
        for (let i = 0; i < num; i++) {

            const missingAttr = [];
            const entry = {};

            allCols.forEach(el => {
                if (el.cheerio) {
                    const attr = $(elements[i]).attr(el.name)
                    if (attr) {
                        entry[el.name] = attr
                    }
                    else {
                        entry[el.name] = ''
                        missingAttr.push(el.name)
                    }
                }
            })

            let deleted = 0
            if ($(elements[i]).attr('deleted') && ($(elements[i]).attr('deleted') === 'true')) {
                deleted = 1
            }

            entry[partId] = $(elements[i]).attr('id') || chance.guid()
            entry.treatmentId = treatmentId
            entry.updateVersion = $(elements[i]).attr('updateVersion') || ''
            entry.deleted = deleted

            entries.push(entry)
        }
    }

    return entries
};

const parseBibRefCitations = function($, treatmentId) {
    const elements = $('bibRefCitation');
    return _parse($, elements, 'bibRefCitations', 'bibRefCitationId', treatmentId);  
};

const parseFigureCitations = function($, treatmentId) {
    const elements = $('figureCitation');
    return _parse($, elements, 'figureCitations', 'figureCitationId', treatmentId);
};

const parseMaterialsCitations = function($, treatmentId) {
    const elements = $('materialsCitation');
    //return _parse($, elements, 'materialsCitations', 'materialsCitationId', treatmentId);

    const num = elements.length;
    const collectionCodes = []
    const entries = []
    const mc = []

    const allCols = getSqlCols('materialsCitations')

    if (num) {
        for (let i = 0; i < num; i++) {

            const missingAttr = [];
            const entry = {};

            const mId = $(elements[i]).attr('id')

            allCols.forEach(el => {
                if (el.cheerio) {
                    const attr = $(elements[i]).attr(el.name)
                    
                    if (attr) {
                        if (el.name === 'collectionCode') {
                            const cc = attr.split(', ')
                            collectionCodes.push( ...cc )

                            cc.forEach(c => {
                                mc.push({ 
                                    materialsCitationId: mId,
                                    collectionCode: c
                                })
                            })  
                        }
                        else {
                            entry[el.name] = attr
                        }
                        
                    }
                    else {
                        entry[el.name] = ''
                        missingAttr.push(el.name)
                    }
                }
            })

            let deleted = 0
            if ($(elements[i]).attr('deleted') && ($(elements[i]).attr('deleted') === 'true')) {
                deleted = 1
            }

            entry['materialsCitationId'] = $(elements[i]).attr('id') || chance.guid()
            entry.treatmentId = treatmentId
            entry.updateVersion = $(elements[i]).attr('updateVersion') || ''
            entry.deleted = deleted

            entries.push(entry)
        }
    }

    // create an array of hashes of unique collection codes
    // [ {'cc': <code1>}, {'cc': <code2}, … ]
    //
    // see https://stackoverflow.com/a/14438954/183692 for `filter` method to 
    // create uniq array
    const ccs = collectionCodes
        .filter((v, i, s) => { return s.indexOf(v) === i })
        .map(e => { return { collectionCode: e } })

    return [entries, mc, ccs]
};

const parseTreatment = function($, treatmentId) {
        
    let treatment = {};
    
    const allCols = getSqlCols('treatments')

    allCols.forEach(el => {
        if (el.cheerio) {
            let val = eval(el.cheerio) || ''

            if (val) {
                if (el.name === 'treatmentId') {
                    val = treatmentId
                }
                else if (el.name === 'deleted') {
                    val = val && val === 'true' ? 1 : 0
                }
                
                treatment[el.name] = typeof val === 'string' ? val.trim() : val
            }
            else {
                if (el.name === 'deleted') {
                    val = 0
                }
                
                treatment[el.name] = val
            }
        }
    })

    return treatment
}

const getLatest = function(array, groupByKey, versionKey) {

    // remove any empty objects
    array = array.filter((el) => Object.keys(el).length > 0);
    
    const tmp = array.reduce((accumulator, currentValue, currentIndex, array) => {
        (accumulator[ currentValue[groupByKey] ] = accumulator[ currentValue[groupByKey] ] || []).push(currentValue);
        return accumulator;
    }, {});

    const reducer = (accumulator, currentValue, currentIndex, array) => {
        if (accumulator[versionKey] > currentValue[versionKey]) {
            return accumulator;
        }
        else {
            return currentValue;
        }
    };

    const latest = [];
    Object.values(tmp).forEach(el => {
        const reduced = el.reduce(reducer);
        delete(reduced[versionKey]);
        latest.push(reduced);
    });

    return latest;
};

const cheerioparse = function(xml, treatmentId) {
    const $ = cheerio.load(xml, {
        normalizeWhitespace: true,
        xmlMode: true
    });

    //const report = {};
    const treatment = {};
    treatment.treatment = parseTreatment($, treatmentId);

    // The following two functions are used to filter out any 
    // empty objects returned from parsing, and to add the 
    // 'treatmentId' to each remaining object so it can be 
    // used as a foreign key to connect the object to the 
    // parent treatment
    const emptyObjs = (el) => Object.keys(el).length > 0;
    const addTreatmentId = (el) => el.treatmentId = treatmentId;

    treatment.treatmentAuthors = parseTreatmentAuthors($, treatmentId)
    treatment.treatmentCitations = parseTreatmentCitations($, treatmentId)
    treatment.bibRefCitations = parseBibRefCitations($, treatmentId)
    treatment.figureCitations = parseFigureCitations($, treatmentId)
    const arr = parseMaterialsCitations($, treatmentId)
    treatment.materialsCitations = arr[0]
    treatment.materialsCitationsXcollectionCodes = arr[1]
    treatment.collectionCodes = arr[2]


    // const ta = parseTreatmentAuthors($, treatmentId);
    // if (ta.length) {
    //     treatment.treatmentAuthors = getLatest(ta, 'treatmentAuthorId', 'updateVersion');
    // }

    // const tc = parseTreatmentCitations($, treatmentId);
    // if (tc.length) {
    //     treatment.treatmentCitations = getLatest(tc, 'treatmentCitationId', 'updateVersion');
    // }

    // const br = parseBibRefCitations($, treatmentId);
    // if (br.length) {
    //     treatment.bibRefCitations = getLatest(br, 'bibRefCitationId', 'updateVersion');
    // }

    // const fc = parseFigureCitations($, treatmentId);
    // if (fc.length) {
    //     treatment.figureCitations = getLatest(fc, 'figureCitationId', 'updateVersion');
    // }
    
    // const mc = parseMaterialsCitations($, treatmentId);
    // if (mc.length) {
    //     treatment.materialsCitations = getLatest(mc, 'materialsCitationId', 'updateVersion');
    // }
    
    return treatment;
};

const parse = function(opts) {
    console.log('parsing')

    // if 'n' is a 32 character string, we assume it is an XML id
    // hence, a single XML to be parsed
    if (/^[A-Za-z0-9]{32}$/.test(opts.source)) {
        console.log(`   - going to parse treatment ${opts.source}`)
        const treatment = parseOne(opts.source)
        stats(treatment, true, opts.etl.parsed)
        console.log('----------------------------------------\n')
        console.log(treatment);
    }

    // 'n' is either a number (number of treatments to parse) or 
    // it is a string such as 'full' or 'diff', in which case, we 
    // find out the number of treatments to parse (effectively 'n')
    // by finding the number of treatments in the dump directory
    else {

        // const start = new Date().getTime();
        const xmlsArr = fs.readdirSync(DUMP)
        let i = 0
        let j = typeof(n) === 'number' ? n : xmlsArr.length

        /**************************************************************
         * 
         * update the progress bar every x% of the total num of files
         * but x% of j should not be more than 5000 because we don't 
         * want to insert more than 5K records at a time.
         * 
         **************************************************************/
        
        let batch = 1
        if (j > 50 && j < 5000) {
            batch = Math.floor(j / 10)
        }
        else if (j > 5000) {
            batch = 5000
        }

        const tickInterval = Math.floor( j / batch );
        const bar = new progress('     processing [:bar] :rate files/sec :current/:total done (:percent) time left: :etas', {
            complete: '=',
            incomplete: ' ',
            width: 30,
            total: j
        })
    
        
        let treatments = []
        let endProc = false

        console.log(`   - parsing XMLs and inserting into the db ${batch} at a time`)
        for (; i < j; i++) {

            if (i == (j - 1)) {
                endProc = true;
            }

            // update progress bar every tickInterval
            if (!(i % tickInterval)) {
                bar.tick(tickInterval)
            }

            if (opts.rearrange) {

                // rearrange XMLs into a hierachical structure
                const file = xmlsArr[i]
                rearrangeFiles({ opts, file })
            }

            const treatmentId = path.basename(xmlsArr[i], '.xml');
            const treatment = parseOne(treatmentId)
            treatments.push(treatment);
        
            if (!(i % batch)) {

                //bar.interrupt(stats(treatments, endProc) + '\n');
                stats(treatments, endProc, opts.etl.parsed)

                if (opts.database) {
                    insertData(opts, treatments)
                }
                
                // empty the treatments for the next batch
                treatments = []
            }

            
        }

        stats(treatments, endProc, opts.etl.parsed);
        console.log('   - finished')

        if (opts.database) {
            insertData(opts, treatments)

            opts.fts = ['vtreatments', 'vfigurecitations', 'vbibrefcitations']
            loadFTS(opts)
            // loadFTSTreatments(opts)
            // loadFTSFigureCitations(opts)
            // loadFTSBibRefCitations(opts)

            opts.etl.loaded = selCountOfTreatments() - opts.etl.loaded
            buildIndexes(opts)
        }
    }

    console.log('\n')
    console.log('='.repeat(75))
}

module.exports = parse