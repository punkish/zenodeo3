CREATE TABLE etl (
    id INTEGER PRIMARY KEY,

    -- timestamps stored as ms since unix epoch matches nodejs 
    -- `new Date().getTime()`. The timezone is UTC, 1 hr before 
    -- CET where this program was written
    started INTEGER DEFAULT (unixepoch('subsec') * 1000),
    ended INTEGER,
    d INTEGER GENERATED AS (ended - started) VIRTUAL
);
CREATE VIEW etlView AS
    SELECT 
        id AS etl_id,

        -- human-readable timestamps and duration '2025-11-22 09:38:29'
        datetime(started/1000, 'unixepoch') AS etlStarted,
        datetime(ended/1000, 'unixepoch') AS etlEnded,
        CASE
            WHEN d < 1000 THEN d || 'ms'
            WHEN d < 60000 THEN (d/1000) || 's ' || (d%1000) || 'ms'
            WHEN d < 3600000 THEN (d/60000) || 'm ' || ((d%60000)/1000) || 's ' || (d%1000) || 'ms'
            WHEN d < 86400000 THEN (d/3600000) || 'h ' || ((d%3600000)/60000) || 'm ' || ((d%60000)/1000) || 's ' || (d%1000) || 'ms' 
            ELSE (d / 86400000) || 'd ' || ((d%86400000)/3600000) || 'h ' || ((d%3600000)/60000) || 'm ' || ((d%60000)/1000) || 's ' || (d%1000) || 'ms'
        END AS etlDuration
    FROM etl
/* etlView(etl_id,etlStarted,etlEnded,etlDuration) */;