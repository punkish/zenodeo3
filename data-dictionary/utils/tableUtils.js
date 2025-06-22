import { tables } from '../resources/index.js';
import { commonparams } from '../resources/commonparams.js';
import { cache } from '../../lib/zimple-cache.js';

const getTableProperties = () => Object.keys(tables[0]).join("\n\t- ");

const getTableSchemas = () => {
    const reducer = (acc, obj) => {
        const cols = getCols(obj.name);

        const table = {
            name: obj.name,
            createStmt: createTable(obj.name),
            triggers: getTable(obj.name, 'triggers'),
            insertFuncs: getTable(obj.name, 'inserts'),
            indexes: createIndexes(obj.name, cols)
        }

        const i = acc.findIndex(e => {
            if (obj.database) {
                return e.database.name === obj.database.name
                    ? true
                    : false;
            }
            else {
                return false;
            }
        });

        if (i > -1) {
            acc[i].tables.push(table);
        }
        else {
            acc.push({
                database: obj.database,
                tables: [ table ]
            })
        }

        return acc;
    }

    return tables.reduce(reducer, [])
}

function getTables(property = 'name') {

    if (property === 'name') {
        return tables.map(r => r[property]);
    }
    else {
        const obj = {};
        tables.forEach(r => obj[r.name] = r[property]);
        return obj;
    }
    
}

// const getTable = (tableName, property) => getEntity(tableName, 'table', property);

function getTable(tableName, property) {
    const table = tables.filter(t => t.name === tableName)[0];

    return property
        ? table[property]
        : table;
}

const getCols = (tableName) => {

    // if there is an attached database, SQLite treats it as a separate
    // schema accessible via its own namespace. (This schema is not the same
    // as the 'JSON schema')
    const schema = getTable(tableName, 'attachedDatabase')
        ? getTable(tableName, 'attachedDatabase').name
        : '';

    const colsCopy = JSON.parse(JSON.stringify(getTable(tableName, 'params')));
    const cols = colsCopy
        .filter(col => col.sql)
        .filter(col => !col.external)
        .map(col => {

            // if selname doesn't already exist, create a fully-qualified 
            // selname by prefixing with the resourceName
            if (!col.selname) {
                col.selname = schema
                    ? `${schema}.${tableName}.${col.name}`
                    : `${tableName}.${col.name}`
            }

            if (col.alias) {
                col.fqname = `${col.selname} AS ${col.alias}`;
            }

            // add a where name
            if (!col.where) {
                col.where = schema 
                    ? `${schema}.${tableName}.${col.name}`
                    : `${tableName}.${col.name}`;
            }

            return col;
        });

    return cols;
}

const getCol = (tableName, colname, property) => {
    const segment = `tbl_${tableName}`;
    const key = 'col';
    const res = cache({ segment, key });

    if (res) {
        return res;
    }

    const col = getCols(tableName)
        .filter(col => col.name === colname)[0];

    cache({ segment, key, val: col });
    return col;
}

const getXmlCols = (tableName) => {
    const segment = `tbl_${tableName}`;
    const key = 'xmlCols';
    const res = cache({ segment, key });

    if (res) {
        return res;
    }

    // first, get all the params from the dictionary
    const cols = getTable(tableName, 'params');

    // all columns that have cheerio and that are not external
    const cheerioCols = cols.filter(col => col.cheerio && !col.external);

    // all cols that are FKs
    const fkCols = cols.filter(col => col.fk);

    // concat the above two and get their name and cheerio expr
    const xmlCols = [...cheerioCols, ...fkCols]
        .map(col => {
            return {
                name: col.name,
                cheerio: col.cheerio
            }
        });
    
    cache({ segment, key, val: xmlCols });
    return xmlCols;
}

const getDOM = (tableName) => {
    const segment = `tbl_${tableName}`;
    const key = 'DOM';
    const res = cache({ segment, key });

    if (res) {
        return res;
    }

    const DOM = {}

    // first, get all the params from the dictionary
    const cols = getTable(tableName, 'params');

    // all columns that have cheerio and that are not external
    const cheerioCols = cols.filter(col => col.cheerio && !col.external);

    // all cols that are FKs
    const fkCols = cols.filter(col => col.fk);

    // concat the above two and get their name and cheerio expr
    [...cheerioCols, ...fkCols]
        .forEach(col => DOM[col.name] = col.cheerio);

    cache({ segment, key, val: DOM });
    return DOM;
}

const _sqlComment = (str, outarr = []) => {
    const inarr = str.split(' ');
    const tmparr = [];
    const tab = '    ';
    let tmpsen;

    for (let i = 0, j = inarr.length; i < j; i++) {
        tmparr.push(inarr[i]);
        tmpsen = tmparr.join(' ');

        if (tmpsen.length > 60) {
            break;
        }
        
    }

    outarr.push(tmpsen);
    const remaining = str.substring(tmpsen.length + 1);

    if (remaining) {
        _sqlComment(remaining, outarr);
    }
    
    const prefix = `${tab}-- `;
    return `${prefix}${outarr.join(`\n${prefix}`)}`;
}

/**
 * @function createTable
 * @returns {string} create table statement
 */
const createTable = (tableName, cols) => {
    if (!tableName) {
        console.error('required argument "tableName" missing');
        return;
    }

    const table = getTable(tableName);
    const tableType = table.tableType;
    const sqliteExtension = table.sqliteExtension;
    const viewSource = table.viewSource;
    const isWithoutRowid = table.isWithoutRowid;

    if (!cols) {
        cols = getCols(tableName);
    }
    
    const tab = '    ';

    let stmt = `CREATE ${tableType} IF NOT EXISTS ${tableName}`;

    if (tableType === 'VIEW') {
        stmt += ` AS${viewSource}\n`;
    }
    else {
        if (tableType === 'TABLE') {
            stmt += ' (\n';
        }
        else if (tableType === 'VIRTUAL TABLE') {
            stmt += ` USING ${sqliteExtension} (\n`;
        }

        stmt += cols.map(c => {
            let stmt = '';
            let comment = '';

            if (c.sql.desc) {
                comment = _sqlComment(c.sql.desc);
                stmt += `\n${comment}\n`;
            }

            if (c.name.substring(0, 1) === '_') {

                // if col.name starts with '_' then it is not really 
                // a column but a column qualifier such as 'PRIMARY KEY' 
                // or 'UNIQUE'. See materialCitations_x_collectionCodes.params 
                // for example
                stmt += `${tab}${c.sql.type}`;
            }
            else {

                stmt += (tableType === 'TABLE')
                    ? `${tab}"${c.name}"`
                    : `${tab}${c.name}`;

                if (c.sql.type) {
                    stmt += ` ${c.sql.type}`;
                }
            }
            
            return stmt;
        }).join(",\n");

        stmt += '\n)';

        if (isWithoutRowid) {
            stmt += ` WITHOUT rowid`;
        }
    }
    
    return stmt;
}

const createIndexes = (tableName, cols) => {
    const table = getTable(tableName);
    const tableType = table.tableType.toUpperCase();

    if (tableType === 'TABLE') {
        if (!cols) {
            cols = getCols(tableName);
        }
        
        const indexes = {};

        for (const col of cols) {
            const c1 = col.name.substring(0, 1) !== '_';
            const c2 = col.sql.type.indexOf('PRIMARY KEY') == -1;
            const c3 = col.sql.type.indexOf('UNIQUE') == -1;
            const c4 = col.indexed !== false;

            if (c1 && c2 && c3 && c4) {

                // Adjust the name of the 'caption' column to 'captionText'
                if (tableName === 'images' && col.name === 'caption') {
                    col.name = 'captionText';
                }

                const idx = `ix_${tableName}_${col.name}`;
                indexes[idx] = `CREATE INDEX IF NOT EXISTS ${idx} ON ${tableName} ("${col.name}")`
            }
        }

        if (Object.keys(indexes).length) {
            return indexes;
        }
    }
}

const getNotCols = () => commonparams.map(c => c.name);

export { 
    getTableSchemas,
    getTableProperties,
    getTables,
    getTable,
    getCols,
    getCol,
    getNotCols,
    getXmlCols,
    getDOM,
    createTable,
    createIndexes
}