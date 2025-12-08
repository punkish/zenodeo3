BEGIN TRANSACTION;

CREATE TEMP VIEW IF NOT EXISTS treatmentsView AS
    SELECT
        t.id,
        t.treatmentId,
        t.treatmentTitle, 
        t.treatmentVersion,
        t.treatmentDOIorig,
        t.treatmentLSID,
        t.zenodoDep,
        t.zoobankId,
        t.articleId,
        t.articleTitle,
        t.articleAuthor,
        t.articleDOIorig,
        t.publicationDate,
        j.journalTitle,
        t.journalYear,
        t.journalVolume,
        t.journalIssue,
        t.pages,
        t.authorityName,
        t.authorityYear,
        k.kingdom,
        p.phylum,
        c.class,
        o."order",
        g.genus,
        f.family,
        s.species,
        t.rank,
        t.status,
        t.taxonomicNameLabel,
        t.updateTime,
        t.checkinTime,
        t.timeToParseXML,
        t.fulltext,
        td.xml,
        td.json
    FROM 
        treatments t
        JOIN journals j ON t.journals_id = j.id 
        JOIN kingdoms k ON t.kingdoms_id = k.id
        JOIN phyla p ON t.phyla_id = p.id 
        JOIN classes c ON t.classes_id = c.id
        JOIN orders o ON t.orders_id = o.id 
        JOIN genera g ON t.genera_id = g.id 
        JOIN families f ON t.families_id = f.id 
        JOIN species s ON t.species_id = s.id
        JOIN arc.treatmentsDump td ON t.id = td.id;
        
/* instead-of-insert trigger to populate tables via a view */
CREATE TEMP TRIGGER IF NOT EXISTS treatmentsView_ii 
    INSTEAD OF INSERT ON treatmentsView
    BEGIN

        -- Insert all the FKs
        INSERT INTO journals (journalTitle) VALUES (new.journalTitle);
        INSERT INTO kingdoms (kingdom) VALUES (new.kingdom);
        INSERT INTO phyla (phylum) VALUES (new.phylum);
        INSERT INTO classes (class) VALUES (new.class);
        INSERT INTO orders ("order") VALUES (new."order");
        INSERT INTO genera (genus) VALUES (new.genus);
        INSERT INTO families (family) VALUES (new.family);
        INSERT INTO species (species) VALUES (new.species);
        
        -- Insert data into treatments
        INSERT OR IGNORE INTO treatments (
            treatmentId,
            treatmentTitle, 
            treatmentVersion,
            treatmentDOIorig,
            treatmentLSID,
            zenodoDep,
            zoobankId,
            articleId,
            articleTitle,
            articleAuthor,
            articleDOIorig,
            publicationDate,
            journals_id, 
            journalYear,
            journalVolume,
            journalIssue,
            pages,
            authorityName,
            authorityYear,
            kingdoms_id,
            phyla_id,
            classes_id,
            orders_id,
            genera_id, 
            families_id,
            species_id,
            rank,
            status,
            taxonomicNameLabel,
            updateTime,
            checkinTime,
            --updated,
            timeToParseXML,
            fulltext
        ) 
        VALUES (
            new.treatmentId,
            new.treatmentTitle,
            new.treatmentVersion,
            new.treatmentDOIorig,
            new.treatmentLSID,
            new.zenodoDep,
            new.zoobankId,
            new.articleId,
            new.articleTitle,
            new.articleAuthor,
            new.articleDOIorig,
            new.publicationDate,
            (SELECT id FROM journals WHERE journalTitle=new.journalTitle), 
            new.journalYear,
            new.journalVolume,
            new.journalIssue,
            new.pages,
            new.authorityName,
            new.authorityYear,
            (SELECT id FROM kingdoms WHERE kingdom=new.kingdom),
            (SELECT id FROM phyla WHERE phylum=new.phylum), 
            (SELECT id FROM classes WHERE class=new.class),
            (SELECT id FROM orders WHERE "order"=new."order"), 
            (SELECT id FROM genera WHERE genus=new.genus), 
            (SELECT id FROM families WHERE family=new.family),
            (SELECT id FROM species WHERE species=new.species),
            new.rank,
            new.status,
            new.taxonomicNameLabel,
            new.updateTime,
            new.checkinTime,
            --new.updated,
            new.timeToParseXML,
            new.fulltext
        );

        INSERT INTO journalsByYears ( 
            journals_id, 
            journalYear, 
            num 
        )
        VALUES ( 
            (SELECT id FROM journals WHERE journalTitle=NEW.journalTitle),
            NEW.journalYear, 
            1 
        )
        ON CONFLICT(journals_id, journalYear) 
        DO UPDATE SET num = num + 1;

        -- Insert treatment into the dumps table if and only if both
        -- xml and json exist
        INSERT OR IGNORE INTO treatmentsDump (id, xml, json)
        SELECT NEW.id, NEW.xml, NEW.json
        WHERE NEW.xml IS NOT NULL AND NEW.json IS NOT NULL;
    END;

CREATE TEMP VIEW treatmentsWithSpecies AS
    SELECT
        t.treatmentId,
        z.summary,
        g.genus,
        s.species 
    FROM
        treatments t
        JOIN genera g ON t.genera_id = g.id
        JOIN species s ON t.species_id = s.id
        JOIN zai.treatmentSummaries AS z ON t.treatmentId = z.treatmentId 
    WHERE
        t.rank = 'species' 
        AND t.genera_id IS NOT NULL
        AND t.genera_id != 9 
        AND t.species_id IS NOT NULL
        AND t.species_id != 3;

COMMIT;
