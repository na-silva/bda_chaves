import path from 'path';
import { app } from 'electron';

function getBaseDataPath() {
  if (app.isPackaged) {
    return app.getPath('userData');
  }

  return process.cwd();
}

export function getDatabasePath() {
  return path.join(
    getBaseDataPath(),
    'battle_manager.db'
  );
}

export function getBackupDir() {
  return path.join(
    getBaseDataPath(),
    'backups'
  );
}

export function getBackupFilePath() {
  return path.join(
    getBackupDir(),
    'latest_tournament.json'
  );
}
