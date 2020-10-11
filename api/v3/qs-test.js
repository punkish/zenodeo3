'use strict'

const querystring = require('querystring')


const getOriginalUrl = (request) => {

    const qs_orig = request.url.split('?')[1]
    const qp = querystring.parse(qs_orig)

    if ('$refreshCache' in qp) {
        delete qp.$refreshCache
    }

    const params = Object.keys(qp)
        .sort()
        .map(k => {
            let str

            if (Array.isArray(qp[k])) {
                str = qp[k].sort().map(e => `${k}=${e}`).join('&')
            }
            else {
                str = `${k}=${qp[k]}`
            }
            
            return str
        })

    const qs = params.join('&')

    return { 
        qs, qp
    }
}

const request = {
    url: '/v3/figurecitations?$cols=httpUri&$refreshCache=true&$page=3&$size=40&captionText=hemelytra&$cols=captionText'
}

const obj = getOriginalUrl(request)
console.log(obj)