.headers on
.mode col
.timer on
.eqp on
.open ./data/db/zenodeo.sqlite
ATTACH DATABASE './data/db/archives.sqlite' AS arc;
ATTACH DATABASE './data/db/geo.sqlite' AS geo;
ATTACH DATABASE './data/db/zai.sqlite' AS zai;
