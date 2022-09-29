# zenodeo3

A `nodejs` API to the [Zenodo API](https://zenodo.org/api).

## Technical notes

Built with [Fastify](https://www.fastify.io/) and [SQLite](https://sqlite.org/). Requires [nodejs](https://nodejs.org) v. >= 16.x. To install:

```
~$ git clone git@github.com:punkish/zenodeo3.git
~$ cd zenodeo3
~/zenodeo3$ npm i
~/zenodeo3$ node server
```

## Objective

Zenodeo is a node-based, REST API with its own data source built from treatment XMLs downloaded periodically from [TreatmentBank](https://plazi.org/treatmentbank/). It allows querying treatment data granularly against almost all its uniquely tagged information that has been parsed and extracted out of XMLs and stored in a relational database. Zenodeo is particularly fast at full-text search and spatial search against an R*Tree index of `lat-lng` values of **material citations**.

Zenodeo is queried via `http`, either via the browser or, preferably, via any REST client. All the queries are `GET` requests and all the responses are JSON. The base URI is `test.zenodeo.org/v3`. The term after the base query specifies the resource that is being retrieved. So, to retrieve 'treatments', go to `test.zenodeo.org/v3/treatments` or to retrieve 'materialCitations', go to `test.zenodeo.org/v3/materialcitations`

### ZQL

Since the queries are constructed using `URLSearchParams`, only `&`-separated `key=value` pairs are allowed. The easiest query is to conduct a free-text search by specifying the `q` param which will find all the records with the specified value anywhere in the text. For example, to find all the records with the word 'agosti' anywhere in the text, use the following query

    ?q=agosti

To provide more querying flexibility, Zenodeo implements are very lightweight Zenodeo Query Language (ZQL) with an easy English-like syntax. For example, 

    ?publicationDate=since(2010-12-27)
    ?checkinTime=between(2010-12-27 and 2011-12-27) 
    
do exactly what it looks like. Similarly, 

    ?geolocation=within(radius:10,units:'kilometers',lat:40.21,lng:-120.33) 
    
finds records within the specified radius from the provided `lat-lng` pair.

## Documentation

Zenodeo3 follows the OpenAPI specs. Browse to the root to view the docs with details on ZQL and syntax examples along with a simple interface to try out queries.
