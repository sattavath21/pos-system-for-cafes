const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(process.cwd(), 'dev.db');
const db = new sqlite3.Database(dbPath);
db.get('SELECT id FROM "Order" ORDER BY createdAt DESC LIMIT 1', (err, row) => {
    if (err) console.error(err);
    console.log(row?.id);
    db.close();
});
