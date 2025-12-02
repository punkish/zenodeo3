import fs from 'fs';
import zlib from 'zlib';
import { parseTreatment } from './lib/treatment.js';

// see https://github.com/cheeriojs/cheerio/issues/2786#issuecomment-1288843071
import * as cheerio from 'cheerio';

// --- Precompiled regexes & constants ---
const RE_DOUBLE_SPC = /\s+/g;
const RE_SPACE_COMMA = /\s+,/g;
const RE_SPACE_COLON = /\s+:/g;
const RE_SPACE_PERIOD = /\s+\./g;
const RE_OPENPAR_SPACE = /\(\s+/g;
const RE_SPACE_CLOSEPAR = /\s+\)/g;
const RE_CAPTION_INDEX = /^captionText-(\d+)$/;

export default function xml2json(file) {
    const start = process.hrtime.bigint();
    const xml = fs.readFileSync(file);
    const cheerioOpts = { normalizeWhitespace: true, xmlMode: true };
    const $ = cheerio.loadBuffer(xml, cheerioOpts, false);

    $.prototype.cleanText = function () {
        return this.text()
            .replace(RE_DOUBLE_SPC, ' ')
            .replace(RE_SPACE_COMMA, ',')
            .replace(RE_SPACE_COLON, ',')
            .replace(RE_SPACE_PERIOD, ',')
            .replace(RE_OPENPAR_SPACE, ',')
            .replace(RE_SPACE_CLOSEPAR, ',')
            .trim();
    };

    const treatment = parseTreatment($);

    // Save a copy of the XML and the JSON in the treatment obj
    // so we can insert it in the archives.treatmentsDump table
    treatment.json = zlib.deflateRawSync(JSON.stringify(treatment));
    treatment.xml = zlib.deflateRawSync(xml);

    const end = process.hrtime.bigint();
    const timeToParseXML = (Number(end - start) * 1e-6).toFixed(2);
    treatment.timeToParseXML = timeToParseXML;
    return treatment;
}