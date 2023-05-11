'use strict';

import * as utils from '../../../lib/utils.js';
import * as tbutils from './utils.js';

import process from 'node:process';
import fs from 'fs';
import path from 'path';
import isSea from 'is-sea';

// see https://github.com/cheeriojs/cheerio/issues/2786#issuecomment-1288843071
import * as cheerio from 'cheerio';

import Chance from 'chance';
const chance = Chance();

import { Config } from '@punkish/zconfig';
const config = new Config().settings;
const truebug = config.truebug;
const ts = truebug.steps.parse;

import { ddutils } from '../../../data-dictionary/utils/index.js';

// get and cache allCols for later use
const allCols = {
    tr                : ddutils.getDOM('treatments'),
    treatments        : ddutils.getXmlCols('treatments'),
    bibRefCitations   : ddutils.getCols('bibRefCitations'),
    figureCitations   : ddutils.getCols('figureCitations'),
    materialCitations : ddutils.getCols('materialCitations'),
    collectionCodes   : ['country', 'name', 'lsid', 'type'],
    treatmentCitations: ddutils.getCols('treatmentCitations'),
    treatmentAuthors  : ddutils.getCols('treatmentAuthors')
};

const logOpts = JSON.parse(JSON.stringify(truebug.log));
logOpts.name = 'TB:PARSE';
import { Zlogger } from '@punkish/zlogger';
const log = new Zlogger(logOpts);

// const cleanText = (str) => {
//     const fn = 'cleanText';
//     if (!ts[fn]) return;
//     tbutils.incrementStack(logOpts.name, fn);

//     if (str) {
//         //str = str.replace(utils.re.linebreaks, ' ');
//         str = str.replace(utils.re.double_spc, ' ');
//         str = str.replace(utils.re.space_comma, ',');
//         str = str.replace(utils.re.space_colon, ':');
//         str = str.replace(utils.re.space_period, '.');
//         str = str.replace(utils.re.openparens_space, '(');
//         str = str.replace(utils.re.space_closeparens, ')');
//         str = str.trim();
//         return str;
//     }
    
//     return '';
// }

const calcStats = (treatment, stats) => {
    const fn = 'calcStats';
    if (!ts[fn]) return;
    tbutils.incrementStack(logOpts.name, fn);

    stats.etl.treatments++;

    stats.etl.treatmentCitations += treatment.treatmentCitations 
        ? treatment.treatmentCitations.length 
        : 0;

    stats.etl.materialCitations += treatment.materialCitations 
        ? treatment.materialCitations.length 
        : 0;

    for (const mc of treatment.materialCitations) {
        const collectionCodes = mc.collectionCodes;

        stats.etl.collectionCodes += collectionCodes
            ? collectionCodes.length
            : 0;
    }
    
    stats.etl.figureCitations += treatment.figureCitations 
        ? treatment.figureCitations.length 
        : 0;

    stats.etl.bibRefCitations += treatment.bibRefCitations 
        ? treatment.bibRefCitations.length 
        : 0;

    stats.etl.treatmentAuthors += treatment.treatmentAuthors 
        ? treatment.treatmentAuthors.length 
        : 0;
}

const _parseTreatmentCitations = function($) {
    const fn = '_parseTreatmentCitations';
    if (!ts[fn]) return;
    tbutils.incrementStack(logOpts.name, fn);

    const entries = [];
    const trecitgroups = $('treatmentCitationGroup', 'subSubSection[type=reference_group]');
    
    if (Array.isArray(trecitgroups)) {
        let i = 0;
        const j = trecitgroups.length;

        for (; i < j; i++) {
            const trecitgroup = $(trecitgroups[i]);
            const taxonomicName = $('taxonomicName', trecitgroup);            
            let tname = Array.isArray(taxonomicName) 
                ? taxonomicName[0] 
                : taxonomicName;

            const tcPreArr = [];
            //if (tname.text()) tcPreArr.push(cleanText(tname.text()));
            if (tname.text()) tcPreArr.push(cleanText.text());
            if (tname.attr('authorityName')) tcPreArr.push(tname.attr('authorityName'));
            tcPreArr.push(', ');
            if (tname.attr('authorityYear')) tcPreArr.push(tname.attr('authorityYear'));
            let tcPrefix = tcPrefixArray.join(' ');

            const treatmentCitations = $('treatmentCitation', trecitgroup);

            if (Array.isArray(treatmentCitations)) {
                const tlen = treatmentCitations.length;

                for (let k = 0; k < tlen; k++) {
                    const bib = $('bibRefCitation', treatmentCitations[k]);

                    if (bib) {
                        entries.push({
                            treatmentCitationId: bib.attr('id'),
                            //treatmentCitation: `${tcPrefix} sec. ${cleanText(bib.text())}`,
                            treatmentCitation: `${tcPrefix} sec. ${bib.cleanText()}`,
                            refString: bib.attr('refString')
                        });
                    }
                }
            }
            else {
                const bib = $('bibRefCitation', treatmentCitations);

                if (bib) {
                    entries.push({
                        treatmentCitationId: bib.attr('id'),
                        //treatmentCitation: `${tcPrefix} sec. ${cleanText(bib.text())}`,
                        treatmentCitation: `${tcPrefix} sec. ${bib.cleanText()}`,
                        refString: bib.attr('refString')
                    });
                }
            }
        }
    }

    return entries;
}

const _parseTreatmentAuthors = function($) {
    const fn = '_parseTreatmentAuthors';
    if (!ts[fn]) return;
    tbutils.incrementStack(logOpts.name, fn);

    const treaut = $('mods\\:mods mods\\:name[type=personal]');
    const j = treaut.length;

    const entries = [];

    if (j) {
        for (let i = 0; i < j; i++) {
            //const role = cleanText($('mods\\:role mods\\:roleTerm', treaut[i]).text());
            const role = $('mods\\:role mods\\:roleTerm', treaut[i]).text();
            
            if (role === 'Author') {
                const delExists = $('mods\\:namePart', treaut[i]).attr('deleted');
                const isDel = ($('mods\\:namePart', treaut[i]).attr('deleted') === 'true');
                const deleted = delExists && isDel 
                    ? 1 
                    : 0;

                entries.push({
                    treatmentAuthorId: $('mods\\:namePart', treaut[i]).attr('id') || chance.guid(),
                    //treatmentAuthor: cleanText($('mods\\:namePart', treaut[i]).text()),
                    treatmentAuthor: $('mods\\:namePart', treaut[i]).text(),
                    updateVersion: $('mods\\:namePart', treaut[i]).attr('updateVersion'),
                    deleted
                })
            }
        }
    }

    return entries;
};

const _parseBibRefCitations = function($) {
    const fn = '_parseBibRefCitations';
    if (!ts[fn]) return;
    tbutils.incrementStack(logOpts.name, fn);

    const bibRefCitations = $('bibRefCitation');
    
    const entries = [];

    if (Array.isArray(bibRefCitations)) {
        const j = bibRefCitations.length;

        for (let i = 0; i < j; i++) {
            const e = bibRefCitations[i];

            const missingAttr = [];
            const entry = {};

            allCols.bibRefCitations.forEach(el => {

                if (el.cheerio) {
                    const attr = $(e).attr(el.name);

                    if (attr) {
                        entry[el.name] = attr;
                    }
                    else {
                        entry[el.name] = '';
                        missingAttr.push(el.name);
                    }

                }

            })

            entry.bibRefCitationId = $(e).attr('id') || chance.guid();
            entry.updateVersion = $(e).attr('updateVersion') || '';

            const del = $(e).attr('deleted');
            entry.deleted = del && del === 'true' ? 1 : 0;

            //entry.fulltext = cleanText($(e).text());
            entry.fulltext = $(e).cleanText();

            entries.push(entry);
        }
    }

    return entries;  
}

const _parseFigureCitations = function($) {
    const fn = '_parseFigureCitations';
    if (!ts[fn]) return;
    tbutils.incrementStack(logOpts.name, fn);

    const entries = [];
    const elements = $('figureCitation');
    const num = elements.length;

    if (num) {
        
        for (let i = 0; i < num; i++) {
            if (elements[i].parent.name !== 'updateHistory') {
                const el = elements[i];
                const fc_keys = Object.keys(el.attribs);
                let num_of_explosions = 0;
                const cols_to_explode = {};
                const entry = {};

                allCols.figureCitations.forEach(col => {

                    if (col.cheerio) {
                        const matched = fc_keys
                            .filter(key => {
                                key.match(
                                    new RegExp('^' + col.name + '-[0-9]+', 'gi')
                                )
                            });

                        num_of_explosions = matched.length;

                        cols_to_explode[col.name] = num_of_explosions 
                            ? matched 
                            : '';

                        entry[col.name] = $(el).attr(col.name);
                    }

                });

                if (num_of_explosions) {
                    for (let i = 0; i < num_of_explosions; i++) {
                        const entry = {
                            figureCitationId: $(el).attr('id'),
                            figureNum: i
                        }

                        entry.httpUri = cols_to_explode.httpUri
                            ? $(el).attr(cols_to_explode.httpUri[i]) || ''
                            : '';
                        
                        // entry.captionText = cols_to_explode.captionText
                        //     ? cleanText($(el).attr(cols_to_explode.captionText[i]))
                        //     : '';

                        entry.captionText = cols_to_explode.captionText
                            ? $(el).attr(cols_to_explode.captionText[i])
                            : '';
                        
                        entry.figureDoi = cols_to_explode.figureDoi
                            ? $(el).attr(cols_to_explode.figureDoi[i]) || ''
                            : '';

                        entry.updateVersion = $(el).attr('updateVersion') || '';
                        entries.push(entry);
                    }
                }
                else {
                    entry.figureCitationId = $(el).attr('id');
                    entry.figureNum = 0;
                    entry.httpUri = $(el).attr('httpUri') || '';
                    //entry.captionText = cleanText($(el).attr('captionText'));
                    entry.captionText = $(el).attr('captionText') || '';
                    entry.figureDoi = $(el).attr('figureDoi') || '';
                    entry.updateVersion = $(el).attr('updateVersion') || '';
                    entries.push(entry);
                }
            }
        }
    }

    return entries
}

const _parseCollectionCodes = ($, e, materialCitationId) => {
    const fn = '_parseCollectionCodes';
    if (!ts[fn]) return;
    tbutils.incrementStack(logOpts.name, fn);

    const elements = $('collectionCode', e);
    const num = elements.length;
    const entries = [];

    if (num) {
        for (let i = 0; i < num; i++) {
            const el = elements[i];
            const entry = {};

            allCols.collectionCodes.forEach(col => {
                entry[col] = $(el).attr(col) || '';
            });

            //entry.collectionCode = cleanText($(el).text());
            entry.collectionCode = $(el).cleanText();
            entry.materialCitationId = materialCitationId;
            entries.push(entry);
        }
    }

    // remove duplicate objects by collectionCode
    // https://stackoverflow.com/a/48024553/183692
    const initialValue = [];
    const reducer = (acc, x) => acc.concat(
        acc.find(y => y.collectionCode === x.collectionCode) 
            ? [] 
            : [x]
    );

    return entries.reduce(reducer, initialValue);
}

const isOnLand = (latitude, longitude) => {
    if (latitude && longitude) {
        return isSea(latitude, longitude) ? 0 : 1;
    }
}

const _parseMaterialCitations = function($) {
    const fn = '_parseMaterialCitations';
    if (!ts[fn]) return;
    tbutils.incrementStack(logOpts.name, fn);

    // 
    // A note on the name of this tag
    // ------------------------------------------------------------
    // we now use 'materialCitations' instead of 'materialsCitation'
    // because that is what TDWG has accepted as a name. However, 
    // for historical reasons, the xml tag is 'materialsCitation'
    // 
    const elements = $('materialsCitation');
    const num = elements.length;
    const entries = [];

    if (num) {
        for (let i = 0; i < num; i++) {
            const e = elements[i];
            const entry = {};

            allCols.materialCitations.forEach(el => {

                if (el.cheerio) {

                    if (el.name === 'collectionCodeCSV') {
                        entry.collectionCodeCSV = $(e).attr('collectionCode') || '';
                    }
                    else {
                        entry[el.name] = $(e).attr(el.name) || '';
                    }

                }

            })

            entry.materialCitationId = $(e).attr('id');
            entry.isOnLand = isOnLand(entry.latitude, entry.longitude);
            entry.updateVersion = $(e).attr('updateVersion') || '';

            const deleted = $(e).attr('deleted');
            entry.deleted = deleted && deleted === 'true' ? 1 : 0;

            //entry.fulltext = cleanText($(e).text());
            entry.fulltext = $(e).cleanText();
            entry.collectionCodes = _parseCollectionCodes(
                $, e, entry.materialCitationId
            );
            
            entries.push(entry);
        }
    }

    return entries;
};

const _parseTreatment = function($, treatmentId) {
    const fn = '_parseTreatment';
    if (!ts[fn]) return;
    tbutils.incrementStack(logOpts.name, fn);

    const treatment = {};
    
    allCols.treatments.forEach(el => {
        
        if (el.cheerio) {

            if (el.name === 'treatmentId') {
                treatment.treatmentId = treatmentId;
            }
            else {
                let val;

                try {

                    //
                    // eval() || ''
                    // very important to default val to '' so FKs with 
                    // NOT NULL constraints don't croak
                    val = eval(el.cheerio) || '';
                } 
                catch(error) {
                    log.error(error);
                    log.info(`el.cheerio: ${el.cheerio}`);
                    log.info(`treatmentId: ${treatmentId}`);
                }
                
                if (el.name === 'deleted') {
                    treatment.deleted = val === 'true' 
                        ? 1 
                        : 0;
                }
                else {
                    // treatment[el.name] = typeof(val) === 'string' 
                    //     ? cleanText(val) 
                    //     : val;
                    treatment[el.name] = val;
                }

            }
        }
        
    })

    return treatment;
}

const _cheerioparse = function(xmlContent, treatmentId) {
    const fn = '_cheerioparse';
    if (!ts[fn]) return;
    tbutils.incrementStack(logOpts.name, fn);

    const cheerioOpts = { normalizeWhitespace: true, xmlMode: true };

    const $ = cheerio.load(xmlContent, cheerioOpts, false);
    $.prototype.cleanText = function () {
        const fn = 'cleanText';
        if (!ts[fn]) return;
        tbutils.incrementStack(logOpts.name, fn);

        // let str = this.text();
        // //str = str.replace(utils.re.linebreaks, ' ');
        // str = str.replace(utils.re.double_spc, ' ');
        // str = str.replace(utils.re.space_comma, ',');
        // str = str.replace(utils.re.space_colon, ':');
        // str = str.replace(utils.re.space_period, '.');
        // str = str.replace(utils.re.space_openparens, '(');
        // str = str.replace(utils.re.space_closeparens, ')');
        // str = str.trim();
        // return str;
        return this.text()
    };

    // return a complete treatment
    return {
        treatment         : _parseTreatment($, treatmentId),
        treatmentAuthors  : _parseTreatmentAuthors($),
        treatmentCitations: _parseTreatmentCitations($),
        bibRefCitations   : _parseBibRefCitations($),
        figureCitations   : _parseFigureCitations($),
        materialCitations : _parseMaterialCitations($)
    };
}

const _cheerioparse2 = function(xmlContent) {
    const fn = '_cheerioparse';
    if (!ts[fn]) return;
    tbutils.incrementStack(logOpts.name, fn);

    const cheerioOpts = { normalizeWhitespace: true, xmlMode: true };
    const $ = cheerio.load(xmlContent, cheerioOpts, false);
    $.prototype.cleanText = function () {
        const fn = 'cleanText';
        if (!ts[fn]) return;
        tbutils.incrementStack(logOpts.name, fn);

        let str = this.text();
        str = str.replace(utils.re.double_spc, ' ');
        str = str.replace(utils.re.space_comma, ',');
        str = str.replace(utils.re.space_colon, ':');
        str = str.replace(utils.re.space_period, '.');
        str = str.replace(utils.re.space_openparens, '(');
        str = str.replace(utils.re.space_closeparens, ')');
        str = str.trim();
        return str;
    };

    const deleted = (del) => {
        if (del && del === 'true') {
            return 1;
        }

        return 0;
    }

    const treatmentAuthors = $('mods\\:name[type=personal]')
        .get()
        .filter(a => $('mods\\:roleTerm', a).text() === 'Author')
        .map(a => {
            return {
                treatmentAuthorId: $(a).attr('id'),
                treatmentAuthor  : $('mods\\:namePart', a).cleanText(),
                email            : $('mods\\:nameIdentifier[type=email]', a).text()
            }
        });

/*
<bibRefCitation 
    id="FCE3BBB4CB07C7AB682FBD69BC94900B" 
    DOI="https://doi.org/10.11646/zootaxa.1333.1.2" 
    author="Liang, AP" 
    journalOrPublisher="Zootaxa" 
    … 
    title="Revision of the Oriental and eastern Palaearctic planthopper…" 
    refString="Liang, AP, Song, ZS, 2006. Revision of the Oriental and…" 
    type="journal article",
    url="https://doi.org/10.11646/zootaxa.1333.1.2" 
    volume="1333" 
    year="2006">
    Liang and Song 2006
</bibRefCitation>
*/
    const bibRefCitations = $('bibRefCitation')
        .get()
        .filter(a => $(a).attr('id'))
        .map(a => {
            return {
                bibRefCitationId  : $(a).attr('id'),
                DOI               : $(a).attr('DOI')                || '',
                author            : $(a).attr('author')             || '',
                journalOrPublisher: $(a).attr('journalOrPublisher') || '',
                title             : $(a).attr('title')              || '',
                refString         : $(a).attr('refString')          || '',
                type              : $(a).attr('type')               || '',
                year              : $(a).attr('year')               || '',
                innertext         : $(a).cleanText()
            }
        });

/*
Some figureCitation tags have multiple citations within them (see xml fragment below). The attributes are 
suffixed with -0, -1 and so on.

<figureCitation id="10922A65E320FF95FD00FA16FCB8FA1F" 
    captionText-0="Fig. 1. Habitus of Carvalhoma species…" 
    captionText-1="Fig. 2. SEM images of C. malcolmae Slater…" 
    figureDoi-0="http://doi.org/10.5281/zenodo.3850851" 
    figureDoi-1="http://doi.org/10.5281/zenodo.3850855" 
    httpUri-0="https://zenodo.org/record/3850851/files/figure.png" 
    httpUri-1="https://zenodo.org/record/3850855/files/figure.png">
    Figs 1–2
</figureCitation>
*/

    // We will store images temporarily in an object keyed by their httpUri
    // so we get unique images only
    const imagesObj = {};

    const figureCitations = $('figureCitation')
        .get()
        .map(a => {
            const entries = [];

            if (a.parent.name !== 'updateHistory') {

                // Let's find out if this tag has multiple figs within as 
                // described above
                const matched = Object.keys(a.attribs)
                    .filter(key => key.match(new RegExp('^captionText-[0-9]+', 'g')));

                const num_of_figs = matched.length;

                if (num_of_figs) {
                    for (let figureNum = 0; figureNum < num_of_figs; figureNum++) {
                        const figureCitationId = $(a).attr('id');

                        entries.push({
                            figureCitationId,
                            figureNum,
                            innertext       : $(a).text() || '',
                            updateVersion   : $(a).attr(`updateVersion-${figureNum}`) || ''
                        });

                        imagesObj[$(a).attr(`httpUri-${figureNum}`)] = {
                            httpUri    : $(a).attr(`httpUri-${figureNum}`)     || '',
                            figureDoi  : $(a).attr(`figureDoi-${figureNum}`)   || '',
                            captionText: $(a).attr(`captionText-${figureNum}`) || '',
                            figureCitationId
                        };
                    }
                }
                else {
                    const figureCitationId = $(a).attr('id');

                    entries.push({
                        figureCitationId,
                        figureNum       : 0,
                        innertext       : $(a).text(),
                        updateVersion   : $(a).attr('updateVersion')      || ''
                    });

                    imagesObj[$(a).attr('httpUri')] = {
                        httpUri    : $(a).attr('httpUri')     || '',
                        figureDoi  : $(a).attr('figureDoi')   || '',
                        captionText: $(a).attr('captionText') || '',
                        figureCitationId
                    }
                }
            }

            return entries;
        })
        .flat();

    const images = Object.values(imagesObj);

/*
<treatmentCitation id="090D10E8FFADFFCE66FAFA5E33BBFA00" author="Briggs" page="102" pageId="4" pageNumber="117" year="1963">
    <bibRefCitation id="EC3D4B08FFADFFCE66FAFA5E334CFA00" author="Briggs" pageId="4" pageNumber="117" refString="Briggs, J. C. &amp; Link, G. (1963) New clingfishes of the genus Lepadichthys from the northern Indian Ocean and Red Sea. Senckenbergiana Biologica, 44 (2), 101 - 105." type="journal article" year="1963">Briggs &amp; Link 1963</bibRefCitation>
: 102
</treatmentCitation>
*/
    const treatmentCitations = $('treatmentCitationGroup', 'subSubSection[type=reference_group]')
        .get()
        .map(a => {
            const trecitgroup = $(a);
            const taxonomicName = $('taxonomicName', trecitgroup);            
            let tname = Array.isArray(taxonomicName) 
                ? taxonomicName[0] 
                : taxonomicName;

            const tcPreArr = [];
            if (tname.text()) tcPreArr.push(tname.cleanText());
            if (tname.attr('authorityName')) tcPreArr.push(tname.attr('authorityName'));
            tcPreArr.push(', ');
            if (tname.attr('authorityYear')) tcPreArr.push(tname.attr('authorityYear'));
            const tcPrefix = tcPreArr.join(' ');

            return $('treatmentCitation', trecitgroup)
                .get()
                .map(a => {
                    const bib = $('bibRefCitation', a);

                    if (bib) {
                        return {
                            treatmentCitationId: $(a).attr('id'),
                            bibRefCitationId   : bib.attr('id'),
                            treatmentCitation  : `${tcPrefix} sec. ${bib.cleanText()}`,
                            refString          : bib.attr('refString') || ''
                        };
                    }
                });
        })
        .flat();

/*
<materialsCitation id="64B83C8FFFC1FFD8EDD0FD8F376CFDB5" collectionCode="MNCN" collectorName="Jerez de la Frontera &amp; Canuto de la Gallina &amp; de Propios" country="Spain" location="Montes de Propios" pageId="33" pageNumber="34" specimenCode="MNCN 15.05" specimenCount="1" typeStatus="holotype">
    <specimenCode collectionCode="MNCN" country="Spain" httpUri="http://biocol.org/urn:lsid:biocol.org:col:35275" lsid="urn:lsid:biocol.org:col:35275" name="Museo Nacional de Ciencias Naturales" pageId="33" pageNumber="34" type="Museum">MNCN 15.05</specimenCode>
</materialsCitation>
<materialsCitation id="64B83C8FFFC1FFD8EDD0FD07364DFD2C" collectionCode="MNCN" collectorName="Jerez de la Frontera &amp; Canuto de la Gallina &amp; de Propios" country="Spain" location="Montes de Propios" pageId="33" pageNumber="34" specimenCode="MNCN 15.05" specimenCount="1" typeStatus="paratype">
    <specimenCode collectionCode="MNCN" country="Spain" httpUri="http://biocol.org/urn:lsid:biocol.org:col:35275" lsid="urn:lsid:biocol.org:col:35275" name="Museo Nacional de Ciencias Naturales" pageId="33" pageNumber="34" type="Museum">MNCN 15.05</specimenCode>
</materialsCitation>
<materialsCitation id="64B83C8FFFC1FFD8EEEDFD25366BFD00" collectionCode="MNCN" collectorName="Jerez de la Frontera &amp; Canuto de la Gallina &amp; de Propios" country="Spain" location="Montes de Propios" pageId="33" pageNumber="34" specimenCode="MNCN 15.05" specimenCount="1" typeStatus="paratype">
    <specimenCode collectionCode="MNCN" country="Spain" httpUri="http://biocol.org/urn:lsid:biocol.org:col:35275" lsid="urn:lsid:biocol.org:col:35275" name="Museo Nacional de Ciencias Naturales" pageId="33" pageNumber="34" type="Museum">MNCN 15.05</specimenCode>
</materialsCitation>
<materialsCitation id="64B83C8FFFC1FFD8EE0EFD413627FCE6" collectionCode="MZB" collectorName="Jerez de la Frontera &amp; Canuto de la Gallina &amp; de Propios" country="Spain" location="Montes de Propios" pageId="33" pageNumber="34" specimenCode="MZB 2021-2796" specimenCount="1" typeStatus="paratype">
    <specimenCode collectionCode="MZB" country="Indonesia" httpUri="http://grbio.org/cool/b9gz-izvg" name="Museum Zoologicum Bogoriense" pageId="33" pageNumber="34" type="Museum">MZB 2021-2796</specimenCode>
</materialsCitation>
<materialsCitation id="64B83C8FFFC1FFD8EE40FC9C3736FCBA" collectionCode="NHMW" collectorName="Jerez de la Frontera &amp; Canuto de la Gallina &amp; de Propios" country="Spain" location="Montes de Propios" pageId="33" pageNumber="34" specimenCode="NHMW 113527" specimenCount="1" typeStatus="paratype">
    <specimenCode collectionCode="NHMW" country="Austria" httpUri="http://grbio.org/cool/91g3-0mnw" name="Naturhistorisches Museum, Wien" pageId="33" pageNumber="34" type="Museum">NHMW 113527</specimenCode>
</materialsCitation>
<materialsCitation id="64B83C8FFFC1FFD8EF55FCBB3476FC99" collectionCode="RMNH" collectorName="Jerez de la Frontera &amp; Canuto de la Gallina &amp; de Propios" country="Spain" location="Montes de Propios" pageId="33" pageNumber="34" specimenCount="1" typeStatus="paratype">
    <collectionCode country="Netherlands" httpUri="http://biocol.org/urn:lsid:biocol.org:col:34992" lsid="urn:lsid:biocol.org:col:34992" name="National Museum of Natural History, Naturalis" pageId="33" pageNumber="34" type="Museum">RMNH</collectionCode>
</materialsCitation>
<materialsCitation id="64B83C8FFFC1FFD8EC17FCD731E3FC99" collectionCode="JPM" collectorName="Jerez de la Frontera &amp; Canuto de la Gallina &amp; de Propios" country="Spain" location="Montes de Propios" pageId="33" pageNumber="34" specimenCode="JPM-586" specimenCount="1" typeStatus="paratype">
    <specimenCount pageId="33" pageNumber="34" type="generic">1 spec.</specimenCount>
    <specimenCode collectionCode="JPM-" pageId="33" pageNumber="34">JPM-586</specimenCode>
</materialsCitation>
<materialsCitation id="64B83C8FFFC1FFD8E988FCD7366FFC7C" collectionCode="MCP" collectorName="Jerez de la Frontera &amp; Canuto de la Gallina &amp; de Propios" country="Spain" location="Montes de Propios" pageId="33" pageNumber="34" specimenCount="1" typeStatus="paratype">
    <collectionCode country="Brazil" httpUri="http://grbio.org/cool/bqgs-f9q8" name="Pontificia Universidade Catolica do Rio Grande do Sul" pageId="33" pageNumber="34">MCP</collectionCode>
</materialsCitation>
<materialsCitation id="64B83C8FFFC1FFD8EE32FCF23490FC53" collectionCode="MCP" collectorName="Jerez de la Frontera &amp; Canuto de la Gallina &amp; de Propios" country="Spain" location="Montes de Propios" pageId="33" pageNumber="34" specimenCount="1" typeStatus="paratype">
    <collectionCode country="Brazil" httpUri="http://grbio.org/cool/bqgs-f9q8" name="Pontificia Universidade Catolica do Rio Grande do Sul" pageId="33" pageNumber="34">MCP</collectionCode>
</materialsCitation>
*/
    const materialCitations = $('materialsCitation')
        .get()
        .map(a => {
            const materialCitationId = $(a).attr('id');

            // collectionCode from <materialsCitation collectionCode="">
            const collectionCode = $(a).attr('collectionCode') || '';

/*
<collectionCode 
    country="Netherlands" 
    httpUri="http://biocol.org/urn:lsid:biocol.org:col:34992" lsid="urn:lsid:biocol.org:col:34992" 
    name="National Museum of Natural History, Naturalis"
    type="Museum">
    RMNH
</collectionCode>
<collectionCode 
    country="Brazil" 
    httpUri="http://grbio.org/cool/bqgs-f9q8" 
    name="Pontificia Universidade Catolica do Rio Grande do Sul">
    MCP
</collectionCode>
<collectionCode 
    country="Brazil" 
    httpUri="http://grbio.org/cool/bqgs-f9q8" 
    name="Pontificia Universidade Catolica do Rio Grande do Sul">
    MCP
</collectionCode>
<collectionCode 
    country="Spain" 
    httpUri="http://biocol.org/urn:lsid:biocol.org:col:35275" lsid="urn:lsid:biocol.org:col:35275" 
    name="Museo Nacional de Ciencias Naturales"
    type="Museum">
    MNCN
</collectionCode>
<collectionCode 
    country="Spain" 
    httpUri="http://biocol.org/urn:lsid:biocol.org:col:35275" lsid="urn:lsid:biocol.org:col:35275" 
    name="Museo Nacional de Ciencias Naturales" 
    type="Museum">
    MNCN
</collectionCode>
*/
            // collectionCodes from <collectionCode>
            const collectionCodes = $('collectionCode', a)
                .get()
                .filter(a => $(a).attr('collectionCode') === collectionCode)
                .map(a => {
                    return {
                        //collectionCodeId: $(a).attr('id'),
                        country         : $(a).attr('country')        || '',
                        name            : $(a).attr('name')           || '',
                        httpUri         : $(a).attr('httpUri')        || '',
                        lsid            : $(a).attr('lsid')           || '',
                        type            : $(a).attr('type')           || '',
                        collectionCode  : $(a).attr('collectionCode') || '',
                        materialCitationId
                    }
                });

            // collectionCodes from <specimenCode>
            const specimenCodes = $('specimenCode', a)
                .get()
                .filter(a => $(a).attr('collectionCode') === collectionCode)
                .map(a => {
                    return {
                        //collectionCodeId: $(a).attr('id'),
                        country         : $(a).attr('country')        || '',
                        name            : $(a).attr('name')           || '',
                        httpUri         : $(a).attr('httpUri')        || '',
                        lsid            : $(a).attr('lsid')           || '',
                        type            : $(a).attr('type')           || '',
                        collectionCode  : $(a).attr('collectionCode') || '',
                        materialCitationId
                    }
                });

            collectionCodes.push(...specimenCodes);

            const isOnLand = (() => {
                const fn = 'calcIsOnLand';
                if (!ts[fn]) return;
                tbutils.incrementStack(logOpts.name, fn);

                isOnLand(latitude, longitude)
            })();

            return {
                materialCitationId,
                collectingDate     : $(a).attr('collectingDate')       || '',
                collectionCodeCSV  : $(a).attr('collectionCode')       || '',
                collectorName      : $(a).attr('collectorName')        || '',
                country            : $(a).attr('country')              || '',
                collectingRegion   : $(a).attr('collectingRegion')     || '',
                municipality       : $(a).attr('municipality')         || '',
                county             : $(a).attr('county')               || '',
                stateProvince      : $(a).attr('stateProvince')        || '',
                location           : $(a).attr('location')             || '',
                locationDeviation  : $(a).attr('locationDeviation')    || '',
                specimenCountFemale: $(a).attr('specimenCount-female') || '',
                specimenCountMale  : $(a).attr('specimenCount-male')   || '',
                specimenCount      : $(a).attr('specimenCount')        || '',
                specimenCode       : $(a).attr('specimenCode')         || '',
                typeStatus         : $(a).attr('typeStatus')           || '',
                determinerName     : $(a).attr('determinerName')       || '',
                collectedFrom      : $(a).attr('collectedFrom')        || '',
                collectingMethod   : $(a).attr('collectingMethod')     || '',
                latitude           : $(a).attr('latitude')             || '',
                longitude          : $(a).attr('longitude')            || '',
                elevation          : $(a).attr('elevation')            || '',
                isOnLand,
                httpUri            : $(a).attr('httpUri')              || '',
                updateVersion      : $(a).attr('updateVersion')        || '',
                deleted            : deleted($(a).attr('deleted')),
                fulltext           : $(a).cleanText(),
                collectionCodes    : collectionCodes.flat()
            }
        });

    const pages = (() => {
        const start = $('mods\\:relatedItem[type=host] mods\\:part mods\\:extent[unit=page] mods\\:start').text();
        const end = $('mods\\:relatedItem[type=host] mods\\:part mods\\:extent[unit=page] mods\\:end').text();

        if (start && end) {
            return `${start}–${end}`;
        }
        else if (start) {
            return start;
        }
        else if (end) {
            return end;
        }
        else {
            return '';
        }
    })();

    // return a complete treatment
    const treatment = {
        treatmentId       : $('document').attr('docId'),
        treatmentTitle    : $('document').attr('docTitle') || '',
        treatmentVersion  : $('document').attr('docVersion') || '',
        treatmentDOI      : $('treatment').attr('ID-DOI') || '',
        treatmentLSID     : $('treatment').attr('LSID') || '',
        zenodoDep         : $('document').attr('ID-Zenodo-Dep') || '',
        zoobankId         : $('document').attr('ID-ZooBank') || '',
        articleId         : $('document').attr('masterDocId') || '',
        articleTitle      : $('document').attr('masterDocTitle') || '',
        articleAuthor     : $('document').attr('docAuthor') || '',
        articleDOI        : $('mods\\:identifier[type=DOI]').text() || '',
        publicationDate   : $('mods\\:detail[type=pubDate] mods\\:number').text() || '',
        journalYear       : $('mods\\:relatedItem[type=host] mods\\:part mods\\:date').text() || '',
        journalVolume     : $('mods\\:relatedItem[type=host] mods\\:part mods\\:detail[type=volume] mods\\:number').text() || '',
        journalIssue      : $('mods\\:relatedItem[type=host] mods\\:part mods\\:detail[type=issue] mods\\:number').text() || '',
        pages,
        authorityName     : $('subSubSection[type=nomenclature] taxonomicName').attr('authorityName') || '',
        authorityYear     : $('subSubSection[type=nomenclature] taxonomicName').attr('authorityYear') || '',
        status            : $('subSubSection[type=nomenclature] taxonomicName').attr('status') || '',
        taxonomicNameLabel: $('subSubSection[type=nomenclature] taxonomicName').text() || '',
        rank              : $('subSubSection[type=nomenclature] taxonomicName').attr('rank') || '',
        updateTime        : Number($('document').attr('updateTime')) || '',
        checkinTime       : Number($('document').attr('checkinTime')) || '',
        fulltext          : $('treatment').cleanText() || '',
        deleted           : deleted($('document').attr('deleted')),
        journalTitle      : $('mods\\:relatedItem[type=host] mods\\:titleInfo mods\\:title').text() || '',
        kingdom           : $('subSubSection[type=nomenclature] taxonomicName').attr('kingdom') || '',
        phylum            : $('subSubSection[type=nomenclature] taxonomicName').attr('phylum') || '',
        class             : $('subSubSection[type=nomenclature] taxonomicName').attr('class') || '',
        order             : $('subSubSection[type=nomenclature] taxonomicName').attr('order') || '',
        family            : $('subSubSection[type=nomenclature] taxonomicName').attr('family') || '',
        genus             : $('subSubSection[type=nomenclature] taxonomicName').attr('genus') || '',
        species           : $('subSubSection[type=nomenclature] taxonomicName').attr('species') || '',
        treatmentAuthors,
        bibRefCitations,
        figureCitations,
        images,
        treatmentCitations,
        materialCitations
    };
    
    return treatment;
}

const parseOne = (archive_name, xml) => {
    const fn = 'parseOne';
    if (!ts[fn]) return true;
    tbutils.incrementStack(logOpts.name, fn);

    const treatmentId = path.basename(xml, '.xml');

    if (utils.re.treatmentId.test(treatmentId)) {
        const xmlfile = `${truebug.dirs.data}/treatments-dumps/${archive_name}/${xml}`;
        const xmlContent = fs.readFileSync(xmlfile, 'utf8');
        const startParseTime = process.hrtime.bigint();
        const treatment = _cheerioparse2(xmlContent, treatmentId);
        const endParseTime = process.hrtime.bigint();
        const timeTaken = (Number(endParseTime - startParseTime) / 1e6).toFixed(2);
        return { timeTaken, treatment };
    }
    else {
        log.error(`file ${xmlfile} doesn't look like a treatment`)
    }
}

export { parseOne, calcStats }