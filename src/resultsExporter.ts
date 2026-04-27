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

type MatchExportRow = {
  round?: string;
  winner_id?: number;

  participant1_id?: number;
  participant1_key?: string;
  participant1_name?: string;

  participant2_id?: number;
  participant2_key?: string;
  participant2_name?: string;
};

type ChampionExport = {
  id?: number;
  participant_key?: string;
  name?: string;
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

function enrichChampionWithKey(
  data: TournamentExport
): TournamentExport {
  const champion =
    data.champion as ChampionExport | null;

  if (!champion) {
    return data;
  }

  if (champion.participant_key) {
    return data;
  }

  const matches =
    data.matches as MatchExportRow[];

  const finalMatch =
    matches.find(
      (match) =>
        match.round === 'final'
        && match.winner_id
    );

  if (!finalMatch) {
    return data;
  }

  let participantKey: string | undefined;

  if (
    finalMatch.winner_id
    === finalMatch.participant1_id
  ) {
    participantKey =
      finalMatch.participant1_key;
  }

  if (
    finalMatch.winner_id
    === finalMatch.participant2_id
  ) {
    participantKey =
      finalMatch.participant2_key;
  }

  if (!participantKey) {
    return data;
  }

  return {
    ...data,
    champion: {
      ...champion,
      participant_key: participantKey,
    },
  };
}

export function exportTournamentResult(
  data: TournamentExport
) {
  ensureResultsDir();

  const exportData =
    enrichChampionWithKey(data);

  const tournament =
    exportData.tournament as {
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
      exportData,
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