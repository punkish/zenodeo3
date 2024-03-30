import { init1 } from "./trad.js";
import { init2 } from "./ng.js";
import { init3 } from "./ng2.js";

const queries = [
    {
        name: 'specific journal',
        from: 'images JOIN treatments ON images.treatments_id = treatments.id JOIN journals ON treatments.journals_id = journals.id',
        where: `journals."journalTitle" = 'European Journal of Taxonomy'`
    },
    {
        name: 'fts and publicationDate BETWEEN',
        from: 'images JOIN treatments ON images.treatments_id = treatments.id JOIN treatmentsFts ON treatments.id = treatmentsFts.rowid',
        where: `treatmentsFts.fulltext MATCH 'agosti' AND 
        treatments.publicationDateMs BETWEEN 
            ((julianday ('2021-01-01') - 2440587.5) * 86400000) AND 
            ((julianday ('2022-12-31') - 2440587.5) * 86400000)`
    },
    {
        name: 'order',
        from: 'images JOIN treatments ON images.treatments_id = treatments.id JOIN orders ON treatments.orders_id = orders.id',
        where: `orders."order" = 'coleoptera'`
    },
    {
        name: 'class',
        from: 'images JOIN treatments ON images.treatments_id = treatments.id JOIN classes ON treatments.classes_id = classes.id',
        where: `classes."class" = 'Actinopterygii'`
    },
    {
        name: 'family',
        from: 'images JOIN treatments ON images.treatments_id = treatments.id JOIN families ON treatments.families_id = families.id',
        where: `families."family" = 'Formicidae'`
    },
    {
        name: 'fishes from publications since date',
        from: `images JOIN treatments ON images.treatments_id = treatments.id JOIN classes ON treatments.classes_id = classes.id`,
        where: `treatments."publicationDateMs" >= ((julianday('2021-12-21') - 2440587.5) * 86400000) AND classes."class" = 'Actinopterygii'`
    }
]


function timerFormat (t) {
    return {
        ms: (t[0] * 1000) + (t[1]/10e6).toFixed(2),
        formatted: `${t[0]} secs ${(t[1]/10e6).toFixed(2)} ms`
    };
}

for (const query of queries) {
    const from = query.from;
    const where = query.where;
    const name = query.name;

    console.log(`Query: ${name}`);
    console.log('='.repeat(50));
    const result1 = init2(from, where);
    const t1 = timerFormat(result1.runtime);
    const onetime = t1.ms;
    console.log(`  one took ${t1.formatted}`);
    console.log(`  found ${result1.num_of_records} records`);
    console.log('-'.repeat(50));

    const result2 = init3(from, where);
    const t2 = timerFormat(result2.runtime);
    const twotime = t2.ms;
    console.log(`  two took ${t2.formatted}`);
    console.log(`  found ${result2.num_of_records} records`);
    console.log('-'.repeat(50));

    if (twotime > onetime) {
        const delta = twotime - onetime;
        const perc = (delta / onetime) * 100;
        console.log(`  two was ${perc.toFixed(2)}% slower`);
    }
    else {
        const delta = onetime - twotime;
        const perc = (delta / onetime) * 100;
        console.log(`  two was ${perc.toFixed(2)}% faster`);
    }
}
