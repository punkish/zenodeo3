'use strict';

import * as utils from './utils.js';

import fs from 'fs';
import path from 'path';
//import isSea from 'is-sea';
import * as cheerio from 'cheerio';
import Chance from 'chance';
const chance = Chance();

import { Config } from '@punkish/zconfig';
const config = new Config().settings;
const truebug = config.truebug;
const ts = truebug.steps.parse;

import { dispatch as ddutils } from '../../../data-dictionary/dd-utils.js';

const logOpts = JSON.parse(JSON.stringify(config.truebug.log));
logOpts.name = 'TRUEBUG:PARSE';
import { Zlogger } from '@punkish/zlogger';
const log = new Zlogger(logOpts);

const stats = {
    treatments: 0,
    treatmentCitations: 0,
    materialsCitations: 0,
    figureCitations: 0,
    bibRefCitations: 0
}

const calcStats = (treatment) => {
    const fn = 'calcStats';
    if (!ts[fn]) return;
    utils.incrementStack(logOpts.name, fn);

    stats.treatments++;

    stats.treatmentCitations += treatment.treatmentCitations 
        ? treatment.treatmentCitations.length 
        : 0;

    stats.materialsCitations += treatment.materialsCitations 
        ? treatment.materialsCitations.length 
        : 0;

    stats.figureCitations += treatment.figureCitations 
        ? treatment.figureCitations.length 
        : 0;

    stats.bibRefCitations += treatment.bibRefCitations 
        ? treatment.bibRefCitations.length 
        : 0;
}

const _parseTreatmentCitations = function($, treatmentId) {
    const fn = '_parseTreatmentCitations';
    utils.incrementStack(logOpts.name, fn);

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
            const tlen = treatmentCitations.length;
            if (tlen) {
                for (let k = 0; k < tlen; k++) {
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
}

const _parseTreatmentAuthors = function($, treatmentId) {
    const fn = '_parseTreatmentAuthors';
    utils.incrementStack(logOpts.name, fn);

    const treaut = $('mods\\:mods mods\\:name[type=personal]');
    
    let ta = [];

    if (treaut.length) {
        for (let i = 0, j = treaut.length; i < j; i++) {
            const role = $('mods\\:role mods\\:roleTerm', treaut[i]).text();
            
            if (role === 'Author') {
                const delExists = $('mods\\:namePart', treaut[i]).attr('deleted');
                const isDel = ($('mods\\:namePart', treaut[i]).attr('deleted') === 'true');
                const deleted = delExists && isDel ? 1 : 0;

                ta.push({
                    treatmentAuthorId: $('mods\\:namePart', treaut[i]).attr('id') || chance.guid(),
                    treatmentId,
                    treatmentAuthor: $('mods\\:namePart', treaut[i]).text() || '',
                    updateVersion: $('mods\\:namePart', treaut[i]).attr('updateVersion'),
                    deleted
                })
            }
        }
    }

    return ta;
};

const _parse = function($, part, parts, partId, treatmentId) {
    const fn = '_parse';
    utils.incrementStack(logOpts.name, fn);

    const elements = $(part)
    const num = elements.length;
    let entries = [];

    const allCols = ddutils.getSqlCols(parts)

    if (num) {
        for (let i = 0; i < num; i++) {
            const e = elements[i]

            const missingAttr = [];
            const entry = {};

            allCols.forEach(el => {
                if (el.cheerio) {
                    const attr = $(e).attr(el.name)
                    if (attr) {
                        entry[el.name] = attr;
                    }
                    else {
                        entry[el.name] = '';
                        missingAttr.push(el.name);
                    }
                }
            })

            let deleted = 0
            if ($(e).attr('deleted') && ($(e).attr('deleted') === 'true')) {
                deleted = 1
            }

            entry[partId] = $(e).attr('id') || chance.guid();
            entry.treatmentId = treatmentId;
            entry.updateVersion = $(e).attr('updateVersion') || '';
            entry.deleted = deleted;
            //entry[part] = $(e).text()
            entry.fulltext = $(e).text();

            entries.push(entry);
        }
    }

    return entries
};

const _parseBibRefCitations = function($, treatmentId) {
    const fn = '_parseBibRefCitations';
    utils.incrementStack(logOpts.name, fn);

    //const elements = $('bibRefCitation');
    return _parse($, 'bibRefCitation', 'bibRefCitations', 'bibRefCitationId', treatmentId);  
}

const _parseFigureCitations = function($, treatmentId) {
    const fn = '_parseFigureCitations';
    utils.incrementStack(logOpts.name, fn);

    const entries = []
    const elements = $('figureCitation')
    const num = elements.length

    if (num) {
        const allCols = ddutils.getSqlCols('figureCitations')
        
        for (let i = 0; i < num; i++) {
            if (elements[i].parent.name !== 'updateHistory') {
                const el = elements[i]
                const fc_keys = Object.keys(el.attribs)
                let num_of_explosions = 0
                const cols_to_explode = {}
                const entry = {}

                allCols.forEach(col => {
                    if (col.cheerio) {
                        const matched = fc_keys.filter(key => key.match(new RegExp('^' + col.name + '-[0-9]+', 'gi')))
                        num_of_explosions = matched.length
                        cols_to_explode[col.name] = num_of_explosions ? matched : ''
                        entry[col.name] = $(el).attr(col.name)
                    }
                })

                //console.log(`figureCitationId: ${$(el).attr('id')}`)
                //console.log(cols_to_explode)

                if (num_of_explosions) {
                    for (let i = 0; i < num_of_explosions; i++) {
                        const entry = {
                            figureCitationId: $(el).attr('id') || chance.guid(),
                            treatmentId: treatmentId,
                            figureNum: i
                        }

                        if (cols_to_explode.httpUri) {
                            entry.httpUri = $(el).attr(cols_to_explode.httpUri[i]) || ''
                        }
                        else {
                            entry.httpUri = ''
                        }

                        if (cols_to_explode.captionText) {
                            entry.captionText = $(el).attr(cols_to_explode.captionText[i]) || ''
                        }
                        else {
                            entry.captionText = ''
                        }

                        // if (cols_to_explode.figureDoi) {
                        //     entry.figureDoi = $(el).attr(cols_to_explode.figureDoi[i]) || ''
                        // }
                        // else {
                        //     entry.figureDoi = ''
                        // }

                        entry.updateVersion = $(el).attr('updateVersion') || '';
                        entry.deleted = $(el).attr('deleted') && ($(el).attr('deleted') === 'true') ? 1 : 0;
                        entry.fulltext = $(el).text();
                        entries.push(entry);
                    }
                }
                else {
                    entry.figureCitationId = $(el).attr('id') || chance.guid();
                    entry.treatmentId = treatmentId;
                    entry.figureNum = 0;
                    entry.httpUri = $(el).attr('httpUri') || '';
                    entry.captionText = $(el).attr('captionText') || '';
                    entry.figureDoi = $(el).attr('figureDoi') || '';
                    entry.updateVersion = $(el).attr('updateVersion') || '';
                    entry.deleted = $(el).attr('deleted') && ($(el).attr('deleted') === 'true') ? 1 : 0;
                    entry.fulltext = $(el).text();
                    entries.push(entry);
                }
            }
        }
    }

    return entries
}

// const isValidGeo = (latitude, longitude) => {
//     const latIsGood = isFinite(latitude) && Math.abs(latitude) <= 90;
//     const lngIsGood = isFinite(longitude) && Math.abs(longitude) <= 180;
//     return latIsGood && lngIsGood ? 1 : 0;
// }

// const isOnLand = (latitude, longitude) => {
//     if (isValidGeo(latitude, longitude)) {
//         return isSea(latitude, longitude) ? 0 : 1;
//     }
// }

const _parseMaterialsCitations = function($, treatmentId) {
    const fn = '_parseMaterialsCitations';
    utils.incrementStack(logOpts.name, fn);

    /** 
     * see note below on naming
     */
    const elements = $('materialsCitation');

    const num = elements.length;
    const collectionCodes = [];
    const entries = [];
    const mc = [];

    /**
     * Note on name
     * ------------------------------------------------------------
     * we now use 'materialCitations' instead of 'materialsCitation'
     * because that is what TDWG has accepted as a name. However, 
     * for historical reasons, the xml tag is 'materialsCitation', 
     * hence the db table definitions use 'materialsCitation'
     */
    const allCols = ddutils.getSqlCols('materialCitations')

    if (num) {
        for (let i = 0; i < num; i++) {
            const e = elements[i]
            const entry = {};
            const materialsCitationId = $(e).attr('id')

            allCols.forEach(col => {
                if (col.cheerio) {
                    const attr = $(e).attr(col.name);

                    let key = col.name;
                    if (key === 'specimenCount-female') {
                        key = 'specimenCountFemale';
                    }
                    else if (key === 'specimenCount-male') {
                        key = 'specimenCountMale';
                    }

                    if (attr) {
                        entry[key] = attr;

                        if (col.name === 'collectionCode') {
                            const cc = attr.split(', ');
                            collectionCodes.push( ...cc );

                            cc.forEach(collectionCode => {
                                mc.push({ 
                                    materialsCitationId,
                                    collectionCode
                                })
                            })  
                        }
                    }
                    else {
                        entry[key] = '';
                    }
                }
            })

            //entry.isOnLand = isOnLand(entry.latitude, entry.longitude);
            entry.materialsCitationId = materialsCitationId || chance.guid();
            entry.treatmentId = treatmentId;
            entry.updateVersion = $(e).attr('updateVersion') || '';
            const deleted = $(e).attr('deleted');
            entry.deleted = deleted && deleted === 'true' ? 1 : 0;
            entry.fulltext = $(e).text();
            
            entries.push(entry);
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

const _parseTreatment = function($, treatmentId) {
    const fn = '_parseTreatment';
    utils.incrementStack(logOpts.name, fn);

    let treatment = {};
    
    const allCols = ddutils.getSqlCols('treatments')
    allCols.forEach(el => {
        
        if (el.cheerio) {
            let val;

            try {
                val = eval(el.cheerio) || '';
            } 
            catch(error) {
                log.error(error);
                log.info(`el.cheerio: ${el.cheerio}`);
                log.info(`treatmentId: ${treatmentId}`);
            }

            if (val) {
                if (el.name === 'treatmentId') {
                    val = treatmentId;
                }
                else if (el.name === 'deleted') {
                    val = val && val === 'true' ? 1 : 0;
                }
                
                treatment[el.name] = typeof val === 'string' ? val.trim() : val;
            }
            else {
                if (el.name === 'deleted') {
                    val = 0;
                }
                
                treatment[el.name] = val;
            }
        }
        
    })

    return treatment;
}

const _cheerioparse = function(xml, treatmentId) {
    const fn = '_cheerioparse';
    utils.incrementStack(logOpts.name, fn);

    const cheerioOpts = { normalizeWhitespace: true, xmlMode: true };
    const $ = cheerio.load(xml, cheerioOpts, false);

    const [
        materialsCitations, 
        materialsCitations_x_collectionCodes, 
        collectionCodes
    ] = _parseMaterialsCitations($, treatmentId);

    // return a complete treatment
    return {
        treatment: _parseTreatment($, treatmentId),
        treatmentAuthors: _parseTreatmentAuthors($, treatmentId),
        treatmentCitations: _parseTreatmentCitations($, treatmentId),
        bibRefCitations: _parseBibRefCitations($, treatmentId),
        figureCitations: _parseFigureCitations($, treatmentId),
        materialsCitations,
        materialsCitations_x_collectionCodes,
        collectionCodes
    };

    // The following two functions are used to filter out any 
    // empty objects returned from parsing, and to add the 
    // 'treatmentId' to each remaining object so it can be 
    // used as a foreign key to connect the object to the 
    // parent treatment
    // const emptyObjs = (el) => Object.keys(el).length > 0;
    // const addTreatmentId = (el) => el.treatmentId = treatmentId;
}

const _treatmentIdRegex = RegExp(/[^a-zA-Z0-9]/, 'g');

const parseOne = (typeOfArchive, xml) => {
    const fn = 'parseOne';
    if (!ts[fn]) return true;
    utils.incrementStack(logOpts.name, fn);

    const treatmentId = path.basename(xml, '.xml');

    if (treatmentId.length != 32 || !_treatmentIdRegex.test(treatmentId)) {
        const treatmentXml = `${truebug.dirs.dumps}/${typeOfArchive}/${xml}`;
        
        const treatment = _cheerioparse(
            fs.readFileSync(treatmentXml, 'utf8'), 
            treatmentId
        );
        
        return treatment;
    }
    else {
        log.error(`file ${xml} doesn't look like a treatment`)
    }
}

export { stats, parseOne, calcStats }