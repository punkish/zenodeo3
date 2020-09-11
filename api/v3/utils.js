'use strict'

const config = require('config')
const url = config.get('url')
const Database = require('better-sqlite3')
const db = new Database(config.get('data.treatments'))
const env = config.get('env')

// const packageResult = ({ records, count, resource, params, thispage, prevpage, nextpage }) => {
const packageResult = ({ resource, params, res }) => {
    const thispage = 1;
    const prevpage = 1;
    const nextpage = 2;
    let thisq
    let prevq
    let nextq
    let thisqs
    let prevqs
    let nextqs

    if (params) {
        thisq = prevq = nextq = JSON.parse(JSON.stringify(params))

        thisq.page = thispage
        thisqs = q2qs(thisq)

        prevq.page = prevpage
        prevqs = q2qs(prevq)

        nextq.page = nextpage
        nextqs = q2qs(nextq)

        delete params.poly 
    }

    const data = {
        value: {
            'search-criteria': params,
            'num-of-records': res.d1[0].num_of_records,
            _links: {
                self: { href: `${url}/${resource}${thisqs}` },
                prev: { href: `${url}/${resource}${prevqs}` },
                next: { href: `${url}/${resource}${nextqs}` }
            },
            prevId: 0,
            nextId: 316,
            from: 1,
            to: 129,
            prevpage: prevpage,
            nextpage: nextpage,
            records: halify(res.d2)
        }
    }

    if (env === 'test') {
        data.debug = {
            count: {
                sql: {
                    query: res.queries.count.debug.join(' '),
                    t: res.t1
                }
            },
            records: {
                sql: {
                    query: res.queries.records.debug.join(' '),
                    t: res.t2
                }
            }
        }
    }

    return data
}

const q2qs = function(q) {
    let qs = []
    for (const k in qs) {
        qs.push(`${k}=${qs[k]}`)
    }

    if (qs.length) {
        return qs.join('&')
    }
    else {
        return ''
    }
}

// make HAL links for the record(s)
const halify = (d) => {
    // const { resource, query, thispage, prevpage, nextpage } = params

    // const thisq = JSON.parse(JSON.stringify(query))
    // thisq.page = thispage
    // const thisqs = q2qs(thisq)

    // const prevq = JSON.parse(JSON.stringify(query))
    // prevq.page = prevpage
    // const prevqs = q2qs(prevq)

    // const nextq = JSON.parse(JSON.stringify(query))
    // nextq.page = nextpage
    // const nextqs = q2qs(nextq)

    // return {
    //     self: { href: `${url}/${resource}?${thisqs}` },
    //     prev: { href: `${url}/${resource}?${prevqs}` },
    //     next: { href: `${url}/${resource}?${nextqs}` }
    // }

    const len = d.length
    if (len) {
        for (let i = 0, j = len; i < j; i++) {
            const record = d[i]
            record._links = {
                self: { href: `${url}/treatments?treatmentId=${record.treatmentId}` }
            }
        }

        return d
    }
}

const sqlRunner = (sql, params) => {
    try {
        let t = process.hrtime()
        const data = db.prepare(sql).all(params)
        t = process.hrtime(t)

        // 't' is an array of seconds and nanoseconds
        // convert 't' into ms 
        return [ data, Math.round((t[0] * 1000) + (t[1] / 1000000)) ]
    }
    catch(error) {
        console.error(error)
    }
}

module.exports = {
    packageResult: packageResult,
    sqlRunner: sqlRunner,
    halify: halify
}