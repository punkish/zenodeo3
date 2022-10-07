CREATE TABLE treatments (
    id INTEGER PRIMARY KEY,
    treatmentId TEXT NOT NULL UNIQUE,
    treatmentTitle TEXT,
    treatmentVersion INTEGER,
    treatmentDOI TEXT,
    treatmentLSID TEXT,
    zenodoDep TEXT,
    zoobankId TEXT,
    articleId TEXT,
    articleTitle TEXT,
    articleAuthor INTEGER,
    articleDOI TEXT,
    publicationDate TEXT,
    journalTitle TEXT,
    journalYear TEXT,
    journalVolume TEXT,
    journalIssue TEXT,
    pages TEXT,
    authorityName TEXT,
    authorityYear TEXT,
    kingdom TEXT,
    phylum TEXT,
    "order" TEXT,
    family TEXT,
    genus TEXT,
    species TEXT,
    status TEXT,
    taxonomicNameLabel TEXT,
    rank TEXT,
    fulltext TEXT,
    --author TEXT,
    updateTime INTEGER DEFAULT NULL,
    checkinTime INTEGER DEFAULT NULL,
    deleted INTEGER DEFAULT 0,
    created INTEGER DEFAULT (strftime('%s','now') * 1000),
    updated INTEGER, 
    checkInYear INTEGER GENERATED ALWAYS AS (strftime('%Y', datetime(checkinTime/1000, 'unixepoch'))) VIRTUAL);
CREATE TABLE IF NOT EXISTS 'vtreatments_data'(id INTEGER PRIMARY KEY, block BLOB);
CREATE TABLE IF NOT EXISTS 'vtreatments_idx'(segid, term, pgno, PRIMARY KEY(segid, term)) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS 'vtreatments_content'(id INTEGER PRIMARY KEY, c0, c1);
CREATE TABLE IF NOT EXISTS 'vtreatments_docsize'(id INTEGER PRIMARY KEY, sz BLOB);
CREATE TABLE IF NOT EXISTS 'vtreatments_config'(k PRIMARY KEY, v) WITHOUT ROWID;
CREATE TABLE treatmentCitations (
    id INTEGER PRIMARY KEY,
    treatmentCitationId TEXT NOT NULL,
    treatmentId TEXT NOT NULL,
    treatmentCitation TEXT,
    refString TEXT,
    deleted INTEGER DEFAULT 0,
    created INTEGER DEFAULT (strftime('%s','now') * 1000),
    updated INTEGER,
    UNIQUE (treatmentCitationId, treatmentId)
);
CREATE TABLE treatmentAuthors (
    id INTEGER PRIMARY KEY,
    treatmentAuthorId TEXT NOT NULL,
    treatmentId TEXT NOT NULL,
    treatmentAuthor TEXT,
    deleted INTEGER DEFAULT 0,
    created INTEGER DEFAULT (strftime('%s','now') * 1000),
    updated INTEGER,
    UNIQUE (treatmentAuthorId, treatmentId)
);
CREATE TABLE bibRefCitations (
    id INTEGER PRIMARY KEY,
    bibRefCitationId TEXT NOT NULL UNIQUE,
    treatmentId TEXT NOT NULL,
    author TEXT,
    journalOrPublisher TEXT,
    title TEXT,
    refString TEXT,
    type TEXT,
    year TEXT,
    innerText TEXT,
    deleted INTEGER DEFAULT 0,
    created INTEGER DEFAULT (strftime('%s','now') * 1000),
    updated INTEGER
);
CREATE TABLE IF NOT EXISTS 'vbibrefcitations_data'(id INTEGER PRIMARY KEY, block BLOB);
CREATE TABLE IF NOT EXISTS 'vbibrefcitations_idx'(segid, term, pgno, PRIMARY KEY(segid, term)) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS 'vbibrefcitations_content'(id INTEGER PRIMARY KEY, c0, c1);
CREATE TABLE IF NOT EXISTS 'vbibrefcitations_docsize'(id INTEGER PRIMARY KEY, sz BLOB);
CREATE TABLE IF NOT EXISTS 'vbibrefcitations_config'(k PRIMARY KEY, v) WITHOUT ROWID;
CREATE TABLE figureCitations (
    id INTEGER PRIMARY KEY,
    figureNum INTEGER DEFAULT 0,
    figureCitationId TEXT NOT NULL,
    treatmentId TEXT NOT NULL,
    captionText TEXT,
    httpUri TEXT,
    thumbnailUri TEXT,
    deleted INTEGER DEFAULT 0,
    created INTEGER DEFAULT (strftime('%s','now') * 1000),
    updated INTEGER,
    UNIQUE (figureCitationId, figureNum)
);
CREATE TABLE IF NOT EXISTS 'vfigurecitations_data'(id INTEGER PRIMARY KEY, block BLOB);
CREATE TABLE IF NOT EXISTS 'vfigurecitations_idx'(segid, term, pgno, PRIMARY KEY(segid, term)) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS 'vfigurecitations_content'(id INTEGER PRIMARY KEY, c0, c1, c2, c3);
CREATE TABLE IF NOT EXISTS 'vfigurecitations_docsize'(id INTEGER PRIMARY KEY, sz BLOB);
CREATE TABLE IF NOT EXISTS 'vfigurecitations_config'(k PRIMARY KEY, v) WITHOUT ROWID;
CREATE TABLE materialsCitations (
    id INTEGER PRIMARY KEY,
    materialsCitationId TEXT NOT NULL,
    treatmentId TEXT NOT NULL,
    collectingDate TEXT,
    collectionCode TEXT,  -- csv string as in the text
    collectorName TEXT,
    country TEXT,
    collectingRegion TEXT,
    municipality TEXT,
    county TEXT,
    stateProvince TEXT,
    location TEXT,
    locationDeviation TEXT,
    specimenCountFemale TEXT,
    specimenCountMale TEXT,
    specimenCount TEXT,
    specimenCode TEXT,
    typeStatus TEXT,
    determinerName TEXT,
    collectedFrom TEXT,
    collectingMethod TEXT,
    latitude REAL,
    longitude REAL,
    elevation REAL,
    httpUri TEXT,
    innerText TEXT,
    deleted INTEGER DEFAULT 0,
    validGeo INTEGER AS (
        CASE
            WHEN
                typeof(latitude) = 'real' AND
                abs(latitude) <= 90 AND
                typeof(longitude) = 'real' AND
                abs(longitude) <= 180
            THEN 1
            ELSE 0
        END
    ) STORED,
    isOnLand INTEGER DEFAULT NULL,
    created INTEGER DEFAULT (strftime('%s','now') * 1000),
    updated INTEGER,
    UNIQUE (materialsCitationId, treatmentId)
);
CREATE TABLE materialsCitations_x_collectionCodes (
    id INTEGER PRIMARY KEY,
    materialsCitationId TEXT,
    collectionCode TEXT,
    created INTEGER DEFAULT (strftime('%s','now') * 1000),
    updated INTEGER,
    UNIQUE (collectionCode, materialsCitationId)
);
CREATE TABLE collectionCodes (
    id INTEGER PRIMARY KEY,
    collectionCode TEXT NOT NULL UNIQUE,
    created INTEGER DEFAULT (strftime('%s','now') * 1000),
    updated INTEGER
);
CREATE TABLE IF NOT EXISTS "vloc_geopoly_rowid"(rowid INTEGER PRIMARY KEY,nodeno,a0,a1,a2);
CREATE TABLE IF NOT EXISTS "vloc_geopoly_node"(nodeno INTEGER PRIMARY KEY,data);
CREATE TABLE IF NOT EXISTS "vloc_geopoly_parent"(nodeno INTEGER PRIMARY KEY,parentnode);
CREATE TABLE IF NOT EXISTS "vloc_rtree_rowid"(rowid INTEGER PRIMARY KEY,nodeno,a0,a1);
CREATE TABLE IF NOT EXISTS "vloc_rtree_node"(nodeno INTEGER PRIMARY KEY,data);
CREATE TABLE IF NOT EXISTS "vloc_rtree_parent"(nodeno INTEGER PRIMARY KEY,parentnode);
CREATE TABLE treatmentImages (
    id INTEGER PRIMARY KEY,
    figureCitationRowid INTEGER,
    httpUri TEXT UNIQUE,
    captionText TEXT,
    treatmentId TEXT
);
CREATE TABLE sqlite_stat1(tbl,idx,stat);
CREATE VIRTUAL TABLE vtreatments USING FTS5(
    treatmentId,
    fullText
)
/* vtreatments(treatmentId,fullText) */;
CREATE VIRTUAL TABLE vbibrefcitations USING FTS5(
    bibRefCitationId,
    refString
)
/* vbibrefcitations(bibRefCitationId,refString) */;
CREATE VIRTUAL TABLE vfigurecitations USING FTS5(
    figureCitationId,
    figureNum,
    treatmentId,
    captionText
)
/* vfigurecitations(figureCitationId,figureNum,treatmentId,captionText) */;
CREATE VIRTUAL TABLE vloc_geopoly USING geopoly(
    treatmentId,
    materialsCitationId
)
/* vloc_geopoly(_shape,treatmentId,materialsCitationId) */;
CREATE VIRTUAL TABLE vloc_rtree USING rtree(
    id,                         -- primary key
    minX, maxX,                 -- X coordinate
    minY, maxY,                 -- Y coordinate
    +materialsCitationId TEXT,
    +treatmentId TEXT
)
/* vloc_rtree(id,minX,maxX,minY,maxY,materialsCitationId,treatmentId) */;
CREATE INDEX ix_treatments_treatmentId               ON treatments (deleted, treatmentId);
CREATE INDEX ix_treatments_articleTitle              ON treatments (deleted, articleTitle COLLATE NOCASE);
CREATE INDEX ix_treatments_publicationDate           ON treatments (deleted, publicationDate);
CREATE INDEX ix_treatments_journalTitle              ON treatments (deleted, journalTitle COLLATE NOCASE);
CREATE INDEX ix_treatments_journalYear               ON treatments (deleted, journalYear);
CREATE INDEX ix_treatments_authorityName             ON treatments (deleted, authorityName COLLATE NOCASE);
CREATE INDEX ix_treatments_taxonomicNameLabel        ON treatments (deleted, taxonomicNameLabel COLLATE NOCASE);
CREATE INDEX ix_treatments_kingdom                   ON treatments (deleted, kingdom COLLATE NOCASE);
CREATE INDEX ix_treatments_phylum                    ON treatments (deleted, phylum COLLATE NOCASE);
CREATE INDEX ix_treatments_order                     ON treatments (deleted, "order" COLLATE NOCASE);
CREATE INDEX ix_treatments_family                    ON treatments (deleted, family COLLATE NOCASE);
CREATE INDEX ix_treatments_genus                     ON treatments (deleted, genus COLLATE NOCASE);
CREATE INDEX ix_treatments_species                   ON treatments (deleted, species COLLATE NOCASE);
CREATE INDEX ix_treatments_status                    ON treatments (deleted, status COLLATE NOCASE);
CREATE INDEX ix_treatments_rank                      ON treatments (deleted, rank COLLATE NOCASE);
CREATE INDEX ix_treatments_k_phylum                  ON treatments (deleted, kingdom, phylum);
CREATE INDEX ix_treatments_k_p_order                 ON treatments (deleted, kingdom, phylum, "order");
CREATE INDEX ix_treatments_k_p_o_family              ON treatments (deleted, kingdom, phylum, "order", family);
CREATE INDEX ix_treatments_k_p_o_f_genus             ON treatments (deleted, kingdom, phylum, "order", family, genus);
CREATE INDEX ix_treatments_k_p_o_f_g_species         ON treatments (deleted, kingdom, phylum, "order", family, genus, species);
CREATE INDEX ix_treatments_facets                    ON treatments (deleted, treatmentId, journalTitle, journalYear, kingdom, phylum, "order", family, genus, species, status, rank);
CREATE INDEX ix_treatments_checkinTime               ON treatments (deleted, checkinTime);
CREATE INDEX ix_treatments_updateTime                ON treatments (deleted, updateTime);
CREATE INDEX ix_treatments_deleted                   ON treatments (deleted);
CREATE INDEX ix_treatments_year                      ON treatments (deleted, checkInYear);
CREATE INDEX ix_treatments_treatmentTitle            ON treatments (deleted, treatmentTitle COLLATE NOCASE);
CREATE INDEX ix_treatmentCitations_treatmentCitation ON treatmentCitations (deleted, treatmentCitation COLLATE NOCASE);
CREATE INDEX ix_treatmentCitations_refString         ON treatmentCitations (deleted, refString COLLATE NOCASE);
CREATE INDEX ix_treatmentImages_treatId              ON treatmentImages (treatmentId);
CREATE INDEX ix_treatmentCitations_treatmentId       ON treatmentCitations (deleted, treatmentId);
CREATE INDEX ix_treatmentAuthors_treatmentAuthorId   ON treatmentAuthors (deleted, treatmentAuthorId);
CREATE INDEX ix_treatmentAuthors_treatmentId         ON treatmentAuthors (deleted, treatmentId);
CREATE INDEX ix_treatmentAuthors_treatmentAuthor     ON treatmentAuthors (deleted, treatmentAuthor COLLATE NOCASE);
CREATE INDEX ix_treatmentAuthors_deleted             ON treatmentAuthors (deleted);
CREATE INDEX ix_bibRefCitations_bibRefCitationId     ON bibRefCitations (deleted, bibRefCitationId);
CREATE INDEX ix_bibRefCitations_treatmentId          ON bibRefCitations (deleted, treatmentId);
CREATE INDEX ix_bibRefCitations_year                 ON bibRefCitations (deleted, year);
CREATE INDEX ix_bibRefCitations_deleted              ON bibRefCitations (deleted);
CREATE INDEX ix_figureCitations_treatmentId          ON figureCitations (deleted, treatmentId);
CREATE INDEX ix_figureCitations_figId_treatId_figNum ON figureCitations (deleted, figureCitationId, treatmentId, figureNum);
CREATE INDEX ix_figureCitations_httpUri              ON figureCitations (deleted, httpUri);
CREATE INDEX ix_materialsCitations_matCitId          ON materialsCitations (deleted, materialsCitationId);
CREATE INDEX ix_materialsCitations_treatmentId       ON materialsCitations (deleted, treatmentId);
CREATE INDEX ix_materialsCitations_collectingDate    ON materialsCitations (deleted, collectingDate COLLATE NOCASE);
CREATE INDEX ix_materialsCitations_collectionCode    ON materialsCitations (deleted, collectionCode COLLATE NOCASE);
CREATE INDEX ix_materialsCitations_collectorName     ON materialsCitations (deleted, collectorName COLLATE NOCASE);
CREATE INDEX ix_materialsCitations_country           ON materialsCitations (deleted, country COLLATE NOCASE);
CREATE INDEX ix_materialsCitations_collectingRegion  ON materialsCitations (deleted, collectingRegion COLLATE NOCASE);
CREATE INDEX ix_materialsCitations_municipality      ON materialsCitations (deleted, municipality COLLATE NOCASE);
CREATE INDEX ix_materialsCitations_county            ON materialsCitations (deleted, county COLLATE NOCASE);
CREATE INDEX ix_materialsCitations_stateProvince     ON materialsCitations (deleted, stateProvince COLLATE NOCASE);
CREATE INDEX ix_materialsCitations_location          ON materialsCitations (deleted, location COLLATE NOCASE);
CREATE INDEX ix_materialsCitations_locationDeviation ON materialsCitations (deleted, locationDeviation COLLATE NOCASE);
CREATE INDEX ix_materialsCitations_specimenCntFemale ON materialsCitations (deleted, specimenCountFemale COLLATE NOCASE);
CREATE INDEX ix_materialsCitations_specimenCntMale   ON materialsCitations (deleted, specimenCountMale COLLATE NOCASE);
CREATE INDEX ix_materialsCitations_specimenCount     ON materialsCitations (deleted, specimenCount COLLATE NOCASE);
CREATE INDEX ix_materialsCitations_specimenCode      ON materialsCitations (deleted, specimenCode COLLATE NOCASE);
CREATE INDEX ix_materialsCitations_typeStatus        ON materialsCitations (deleted, typeStatus COLLATE NOCASE);
CREATE INDEX ix_materialsCitations_determinerName    ON materialsCitations (deleted, determinerName COLLATE NOCASE);
CREATE INDEX ix_materialsCitations_collectedFrom     ON materialsCitations (deleted, collectedFrom COLLATE NOCASE);
CREATE INDEX ix_materialsCitations_collectingMethod  ON materialsCitations (deleted, collectingMethod COLLATE NOCASE);
CREATE INDEX ix_materialsCitations_latitude          ON materialsCitations (deleted, latitude);
CREATE INDEX ix_materialsCitations_longitude         ON materialsCitations (deleted, longitude);
CREATE INDEX ix_materialsCitations_elevation         ON materialsCitations (deleted, elevation);
CREATE INDEX ix_materialsCitations_validGeo          ON materialsCitations (deleted, validGeo);
CREATE INDEX ix_materialsCitations_isOnLand          ON materialsCitations (deleted, isOnLand);
CREATE INDEX ix_materialsCitations_validGeo_isOnLand ON materialsCitations (deleted, validGeo, isOnLand);
CREATE INDEX ix_materialsCitations_deleted           ON materialsCitations (deleted);
CREATE INDEX ix_collectionCodes_collectionCode       ON collectionCodes (collectionCode);
CREATE INDEX ix_matCits_x_collCodes_mid_cid          ON materialsCitations_x_collectionCodes (materialsCitationId, collectionCode);
CREATE TABLE sqlite_stat4(tbl,idx,neq,nlt,ndlt,sample);
CREATE INDEX ix_figureCitations_figureCitationId_treatmentId_figureNum ON figureCitations (deleted, figureCitationId, treatmentId, figureNum);
CREATE INDEX ix_materialsCitations_materialsCitationId ON materialsCitations (deleted, materialsCitationId);
CREATE INDEX ix_materialsCitations_specimenCountFemale ON materialsCitations (deleted, specimenCountFemale COLLATE NOCASE);
CREATE INDEX ix_materialsCitations_specimenCountMale   ON materialsCitations (deleted, specimenCountMale COLLATE NOCASE);
CREATE INDEX ix_treatmentImages_treatmentId ON treatmentImages (treatmentId);