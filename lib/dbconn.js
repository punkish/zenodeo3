// dbconn.js
// This is a single connection point for the database as well as the logger
import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { Config } from '@punkish/zconfig';
import { snipPath } from '../lib/utils.js';
import * as z from '../lib/logger.js';

const config = new Config().settings;

// Create db connections like so
//
// Read-write connection
//-----------------------------------------------
// const db = DbConnection({
//     configDatabase: fastify.zconfig.database,
//     logger: fastify.zlog
//     readonly: true
// }).getDb();
//
// db.close();
//
//==============================================
//
// Readonly connection
//-----------------------------------------------
// const db = new DbConnection({
//     configDatabase: fastify.zconfig.database,
//     logger: fastify.zlog,
//     readonly: false 
// }).getDb();
//
// db.close();


class DbConnection {

    /**
     * @param {object} options
     * @param {string} [options.mainDbFile] - override main DB file path
     * @param {string} [options.dir] - override DB directory
     * @param {boolean} [options.readonly=false] - open DB in read-only mode
     * @param {object} [options.logger] - custom logger
     */
    constructor({ mainDbFile, dir, readonly = false, logger } = {}) {
        this.logger = logger ?? z.logger;
        this.readonly = readonly;
        this.dir = dir ?? config.database.dir;
        this.mainDbFile = mainDbFile ?? config.database.main.dbFile;
        this.db = null;
        this._connect();
    }

    _connect() {
        const origLevel = this.logger.level();
        this.logger.setLevel('info');

        const mainDbPath = path.join(this.dir, this.mainDbFile);
        const mainPrefix = snipPath(mainDbPath, `${this.dir}/`);
        this.logger.info(`Creating DB connection: "${mainPrefix}"`);

        const openFlags = this.readonly ? { readonly: true } : {};
        this.db = new Database(mainDbPath, openFlags);

        this._applyPragmas();
        this._attachDatabases();

        this.logger.setLevel(origLevel);
    }

    _applyPragmas() {
        const pragmas = [
            'PRAGMA cache_size = 10240',
            'PRAGMA foreign_keys = ON',
            'PRAGMA synchronous = OFF',
            'PRAGMA journal_mode = WAL'
        ];

        pragmas.forEach(pragma => {
            this.logger.info(`Applying ${pragma}`);
            this.db.exec(pragma);
        });
    }

    _attachDatabases() {
        const entities = [ 'tables', 'views', 'indexes', 'triggers', 'temps'];

        config.database.attached.forEach(({ dbFile, schema }) => {

            const dir = schema.startsWith('geodeo_')
                ? `${config.database.dir}/geodeo`
                : config.database.dir;

            const attachedDb = path.join(dir, dbFile);
            const prefix = snipPath(attachedDb, `${dir}/`);

            this.logger.info(`Initializing attached DB: ${prefix}`);

            // Apply schema updates if .sql files exist
            const attachedDbSchema = entities.map(entity => {
                const file = path.join(
                    import.meta.dirname,
                    './schemas',
                    schema,
                    `${entity}.sql`
                );
                if (fs.existsSync(file)) {
                    return fs.readFileSync(file, 'utf8');
                }
            }).filter(Boolean);

            if (attachedDbSchema.length) {
                attachedDbSchema.unshift('BEGIN TRANSACTION;');
                attachedDbSchema.push('COMMIT;');
                const schemaText = attachedDbSchema.join('\n');
                const adb = new Database(attachedDb);
                adb.exec(schemaText);
                adb.close();
            }

            // Attach to main DB
            this.logger.info(`Attaching '${dbFile}' AS "${schema}"`);
            this.db.exec(`ATTACH DATABASE '${attachedDb}' AS ${schema}`);
        });
    }

    /** Returns the better-sqlite3 Database instance */
    getDb() {
        return this.db;
    }

    /** Closes the database connection */
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
}

export { DbConnection };