import * as cheerio from 'cheerio';

const str = '<treatment>\r\n' +
      '\r\n' +
      '\r\n' +
      '\r\n' +
      'Argistes velox\r\n' +
      'Simon, 1897\r\n' +
      '\r\n' +
      '(\r\n' +
      'figs 1–24\r\n' +
      ')\r\n' +
      '\r\n' +
      '\r\n' +
      '\r\n' +
      '\r\n' +
      '\r\n' +
      '\r\n' +
      '\r\n' +
      'Argistes velox\r\n' +
      'Simon, 1897: 144\r\n' +
      '\r\n' +
      '\r\n' +
      '(Ơ); \r\n' +
      '\r\n' +
      'Deeleman-Reinhold, 2001: 403\r\n' +
      '\r\n' +
      ', figs 633–641 (Ơ).\r\n' +
      '\r\n' +
      '\r\n' +
      '\r\n' +
      '\r\n' +
      'Figs 1‒7. Habitus and male palp of \r\n' +
      '\r\n' +
      'Argistes velox\r\n' +
      '\r\n' +
      ': 1–2 — female habitus, lateral and dorsal; 3 — male habitus, lateral; 4‒5 — male palp, retro- and prolateral; 6‒7 — prosoma frontal in female and male. Scale = 0.2 mm if not otherwise indicated.\r\n' +
      '\r\n' +
      '\r\n' +
      '\r\n' +
      '\r\n' +
      'M a t e r i a l e x a m i n e d: \r\n' +
      'SRI LANKA\r\n' +
      ', \r\n' +
      '\r\n' +
      'Central Province\r\n' +
      '\r\n' +
      ': 3 Ơ, \r\n' +
      '2 ♀\r\n' +
      '(\r\n' +
      'ZMMU\r\n' +
      '), \r\n' +
      'Matale District\r\n' +
      ', \r\n' +
      'Dambulla Town\r\n' +
      ', arboretum and forest around, \r\n' +
      '7°51′39.2″ N\r\n' +
      ', \r\n' +
      '80°40′29.8″ E\r\n' +
      ', 24‒ \r\n' +
      '\r\n' +
      '27.12.2011\r\n' +
      '\r\n' +
      '(\r\n' +
      'Y. M. Marusik\r\n' +
      ')\r\n' +
      '\r\n' +
      '; \r\n' +
      '\r\n' +
      '1 ♀\r\n' +
      '(\r\n' +
      'ZMMU\r\n' +
      '), \r\n' +
      'Anuradhapura District\r\n' +
      ', \r\n' +
      'Ritigala Strict Natural Reserve\r\n' +
      ', \r\n' +
      '8°07′02.5″ N\r\n' +
      ', \r\n' +
      '80°39′58″ E\r\n' +
      ', \r\n' +
      '\r\n' +
      '25.12.2011\r\n' +
      '\r\n' +
      '(\r\n' +
      'Y. M. Marusik\r\n' +
      ')\r\n' +
      '\r\n' +
      '.\r\n' +
      '\r\n' +
      '\r\n' +
      '\r\n' +
      '\r\n' +
      'D e s c r i p t i o n. Male. Total length 2.75 (variations 2.5‒2.85). Carapace 1.36 long, 1.0 wide with distinct pattern. Eye sizes and interdistances: AME 0.10, ALE = PLE 0.04, AME- AME 0.03, PME 0.05, PME-PME 0.10. Clypeus 0.14. Legs I‒II thinner than III‒IV, middle part of femur I \r\n' +
      '0.14 in\r\n' +
      'diameter and femur IV — 0.24.\r\n' +
      '\r\n' +
      '\r\n' +
      'Abdomen with pattern (\r\n' +
      'figs 3\r\n' +
      ', \r\n' +
      '12\r\n' +
      '), epigastrum with well-defined epiandrous area (\r\n' +
      'figs 12\r\n' +
      ', \r\n' +
      '23\r\n' +
      '). Colulus triangle-shaped, with three setae (\r\n' +
      'fig. 16\r\n' +
      ').\r\n' +
      '\r\n' +
      '\r\n' +
      '\r\n' +
      'Figs 8‒15. Copulatory organs and abdomen of \r\n' +
      '\r\n' +
      'Argistes velox\r\n' +
      '\r\n' +
      ': 8–10 — male palp, ventral, ventro-prolateral and dorsal; 11–12 — ventral side of abdomen in female and male; 13 — intact epigyne, ventral; 14–15 — macerated epigyne, ventral and dorsal. Scale = 0.2 mm.\r\n' +
      '\r\n' +
      '\r\n' +
      'Abbreviations: \r\n' +
      'Ar\r\n' +
      '— accessorial receptacle, \r\n' +
      'Bc\r\n' +
      '— bursa copulatrix, \r\n' +
      'Cd\r\n' +
      '— copulatory duct, \r\n' +
      'Co\r\n' +
      'conductor, \r\n' +
      'Ea\r\n' +
      '— epiandrus, \r\n' +
      'Em\r\n' +
      '— embolus, \r\n' +
      'Mp\r\n' +
      '— median pocket, \r\n' +
      'Re\r\n' +
      '— receptacle, \r\n' +
      'Rg\r\n' +
      '— gland of receptacle, \r\n' +
      'Ta\r\n' +
      '— tegular apophysis.\r\n' +
      '\r\n' +
      '\r\n' +
      '\r\n' +
      '\r\n' +
      'Figs 16–23. Somatic characters and copulatory organs of \r\n' +
      '\r\n' +
      'Argistes velox\r\n' +
      '\r\n' +
      ': 16 — innerets of male; 17–18 bulb, ventral and anterior, embolus is broken; 19 — epigyne, dorsal; 20 — right part of epigyne, antero-dorsal; 21 — tibia and cymbium of male palp, retrolateral; 22 — epiandrous region; 23 — male abdomen, ventral. Scale = 0.1 mm if not otherwise indicated.\r\n' +
      '\r\n' +
      '\r\n' +
      'Abbreviations: \r\n' +
      'Ar\r\n' +
      '— accessorial receptacle, \r\n' +
      'Bc\r\n' +
      '— bursa copulatrix, \r\n' +
      'Cd\r\n' +
      '— copulatory duct, \r\n' +
      'Cf\r\n' +
      '— cymbial fold, \r\n' +
      'Cl\r\n' +
      '— colulus, \r\n' +
      'Co\r\n' +
      '— conductor, \r\n' +
      'Ea\r\n' +
      '— epiandrus, \r\n' +
      'Em\r\n' +
      '— embolus, \r\n' +
      'Re\r\n' +
      '— receptacle, \r\n' +
      'Rg\r\n' +
      '— gland of receptacle, \r\n' +
      'Rs\r\n' +
      '— round swelling, \r\n' +
      'Ta\r\n' +
      '— tegular apophysis.\r\n' +
      '\r\n' +
      '\r\n' +
      '\r\n' +
      'Palp as in \r\n' +
      'figs 4‒5\r\n' +
      ', \r\n' +
      '8‒10\r\n' +
      ', \r\n' +
      '17‒18, 21\r\n' +
      ': long, longer than carapace; femur equal in length to patella + tibia; tibia 3 times longer than wide, with short, slightly bent retrolateral apophysis; cymbium long, with long apical part and basal fold (\r\n' +
      'Cf\r\n' +
      '); bulb oval, with long straight, not hooked, tegular apophysis (\r\n' +
      'Ta\r\n' +
      '); spermophore with characteristic loops (\r\n' +
      'fig. 9\r\n' +
      '); conductor (\r\n' +
      'Co\r\n' +
      ') weakly sclerotized, with widened tip; embolus (\r\n' +
      'Em\r\n' +
      ') claw-like. Length of palp and relative length of cymbial tip vary.\r\n' +
      '\r\n' +
      '\r\n' +
      'Female. Total length 3.5 (variation 3.4‒3.5). Carapace 1.8 long, 1.14 wide. Colouration as in male (\r\n' +
      'figs 1‒2\r\n' +
      ', \r\n' +
      '11\r\n' +
      '). Eye sizes and interdistances: AME 0.14, AME-AME 0.04, PME 0.09, PME-PME 0.11. Spination differs on left and right legs and in different specimens. Femora: II 1d, III 3d, IV 2d; tibia III 1p, 2r, 1–1v, IV 5p, 2r, 2–2v and 1–1va; metatarsi: II 1–1v, III 3p 3r, 1–1v, IV 3r, 2–2v, 1–1va. Legs I–II thinner than III–IV, middle part of femur I \r\n' +
      '0.17 in\r\n' +
      'diameter and femur IV — 0.27.\r\n' +
      '\r\n' +
      '\r\n' +
      'Epigyne as in \r\n' +
      'figs 11, 13‒15\r\n' +
      ', \r\n' +
      '19‒20\r\n' +
      ': plate with small median pocket (\r\n' +
      'Mp\r\n' +
      ') faced anteriorly, copulatory openings (bursa copulatrix, \r\n' +
      'Bc\r\n' +
      ') round, spaced by 4 diameters; translucent receptacles (\r\n' +
      'Re\r\n' +
      ') spaced by 1.5 diameters; receptacles kidney-shaped, with weakly sclerotized glands (\r\n' +
      'Rg\r\n' +
      ') latero-anteriorly; copulatory ducts (\r\n' +
      'Cd\r\n' +
      ') broad, as long as receptacles, with a kind of small and globular “accessorial” receptacle (\r\n' +
      'Ar\r\n' +
      ') originated from round swelling (\r\n' +
      'Rs\r\n' +
      ').\r\n' +
      '\r\n' +
      '\r\n' +
      '\r\n' +
      'Fig. 24. Distribution records of \r\n' +
      '\r\n' +
      'Argistes velox\r\n' +
      '\r\n' +
      '. Filled circles refer to literature data and open circles refer to present data.\r\n' +
      '\r\n' +
      '\r\n' +
      '\r\n' +
      'N o t e. Males examined are smaller in size than those described by \r\n' +
      'Deeleman-Reinhold (2001)\r\n' +
      ': 2.5‒2.85 vs. 3.0, but have longer legs (leg I 7.0 vs. 6.0).\r\n' +
      '\r\n' +
      '\r\n' +
      'I thank Benjamin Suresh (Kandy, \r\n' +
      '<country>Sri Lanka\r\n</country>' +
      ') and my wife \r\n' +
      'Irina Marusik\r\n' +
      '(\r\n' +
      'Magadan\r\n' +
      ', \r\n' +
      'Russia\r\n' +
      ') for their help in arranging the expedition to \r\n' +
      'Sri Lanka\r\n' +
      '.\r\n' +
      '\r\n' +
      '\r\n</treatment>';

const re = {
    //linebreaks: new RegExp('(?:\\r\\n|\\r|\\n)', 'g'),
    white_space: new RegExp('\\s+', 'g'),
    space_comma: new RegExp('\\s+,', 'g'),
    space_colon: new RegExp('\\s+:', 'g'),
    space_period: new RegExp('\\s+\\.', 'g'),
    space_openparens: new RegExp('\\(\\s+', 'g'),
    space_closeparens: new RegExp('\\s+\\)', 'g'),
}

// str = str.replace(re.linebreaks, ' ');
// str = str.replace(re.double_spc, ' ');
// str = str.replace(re.space_comma, ',');
// str = str.replace(re.space_colon, ':');
// str = str.replace(re.space_period, '.');
// str = str.replace(re.space_openparens, '(');
// str = str.replace(re.space_closeparens, ')');
// str = str.trim();
// console.log(str);

const cheerioOpts = { normalizeWhitespace: true, xmlMode: true };
const $ = cheerio.load(str, cheerioOpts, false);
$.prototype.cleanText = function () {
    let str = this.text();
    //str = str.replace(re.linebreaks, ' ');
    str = str.replace(re.white_space, ' ');
    str = str.replace(re.space_comma, ',');
    str = str.replace(re.space_colon, ':');
    str = str.replace(re.space_period, '.');
    str = str.replace(re.space_openparens, '(');
    str = str.replace(re.space_closeparens, ')');
    str = str.trim();
    return str;
};

const treatment = $('treatment').cleanText();
console.log(treatment);

/*
first 50K

batch  time (ms)  ms/file  files/s  elapsed
-----  ---------  -------  -------  -------
 5000     432800    86.56       12      433
 5000     433001    86.60       12      433

 10000     352041    70.41       14      785
15000     523292   104.66       10     1308
20000     804940   160.99        6     2113
25000     918561   183.71        5     3032
30000     983602   196.72        5     4015
35000     818686   163.74        6     4834
40000     476570    95.31       10     5311
45000     412444    82.49       12     5723
49999     340955    68.19       15     6064

{
  etl: {
    started: 1682949795947,
    ended: 1682955859838,
    treatments: 50000,
    treatmentCitations: 0,
    materialCitations: 106682,
    collectionCodes: 80352,
    figureCitations: 160460,
    bibRefCitations: 0,
    treatmentAuthors: 145369,
    journals: 217,
    archives_id: 1
  }
}

{
    "TB           ": {
        "init": 1,
        "update": 1,
        "etl": 1,
        "processFiles": 1
    },
    "TB:PREFLIGHT ": {
        "checkDir": 2,
        "backupOldDB": 1
    },
    "TB:DOWNLOAD  ": {
        "unzip": 1
    },
    "TB:PARSE": {
        "parseOne": 50000,
        "_cheerioparse": 50000,
        "_parseTreatment": 50000,
        "cleanText": 2245938,
        "_parseTreatmentAuthors": 50000,
        "_parseTreatmentCitations": 50000,
        "_parseBibRefCitations": 50000,
        "_parseFigureCitations": 50000,
        "_parseMaterialCitations": 50000,
        "calcStats": 50000,
        "_parseCollectionCodes": 106682
    },
    "TB:DATABASE  ": {
        "insertTreatments": 10,
        "insertTreatment": 50000
    }
}
*/