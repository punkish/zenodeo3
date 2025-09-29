import { parseTreatmentAuthors } from "./treatmentAuthors.js";
import { parseBibRefCitations } from "./bibRefCitations.js";
import { parseFigureCitations } from "./figureCitations.js";
import { parseTreatmentCitations } from "./treatmentCitations.js";
import { parseMaterialCitations } from "./materialCitations.js";

function pages($) {
    const start = $('mods\\:relatedItem[type=host] mods\\:part mods\\:extent[unit=page] mods\\:start').text();
    const end = $('mods\\:relatedItem[type=host] mods\\:part mods\\:extent[unit=page] mods\\:end').text();

    let pages = '';

    if (start && end) {
        pages = `${start}–${end}`;
    }
    else if (start) {
        pages = start;
    }
    else if (end) {
        pages = end;
    }

    return pages
}

export function parseTreatment($) {
    const treatment = {
        treatmentId       : $('document').attr('docId'),
        treatmentTitle    : $('document').attr('docTitle') || '',
        treatmentVersion  : $('document').attr('docVersion') || '',
        treatmentDOIorig  : $('treatment').attr('ID-DOI') || '',
        treatmentLSID     : $('treatment').attr('LSID') || '',
        zenodoDep         : $('document').attr('ID-Zenodo-Dep') || '',
        zoobankId         : $('document').attr('ID-ZooBank') || '',
        articleId         : $('document').attr('masterDocId') || '',
        articleTitle      : $('document').attr('masterDocTitle') || '',
        articleAuthor     : $('document').attr('docAuthor') || '',
        articleDOIorig    : $('mods\\:identifier[type=DOI]').text(),
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
        deleted           : $('document').attr('deleted') ? 1 : 0,
        journalTitle      : $('mods\\:relatedItem[type=host] mods\\:titleInfo mods\\:title').text() || '',
        kingdom           : $('subSubSection[type=nomenclature] taxonomicName').attr('kingdom') || '',
        phylum            : $('subSubSection[type=nomenclature] taxonomicName').attr('phylum') || '',
        class             : $('subSubSection[type=nomenclature] taxonomicName').attr('class') || '',
        order             : $('subSubSection[type=nomenclature] taxonomicName').attr('order') || '',
        family            : $('subSubSection[type=nomenclature] taxonomicName').attr('family') || '',
        genus             : $('subSubSection[type=nomenclature] taxonomicName').attr('genus') || '',
        species           : $('subSubSection[type=nomenclature] taxonomicName').attr('species') || '',
        treatmentAuthors: parseTreatmentAuthors($),
        bibRefCitations: parseBibRefCitations($),
        figureCitations: parseFigureCitations($),
        treatmentCitations: parseTreatmentCitations($),
        materialCitations: parseMaterialCitations($)
    };

    return treatment
}
