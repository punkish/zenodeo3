import { db } from '../dbConnect.js';

const query = (q, cssClass = 'hilite', buffers = 30) => {
    const obj = {
        q,
        cssClass,
        buffers
    };

    /** 
     *  db.function('add2', (a, b) => a + b);
     *  db.prepare('SELECT add2(?, ?)').pluck().get(12, 4); // => 16
     *  db.prepare('SELECT add2(?, ?)').pluck().get('foo', 'bar'); // => "foobar"
     *  db.prepare('SELECT add2(?, ?, ?)').pluck().get(12, 4, 18); // => Error: wrong number of arguments
     */
    db.function('snippet', (q, cssClass, buffers) => `'…' || 
Substring(tr.treatments.fulltext, (instr(tr.treatments.fulltext, @q) - @buffers), @buffers) || 
'<span class="hilite">@q</span>' || 
Substring(tr.treatments.fulltext, (instr(tr.treatments.fulltext, @q) + Length(@q)), @buffers) || 
'…'`);

    const sql = `SELECT 
    tr.treatments.treatmentId AS tid, 
    '…' || 
    Substring(
        tr.treatments.fulltext, 
        instr(tr.treatments.fulltext, @q) - @buffers, 
        @buffers
    ) || 
    '<span class="' || @cssClass || '">' || @q || '</span>' || 
    Substring(
        tr.treatments.fulltext, 
        instr(tr.treatments.fulltext, @q) + Length(@q), 
        @buffers
    ) || 
    '…' AS snippet
FROM 
    tr.treatments JOIN tr.ftsTreatments ON tr.treatments.id = tr.ftsTreatments.rowid
WHERE 
    tr.ftsTreatments.fulltext MATCH @q 
LIMIT 10`;

    const sql1 = `WITH res0 AS (
    SELECT 
        tr.treatments.treatmentId AS tid,
        Replace(tr.treatments.fulltext, '\r\n', '') AS ft 
    FROM 
        tr.treatments JOIN 
            tr.ftsTreatments ON tr.treatments.id = tr.ftsTreatments.rowid
    WHERE 
        tr.ftsTreatments.fulltext MATCH @q 
    LIMIT 10)
SELECT 
    tid,
    '…' || 
    Substring(ft, Instr(ft, @q) - @buffers, @buffers) || 
    '<span class="' || @cssClass || '">' || @q || '</span>' || 
    Substring(ft, Instr(ft, @q) + Length(@q), @buffers) || 
    '…' AS snippet
FROM res0`;

    const sql2 = `SELECT tr.treatments.treatmentId AS tid, snippet(@q, @cssClass, @buffers) AS snip 
FROM 
    tr.treatments JOIN tr.ftsTreatments ON tr.treatments.id = tr.ftsTreatments.rowid
WHERE 
    tr.ftsTreatments.fulltext MATCH @q 
LIMIT 10`;

 
    const res = db.prepare(sql1).all(obj);
    console.log(res);
}

query('agosti');