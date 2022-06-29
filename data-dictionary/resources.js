export const resources = [
    {
        name: 'root',
        summary: "This is the root route",
        description: "All the routes to resources available via this API are listed below. This route is provided for information as well as a convenience to identify and program resource retrieval.",
        dictionary: '',
        source: '',
        tags: [ 'meta' ]
    },
    // {
    //     name: 'etlstats',
    //     url: 'etlstats',
    //     summary: 'etl statistics',
    //     dictionary: dictEtlstats,
    //     description: 'Information about the Extract-Transform-Load process',
    //     tags: [ 'meta' ]
    // },
    {
        name: 'Treatments',
        summary: 'Fetches treatments',
        description: "Treatments are well-defined parts of articles that describe the particular usage of a scientific name by an author at the time of the publication. In other words, each scientific name has one or more treatments, depending on whether there exists only an original description of a species, or there are subsequent re-descriptions. Similar to bibliographic references, treatments can be cited, and subsequent usages of names cite earlier treatments.",
        //dictionary: require(`${ddpath}/zenodeo/treatments.js`),        
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        name: 'Material Citations',
        summary: 'Fetches material citations of the treatments',
        description: "A reference to or citation of one, a part of, or multiple specimens in scholarly publications. For example, a citation of a physical specimen from a scientific collection in a taxonomic treatment in a scientific publication; a citation of a group of physical specimens, such as paratypes in a taxonomic treatment in a scientific publication; or an occurrence mentioned in a field note book.",
        //dictionary: require(`${ddpath}/zenodeo/materialsCitations.js`),
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },

    {
        name: 'Images',
        summary: 'Fetch images from Zenodo',
        description: "Images stored on Zenodo are made available under an extended collective license that authorizes Plazi to re-use all published photos and other images for the purpose of indexing and making available the worldwide biodiversity literature in the context of BLR. The re-use of these data by third persons is ruled by the copyright regulation applicable to the re-user.",
        //dictionary: require(`${ddpath}/zenodo/images.js`),
        source: 'zenodo',
        tags: [ 'zenodo' ]
    },

    {
        name: 'Publications',
        summary: 'Fetch publications from Zenodo',
        description: "Open access publications on Zenodo are made available under the original license of those publications. Users are advised to consult laws applicable in their jurisdiction.",
        //dictionary: require(`${ddpath}/zenodo/publications.js`),
        source: 'zenodo',
        tags: [ 'zenodo' ]
    },

    /*
    {
        name: 'treatmentCitations',
        url: 'treatmentcitations',
        summary: 'Fetch treatmentCitations of the treatments',
        dictionary: require(`${ddpath}/zenodeo/treatmentCitations.js`),
        description: 'treatment citations citing the treatment',
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        name: 'bibRefCitations',
        url: 'bibrefcitations',
        summary: 'Fetch bibRefCitations of the treatments',
        dictionary: require(`${ddpath}/zenodeo/bibRefCitations.js`),
        description: 'bibliographic citations of treatments',
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        name: 'figureCitations',
        url: 'figurecitations',
        summary: 'Fetch figureCitations of the treatments',
        dictionary: require(`${ddpath}/zenodeo/figureCitations.js`),
        description: 'figure citations of treatments',
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    
    {
        name: 'treatmentImages',
        url: 'treatmentimages',
        summary: 'Fetch treatment images from Zenodeo',
        dictionary: require(`${ddpath}/zenodeo/treatmentImages.js`),
        description: 'images related to treatments',
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        name: 'collectionCodes',
        url: 'collectioncodes',
        summary: 'Fetch collectionCodes of the materialsCitations',
        dictionary: require(`${ddpath}/zenodeo/collectionCodes.js`),
        description: 'collection codes of treatments',
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    
    
    {
        name: 'families',
        url: 'families',
        summary: 'Fetch families',
        dictionary: require(`${ddpath}/zenodeo/families.js`),
        description: 'families of species',
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    }
    */
];