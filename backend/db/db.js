/* Shared database handle using Node's built-in SQLite (Node >= 22.5).
   No native npm build required. */
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = process.env.GLO_DB_PATH || path.join(__dirname, 'glo.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new DatabaseSync(DB_PATH);
// default rollback journal — most portable across filesystems

module.exports = { db, DB_PATH };
