import { archives } from "./archives/index.js";
import { bibRefCitations } from "./bibRefCitations/index.js";
import { bibRefCitationsFts } from "./bibRefCitationsFts/index.js";
import { biomes } from "./biomes/index.js";
import { classes } from "./classes/index.js";
import { collectionCodes } from "./collectionCodes/index.js";
import { downloads } from "./downloads/index.js";
import { ecoregions } from "./ecoregions/index.js";
import { etl } from "./etl/index.js";
import { families } from "./families/index.js";
import { figureCitations } from "./figureCitations/index.js";
//import { figureCitations_images } from "./figureCitations_images/index.js";
import { genera } from "./genera/index.js";
import { images } from "./images/index.js";
//import { images_figureCitations } from "./images_figureCitations/index.js";
import { imagesFts } from "./imagesFts/index.js";
import { journals } from "./journals/index.js";
import { journalsByYears } from "./journalsByYears/index.js";
import { kingdoms } from "./kingdoms/index.js";
import { materialCitations } from "./materialCitations/index.js";
import { materialCitations_collectionCodes } from "./materialCitations_collectionCodes/index.js";
import { materialCitationsFts } from "./materialCitationsFts/index.js";
import { materialCitationsGeopoly } from "./materialCitationsGeopoly/index.js";
import { materialCitationsRtree } from "./materialCitationsRtree/index.js";
import { orders } from "./orders/index.js";
import { phyla } from "./phyla/index.js";
import { realms } from "./realms/index.js";
import { species } from "./species/index.js";
//import { taxa } from "./taxa/index.js";
import { treatmentAuthors } from "./treatmentAuthors/index.js";
import { treatmentCitations } from "./treatmentCitations/index.js";
import { treatments } from "./treatments/index.js";
import { treatmentsFts } from "./treatmentsFts/index.js";
import { unzip } from "./unzip/index.js";

const resources = [
    biomes,
    bibRefCitations,
    classes,
    collectionCodes,
    ecoregions,
    families,
    figureCitations,
    genera,
    images,
    journals,
    kingdoms,
    materialCitations,
    orders,
    phyla,
    realms,
    species,
    //taxa,
    treatmentAuthors,
    treatmentCitations,
    treatments
]

const tables = [
    archives,
    bibRefCitations,
    bibRefCitationsFts,
    biomes,
    classes,
    collectionCodes,
    downloads,
    ecoregions,
    etl,
    families,
    figureCitations,
    //figureCitations_images,
    genera,
    images,
    //images_figureCitations,
    imagesFts,
    journals,
    journalsByYears,
    kingdoms,
    materialCitations,
    materialCitations_collectionCodes,
    materialCitationsFts,
    materialCitationsGeopoly,
    materialCitationsRtree,
    orders,
    phyla,
    realms,
    species,
    treatmentAuthors,
    treatmentCitations,
    treatments,
    treatmentsFts,
    unzip
];

// const databases = {
//     geodata: [
//         biomes,
//         //'biome_synonyms',
//         ecoregions,
//         //'ecoregionsPolygons',
//         //'ecoregionsGeopoly',
//         //'realms'
//     ],
//     zenodeo: [
//         archives,
//         bibRefCitations,
//         bibRefCitationsFts,
//         classes,
//         collectionCodes,
//         downloads,
//         etl,
//         families,
//         figureCitations,
//         genera,
//         images,
//         imagesFts,
//         journals,
//         journalsByYears,
//         kingdoms,
//         materialCitations,
//         materialCitations_collectionCodes,
//         materialCitationsFts,
//         materialCitationsGeopoly,
//         materialCitationsRtree,
//         orders,
//         phyla,
//         realms,
//         species,
//         treatmentAuthors,
//         treatmentCitations,
//         treatments,
//         treatmentsFts,
//         unzip
//     ]
// }

export { resources, tables }