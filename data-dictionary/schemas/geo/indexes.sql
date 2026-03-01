CREATE INDEX IF NOT EXISTS ix_ecoregions_biomes_id ON ecoregions(biomes_id);
CREATE INDEX IF NOT EXISTS ix_ecoregions_realms_id ON ecoregions(realms_id);
CREATE INDEX IF NOT EXISTS ix_biome_synonym_biome_synonyms ON biome_synonyms(biome_synonym);
CREATE INDEX IF NOT EXISTS ix_ecoregions_id_ecoregionsPolygons ON ecoregionsPolygons(ecoregions_id);