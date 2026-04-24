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

function buildMatchTreeCard(match: MatchRow, tournamentFinished: boolean) {
  const winnerLabel = getWinnerLabel(match);
  const matchLocked = tournamentFinished;
  const currentWinnerId = match.winner_id;

  return `
    <div
      style="
        background: #181818;
        border: 1px solid #3a3a3a;
        border-radius: 12px;
        padding: 14px;
        min-width: 240px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.25);
      "
    >
      <div style="display: flex; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
        <strong>Batalha ${match.match_order}</strong>
        <span style="font-size: 12px; color: #aaa;">${winnerLabel}</span>
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px;">
        <div
          style="
            padding: 8px 10px;
            border-radius: 8px;
            background: ${match.winner_id === match.participant1_id ? '#2d5a27' : '#222'};
            border: 1px solid ${match.winner_id === match.participant1_id ? '#4caf50' : '#333'};
          "
        >
          ${match.participant1_name}
        </div>

        <div
          style="
            padding: 8px 10px;
            border-radius: 8px;
            background: ${match.winner_id === match.participant2_id ? '#2d5a27' : '#222'};
            border: 1px solid ${match.winner_id === match.participant2_id ? '#4caf50' : '#333'};
          "
        >
          ${match.participant2_name}
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px;">
        <button
          data-action="winner"
          data-match-id="${match.id}"
          data-winner-id="${match.participant1_id}"
          data-current-winner-id="${currentWinnerId ?? ''}"
          ${matchLocked ? 'disabled' : ''}
          style="
            padding: 8px 10px;
            border-radius: 8px;
            border: none;
            cursor: ${matchLocked ? 'not-allowed' : 'pointer'};
            opacity: ${matchLocked ? '0.6' : '1'};
          "
        >
          Vitória: ${match.participant1_name}
        </button>

        <button
          data-action="winner"
          data-match-id="${match.id}"
          data-winner-id="${match.participant2_id}"
          data-current-winner-id="${currentWinnerId ?? ''}"
          ${matchLocked ? 'disabled' : ''}
          style="
            padding: 8px 10px;
            border-radius: 8px;
            border: none;
            cursor: ${matchLocked ? 'not-allowed' : 'pointer'};
            opacity: ${matchLocked ? '0.6' : '1'};
          "
        >
          Vitória: ${match.participant2_name}
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

function buildTreeColumn(title: string, matches: MatchRow[], tournamentFinished: boolean) {
  if (matches.length === 0) {
    return '';
  }

  return `
    <div
      style="
        min-width: 290px;
        display: flex;
        flex-direction: column;
        gap: 18px;
      "
    >
      <h2 style="margin: 0 0 8px 0; font-size: 28px;">${title}</h2>
      ${matches.map((match) => buildMatchTreeCard(match, tournamentFinished)).join('')}
    </div>
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

      <div style="overflow-x: auto; padding-bottom: 10px;">
        <div
          style="
            display: flex;
            gap: 28px;
            align-items: flex-start;
            min-width: max-content;
          "
        >
          ${buildTreeColumn('Oitavas', grouped.oitavas, tournamentFinished)}
          ${buildTreeColumn('Quartas', grouped.quartas, tournamentFinished)}
          ${buildTreeColumn('Semifinal', grouped.semi, tournamentFinished)}
          ${buildTreeColumn('Final', grouped.final, tournamentFinished)}
        </div>
      </div>
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