'use strict'

const config = require('config')
const port = config.get('port')
const ajvOpts = config.get('v3.ajv.options')
const log = require('../lib/utils')('TEST')
const qs = require('qs')

const { test } = require('tap')
const build = require('../app')
const opts = {
    querystringParser: str => qs.parse(str, { comma: true }),
    logger: log,
    ajv: ajvOpts
}

test('requests "/treatments" with no querystring', async t => {
	const app = build(opts)
  
	const response = await app.inject({
	  method: 'GET',
	  url: 'http://127.0.0.1:3010/v3/treatments'
	})
	
	t.strictEqual(response.statusCode, 200, 'returns a status code of 200')
})

test('requests "/treatments" with location', async t => {
	const app = build(opts)
  
	const response = await app.inject({
	  	method: 'GET',
		url: 'http://127.0.0.1:3010/v3/treatments',
		query: {
			geolocation: 'within(radius:50, units:"kilometers", lat:0,lng:0)'
		}
	})
	
	t.strictEqual(response.statusCode, 200, 'returns a status code of 200')
})