import fs from 'fs';
import Newbug from '../newbug.js';
import * as utils from '../../../../lib/utils.js';
import { parseTreatment } from './lib/treatment.js';

// see https://github.com/cheeriojs/cheerio/issues/2786#issuecomment-1288843071
import * as cheerio from 'cheerio';

export default class NewbugParse extends Newbug {
    constructor(conf) {
        super(conf);
    }

    xml(source) {

        // if (!source) {
        //     throw new Error('"source" is required');
        // }
        
        const start = process.hrtime.bigint();
        const xmlContent = fs.readFileSync(source);
        const cheerioOpts = { normalizeWhitespace: true, xmlMode: true };
        const $ = cheerio.load(xmlContent, cheerioOpts, false);
        $.prototype.cleanText = function () {
            const re = utils.getPattern('all');
            let str = this.text();
            str = str.replace(re.double_spc, ' ');
            str = str.replace(re.space_comma, ',');
            str = str.replace(re.space_colon, ':');
            str = str.replace(re.space_period, '.');
            str = str.replace(re.space_openparens, '(');
            str = str.replace(re.space_closeparens, ')');
            str = str.trim();
            return str;
        }

        const treatment = parseTreatment($);
        const end = process.hrtime.bigint();
        const timeToParseXML = (Number(end - start) * 1e-6).toFixed(2);
        treatment.timeToParseXML = timeToParseXML;

        return treatment
    }
}