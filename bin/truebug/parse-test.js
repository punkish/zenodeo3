'use strict'

const config = require('config');
const truebug = JSON.parse(JSON.stringify(config.get('truebug')));

const parse = require('./lib/parse');
const dir = '/Users/punkish/Projects/zenodeo/data/treatments-full'
// 2021-12-27 11:54:56 INFO row: {"figureNum":0,"captionText":{"id":"BF8A576EC3F6661E96B5590C108213BA","createTime":"1425478130016","createUser":"donat","createVersion":"3","httpUri-0":"http://dx.doi.org/10.5281/zenodo.15820","httpUri-1":"http://dx.doi.org/10.5281/zenodo.15819","httpUri-2":"http://dx.doi.org/10.5281/zenodo.15821","httpUri-3":"http://dx.doi.org/10.5281/zenodo.15823","updateTime":"1425479072016","updateUser":"donat","updateVersion":"6"},"httpUri":"http://dx.doi.org/10.5281/zenodo.15820","figureCitationId":"BF8A576EC3F6661E96B5590C108213BA","treatmentId":"0610DE634A625801C11B0C8AD642A55A","updateVersion":"6","deleted":0}
// 2021-12-27 11:54:56 ERROR TypeError: SQLite3 can only bind numbers, strings, bigints, buffers, and null
// 2021-12-27 11:54:56 INFO table figureCitations
// 2021-12-27 11:54:56 INFO row: {"figureNum":1,"captionText":{"id":"BF8A576EC3F6661E96B5590C108213BA","createTime":"1425478130016","createUser":"donat","createVersion":"3","httpUri-0":"http://dx.doi.org/10.5281/zenodo.15820","httpUri-1":"http://dx.doi.org/10.5281/zenodo.15819","httpUri-2":"http://dx.doi.org/10.5281/zenodo.15821","httpUri-3":"http://dx.doi.org/10.5281/zenodo.15823","updateTime":"1425479072016","updateUser":"donat","updateVersion":"6"},"httpUri":"http://dx.doi.org/10.5281/zenodo.15819","figureCitationId":"BF8A576EC3F6661E96B5590C108213BA","treatmentId":"0610DE634A625801C11B0C8AD642A55A","updateVersion":"6","deleted":0}
// 2021-12-27 11:54:56 ERROR TypeError: SQLite3 can only bind numbers, strings, bigints, buffers, and null
// 2021-12-27 11:54:56 INFO table figureCitations
// 2021-12-27 11:54:56 INFO row: {"figureNum":2,"captionText":{"id":"BF8A576EC3F6661E96B5590C108213BA","createTime":"1425478130016","createUser":"donat","createVersion":"3","httpUri-0":"http://dx.doi.org/10.5281/zenodo.15820","httpUri-1":"http://dx.doi.org/10.5281/zenodo.15819","httpUri-2":"http://dx.doi.org/10.5281/zenodo.15821","httpUri-3":"http://dx.doi.org/10.5281/zenodo.15823","updateTime":"1425479072016","updateUser":"donat","updateVersion":"6"},"httpUri":"http://dx.doi.org/10.5281/zenodo.15821","figureCitationId":"BF8A576EC3F6661E96B5590C108213BA","treatmentId":"0610DE634A625801C11B0C8AD642A55A","updateVersion":"6","deleted":0}
// 2021-12-27 11:54:56 ERROR TypeError: SQLite3 can only bind numbers, strings, bigints, buffers, and null
// 2021-12-27 11:54:56 INFO table figureCitations
// 2021-12-27 11:54:56 INFO row: {"figureNum":3,"captionText":{"id":"BF8A576EC3F6661E96B5590C108213BA","createTime":"1425478130016","createUser":"donat","createVersion":"3","httpUri-0":"http://dx.doi.org/10.5281/zenodo.15820","httpUri-1":"http://dx.doi.org/10.5281/zenodo.15819","httpUri-2":"http://dx.doi.org/10.5281/zenodo.15821","httpUri-3":"http://dx.doi.org/10.5281/zenodo.15823","updateTime":"1425479072016","updateUser":"donat","updateVersion":"6"},"httpUri":"http://dx.doi.org/10.5281/zenodo.15823","figureCitationId":"BF8A576EC3F6661E96B5590C108213BA","treatmentId":"0610DE634A625801C11B0C8AD642A55A","updateVersion":"6","deleted":0}
let testfile = '0610DE634A625801C11B0C8AD642A55A'
testfile = '907E87AE5161FF80B0546D27F9B4F747'
const xml = `${testfile}..xml`
const treatment = parse.parseOne(truebug, xml)
console.log(treatment)


const cheerio = require('cheerio');
const xml = `<foo id="1" a="blah"><updateHistory><foo id="1" a="blah"/><foo id="1" a="blah"/><foo id="1" a="blah"/><foo id="1" a="blah"/></updateHistory>Figs. 1-9</foo>`;

const parseFigureCitations = function($) {
    const entries = []
    const elements = $('foo')
    const num = elements.length

    for (let i = 0, j = elements.length; i < j; i++) {
        if (elements[i].parent.name !== 'updateHistory') {
            
        }
    }

    return entries
}

const $ = cheerio.load(xml, { normalizeWhitespace: true, xmlMode: true }, false);
parseFigureCitations($)