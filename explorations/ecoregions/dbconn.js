import Database from 'better-sqlite3';
const dbgeo = new Database('./geo.sqlite');
const dbmat = new Database('./mat.sqlite');
// dbgeo.pragma('journal_mode = WAL');
dbgeo.pragma('foreign_keys = ON');
// dbmat.pragma('journal_mode = WAL');
dbmat.pragma('foreign_keys = ON');
dbmat.prepare(`ATTACH DATABASE './geo.sqlite' AS geo`).run();

export { dbgeo, dbmat }