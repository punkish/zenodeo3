'use strict'

const cheerio = require('cheerio')

const doc = `<foo id="3B3D3CAD1268FFDFD3E36F2DFD30DBD0" a="3392779302" b="Chiapas" c="Mexico">
<emphasis bold="true" pageId="3" pageNumber="120">Type locality.</emphasis>
</foo>
<emphasis bold="true" pageId="3" pageNumber="120">Other localities.</emphasis>
<foo id="3B3D3CAD1268FFDFD3E36F2D68FFDFD" a="3392779378" b="Baja California" c="Mexico">
<emphasis bold="true" pageId="3" pageNumber="120">Type locality.</emphasis>
</foo>`

const opts = {
    xml: {
        normalizeWhitespace: true,
        xmlMode: true
    }
}

const $ = cheerio.load(doc, opts, false)

const elements = $('foo')
const num = elements.length
//console.log(`found ${num} elements`)
if (num) {
    let i = 0
    for (; i < num; i++) {
        const e = elements[i]
        //console.log($(e).html())
        //cheerio.html($(e))
        const tag = $(e).prop('outerHTML')
        const t = tag.match(/^<.*?>/)
        console.log(t[0])
    }
}