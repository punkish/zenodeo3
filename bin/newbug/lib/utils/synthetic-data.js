import Chance from "chance";
const chance = new Chance();

function makeJournals(num) {
    const jrn = 'Journal of';

    return Array.from({ length: num }, () => {
        return {
            journalTitle: `${jrn} ${chance.sentence({words: 2}).slice(0, -1)}`,
            journalYear: chance.year({min: 1925, max: 2024})
        }
    });
}

function makeDoi() {
    const a = chance.floating({ min: 10, max: 11 });
    const b = chance.word();
    const c = chance.integer({ min: 1000, max: 10000 });
    const d = `${a}/${b}.${c}`;
    return chance.bool() ? d : `http://doi.org/${d}`
}

function getRank() {
    const ranks = [
        'kingdom', 'phylum', 'class', 'order', 'genus', 'family', 'species'
    ];

    return ranks[Math.floor(Math.random()*ranks.length)]
}

function makeMany(cb, num, journals) {
    if (journals) {
        return Array.from({ length: num }, () => cb(journals));
    }
    else {
        const id = makeGuid();
        return Array.from({ length: num }, (v, i) => {
            v = id;
            return cb(v, i);
        });
    }
}

function makeCollectionCode(materialCitationId) {
    return {
        country: chance.country(),
        name: chance.sentence({ words: 3 }),
        httpUri: chance.url(),
        lsid: makeLSID('biocol.org:col', chance.integer()),
        type: chance.word(),
        collectionCode: chance.word().toUpperCase(),
        materialCitationId
    }
}

function makeMaterialCitation() {
    const materialCitationId = makeGuid();
    const collectionCodes = makeMany(
        function() { return makeCollectionCode(materialCitationId) }, 
        chance.integer({min: 1, max: 5})
    );

    return {
        materialCitationId,
        latitude: chance.bool() ? chance.latitude() : null,
        longitude: chance.bool() ? chance.longitude() : null,
        collectingDate: makeDate(),
        collectionCodeCSV: collectionCodes.map(c => c.collectionCode).join(','),
        collectorName: chance.name(),
        country: chance.country({ full: true }),
        collectingRegion: chance.word(),
        municipality: chance.word(),
        county: chance.word(),
        stateProvince: chance.word(),
        location: chance.word(),
        locationDeviation: chance.word(),
        specimenCountFemale: chance.integer({min: 0, max: 30}),
        specimenCountMale: chance.integer({min: 0, max: 30}),
        specimenCount: chance.integer({min: 0, max: 30}),
        specimenCode: chance.word(),
        typeStatus: chance.word(),
        determinerName: chance.name(),
        collectedFrom: chance.word(),
        collectingMethod: chance.word(),
        elevation: chance.floating(),
        httpUri: chance.url(),
        deleted: 0,
        isOnLand: chance.bool ? 1 : 0, 
        ecoregions_id: chance.integer({min: 0, max: 30}), 
        biomes_id: chance.integer({min: 0, max: 30}), 
        realms_id: chance.integer({min: 0, max: 30}),
        fulltext: chance.paragraph({ sentences: 2 }),
        collectionCodes
    }
}

function makeBibRefCitationId() {
    return {
        bibRefCitationId: makeGuid(),
        DOI: makeDoi(),
        author: chance.sentence({ words: 5 }),
        journalOrPublisher: chance.sentence({ words: 3 }),
        title: chance.sentence({ words: 5 }),
        refString: chance.sentence({ words: 15 }),
        type: chance.sentence({ words: 3 }),
        year: chance.year(),
        innertext: chance.sentence({ words: 4 })
    }
}

function makeFigureCitation(figureCitationId, figureNum) {
    return {
        figureCitationId,
        figureNum,
        httpUri: chance.url(),
        figureDoiOriginal: makeDoi(),
        captionText: chance.sentence({ words: 10 }),
        innertext: chance.sentence({ words: 5 }),
        updateVersion: chance.integer({ min: 0, max: 4 })
    }
}

function makeDate() {
    const mm = String(chance.integer({min: 1, max: 12})).padStart(2, '0');
    const dd = String(chance.integer({min: 1, max: 31})).padStart(2, '0');
    const yyyy = chance.year();
    return `${yyyy}-${mm}-${dd}`
}

function makeImage() {
    return {
        httpUri: chance.url(),
        figureDoiOriginal: makeDoi(),
        captionText: chance.paragraph({ sentences: 3 })
    }
}

function makeLSID(prefix, id) {
    return `urn:lsid:${prefix}:${id}`
}

function makeGuid() {
    return chance.guid().replace(/-/g, '').toUpperCase()
}

function makeTreatment(journals) {
    const journal = journals[Math.floor(Math.random()*journals.length)];
    const treatmentId = makeGuid();

    return {
        treatmentId,
        treatmentTitle: chance.sentence({ words: 5 }).slice(0, -1),
        treatmentVersion: chance.integer({ min: 1, max: 10 }),
        treatmentDOIorig: makeDoi(),
        treatmentLSID: makeLSID('plazi:treatment', treatmentId),
        zenodoDep: chance.integer({ min: 100000, max: 999999 }),
        zoobankId: "",
        articleId: makeGuid(),
        articleTitle: chance.sentence({ words: 5 }),
        articleAuthor: chance.name(),
        articleDOIorig: makeDoi(),
        publicationDate: makeDate(),
        journalTitle: journal.journalTitle,
        journalYear: journal.journalYear,
        journalVolume: chance.integer({ min: 1, max: 100 }),
        journalIssue: chance.integer({ min: 1, max: 10 }),
        pages: `${chance.integer({min: 1, max: 10})}-${chance.integer({min: 1, max: 10})}`,
        authorityName: chance.name(),
        authorityYear: chance.year(),
        kingdom: chance.word({ length: 5 }),
        phylum: chance.word({ length: 5 }),
        class: chance.word({ length: 5 }),
        order: chance.word({ length: 5 }),
        genus: chance.bool() ? chance.word({ length: 5 }) : null,
        family: chance.word({ length: 5 }),
        species: chance.bool() ? chance.word({ length: 5 }) : null,
        status: chance.sentence({ words: 2 }),
        taxonomicNameLabel: chance.sentence({ words: 5 }),
        rank: getRank(),
        updateTime: chance.hammertime(),
        checkinTime: chance.hammertime(),
        timeToParseXML: chance.millisecond(),
        updated: null,
        deleted: 0,
        fulltext: chance.paragraph({ sentences: 10 }),
        materialCitations: makeMany(
            makeMaterialCitation,
            chance.integer({ min: 1, max: 4 })
        ),
        // images: makeMany(
        //     makeImage,
        //     chance.integer({ min: 0, max: 4 })
        // ),
        figureCitations: makeMany(
            makeFigureCitation,
            chance.integer({ min: 0, max: 4 })
        ),
        bibRefCitations: makeMany(
            makeBibRefCitationId,
            chance.integer({ min: 0, max: 4 })
        )
    }
}

function makeTreatments(num) {
    const journals = makeJournals(5);
    const treatments = makeMany(makeTreatment, num, journals);
    return treatments;
}


export { makeTreatments }