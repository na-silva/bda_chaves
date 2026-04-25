import db from './db';
import { generateFirstRoundMatches } from './bracket';

type ParticipantRow = {
  id: number;
  tournament_id: number;
  name: string;
  nickname: string | null;
};

type MatchRow = {
  id: number;
  tournament_id: number;
  round: string;
  match_order: number;
  participant1_id: number;
  participant2_id: number;
  winner_id: number | null;
};

export function resetTestData() {
  db.prepare('DELETE FROM matches').run();
  db.prepare('DELETE FROM participants').run();
  db.prepare('DELETE FROM tournaments').run();
}

export function createTestTournament() {
  const participantNames = [
    'MC A',
    'MC B',
    'MC C',
    'MC D',
    'MC E',
    'MC F',
    'MC G',
    'MC H',
    'MC I',
    'MC J',
    'MC K',
    'MC L',
    'MC M',
    'MC N',
    'MC O',
    'MC P',
  ];

  return createTournamentWithParticipants('Batalha Principal', participantNames);
}

export function createTournamentWithParticipants(
  tournamentName: string,
  participantNames: string[]
) {
  const cleanedNames = participantNames
    .map((name) => name.trim())
    .filter((name) => name.length > 0);

  if (cleanedNames.length !== 16) {
    throw new Error('O torneio precisa ter exatamente 16 participantes.');
  }

  const insertTournament = db.prepare(`
    INSERT INTO tournaments (name, status)
    VALUES (?, 'active')
  `);

  const tournamentResult = insertTournament.run(tournamentName);
  const tournamentId = Number(tournamentResult.lastInsertRowid);

  const insertParticipant = db.prepare(`
    INSERT INTO participants (tournament_id, name)
    VALUES (?, ?)
  `);

  for (const name of cleanedNames) {
    insertParticipant.run(tournamentId, name);
  }

  const participants = db.prepare(`
    SELECT id, tournament_id, name, nickname
    FROM participants
    WHERE tournament_id = ?
    ORDER BY id ASC
  `).all(tournamentId) as ParticipantRow[];

  const matches = generateFirstRoundMatches(participants);

  const insertMatch = db.prepare(`
    INSERT INTO matches (
      tournament_id,
      round,
      match_order,
      participant1_id,
      participant2_id
    )
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const match of matches) {
    insertMatch.run(
      tournamentId,
      match.round,
      match.match_order,
      match.participant1_id,
      match.participant2_id
    );
  }

  return tournamentId;
}

function getMatchesByRound(tournamentId: number, round: string) {
  return db.prepare(`
    SELECT *
    FROM matches
    WHERE tournament_id = ? AND round = ?
    ORDER BY match_order ASC
  `).all(tournamentId, round) as MatchRow[];
}

function getRoundOrder(round: string) {
  const order = {
    oitavas: 1,
    quartas: 2,
    semi: 3,
    final: 4,
  };

  return order[
    round as keyof typeof order
  ] ?? 0;
}

function nextRoundName(round: string) {
  if (round === 'oitavas') return 'quartas';
  if (round === 'quartas') return 'semi';
  if (round === 'semi') return 'final';
  return null;
}

function deleteFutureRounds(
  tournamentId: number,
  currentRound: string
) {
  const currentOrder =
    getRoundOrder(currentRound);

  const rounds = [
    'oitavas',
    'quartas',
    'semi',
    'final',
  ];

  const futureRounds =
    rounds.filter(
      (round) =>
        getRoundOrder(round)
        > currentOrder
    );

  if (futureRounds.length === 0) {
    return;
  }

  const placeholders =
    futureRounds
      .map(() => '?')
      .join(',');

  db.prepare(`
    DELETE FROM matches
    WHERE tournament_id = ?
      AND round IN (${placeholders})
  `).run(
    tournamentId,
    ...futureRounds
  );
}

function finalizeTournamentIfPossible(tournamentId: number) {
  const finalMatches = getMatchesByRound(tournamentId, 'final');

  if (finalMatches.length !== 1) {
    return;
  }

  const finalMatch = finalMatches[0];

  if (!finalMatch.winner_id) {
    return;
  }

  db.prepare(`
    UPDATE tournaments
    SET status = 'finished'
    WHERE id = ?
  `).run(tournamentId);
}

function createNextRoundIfPossible(tournamentId: number, currentRound: string) {
  const currentMatches = getMatchesByRound(tournamentId, currentRound);

  if (currentMatches.length === 0) {
    return;
  }

  const hasPendingWinner = currentMatches.some((match) => !match.winner_id);
  if (hasPendingWinner) {
    return;
  }

  const nextRound = nextRoundName(currentRound);

  if (!nextRound) {
    finalizeTournamentIfPossible(tournamentId);
    return;
  }

  const existingNextRoundMatches = getMatchesByRound(tournamentId, nextRound);
  if (existingNextRoundMatches.length > 0) {
    return;
  }

  const winners = currentMatches.map((match) => match.winner_id) as number[];

  const insertMatch = db.prepare(`
    INSERT INTO matches (
      tournament_id,
      round,
      match_order,
      participant1_id,
      participant2_id
    )
    VALUES (?, ?, ?, ?, ?)
  `);

  let order = 1;

  for (let i = 0; i < winners.length; i += 2) {
    insertMatch.run(
      tournamentId,
      nextRound,
      order,
      winners[i],
      winners[i + 1]
    );

    order += 1;
  }

  if (nextRound === 'final') {
    finalizeTournamentIfPossible(tournamentId);
  }
}

function getChampion(tournamentId: number) {
  const champion = db.prepare(`
    SELECT p.id, p.name
    FROM matches m
    INNER JOIN participants p ON p.id = m.winner_id
    WHERE m.tournament_id = ?
      AND m.round = 'final'
      AND m.winner_id IS NOT NULL
    LIMIT 1
  `).get(tournamentId) as { id: number; name: string } | undefined;

  return champion ?? null;
}

export function getTournamentData() {
  const tournament = db.prepare(`
    SELECT *
    FROM tournaments
    ORDER BY id DESC
    LIMIT 1
  `).get() as
    | {
        id: number;
        name: string;
        status: string;
        created_at: string;
      }
    | undefined;

  if (!tournament) {
    return {
      tournament: null,
      matches: [],
      champion: null,
    };
  }

  const matches = db.prepare(`
    SELECT
      m.id,
      m.round,
      m.match_order,
      m.winner_id,
      p1.id AS participant1_id,
      p1.name AS participant1_name,
      p2.id AS participant2_id,
      p2.name AS participant2_name
    FROM matches m
    INNER JOIN participants p1 ON p1.id = m.participant1_id
    INNER JOIN participants p2 ON p2.id = m.participant2_id
    WHERE m.tournament_id = ?
    ORDER BY
      CASE
        WHEN m.round = 'oitavas' THEN 1
        WHEN m.round = 'quartas' THEN 2
        WHEN m.round = 'semi' THEN 3
        WHEN m.round = 'final' THEN 4
        ELSE 5
      END,
      m.match_order ASC
  `).all(tournament.id);

  return {
    tournament,
    matches,
    champion: getChampion(tournament.id),
  };
}

export function setMatchWinner(matchId: number, winnerId: number) {
  const selectedMatch = db.prepare(`
    SELECT *
    FROM matches
    WHERE id = ?
  `).get(matchId) as MatchRow | undefined;

  if (!selectedMatch) {
    return;
  }

  const tournament = db.prepare(`
    SELECT *
    FROM tournaments
    WHERE id = ?
  `).get(selectedMatch.tournament_id) as
    | { id: number; status: string }
    | undefined;

  if (!tournament || tournament.status === 'finished') {
    return;
  }

  const changingWinner =
    selectedMatch.winner_id !== null
    && selectedMatch.winner_id !== winnerId;

  if (changingWinner) {
    deleteFutureRounds(
      selectedMatch.tournament_id,
      selectedMatch.round
    );
  }

  db.prepare(`
    UPDATE matches
    SET winner_id = ?
    WHERE id = ?
  `).run(winnerId, matchId);

  createNextRoundIfPossible(selectedMatch.tournament_id, selectedMatch.round);
}