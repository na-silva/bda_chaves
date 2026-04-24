import Database from 'better-sqlite3';

import {
  getDatabasePath,
} from './appPaths';

const db = new Database(
  getDatabasePath()
);

db.exec(`
  CREATE TABLE IF NOT EXISTS tournaments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    name TEXT NOT NULL,

    status TEXT NOT NULL DEFAULT 'active',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    tournament_id INTEGER NOT NULL,

    name TEXT NOT NULL,

    nickname TEXT,

    FOREIGN KEY (tournament_id)
      REFERENCES tournaments(id)
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    tournament_id INTEGER NOT NULL,

    round TEXT NOT NULL,

    match_order INTEGER NOT NULL,

    participant1_id INTEGER NOT NULL,

    participant2_id INTEGER NOT NULL,

    winner_id INTEGER,

    FOREIGN KEY (tournament_id)
      REFERENCES tournaments(id)
  );
`);

export default db;