'use strict'

module.exports = function(col, type) {
    const examples = {
        int: '',
        id: '',
        fts: '',

        guid: `Has to be a 32 character string like so:

- '00078788D74DDE17E88B89EFFCD2D91C'`,

        date: `Can use the following syntax:

- col=since({y:2010,m:12,d:3})
- col=until({y:2015,m:2,d:13})
- col=between({y:2015,m:2,d:13}-{y:2015,m:2,d:13})`,

        str: `Can use the following syntax:

- col=eq('Full Name')
- col=starts_with('It was a dark')
- col=ends_with('that ends well.')
- col=contains('stuck in the middle')`,

        spatial: `Can use the following syntax:

- col=within({r:10,units:"kilometers",lat:40.00,lng:-120})
- col=near({lat:40.00,lng:-120})
  *note:* radius defaults to 1 km`

    }

    let text = examples[type].replace(/col/g, col)
    return text
}