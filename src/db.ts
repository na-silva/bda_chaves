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
    battle_type TEXT NOT NULL DEFAULT 'sangue',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER NOT NULL,
    participant_key TEXT NOT NULL,
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
    win_type TEXT DEFAULT '2x0',
    FOREIGN KEY (tournament_id)
      REFERENCES tournaments(id)
  );
`);
try {
  db.exec(`
    ALTER TABLE tournaments
    ADD COLUMN battle_type TEXT DEFAULT 'sangue'
  `);
} catch {}

try {
  db.exec(`
    ALTER TABLE matches
    ADD COLUMN win_type TEXT DEFAULT '2x0'
  `);
} catch {}
try {
  db.exec(`
    ALTER TABLE participants
    ADD COLUMN participant_key TEXT DEFAULT ''
  `);
} catch {}
export default db;
