import { dictEtlStats } from './resources/metadata/etlstats.js';
import { dictTreatments } from './resources/zenodeo/treatments.js';
import { dictMaterialCitations } from './resources/zenodeo/materialcitations.js';
import { dictTreatmentCitations } from './resources/zenodeo/treatmentcitations.js';
import { dictTreatmentAuthors } from './resources/zenodeo/treatmentauthors.js';
import { dictBibRefCitations } from './resources/zenodeo/bibrefcitations.js';
import { dictFigureCitations } from './resources/zenodeo/figurecitations.js';
import { dictTreatmentImages } from './resources/zenodeo/treatmentimages.js';
import { dictCollectionCodes } from './resources/zenodeo/collectioncodes.js';
import { dictKingdoms } from './resources/zenodeo/kingdoms.js';
import { dictPhyla } from './resources/zenodeo/phyla.js';
import { dictRealms } from './resources/zenodeo/realms.js';
import { dictClasses } from './resources/zenodeo/classes.js';
import { dictOrders } from './resources/zenodeo/orders.js';
import { dictFamilies } from './resources/zenodeo/families.js';
import { dictGenera } from './resources/zenodeo/genera.js';
import { dictSpecies } from './resources/zenodeo/species.js';
import { dictTaxa } from './resources/zenodeo/taxa.js';
import { dictKeywords } from './resources/zenodeo/keywords.js';
import { dictAuthors } from './resources/zenodeo/authors.js';
import { dictImages } from './resources/zenodo/images.js';
import { dictPublications } from './resources/zenodo/publications.js';
import { dictEcoregions } from './resources/zenodeo/ecoregions.js';
import { dictBiomes } from './resources/zenodeo/biomes.js';
import { dictBinomens } from './resources/zenodeo/binomens.js';

export const resources = [
    {
        title: 'root',
        name: 'root',
        alias: 'rt',
        summary: "This is the root route",
        description: "All the routes to resources available via this API are listed below. This route is provided for information as well as a convenience to identify and program resource retrieval.",
        dictionary: '',
        source: '',
        tags: [ 'meta' ]
    },
    {
        title: 'ETL Statistics',
        name: 'etlStats',
        alias: 'main',
        summary: "Fetches extract-transform-load statistics",
        description: "…",
        dictionary: dictEtlStats,
        source: 'metadata',
        tags: [ 'meta' ]
    },
    {
        title: 'Treatments',
        name: 'treatments',
        alias: 'tr',
        summary: 'Fetches treatments',
        description: "Treatments are well-defined parts of articles that describe the particular usage of a scientific name by an author at the time of the publication. In other words, each scientific name has one or more treatments, depending on whether there exists only an original description of a species, or there are subsequent re-descriptions. Similar to bibliographic references, treatments can be cited, and subsequent usages of names cite earlier treatments.",
        dictionary: dictTreatments,
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        title: 'Material Citations',
        name: 'materialCitations',
        alias: 'mc',
        summary: 'Fetches material citations of the treatments',
        description: "A reference to or citation of one, a part of, or multiple specimens in scholarly publications. For example, a citation of a physical specimen from a scientific collection in a taxonomic treatment in a scientific publication; a citation of a group of physical specimens, such as paratypes in a taxonomic treatment in a scientific publication; or an occurrence mentioned in a field note book.",
        dictionary: dictMaterialCitations,
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        title: 'Treatment Citations',
        name: 'treatmentCitations',
        alias: 'tc',
        summary: 'Fetches treatments citations of the treatments',
        description: "…",
        dictionary: dictTreatmentCitations,
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        title: 'Treatment Authors',
        name: 'treatmentAuthors',
        alias: 'ta',
        summary: 'Fetches treatment authors',
        description: "…",
        dictionary: dictTreatmentAuthors,
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        title: 'Bibliographic Reference Citations',
        name: 'bibRefCitations',
        alias: 'bc',
        summary: 'Fetches bibliographic reference citations of the treatments',
        description: "…",
        dictionary: dictBibRefCitations,
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        title: 'Figure Citations',
        name: 'figureCitations',
        alias: 'fc',
        summary: 'Fetches figure citations of the treatments',
        description: "…",
        dictionary: dictFigureCitations,
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        title: 'Treatment Images',
        name: 'treatmentImages',
        alias: 'ti',
        summary: 'Fetches images from treatments',
        description: "…",
        dictionary: dictTreatmentImages,
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        title: 'Collection Codes',
        name: 'collectionCodes',
        alias: 'mc',
        summary: 'Fetches collection codes',
        description: "…",
        dictionary: dictCollectionCodes,
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        title: 'Kingdoms',
        name: 'kingdoms',
        alias: 'fa',
        summary: 'Fetches kingdoms',
        description: "…",
        dictionary: dictKingdoms,
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        title: 'Phyla',
        name: 'phyla',
        alias: 'fa',
        summary: 'Fetches phyla',
        description: "…",
        dictionary: dictPhyla,
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        title: 'Classes',
        name: 'classes',
        alias: 'fa',
        summary: 'Fetches classes',
        description: "…",
        dictionary: dictClasses,
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        title: 'Orders',
        name: 'orders',
        alias: 'fa',
        summary: 'Fetches orders',
        description: "…",
        dictionary: dictOrders,
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        title: 'Families',
        name: 'families',
        alias: 'fa',
        summary: 'Fetches families',
        description: "…",
        dictionary: dictFamilies,
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        title: 'Genera',
        name: 'genera',
        alias: 'fa',
        summary: 'Fetches genera',
        description: "…",
        dictionary: dictGenera,
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        title: 'Species',
        name: 'species',
        alias: 'fa',
        summary: 'Fetches species',
        description: "…",
        dictionary: dictSpecies,
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        title: 'Taxa',
        name: 'taxa',
        alias: 'fa',
        summary: 'Fetches taxon',
        description: "…",
        dictionary: dictTaxa,
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        title: 'Keywords',
        name: 'keywords',
        alias: 'fa',
        summary: 'Fetches keywords',
        description: "…",
        dictionary: dictKeywords,
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        title: 'Authors',
        name: 'authors',
        alias: 'fa',
        summary: 'Fetches authors',
        description: "…",
        dictionary: dictAuthors,
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        title: 'Ecoregions',
        name: 'ecoregions',
        alias: 'er',
        summary: 'Fetches ecoregions',
        description: "…",
        dictionary: dictEcoregions,
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        title: 'Biomes',
        name: 'biomes',
        alias: 'bm',
        summary: 'Fetches biomes',
        description: "…",
        dictionary: dictBiomes,
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        title: 'Realms',
        name: 'realms',
        alias: 'rl',
        summary: 'Fetches realms',
        description: "…",
        dictionary: dictRealms,
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        title: 'Images',
        name: 'images',
        alias: 'im',
        summary: 'Fetches images from Zenodo',
        description: "Images stored on Zenodo are made available under an extended collective license that authorizes Plazi to re-use all published photos and other images for the purpose of indexing and making available the worldwide biodiversity literature in the context of BLR. The re-use of these data by third persons is ruled by the copyright regulation applicable to the re-user.",
        dictionary: dictImages,
        source: 'zenodo',
        tags: [ 'zenodo' ]
    },
    {
        title: 'Publications',
        name: 'publications',
        alias: 'pu',
        summary: 'Fetches publications from Zenodo',
        description: "Open access publications on Zenodo are made available under the original license of those publications. Users are advised to consult laws applicable in their jurisdiction.",
        dictionary: dictPublications,
        source: 'zenodo',
        tags: [ 'zenodo' ]
    }
]