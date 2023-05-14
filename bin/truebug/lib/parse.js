// @ts-check

'use strict';

import * as utils from '../../../lib/utils.js';
import * as tbutils from './utils.js';

import process from 'node:process';
import fs from 'fs';
import path from 'path';
import isSea from 'is-sea';

// see https://github.com/cheeriojs/cheerio/issues/2786#issuecomment-1288843071
import * as cheerio from 'cheerio';

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

const deleted = (del) => {
    if (del && del === 'true') {
        return 1;
    }

    return 0;
}

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

const parseTreatmentAuthors = ($) => {
    return $('mods\\:name[type=personal]')
        .get()
        .filter(a => $('mods\\:roleTerm', a).text() === 'Author')
        .map(a => {
            return {
                treatmentAuthorId: $(a).attr('id'),
                treatmentAuthor  : $('mods\\:namePart', a).cleanText(),
                email            : $('mods\\:nameIdentifier[type=email]', a).text()
            }
        })
};

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
const parseBibRefCitations = ($) => {
    return $('bibRefCitation')
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
};

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
const parseFigureCitations = ($) => {

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
                            figureDoiOriginal: $(a).attr(`figureDoi-${figureNum}`)   || '',
                            //figureDoi  : text2DOI($(a).attr(`figureDoi-${figureNum}`)),
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
                        figureDoiOriginal: $(a).attr('figureDoi'),
                        captionText: $(a).attr('captionText') || '',
                        figureCitationId
                    }
                }
            }

            return entries;
        })
        .flat();

    const images = Object.values(imagesObj);

    return { images, figureCitations };
}

/*
<treatmentCitation id="090D10E8FFADFFCE66FAFA5E33BBFA00" 
    author="Briggs" 
    year="1963">
    <bibRefCitation id="EC3D4B08FFADFFCE66FAFA5E334CFA00" 
        author="Briggs" 
        refString="Briggs, J. C. &amp; Link, G. (1963) New clingfishes of…" 
        type="journal article" 
        year="1963">
        Briggs &amp; Link 1963
    </bibRefCitation>
: 102
</treatmentCitation>
*/
const parseTreatmentCitations = ($) => {
    return $('treatmentCitationGroup', 'subSubSection[type=reference_group]')
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
}

/*
<collectionCode 
    country="Spain" 
    httpUri="http://biocol.org/urn:lsid:biocol.org:col:35275" lsid="urn:lsid:biocol.org:col:35275" 
    name="Museo Nacional de Ciencias Naturales" 
    type="Museum">
    MNCN
</collectionCode>
*/
const parseCollectionCodes = ($, a, collectionCode, materialCitationId) => {

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
    return collectionCodes.flat();
}

/*
<materialsCitation id="64B83C8FFFC1FFD8EE32FCF23490FC53" 
    collectionCode="MCP" 
    collectorName="Jerez de la Frontera &amp; Canuto de la Gallina &amp; de Propios" 
    country="Spain" 
    location="Montes de Propios" 
    specimenCount="1" 
    typeStatus="paratype">
    <collectionCode country="Brazil" 
        httpUri="http://grbio.org/cool/bqgs-f9q8" 
        name="Pontificia Universidade Catolica do Rio Grande do Sul">
        MCP
    </collectionCode>
</materialsCitation>
*/
const parseMaterialCitations = ($) => {
    const materialCitations = $('materialsCitation')
        .get()
        .map(a => {
            const materialCitationId = $(a).attr('id');

            // collectionCode from <materialsCitation collectionCode="">
            const collectionCode = $(a).attr('collectionCode') || '';
            const collectionCodes = parseCollectionCodes(
                $, a, collectionCode, materialCitationId
            );

            // const isOnLand = (() => {
            //     const fn = 'calcIsOnLand';
            //     if (!ts[fn]) return;
            //     tbutils.incrementStack(logOpts.name, fn);

            //     isOnLand(latitude, longitude)
            // })();

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
                //isOnLand,
                httpUri            : $(a).attr('httpUri')              || '',
                updateVersion      : $(a).attr('updateVersion')        || '',
                deleted            : deleted($(a).attr('deleted')),
                fulltext           : $(a).cleanText(),
                collectionCodes
            }
        });

    return materialCitations;
}

const isOnLand = (latitude, longitude) => {
    if (latitude && longitude) {
        return isSea(latitude, longitude) ? 0 : 1;
    }
}

const pages = ($) => {
    const start = $('mods\\:relatedItem[type=host] mods\\:part mods\\:extent[unit=page] mods\\:start').text();
    const end = $('mods\\:relatedItem[type=host] mods\\:part mods\\:extent[unit=page] mods\\:end').text();

    let pages;

    if (start && end) {
        pages = `${start}–${end}`;
    }
    else if (start) {
        pages = start;
    }
    else if (end) {
        pages = end;
    }
    else {
        pages = '';
    }

    return pages;
};

const text2DOI = (str) => {
    const re = new RegExp('^http(s?):\/\/(dx\.)?doi.org\/(?<doi>10\.[0-9]{4,9}.*)$');
    const match = str.match(re);
    if (match && match.groups && match.groups.doi) {
        return match.groups.doi;
    }
    else {
        return str;
    }
}

const parseTreatment = function($) {
    const treatmentAuthors = parseTreatmentAuthors($);
    const bibRefCitations = parseBibRefCitations($);
    const { images, figureCitations } = parseFigureCitations($);
    const treatmentCitations = parseTreatmentCitations($);
    const materialCitations = parseMaterialCitations($);

    const treatment = {
        treatmentId       : $('document').attr('docId'),
        treatmentTitle    : $('document').attr('docTitle') || '',
        treatmentVersion  : $('document').attr('docVersion') || '',
        treatmentDOIoriginal      : $('treatment').attr('ID-DOI') || '',
        treatmentLSID     : $('treatment').attr('LSID') || '',
        zenodoDep         : $('document').attr('ID-Zenodo-Dep') || '',
        zoobankId         : $('document').attr('ID-ZooBank') || '',
        articleId         : $('document').attr('masterDocId') || '',
        articleTitle      : $('document').attr('masterDocTitle') || '',
        articleAuthor     : $('document').attr('docAuthor') || '',
        articleDOIoriginal: $('mods\\:identifier[type=DOI]').text(),
        publicationDate   : $('mods\\:detail[type=pubDate] mods\\:number').text() || '',
        journalYear       : $('mods\\:relatedItem[type=host] mods\\:part mods\\:date').text() || '',
        journalVolume     : $('mods\\:relatedItem[type=host] mods\\:part mods\\:detail[type=volume] mods\\:number').text() || '',
        journalIssue      : $('mods\\:relatedItem[type=host] mods\\:part mods\\:detail[type=issue] mods\\:number').text() || '',
        pages             : pages($),
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

const _cheerioparse = function(xmlContent) {
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
    }

    // return a complete treatment 
    return parseTreatment($);
}

const parseOne = (archive_name, xml) => {
    const fn = 'parseOne';
    if (!ts[fn]) return true;
    tbutils.incrementStack(logOpts.name, fn);

    const treatmentId = path.basename(xml, '.xml');
    const xmlfile = `${truebug.dirs.data}/treatments-dumps/${archive_name}/${xml}`;
    
    if (utils.re.treatmentId.test(treatmentId)) {
        const xmlContent = fs.readFileSync(xmlfile, 'utf8');
        const startParseTime = process.hrtime.bigint();
        const treatment = _cheerioparse(xmlContent);
        const endParseTime = process.hrtime.bigint();
        const timeToParseXML = (Number(endParseTime - startParseTime) / 1e6)
            .toFixed(2);
        treatment.timeToParseXML = timeToParseXML;
        return treatment;
        
        //return { timeTaken, treatment };
    }
    else {
        log.error(`file ${xmlfile} doesn't look like a treatment`);
    }
}

export { parseOne, calcStats }