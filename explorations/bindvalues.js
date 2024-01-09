import Database from 'better-sqlite3';
const db = new Database(":memory:");

function t1() {
    db.prepare('CREATE TABLE IF NOT EXISTS t (id INTEGER PRIMARY KEY, flag INTEGER)').run();

    const insert = db.prepare('INSERT INTO t (flag) VALUES (@flag)');

    const data = [
        { flag: 1 },
        { flag: 0 },
        { flag: 'TRUE' },
        { flag: 'FALSE' },
        { flag: true },
        { flag: false }
    ];

    data.forEach(d => insert.run(d));

    const res = db.prepare('SELECT * FROM t').all();
    console.log(res);
}

t1();

function t2() {
    db.prepare('CREATE TABLE IF NOT EXISTS t (id INTEGER PRIMARY KEY, flag INTEGER)').run();

    const insert = db.prepare(`INSERT INTO t (flag) VALUES (1), (0), ('TRUE'), ('FALSE'), (true), (false)`).run();

    const res = db.prepare('SELECT * FROM t').all();
    console.log(res);
}

t2();