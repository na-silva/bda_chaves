import fs from 'fs';
import path from 'path';

import {
  app,
} from 'electron';

type TournamentExport = {
  tournament: unknown;
  champion: unknown;
  matches: unknown[];
};

function getResultsDir() {
  const basePath =
    app.isPackaged
      ? app.getPath('userData')
      : process.cwd();

  return path.join(
    basePath,
    'results'
  );
}

function ensureResultsDir() {
  const dir =
    getResultsDir();

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(
      dir,

      {
        recursive: true,
      }
    );
  }
}

function sanitizeFileName(
  value: string
) {
  return value
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '');
}

export function exportTournamentResult(
  data: TournamentExport
) {
  ensureResultsDir();

  const tournament =
    data.tournament as {
      name?: string;
    };

  const tournamentName =
    tournament?.name
    ?? 'tournament';

  const date =
    new Date()
      .toISOString()
      .split('T')[0];

  const fileName =
    `${date}_${sanitizeFileName(
      tournamentName
    )}.json`;

  const filePath =
    path.join(
      getResultsDir(),
      fileName
    );

  fs.writeFileSync(
    filePath,

    JSON.stringify(
      data,
      null,
      2
    ),

    'utf-8'
  );

  console.log(
    '[RESULTS] Resultado exportado:',
    filePath
  );
}