const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./turnos.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS turnos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT,
      telefono TEXT,
      fecha TEXT,
      hora TEXT
    )
  `);
});

module.exports = db;
