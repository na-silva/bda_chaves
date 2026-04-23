import Database from 'better-sqlite3';

const db = new Database('battle_manager.db');

db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS tournaments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    nickname TEXT,

    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER NOT NULL,
    round TEXT NOT NULL,
    match_order INTEGER NOT NULL,
    participant1_id INTEGER NOT NULL,
    participant2_id INTEGER NOT NULL,
    winner_id INTEGER,

    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (participant1_id) REFERENCES participants(id) ON DELETE CASCADE,
    FOREIGN KEY (participant2_id) REFERENCES participants(id) ON DELETE CASCADE,
    FOREIGN KEY (winner_id) REFERENCES participants(id) ON DELETE SET NULL
  );
`);

export default db;