CREATE INDEX IF NOT EXISTS figureCitations_treatmentsId ON figureCitations (treatments_id);
CREATE INDEX IF NOT EXISTS materialCitations_treatmentsId ON materialCitations(treatments_id)
CREATE INDEX IF NOT EXISTS figureCitations_images ON figureCitations(
    id,
    treatments_id,
    httpUri,
    captionText
);
CREATE INDEX IF NOT EXISTS treatments_images ON treatments(
    id,
    treatmentId,
    treatmentTitle,
    treatmentDOI,
    zenodoDep,
    articleTitle,
    articleAuthor
);
CREATE INDEX IF NOT EXISTS materialCitations_images ON materialCitations(
    treatments_id,
    latitude,
    longitude
);
CREATE INDEX IF NOT EXISTS treatments_orders ON treatments(orders_id);
CREATE INDEX IF NOT EXISTS treatments_classes ON treatments(classes_id);
CREATE INDEX IF NOT EXISTS treatments_families ON treatments(families_id);
CREATE INDEX IF NOT EXISTS treatments_binomens ON treatments(
    rank,
    genera_id,
    species_id
);
CREATE INDEX IF NOT EXISTS treatments_articleDOI ON treatments(articleDOI);
CREATE INDEX IF NOT EXISTS materialCitations_validGeo ON materialCitations(validGeo);
CREATE INDEX IF NOT EXISTS treatments_journalYear ON treatments(journalYear);
CREATE INDEX IF NOT EXISTS treatments_journals_id ON treatments(journals_id);
CREATE INDEX IF NOT EXISTS treatments_genera_species ON treatments(genera_id, species_id);
CREATE INDEX IF NOT EXISTS ix_ecoregions_id_ecoregionsPolygons ON ecoregionsPolygons(ecoregions_id);
CREATE INDEX IF NOT EXISTS treatmentAuthors_idx ON treatmentAuthors(treatmentAuthor);
CREATE INDEX IF NOT EXISTS rowcounts_tblname ON rowcounts(tblname);
CREATE INDEX IF NOT EXISTS idx_genera_genus_lower ON genera(Lower(genus));
CREATE INDEX IF NOT EXISTS idx_species_species_lower ON species(Lower(species));
CREATE INDEX IF NOT EXISTS idx_ta_treatments_id ON treatmentAuthors(treatments_id);
CREATE INDEX IF NOT EXISTS figureCitations_idx_d85d8487 ON figureCitations(treatments_id, httpUri);
CREATE INDEX IF NOT EXISTS treatments_idx_0074785c ON treatments(status);