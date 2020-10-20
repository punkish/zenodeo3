'use strict'

module.exports = [
	{ 
		url: 'treatments',
        query: {},
        count: 370313
	},
	{
		url: 'treatments',
		query: {
			geolocation: 'within(radius:50, units:"kilometers", lat:0,lng:0)'
        },
        count: 18
	},
	{
		url: 'treatments',
		query: {
			$page: 3,
			$size: 25,
			$cols: ['treatmentTitle', 'doi'],
			treatmentId: '0038E4BB3C0E08E289CCA83CF86D4A97'
		},
        count: 1
	},
	{
		url: 'treatments',
		query: {
			q: 'Meshram',
			geolocation: 'within(radius:50, units: "kilometers", lat:25.6532, lng:3.48)',
			rank: 'species',
			$cols: ['treatmentId', 'treatmentTitle'],
			$page: 5,
			$size: 70,
			$sortby: 'journalYear:asc,zenodoDep:desc'
		},
        count: 1
	},
	{
		url: 'figurecitations',
		query: {
			figureCitationId: '10922A65E320FF95FDB6FA8EFD45FA96'
		},
		count: 1
	},
	{
		url: 'figurecitations',
		query: {
			treatmentId: '000087F6E320FF95FF7EFDC1FAE4FA7B'
		},
        count: 22
	},
	{
		url: 'treatments',
		query: {
			publicationDate: 'between(2018-1-12 and 2019-9-3)',
			$page: 1,
            $size: 30
		},
		count: 42595
	},
	{
		url: 'treatments',
		query: {
			publicationDate: 'since(2018-1-12)'
		},
		count: 103
	},
	{
		url: 'treatments',
		query: {
			authorityName: 'starts_with(Agosti)'
		},
		count: 29
	},
	{
		url: 'figurecitations',
		query: {
			treatmentId: '000087F6E320FF95FF7EFDC1FAE4FA7B',
			$cols: [ 'httpUri' ]
		},
		count: 1
	},
	{
		url: 'materialscitations',
		query: {
			materialsCitationId: '38C63CC3D74CDE17E88B8E25FCD2D91C'
		},
		count: 1
	}
]