export const triggers = {
    er_geom_afterInsert: `CREATE TRIGGER IF NOT EXISTS er_geom_afterInsert 
    AFTER INSERT ON ecoregions 
    BEGIN
    
        -- insert new entry in geopoly table
        INSERT INTO ecoregionsGeopoly (
            _shape,
            ecoregions_id
        ) 
        VALUES (
    
            -- shape
            new.geometry,
            new.id
        );
    END;`
}