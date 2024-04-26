import url from 'node:url';
import Database from "better-sqlite3";
const db = new Database(':memory:', { verbose: console.log });
const str = 'https://podcasts.files.bbci.co.uk/b05qqhqp.rss';
const myURL = new URL(str); 
console.log(myURL);