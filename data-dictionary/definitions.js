'use strict'

const re = {
    date: '[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}'
}

module.exports = {

    array: {
        schema: { 
            type: 'array', 
            items: { type: 'string' } 
        },
        help: `Provide a list like so:
- $col=column1&$col=column2&$col=column3`
    },

    // array: {
    //     schema: { type: 'string' },
    //     help: 'Provide a comma-separated list'
    // },

    doi: {
        schema: { type: 'string' },
        help: '',
        //errorMessage:
    },

    year: {
        schema: { type: 'number', min: 1000, max: new Date().getFullYear() },
        help: `A valid four digit year between 1000 and ${new Date().getFullYear()}`
    },

    sortby: {
        schema: { type: 'string' },
        help: ''
    },

    resourceId: {

        // uuid, well, at least the kind the treatment bank uses
        schema: { type: 'string', maxLength: 32, minLength: 32 },
        help: `Has to be a 32 character string like so:
- '00078788D74DDE17E88B89EFFCD2D91C'`
    },

    fk: {

        // uuid, well, at least the kind the treatment bank uses
        schema: { type: 'string', maxLength: 32, minLength: 32 },
        help: `Has to be a 32 character string like so:
- '00078788D74DDE17E88B89EFFCD2D91C'`
    },

    uri: {
        schema: { type: 'string', format: 'uri' },
        help: 'Has to be a valid URI.'
    },

    string: {
        schema: { type: 'string' },
        help: `Can use the following syntax:
- cname=eq('Full Name')
- cname=starts_with('It was a dark')
- cname=ends_with('that ends well.')
- cname=contains('stuck in the middle')`
    },

    boolean: {
        schema: { type: 'boolean' },
        help: '(true | false)'
    },

    integer: {
        schema: { type: 'integer', minimum: 1 },
        help: 'Has to be an integer greater than 0'
    },

    size: {
        schema: { type: 'integer', minimum: 1, maximum: 100 },
        help: 'Has to be an integer between 1 and 100'
    },

    number: {
        schema: {type: 'number' },
        help: 'Has to be a negative or positive real number'
    },

    fts: {
        schema: { type: 'string' },
        help: `Can use the following syntax:
- q='spiders'`
    },

    date: {
        schema: {
            "type": "string",
            "pattern": `^((since|until)\\(${re.date}\\))|(${re.date})|(between\\(${re.date} and ${re.date}\\))$`
        },
        help: `Can use the following syntax: 
- &lt;date&gt; : 2018-1-12
- since(&lt;date&gt;) : since(2018-12-03)
- until(&lt;date&gt;) : until(2018-03-22)
- between(&lt;date&gt; and &lt;date&gt;) : between(2018-03-22 and 2018-12-03)

&lt;date&gt; = &lt;yyyy&gt;-&lt;m?&gt;-&lt;d?&gt;
- &lt;yyyy&gt; a four digit year
- &lt;m?&gt; one or two digit month
- &lt;d?&gt; one or two digit day`
    },
    
    geolocation: {
        schema: { type: 'string' },
        help: `Can use the following syntax:
- cname=within({"radius":10,units:"kilometers","lat":40.00,"lng":-120})
- cname=near({"lat":40.00,"lng":-120})
  **note:** radius defaults to 1 km when using *near*`
    }
//     location: {
//         schema: {
//             type: "object",
//             properties: {
//                 radius: { type: "number" },
//                 lat:    { type: "number", minimum: -90, maximum: 90 },
//                 lng:    { type: "number", minimum: -180, maximum: 180 },
//                 find:   { type: "string", enum: ["near", "within"] },
//                 units:  { type: "string", enum: ["miles", "kms"] }
//             }
//         },
//         help: `Can use the following syntax: 
// - {find: &lt;"within" or "near"&gt;, radius: &lt;number&gt;, lat: &lt;number between -90 and 90&gt;, lng: &lt;number between -180 and 180&gt;, units: &lt;"miles" or "kms"&gt;}
//   *note:* radius defaults to 1 km when using 'near'
//   **note:** units defaults to kms if not provided`
//     }
}