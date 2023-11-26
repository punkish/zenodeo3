import Database from 'better-sqlite3';
const db = new Database('./geo.sqlite');
db.pragma('journal_mode = WAL');

export { db }