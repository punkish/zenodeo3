import { parseTreatmentAuthors } from "./treatmentAuthors.js";
import { parseBibRefCitations } from "./bibRefCitations.js";
import { parseFigureCitations } from "./figureCitations.js";
import { parseTreatmentCitations } from "./treatmentCitations.js";
import { parseMaterialCitations } from "./materialCitations.js";

function pages($) {
    const start = $('mods\\:relatedItem[type=host] mods\\:part mods\\:extent[unit=page] mods\\:start').text();
    const end = $('mods\\:relatedItem[type=host] mods\\:part mods\\:extent[unit=page] mods\\:end').text();

    let pages = '';

    if (start) {
        pages = end ? `${start}-${end}` : start;
    }
    else if (end) {
        pages = end;
    }

    return pages
}

export function parseTreatment($) {
    // cache single selectors used multiple times
    const $document = $('document').first();
    const $treatment = $('treatment').first();
    const $nomen = $('subSubSection[type=nomenclature] taxonomicName').first();
    
    const treatment = {
        treatmentId       : $document.attr('docId'),
        treatmentTitle    : $document.attr('docTitle') || '',
        treatmentVersion  : $document.attr('docVersion') || '',
        zenodoDep         : $document.attr('ID-Zenodo-Dep') || '',
        zoobankId         : $document.attr('ID-ZooBank') || '',
        articleId         : $document.attr('masterDocId') || '',
        articleTitle      : $document.attr('masterDocTitle') || '',
        articleAuthor     : $document.attr('docAuthor') || '',
        deleted           : $document.attr('deleted') ? 1 : 0,
        updateTime        : Number($document.attr('updateTime')) || '',
        checkinTime       : Number($document.attr('checkinTime')) || '',

        treatmentDOIorig  : $treatment.attr('ID-DOI') || '',
        treatmentLSID     : $treatment.attr('LSID') || '',
        fulltext          : $treatment.cleanText() || '',
        
        articleDOIorig    : $('mods\\:identifier[type=DOI]').text(),
        publicationDate   : $('mods\\:detail[type=pubDate] mods\\:number').text() || '',
        journalYear       : $('mods\\:relatedItem[type=host] mods\\:part mods\\:date').text() || '',
        journalVolume     : $('mods\\:relatedItem[type=host] mods\\:part mods\\:detail[type=volume] mods\\:number').text() || '',
        journalIssue      : $('mods\\:relatedItem[type=host] mods\\:part mods\\:detail[type=issue] mods\\:number').text() || '',
        journalTitle      : $('mods\\:relatedItem[type=host] mods\\:titleInfo mods\\:title').text() || '',

        pages             : pages($),
        
        authorityName     : $nomen.attr('authorityName') || '',
        authorityYear     : $nomen.attr('authorityYear') || '',
        status            : $nomen.attr('status') || '',
        taxonomicNameLabel: $nomen.text() || '',
        rank              : $nomen.attr('rank') || '',
        kingdom           : $nomen.attr('kingdom') || '',
        phylum            : $nomen.attr('phylum') || '',
        class             : $nomen.attr('class') || '',
        order             : $nomen.attr('order') || '',
        family            : $nomen.attr('family') || '',
        genus             : $nomen.attr('genus') || '',
        species           : $nomen.attr('species') || '',

        treatmentAuthors  : parseTreatmentAuthors($),
        bibRefCitations   : parseBibRefCitations($),
        figureCitations   : parseFigureCitations($),
        treatmentCitations: parseTreatmentCitations($),
        materialCitations : parseMaterialCitations($)
    };

    return treatment
}
