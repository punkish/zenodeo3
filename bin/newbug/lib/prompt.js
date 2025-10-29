import { underline, white, blue, red, grey, yellow, green } from 'kleur/colors';

const b = str => blue(str);
const w = str => white(str);
const g = str => green(str);
const y = str => yellow(str);
const gr = str => grey(str);

export function showPrompt() {
    const len = 69;

    return `
${b('newbug USAGE')}
${b('━'.repeat(len))}
${w('$ node bin/newbug/index.js')}
    ${w('--action=[parseOneFile | getCounts | getArchiveUpdates | etl]')}
    ${w('--mode  =[dryRun | test | real]')}
    ${w('--source=[archive | <xmldir> | <xmlfile>]')}
    ${w('--help')}

${g('─'.repeat(len))}
${g('Note 1:')}
${g('─'.repeat(len))}
${g(`- ${underline('All')} options except --action are optional.`)}
${g('- If no options are provided, or the option is --help')}
${g('  this usage is printed in the terminal.')}
${g('- Options not provided (except --action) are picked up from config.')}
${g('- [choices] are choose-one-from-the-list.')}

${y('EXAMPLES')}
${y('━'.repeat(len))}

${y(`$ index.js --help`)}              ${gr('// this text')}
${y(`$ index.js --action=getCounts`)}      ${gr('// get count in each table')}
${y(`$ index.js --action=getArchiveUpdates`)} ${gr('// updates for all archives')}
${g('─'.repeat(len))}
${g('Note 2: No other options are required for the above --action invocations')}
${g('─'.repeat(len))}

${y(`$ index.js --action=etl`)}            ${gr('// perform the ETL')}

${g('─'.repeat(len))}
${g('Note 3: If --action is not provided, it is picked up from config.')}
${g('─'.repeat(len))}
${g('Additional options are as below, and may be provided on command line')}
${g('or, if not, they will be picked up from the config settings')}

${y(`$ index.js --mode=dryRun`)}       ${gr('// dry run only')}
${y(`$ index.js --mode=real`)}         ${gr('// make permanent changes')}
${y(`$ index.js --source=archive`)}    ${gr('// use archives')}

${y(`$ index.js --source=<xmldir>`)}   ${gr('// an XML archive')}
${y(`$ index.js --source=./data/treatments-dumps/xmls`)}

${y(`$ index.js --source=<xmlfile>`)}  ${gr('// a single XML')}
${y(`$ index.js --source=./data/treatments-dumps/xmls/000587EFFFADFFC267F7FAC4351CFBC7.xml`)}

${y(`$ index.js --source=<xmldir>`)} \\  ${gr('// an XML archive')}
    ${y('--print=<part>')}              ${gr('// print treatment part:')}
                                ${gr('//    - figureCitations')}
                                ${gr('//    - materialCitations')}
                                ${gr('//    - bibRefCitations')}
                                ${gr('//    - treatmentCitations')}
                                ${gr('//    - treatmentAuthors')}
                                ${gr('//    - images')}
${y(`$ index.js --source=./data/treatments-dumps/xmls`)} \\
    ${y('--print=materialCitations')}
            `
}