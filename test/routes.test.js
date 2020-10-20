'use strict'

const config = require('config')
const uriZenodeo = config.get('url.zenodeo')

const log = require('../lib/utils')('TEST')
const qs = require('qs')
const ajvOpts = config.get('v3.ajv.options')

const { test } = require('tap')
const build = require('../app')
const opts = {
    querystringParser: str => qs.parse(str, { comma: true }),
    logger: log,
    ajv: ajvOpts
}

const app = build(opts)

const routes = require('./routes')

routes.forEach(r => {
	
	const arr = [ '$refreshCache=true' ]
	for (let k in r.query) {
		arr.push(`${k}=${r.query[k]}`)
	}
	r.query.$refreshCache = true
	
	const description = `${r.url}?${arr.join('&')}`

	test(description, t => {

		t.plan(r.response ? 4 : 3)

		app.inject({
			method: 'GET',
			url: `${uriZenodeo}/${r.url}`,
			query: r.query
		}, (error, response) => {
			t.error(error)
			t.strictEqual(response.statusCode, 200, 'statusCode 200')
			t.strictEqual(response.headers['content-type'], 'application/json; charset=utf-8', 'content-type json')

			if (r.response) {
				t.deepEqual(response.json().item.count, r.count)
			}
		})
	})
})