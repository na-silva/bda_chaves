export {};

type MatchRow = {
  id: number;
  round: string;
  match_order: number;
  winner_id: number | null;
  participant1_id: number;
  participant1_name: string;
  participant2_id: number;
  participant2_name: string;
};

type TournamentData = {
  tournament: {
    id: number;
    name: string;
    status: string;
    created_at: string;
  } | null;
  matches: MatchRow[];
  champion: {
    id: number;
    name: string;
  } | null;
};

declare global {
  interface Window {
    battleManager: {
      generateTestTournament: () => Promise<TournamentData>;
      createManualTournament: (
        tournamentName: string,
        participantNames: string[]
      ) => Promise<TournamentData>;
      getTournamentData: () => Promise<TournamentData>;
      setMatchWinner: (matchId: number, winnerId: number) => Promise<TournamentData>;
    };
  }
}

function getWinnerLabel(match: MatchRow) {
  if (!match.winner_id) {
    return 'Pendente';
  }

  if (match.winner_id === match.participant1_id) {
    return match.participant1_name;
  }

  if (match.winner_id === match.participant2_id) {
    return match.participant2_name;
  }

  return 'Pendente';
}

function buildMatchCard(match: MatchRow, tournamentFinished: boolean) {
  const winnerLabel = getWinnerLabel(match);
  const matchLocked = tournamentFinished;
  const currentWinnerId = match.winner_id;

  return `
    <div style="border: 1px solid #444; border-radius: 10px; padding: 16px; background: #151515;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <strong>Batalha ${match.match_order}</strong>
        <span style="font-size: 14px; color: #bbb;">Vencedor: ${winnerLabel}</span>
      </div>

      <div style="margin-bottom: 14px; line-height: 1.8;">
        <div>${match.participant1_name}</div>
        <div>${match.participant2_name}</div>
      </div>

      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <button
          data-action="winner"
          data-match-id="${match.id}"
          data-winner-id="${match.participant1_id}"
          data-current-winner-id="${currentWinnerId ?? ''}"
          ${matchLocked ? 'disabled' : ''}
          style="padding: 10px 14px; border-radius: 8px; border: none; cursor: ${
            matchLocked ? 'not-allowed' : 'pointer'
          }; opacity: ${matchLocked ? '0.6' : '1'};"
        >
          Vencedor: ${match.participant1_name}
        </button>

        <button
          data-action="winner"
          data-match-id="${match.id}"
          data-winner-id="${match.participant2_id}"
          data-current-winner-id="${currentWinnerId ?? ''}"
          ${matchLocked ? 'disabled' : ''}
          style="padding: 10px 14px; border-radius: 8px; border: none; cursor: ${
            matchLocked ? 'not-allowed' : 'pointer'
          }; opacity: ${matchLocked ? '0.6' : '1'};"
        >
          Vencedor: ${match.participant2_name}
        </button>
      </div>
    </div>
  `;
}

function groupMatchesByRound(matches: MatchRow[]) {
  return {
    oitavas: matches.filter((match) => match.round === 'oitavas'),
    quartas: matches.filter((match) => match.round === 'quartas'),
    semi: matches.filter((match) => match.round === 'semi'),
    final: matches.filter((match) => match.round === 'final'),
  };
}

function buildRoundSection(title: string, matches: MatchRow[], tournamentFinished: boolean) {
  if (matches.length === 0) {
    return '';
  }

  return `
    <section style="margin-bottom: 40px;">
      <h2>${title}</h2>
      <div style="display: grid; grid-template-columns: repeat(2, minmax(320px, 1fr)); gap: 16px;">
        ${matches.map((match) => buildMatchCard(match, tournamentFinished)).join('')}
      </div>
    </section>
  `;
}

function renderChampion(champion: TournamentData['champion']) {
  if (!champion) {
    return '';
  }

  return `
    <section
      style="
        margin-bottom: 30px;
        padding: 24px;
        border-radius: 16px;
        background: linear-gradient(135deg, #d4af37, #8b6b10);
        color: #111;
        box-shadow: 0 8px 30px rgba(0,0,0,0.3);
      "
    >
      <div style="font-size: 14px; font-weight: bold; letter-spacing: 1px;">CAMPEÃO</div>
      <div style="font-size: 38px; font-weight: 800; margin-top: 8px;">🏆 ${champion.name}</div>
    </section>
  `;
}

function renderApp(data: TournamentData) {
  const grouped = groupMatchesByRound(data.matches);
  const tournamentFinished = data.tournament?.status === 'finished';

  document.body.innerHTML = `
    <div style="padding: 30px; font-family: Arial; background: #101010; color: #fff; min-height: 100vh;">
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 20px; margin-bottom: 30px;">
        <div>
          <h1 style="margin: 0;">Battle Manager</h1>
          <p style="margin: 10px 0 0 0; color: #bbb;">
            ${data.tournament ? data.tournament.name : 'Nenhum torneio carregado'}
          </p>
          <p style="margin: 6px 0 0 0; color: #888;">
            ${tournamentFinished ? 'Torneio encerrado' : 'Torneio em andamento'}
          </p>
        </div>

        <button
          id="generate-test-button"
          style="padding: 12px 18px; border-radius: 10px; border: none; cursor: pointer; font-weight: bold;"
        >
          Novo torneio
        </button>
      </div>

      ${renderChampion(data.champion)}

      ${buildRoundSection('Oitavas de final', grouped.oitavas, tournamentFinished)}
      ${buildRoundSection('Quartas de final', grouped.quartas, tournamentFinished)}
      ${buildRoundSection('Semifinal', grouped.semi, tournamentFinished)}
      ${buildRoundSection('Final', grouped.final, tournamentFinished)}
    </div>
  `;

  const generateButton = document.getElementById('generate-test-button');
  generateButton?.addEventListener('click', async () => {
    const newData = await window.battleManager.generateTestTournament();
    renderApp(newData);
  });

  const winnerButtons = document.querySelectorAll<HTMLButtonElement>('button[data-action="winner"]');

  winnerButtons.forEach((button) => {
    button.addEventListener('click', async () => {
      if (tournamentFinished) {
        return;
      }

      const matchId = Number(button.dataset.matchId);
      const winnerId = Number(button.dataset.winnerId);
      const currentWinnerId = Number(button.dataset.currentWinnerId || '0');

      if (currentWinnerId && currentWinnerId !== winnerId) {
        const confirmed = window.confirm(
          'Essa batalha já possui um vencedor definido. Deseja realmente alterar o vencedor?'
        );

        if (!confirmed) {
          return;
        }
      }

      const updatedData = await window.battleManager.setMatchWinner(matchId, winnerId);
      renderApp(updatedData);
    });
  });
}

async function init() {
  const data = await window.battleManager.getTournamentData();
  renderApp(data);
}

init();