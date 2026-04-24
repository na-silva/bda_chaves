import fs from 'fs';

import {
  getBackupDir,
  getBackupFilePath,
} from './appPaths';

type BackupData = {
  tournament: unknown;
  matches: unknown[];
  champion: unknown;
};

function ensureBackupDir() {
  const backupDir =
    getBackupDir();

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(
      backupDir,

      {
        recursive: true,
      }
    );
  }
}

export function saveTournamentBackup(
  data: BackupData
) {
  ensureBackupDir();

  fs.writeFileSync(
    getBackupFilePath(),

    JSON.stringify(data, null, 2),

    'utf-8'
  );

  console.log(
    '[BACKUP] Snapshot salvo'
  );
}