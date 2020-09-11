'use strict'

const { test } = require('tap')
const build = require('../app')

test('requests "/treatments" with no querystring', async t => {
	const app = build()
  
	const response = await app.inject({
	  method: 'GET',
	  url: 'http://127.0.0.1:3010/v3/treatments'
	})

	t.strictEqual(response.statusCode, 200, 'returns a status code of 200')
})

test('requests "/treatments" with location', async t => {
	const app = build()
  
	const response = await app.inject({
	  	method: 'GET',
		url: 'http://127.0.0.1:3010/v3/treatments',
		query: {
			location: 'within({"r":50,"units":"kilometers","lat":0,"lng":0})'
		}
	})
	
	t.strictEqual(response.statusCode, 200, 'returns a status code of 200')
})