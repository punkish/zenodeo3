import { Config } from '@punkish/zconfig';
const config = new Config().settings;
const truebug = config.truebug;

import fs from 'fs';

const getUrl = (typeOfArchive) => {
    const remoteArchive = typeOfArchive === 'yearly' 
        ? 'plazi.zenodeo.zip'
        : `plazi.zenodeo.${typeOfArchive}.zip`;

    const pathToArchive = `/${truebug.server.path}/${remoteArchive}`;
    return `${truebug.server.hostname}/${pathToArchive}`;
}

const getLocalcopy = (method, typeOfArchive, lastModified) => {
    //console.log(method, lastModified)
    const d = new Date(lastModified);
    const timeOfArchive = d.toISOString().split('T')[0];
    const archive_name = `${method}-${typeOfArchive}.${timeOfArchive}`;
    return `${truebug.dirs.zips}/${archive_name}.zip`;
}

// native node fetch
import { Readable } from 'stream';
import { finished } from 'stream/promises';

const withFetch = async (typeOfArchive) => {
    const started = new Date().getTime();
    const url = getUrl(typeOfArchive);

    const { headers } = await fetch(url, { method: 'HEAD' });
    const lastModified = headers.get('last-modified');
    const localcopy = getLocalcopy('fetch', typeOfArchive, lastModified);
    const file = fs.createWriteStream(localcopy);
    //console.log(Object.fromEntries(headers));

    const res = await fetch(url);

    try {
        await finished(Readable.fromWeb(res.body).pipe(file));
    } 
    catch (err) {
        console.error(err.stack);
    }

    const ended = new Date().getTime();
    console.log(`"native node fetch" took: ${ended - started}`);
}

// got
//import stream from 'node:stream';
import { pipeline as streamPipeline } from 'node:stream/promises';
import got from 'got';

const withGot = async (typeOfArchive) => {
    const started = new Date().getTime();
    const url = getUrl(typeOfArchive);

    const { headers } = await got(url, { method: 'HEAD' });
    const lastModified = headers['last-modified'];
    const localcopy = getLocalcopy('got', typeOfArchive, lastModified);
    //console.log(headers);

    await streamPipeline(
        got.stream(url),
        fs.createWriteStream(localcopy)
    );

    const ended = new Date().getTime();
    console.log(`"got" took: ${ended - started}`);
}

// unfetch
import { default as unfetch } from '../node_modules/unfetch/dist/unfetch.mjs';

const withUnfetch = async (typeOfArchive) => {
    const started = new Date().getTime();
    const url = getUrl(typeOfArchive);
    const localcopy = getLocalcopy('unfetch', typeOfArchive, headers);

    unfetch(url, { method: 'HEAD' })
        .then(r => {
            console.log(r.headers)
        });

    const ended = new Date().getTime();
    console.log(`"unfetch" took: ${ended - started}`);
}

// node-fetch
import { default as nodeFetch } from 'node-fetch';
//import {createWriteStream} from 'node:fs';
//import {pipeline} from 'node:stream';
//import {promisify} from 'node:util'

const withNodeFetch = async (typeOfArchive) => {
    const started = new Date().getTime();
    const url = getUrl(typeOfArchive);

    const { headers } = await nodeFetch(url, { method: 'HEAD' });
    const lastModified = headers.get('last-modified');
    const localcopy = getLocalcopy('nodeFetch', typeOfArchive, lastModified);
    const response = await nodeFetch(url);

    //if (!response.ok) throw new Error(`unexpected response ${response.statusText}`);
    //const streamPipeline = promisify(pipeline);
    await streamPipeline(
        response.body, 
        fs.createWriteStream(localcopy)
    );

    const ended = new Date().getTime();
    console.log(`"node-fetch" took: ${ended - started}`);
}

const typeOfArchive = 'weekly';
withGot(typeOfArchive);
//withUnfetch(typeOfArchive);
withNodeFetch(typeOfArchive);
withFetch(typeOfArchive);