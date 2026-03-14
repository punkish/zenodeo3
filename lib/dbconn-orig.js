// This is a single connection point for the database as well as the logger
import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { Config } from '@punkish/zconfig';
const config = new Config().settings;
import { snipPath } from '../lib/utils.js';
import * as z from '../lib/logger.js';

function connectDb(obj) {
    const configDatabase = obj.configDatabase ?? config.database
    const logger = obj.logger ?? z.logger;
    
    // Save original log level so it can be set back to it later
    const origLevel = logger.level();
    logger.setLevel('info');
    const entities = [ 'tables', 'views', 'indexes', 'triggers', 'temps'];

    // Before anything, we will create a connection to the main db, 
    // zenodeo.sqlite
    const dir = configDatabase.dir;
    const mainDb = `${dir}/${configDatabase.main.dbFile}`;
    const mainPrefix = snipPath(mainDb, `${dir}/`);
    logger.info(`creating db connection with "${mainPrefix}"`);
    const dryRun = false;
    const db = dryRun ? false : new Database(mainDb);

    const pragmas = [
        'PRAGMA cache_size = 10240',
        'PRAGMA foreign_keys = ON',
        'PRAGMA synchronous = OFF',

        // can also be MEMORY
        'PRAGMA journal_mode = WAL'
    ];

    pragmas.forEach(pragma => {
        logger.info(`applying ${pragma}`);
        
        if (db) db.exec(pragma);
    });
    
    // Now, we will process each attached db
    configDatabase.attached.forEach(({ dbFile, schema }) => {

        // geodeo mbtiles databases are stored under the 
        // geodeo folder so add that to the dir
        const dir = schema.indexOf('geodeo_') > -1
            ? `${configDatabase.dir}/geodeo`
            : configDatabase.dir;
    
        const attachedDb = `${dir}/${dbFile}`;
        const prefix = snipPath(attachedDb, `${dir}/`);

        // First, make sure the attached db schema is up to date
        logger.info(`initializing ${prefix}`);

        const attachedDbSchema = entities.map(entity => {
            const dir = import.meta.dirname;
            const file = path.join(dir, './schemas', schema, `${entity}.sql`);

            if (fs.existsSync(file)) {
                return fs.readFileSync(file, 'utf8');
            }
        });

        attachedDbSchema.unshift('BEGIN TRANSACTION;');
        attachedDbSchema.push('COMMIT;');
        const attachedDbSchemaTxt = attachedDbSchema
            .join('\n')
            .split(/\r?\n/)
            .filter(line => line.trim() !== '')
            .join('\n');

        const dryRun = false;
        const adb = dryRun ? false : new Database(attachedDb);

        if (adb) {
            adb.exec(attachedDbSchemaTxt);
            adb.close();
        }

        // Now attach the db to the main db
        logger.info(`attaching '${dbFile}' AS "${schema}"`);
        if (db) db.exec(`ATTACH DATABASE '${attachedDb}' AS ${schema}`);
    });
    
    logger.setLevel(origLevel);
    return db;
}

export { connectDb }