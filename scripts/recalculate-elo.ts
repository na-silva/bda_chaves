import * as fs from "node:fs";
import * as path from "node:path";

type BattleType = "sangue" | "conhecimento";
type WinType = "2x0" | "2x1";

type TournamentResult = {
  tournament: {
    id: number;
    name: string;
    status: string;
    battle_type: BattleType;
    created_at: string;
  };
  matches: MatchResult[];
  champion?: {
    id: number;
    participant_key: string;
    name: string;
  };
};

type MatchResult = {
  id: number;
  round: string;
  match_order: number;
  winner_id: number;
  win_type: WinType;

  participant1_id: number;
  participant1_key: string;
  participant1_name: string;

  participant2_id: number;
  participant2_key: string;
  participant2_name: string;
};

type McRanking = {
  key: string;
  name: string;
  participantIds: number[];

  eloSangue: number;
  eloConhecimento: number;
  eloGeral: number;

  battles: number;
  wins: number;
  losses: number;

  tournaments: number;
  tournamentWins: number;

  sangueBattles: number;
  sangueWins: number;
  sangueLosses: number;
  sangueTournaments: number;
  sangueTournamentWins: number;

  conhecimentoBattles: number;
  conhecimentoWins: number;
  conhecimentoLosses: number;
  conhecimentoTournaments: number;
  conhecimentoTournamentWins: number;
};

const ELO_INICIAL = 1000;
const K_BASE = 32;

const SCORE_MULTIPLIER: Record<WinType, number> = {
  "2x0": 1.15,
  "2x1": 1,
};

const RESULTS_DIR = path.resolve(process.cwd(), "results");
const DATA_DIR = path.resolve(process.cwd(), "data");
const RANKING_OUTPUT_FILE = path.join(DATA_DIR, "ranking.json");
const CURRENT_ELO_OUTPUT_FILE = path.join(DATA_DIR, "elo-current.json");

function normalizeMcKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function expectedScore(playerElo: number, opponentElo: number): number {
  return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
}

function roundElo(value: number): number {
  return Math.round(value * 100) / 100;
}

function getOrCreateMc(
  ranking: Map<string, McRanking>,
  key: string,
  id: number,
  name: string
): McRanking {
  const existing = ranking.get(key);

  if (existing) {
    existing.name = name;

    if (!existing.participantIds.includes(id)) {
      existing.participantIds.push(id);
    }

    return existing;
  }

  const mc: McRanking = {
    key,
    name,
    participantIds: [id],

    eloSangue: ELO_INICIAL,
    eloConhecimento: ELO_INICIAL,
    eloGeral: ELO_INICIAL,

    battles: 0,
    wins: 0,
    losses: 0,

    tournaments: 0,
    tournamentWins: 0,

    sangueBattles: 0,
    sangueWins: 0,
    sangueLosses: 0,
    sangueTournaments: 0,
    sangueTournamentWins: 0,

    conhecimentoBattles: 0,
    conhecimentoWins: 0,
    conhecimentoLosses: 0,
    conhecimentoTournaments: 0,
    conhecimentoTournamentWins: 0,
  };

  ranking.set(key, mc);

  return mc;
}

function updateGeneralElo(mc: McRanking): void {
  mc.eloGeral = roundElo((mc.eloSangue + mc.eloConhecimento) / 2);
}

function getMatchPlayers(match: MatchResult, ranking: Map<string, McRanking>) {
  const mc1 = getOrCreateMc(
    ranking,
    match.participant1_key,
    match.participant1_id,
    match.participant1_name
  );

  const mc2 = getOrCreateMc(
    ranking,
    match.participant2_key,
    match.participant2_id,
    match.participant2_name
  );

  if (
    match.winner_id !== match.participant1_id &&
    match.winner_id !== match.participant2_id
  ) {
    throw new Error(
      `winner_id inválido na batalha ${match.id}: ${match.winner_id}`
    );
  }

  const winner = match.winner_id === match.participant1_id ? mc1 : mc2;
  const loser = match.winner_id === match.participant1_id ? mc2 : mc1;

  return {
    winner,
    loser,
  };
}

function getEloByType(mc: McRanking, battleType: BattleType): number {
  if (battleType === "sangue") {
    return mc.eloSangue;
  }

  return mc.eloConhecimento;
}

function setEloByType(
  mc: McRanking,
  battleType: BattleType,
  newElo: number
): void {
  if (battleType === "sangue") {
    mc.eloSangue = roundElo(newElo);
    return;
  }

  mc.eloConhecimento = roundElo(newElo);
}

function updateStats(
  winner: McRanking,
  loser: McRanking,
  battleType: BattleType
): void {
  winner.battles += 1;
  winner.wins += 1;

  loser.battles += 1;
  loser.losses += 1;

  if (battleType === "sangue") {
    winner.sangueBattles += 1;
    winner.sangueWins += 1;

    loser.sangueBattles += 1;
    loser.sangueLosses += 1;
  }

  if (battleType === "conhecimento") {
    winner.conhecimentoBattles += 1;
    winner.conhecimentoWins += 1;

    loser.conhecimentoBattles += 1;
    loser.conhecimentoLosses += 1;
  }
}

function processMatch(
  match: MatchResult,
  battleType: BattleType,
  ranking: Map<string, McRanking>
): void {
  const { winner, loser } = getMatchPlayers(match, ranking);

  const winnerElo = getEloByType(winner, battleType);
  const loserElo = getEloByType(loser, battleType);

  const winnerExpectedScore = expectedScore(winnerElo, loserElo);
  const scoreMultiplier = SCORE_MULTIPLIER[match.win_type] ?? 1;

  const eloChange = K_BASE * scoreMultiplier * (1 - winnerExpectedScore);

  setEloByType(winner, battleType, winnerElo + eloChange);
  setEloByType(loser, battleType, loserElo - eloChange);

  updateStats(winner, loser, battleType);

  updateGeneralElo(winner);
  updateGeneralElo(loser);
}

function readTournamentResults(): TournamentResult[] {
  console.log(`Lendo resultados em: ${RESULTS_DIR}`);

  if (!fs.existsSync(RESULTS_DIR)) {
    throw new Error(`Pasta de resultados não encontrada: ${RESULTS_DIR}`);
  }

  const files: string[] = fs
    .readdirSync(RESULTS_DIR)
    .filter((file: string) => file.endsWith(".json"))
    .sort();

  console.log(`Arquivos JSON encontrados: ${files.length}`);

  const tournaments: TournamentResult[] = [];

  for (const file of files) {
    const fullPath = path.join(RESULTS_DIR, file);
    const rawContent = fs.readFileSync(fullPath, "utf-8");

    try {
      const parsed = JSON.parse(rawContent) as TournamentResult;

      if (parsed.tournament.status !== "finished") {
        console.warn(`Ignorando ${file}: torneio não está finished.`);
        continue;
      }

      if (
        parsed.tournament.battle_type !== "sangue" &&
        parsed.tournament.battle_type !== "conhecimento"
      ) {
        console.warn(`Ignorando ${file}: battle_type inválido ou ausente.`);
        continue;
      }

      console.log(
        `Carregado: ${file} | tipo: ${parsed.tournament.battle_type} | batalhas: ${parsed.matches.length}`
      );

      tournaments.push(parsed);
    } catch {
      console.warn(`Erro ao ler ${file}. Verifique se o JSON está válido.`);
    }
  }

  return tournaments.sort((a, b) => {
    return a.tournament.created_at.localeCompare(b.tournament.created_at);
  });
}
function updateTournamentStats(
  tournament: TournamentResult,
  ranking: Map<string, McRanking>
): void {
  const battleType = tournament.tournament.battle_type;
  const participantKeys = new Set<string>();

  for (const match of tournament.matches) {
    const mc1 = getOrCreateMc(
      ranking,
      match.participant1_key,
      match.participant1_id,
      match.participant1_name
    );

    const mc2 = getOrCreateMc(
      ranking,
      match.participant2_key,
      match.participant2_id,
      match.participant2_name
    );

    participantKeys.add(mc1.key);
    participantKeys.add(mc2.key);
  }

  for (const participantKey of participantKeys) {
    const mc = ranking.get(participantKey);

    if (!mc) {
      continue;
    }

    mc.tournaments += 1;

    if (battleType === "sangue") {
      mc.sangueTournaments += 1;
    }

    if (battleType === "conhecimento") {
      mc.conhecimentoTournaments += 1;
    }
  }

  if (!tournament.champion) {
    return;
  }

  const champion = getOrCreateMc(
    ranking,
    tournament.champion.participant_key,
    tournament.champion.id,
    tournament.champion.name
  );

  champion.tournamentWins += 1;

  if (battleType === "sangue") {
    champion.sangueTournamentWins += 1;
  }

  if (battleType === "conhecimento") {
    champion.conhecimentoTournamentWins += 1;
  }
}
function recalculateRanking(): McRanking[] {
  const ranking = new Map<string, McRanking>();
  const tournaments = readTournamentResults();

  for (const tournament of tournaments) {
    const battleType = tournament.tournament.battle_type;

    updateTournamentStats(tournament, ranking);

    const matches = [...tournament.matches].sort((a, b) => {
      const roundOrder: Record<string, number> = {
        oitavas: 1,
        quartas: 2,
        semi: 3,
        final: 4,
      };

      const roundA = roundOrder[a.round] ?? 999;
      const roundB = roundOrder[b.round] ?? 999;

      if (roundA !== roundB) {
        return roundA - roundB;
      }

      return a.match_order - b.match_order;
    });

    for (const match of matches) {
      processMatch(match, battleType, ranking);
    }
  }

  return Array.from(ranking.values()).sort((a, b) => {
    return b.eloGeral - a.eloGeral;
  });
}
function buildCurrentEloOutput(ranking: McRanking[]) {
  return ranking.map((mc, index) => {
    return {
      position: index + 1,
      key: mc.key,
      name: mc.name,
      eloGeral: mc.eloGeral,
      eloSangue: mc.eloSangue,
      eloConhecimento: mc.eloConhecimento,
    };
  });
}
function main(): void {
  console.log("Iniciando recálculo de Elo...");

  const ranking = recalculateRanking();

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log(`Pasta criada: ${DATA_DIR}`);
  }

  const fullOutput = {
    generated_at: new Date().toISOString(),
    config: {
      eloInicial: ELO_INICIAL,
      kBase: K_BASE,
      scoreMultiplier: SCORE_MULTIPLIER,
    },
    ranking,
  };

  const currentEloOutput = {
    generated_at: new Date().toISOString(),
    ranking: buildCurrentEloOutput(ranking),
  };

  fs.writeFileSync(
    RANKING_OUTPUT_FILE,
    JSON.stringify(fullOutput, null, 2),
    "utf-8"
  );

  fs.writeFileSync(
    CURRENT_ELO_OUTPUT_FILE,
    JSON.stringify(currentEloOutput, null, 2),
    "utf-8"
  );

  console.log(`Ranking recalculado com sucesso.`);
  console.log(`MCs no ranking: ${ranking.length}`);
  console.log(`Arquivo completo gerado em: ${RANKING_OUTPUT_FILE}`);
  console.log(`Arquivo atual de Elo gerado em: ${CURRENT_ELO_OUTPUT_FILE}`);
}

main();