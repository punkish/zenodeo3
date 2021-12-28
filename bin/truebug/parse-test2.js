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