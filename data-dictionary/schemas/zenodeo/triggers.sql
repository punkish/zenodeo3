/* after-insert triggers */
CREATE TRIGGER IF NOT EXISTS treatments_ai AFTER INSERT ON treatments
    BEGIN

        -- keep treatments and treatmentsFts in sync
        INSERT INTO treatmentsFts (rowid, fulltext) 
        VALUES (new.id, new.fulltext);

        -- update rowcount
        INSERT INTO rowcounts (tblname, rows) 
        VALUES ('treatments', 1) 
        ON CONFLICT(tblname) DO 
            UPDATE SET rows = rows + 1 
            WHERE tblname = 'treatments'; 
    END;

/* after-delete triggers */
CREATE TRIGGER IF NOT EXISTS treatments_ad AFTER DELETE ON treatments
    BEGIN

        -- keep treatments and treatmentsFts in sync
        INSERT INTO treatmentsFts (treatmentsFts, rowid, fulltext)
        VALUES ('delete', old.id, old.fulltext);

        -- update rowcount
        UPDATE rowcounts 
        SET rows = rows - 1 
        WHERE tblname = 'treatments';
    END;

/* after-update trigger to keep treatments and treatmentsFts in sync */
CREATE TRIGGER IF NOT EXISTS treatments_au AFTER UPDATE ON treatments
    BEGIN
        -- To emulate an Update
        -- Delete the old value
        INSERT INTO treatmentsFts (treatmentsFts, rowid, fulltext)
        VALUES ('delete', old.id, old.fulltext);

        -- Insert the new value
        INSERT INTO treatmentsFts (rowid, fulltext)
        VALUES (new.id, new.fulltext);
    END;

CREATE TRIGGER IF NOT EXISTS journals_ai AFTER INSERT ON journals 
    BEGIN 
        INSERT INTO rowcounts (tblname, rows) 
        VALUES ('journals', 1) 
        ON CONFLICT(tblname) DO 
            UPDATE SET rows = rows + 1 
            WHERE tblname = 'journals'; 
    END;

CREATE TRIGGER IF NOT EXISTS journals_ad AFTER DELETE ON journals 
    BEGIN 
        UPDATE rowcounts 
        SET rows = rows - 1 
        WHERE tblname = 'journals'; 
    END;

CREATE TRIGGER IF NOT EXISTS kingdoms_ai AFTER INSERT ON kingdoms 
    BEGIN 
        INSERT INTO rowcounts (tblname, rows) 
        VALUES ('kingdoms', 1) 
        ON CONFLICT(tblname) DO 
            UPDATE SET rows = rows + 1 
            WHERE tblname = 'kingdoms'; 
    END;
    
CREATE TRIGGER IF NOT EXISTS kingdoms_ad AFTER DELETE ON kingdoms 
    BEGIN 
        UPDATE rowcounts 
        SET rows = rows - 1 
        WHERE tblname = 'kingdoms'; 
    END;

CREATE TRIGGER IF NOT EXISTS phyla_ai AFTER INSERT ON phyla 
    BEGIN 
        INSERT INTO rowcounts (tblname, rows) 
        VALUES ('phyla', 1) 
        ON CONFLICT(tblname) DO 
            UPDATE SET rows = rows + 1 
            WHERE tblname = 'phyla'; 
    END;
    
CREATE TRIGGER IF NOT EXISTS phyla_ad AFTER DELETE ON phyla 
    BEGIN 
        UPDATE rowcounts 
        SET rows = rows - 1 
        WHERE tblname = 'phyla'; 
    END;

CREATE TRIGGER IF NOT EXISTS classes_ai AFTER INSERT ON classes 
    BEGIN 
        INSERT INTO rowcounts (tblname, rows) 
        VALUES ('classes', 1) 
        ON CONFLICT(tblname) DO 
            UPDATE SET rows = rows + 1 
            WHERE tblname = 'classes'; 
    END;
    
CREATE TRIGGER IF NOT EXISTS classes_ad AFTER DELETE ON classes 
    BEGIN 
        UPDATE rowcounts 
        SET rows = rows - 1 
        WHERE tblname = 'classes'; 
    END;

CREATE TRIGGER IF NOT EXISTS orders_ai AFTER INSERT ON orders 
    BEGIN 
        INSERT INTO rowcounts (tblname, rows) 
        VALUES ('orders', 1) 
        ON CONFLICT(tblname) DO 
            UPDATE SET rows = rows + 1 
            WHERE tblname = 'orders'; 
    END;
    
CREATE TRIGGER IF NOT EXISTS orders_ad AFTER DELETE ON orders 
    BEGIN 
        UPDATE rowcounts 
        SET rows = rows - 1 
        WHERE tblname = 'orders'; 
    END;

CREATE TRIGGER IF NOT EXISTS genera_ai AFTER INSERT ON genera 
    BEGIN 
        INSERT INTO rowcounts (tblname, rows) 
        VALUES ('genera', 1) 
        ON CONFLICT(tblname) DO 
            UPDATE SET rows = rows + 1 
            WHERE tblname = 'genera'; 
    END;
    
CREATE TRIGGER IF NOT EXISTS genera_ad AFTER DELETE ON genera 
    BEGIN 
        UPDATE rowcounts 
        SET rows = rows - 1 
        WHERE tblname = 'genera'; 
    END;

CREATE TRIGGER IF NOT EXISTS families_ai AFTER INSERT ON families 
    BEGIN 
        INSERT INTO rowcounts (tblname, rows) 
        VALUES ('families', 1) 
        ON CONFLICT(tblname) DO 
            UPDATE SET rows = rows + 1 
            WHERE tblname = 'families'; 
    END;
    
CREATE TRIGGER IF NOT EXISTS families_ad AFTER DELETE ON families 
    BEGIN 
        UPDATE rowcounts 
        SET rows = rows - 1 
        WHERE tblname = 'families'; 
    END;

CREATE TRIGGER IF NOT EXISTS species_ai AFTER INSERT ON species 
    BEGIN 
        INSERT INTO rowcounts (tblname, rows) 
        VALUES ('species', 1) 
        ON CONFLICT(tblname) DO 
            UPDATE SET rows = rows + 1 
            WHERE tblname = 'species'; 
    END;
    
CREATE TRIGGER IF NOT EXISTS species_ad AFTER DELETE ON species 
    BEGIN 
        UPDATE rowcounts 
        SET rows = rows - 1 
        WHERE tblname = 'species'; 
    END;

CREATE TRIGGER IF NOT EXISTS treatmentCitationsView_ii INSTEAD OF INSERT ON treatmentCitationsView
    BEGIN
        INSERT INTO treatmentCitations (
            treatmentCitationId,
            treatments_id,
            treatmentCitation,
            refString
        )
        VALUES (
            new.treatmentCitationId,
            new.treatments_id,
            new.treatmentCitation,
            new.refString
        );

        UPDATE treatmentCitations
        SET bibRefCitations_id = (
            SELECT id 
            FROM bibRefCitations 
            WHERE bibRefCitationId = new.bibRefCitationId
        )
        WHERE treatmentCitationId = new.treatmentCitationId;

        -- update rowcount
        INSERT INTO rowcounts (tblname, rows) 
        VALUES ('treatmentCitations', 1) 
        ON CONFLICT(tblname) DO 
            UPDATE SET rows = rows + 1 
            WHERE tblname = 'treatmentCitations';
    END;

CREATE TRIGGER IF NOT EXISTS treatmentCitations_ad AFTER DELETE ON treatmentCitations 
    BEGIN 
        UPDATE rowcounts 
        SET rows = rows - 1 
        WHERE tblname = 'treatmentCitations'; 
    END;

CREATE TRIGGER IF NOT EXISTS treatmentAuthors_ai AFTER INSERT ON treatmentAuthors 
    BEGIN 
        INSERT INTO rowcounts (tblname, rows) 
        VALUES ('treatmentAuthors', 1) 
        ON CONFLICT(tblname) DO 
            UPDATE SET rows = rows + 1 
            WHERE tblname = 'treatmentAuthors';

        INSERT INTO treatmentAuthorsFts (rowid, treatmentAuthor, treatments_id)
        VALUES NEW.id, NEW.treatmentAuthor, NEW.treatments_id;
    END;

CREATE TRIGGER IF NOT EXISTS treatmentAuthors_au 
    AFTER UPDATE OF treatmentAuthor, treatments_id ON treatmentAuthors
    BEGIN
        -- Remove the old version
        DELETE FROM treatmentAuthorsFts WHERE rowid = OLD.id;
        
        -- Insert the new version
        INSERT INTO treatmentAuthorsFts (rowid, treatmentAuthor, treatments_id) 
        VALUES (NEW.id, NEW.treatmentAuthor, NEW.treatments_id);
    END;

    
CREATE TRIGGER IF NOT EXISTS treatmentAuthors_ad AFTER DELETE ON treatmentAuthors 
    BEGIN 
        UPDATE rowcounts 
        SET rows = rows - 1 
        WHERE tblname = 'treatmentAuthors';

        DELETE FROM treatmentAuthorsFts WHERE rowid = OLD.id;
    END;

CREATE TRIGGER IF NOT EXISTS materialCitations_loc_ai AFTER INSERT ON materialCitations 
    WHEN new.validGeo = 1
    BEGIN

        -- insert new entry in the rtree table
        INSERT INTO materialCitationsRtree (
            id,
            minX,
            maxX,
            minY,
            maxY,
            longitude, 
            latitude,
            treatments_id
        )
        SELECT 
            id,
            json_extract(g, '$[0][0]') AS minX, 
            json_extract(g, '$[2][0]') AS maxX,
            json_extract(g, '$[0][1]') AS minY,
            json_extract(g, '$[2][1]') AS maxY,
            longitude,
            latitude,
            treatments_id
        FROM (
            SELECT
                new.id,
                geopoly_json(
                    geopoly_bbox(
                        geopoly_regular(
                            new.longitude, 
                            new.latitude, 

                            -- 5 meters in degrees at given latitude
                            abs(5/(40075017*cos(new.latitude)/360)),

                            -- num of sides of poly
                            4
                        )
                    )
                ) AS g,
                new.longitude, 
                new.latitude,
                new.treatments_id
        );

        -- update treatments.validGeo
        UPDATE treatments
        SET validGeo = 1
        WHERE id = new.treatments_id;
    END;

CREATE TRIGGER IF NOT EXISTS materialCitations_ai AFTER INSERT ON materialCitations 
    BEGIN 
        INSERT INTO rowcounts (tblname, rows) 
        VALUES ('materialCitations', 1) 
        ON CONFLICT(tblname) DO 
            UPDATE SET rows = rows + 1 
            WHERE tblname = 'materialCitations'; 
    END;

CREATE TRIGGER IF NOT EXISTS materialCitations_ad AFTER DELETE ON materialCitations 
    BEGIN 
        UPDATE rowcounts 
        SET rows = rows - 1 
        WHERE tblname = 'materialCitations'; 
    END;

CREATE TRIGGER IF NOT EXISTS figureCitations_ai AFTER INSERT ON figureCitations 
    BEGIN
        INSERT INTO imagesFts (captionText)
        VALUES (NEW.captionText);

        INSERT INTO rowcounts (tblname, rows) 
        VALUES ('figureCitations', 1) 
        ON CONFLICT(tblname) DO 
            UPDATE SET rows = rows + 1 
            WHERE tblname = 'figureCitations';
    END;

CREATE TRIGGER IF NOT EXISTS figureCitations_ad AFTER DELETE ON figureCitations 
    BEGIN 
        UPDATE rowcounts 
        SET rows = rows - 1 
        WHERE tblname = 'figureCitations'; 
    END;

CREATE TRIGGER IF NOT EXISTS bibRefCitations_ai AFTER INSERT ON bibRefCitations 
    BEGIN 
        INSERT INTO rowcounts (tblname, rows) 
        VALUES ('bibRefCitations', 1) 
        ON CONFLICT(tblname) DO 
            UPDATE SET rows = rows + 1 
            WHERE tblname = 'bibRefCitations'; 
    END;

CREATE TRIGGER IF NOT EXISTS bibRefCitations_ad AFTER DELETE ON bibRefCitations 
    BEGIN 
        UPDATE rowcounts 
        SET rows = rows - 1 
        WHERE tblname = 'bibRefCitations'; 
    END;