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

      setMatchWinner: (
        matchId: number,
        winnerId: number
      ) => Promise<TournamentData>;
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

  return match.participant2_name;
}

function buildMatchTreeCard(
  match: MatchRow,
  tournamentFinished: boolean
) {
  const winnerLabel = getWinnerLabel(match);

  return `
    <div
      style="
        background: #181818;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 14px;
        min-width: 240px;
      "
    >
      <div
        style="
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
        "
      >
        <strong>Batalha ${match.match_order}</strong>

        <span style="font-size: 12px; color: #999;">
          ${winnerLabel}
        </span>
      </div>

      <div
        style="
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 12px;
        "
      >
        <div
          style="
            padding: 8px;
            border-radius: 8px;
            background:
              ${match.winner_id === match.participant1_id
                ? '#2d5a27'
                : '#222'};
          "
        >
          ${match.participant1_name}
        </div>

        <div
          style="
            padding: 8px;
            border-radius: 8px;
            background:
              ${match.winner_id === match.participant2_id
                ? '#2d5a27'
                : '#222'};
          "
        >
          ${match.participant2_name}
        </div>
      </div>

      <div
        style="
          display: flex;
          flex-direction: column;
          gap: 8px;
        "
      >
        <button
          data-action="winner"
          data-match-id="${match.id}"
          data-winner-id="${match.participant1_id}"
          data-current-winner-id="${match.winner_id ?? ''}"

          ${tournamentFinished ? 'disabled' : ''}

          style="
            padding: 8px;
            border-radius: 8px;
            border: none;
            cursor:
              ${tournamentFinished
                ? 'not-allowed'
                : 'pointer'};
          "
        >
          Vitória:
          ${match.participant1_name}
        </button>

        <button
          data-action="winner"
          data-match-id="${match.id}"
          data-winner-id="${match.participant2_id}"
          data-current-winner-id="${match.winner_id ?? ''}"

          ${tournamentFinished ? 'disabled' : ''}

          style="
            padding: 8px;
            border-radius: 8px;
            border: none;
            cursor:
              ${tournamentFinished
                ? 'not-allowed'
                : 'pointer'};
          "
        >
          Vitória:
          ${match.participant2_name}
        </button>
      </div>
    </div>
  `;
}

function groupMatchesByRound(matches: MatchRow[]) {
  return {
    oitavas: matches.filter((m) => m.round === 'oitavas'),
    quartas: matches.filter((m) => m.round === 'quartas'),
    semi: matches.filter((m) => m.round === 'semi'),
    final: matches.filter((m) => m.round === 'final'),
  };
}

function buildTreeColumn(
  title: string,
  matches: MatchRow[],
  tournamentFinished: boolean
) {
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
      <h2>${title}</h2>

      ${matches
        .map((match) =>
          buildMatchTreeCard(
            match,
            tournamentFinished
          )
        )
        .join('')}
    </div>
  `;
}

function renderChampion(
  champion: TournamentData['champion']
) {
  if (!champion) {
    return '';
  }

  return `
    <div
      style="
        margin-bottom: 30px;
        padding: 24px;
        border-radius: 16px;

        background:
          linear-gradient(
            135deg,
            #d4af37,
            #8b6b10
          );

        color: #111;
      "
    >
      <div
        style="
          font-size: 14px;
          font-weight: bold;
        "
      >
        CAMPEÃO
      </div>

      <div
        style="
          font-size: 38px;
          font-weight: 800;
          margin-top: 8px;
        "
      >
        🏆 ${champion.name}
      </div>
    </div>
  `;
}

function renderCreateTournamentForm() {
  const participantInputs = Array.from(
    { length: 16 },
    (_, index) => `
      <input
        type="text"

        placeholder="Participante ${index + 1}"

        class="participant-input"

        style="
          padding: 10px;
          border-radius: 8px;
          border: 1px solid #333;
          background: #181818;
          color: white;
        "
      />
    `
  ).join('');

  return `
    <section
      style="
        margin-bottom: 40px;
        padding: 24px;
        border-radius: 16px;
        background: #151515;
        border: 1px solid #333;
      "
    >
      <h2 style="margin-top: 0;">
        Criar novo torneio
      </h2>

      <div
        style="
          display: flex;
          flex-direction: column;
          gap: 16px;
        "
      >
        <input
          type="text"

          id="tournament-name"

          placeholder="Nome do torneio"

          style="
            padding: 12px;
            border-radius: 8px;
            border: 1px solid #333;
            background: #181818;
            color: white;
          "
        />

        <div
          style="
            display: grid;
            grid-template-columns:
              repeat(2, 1fr);

            gap: 10px;
          "
        >
          ${participantInputs}
        </div>
        <div
  id="form-error"
  style="
    display: none;
    padding: 12px;
    border-radius: 8px;
    background: #3a1717;
    color: #ffb3b3;
    border: 1px solid #773333;
  "
></div>

        <button
          id="create-tournament-button"

          style="
            padding: 14px;
            border-radius: 10px;
            border: none;
            cursor: pointer;
            font-weight: bold;
          "
        >
          Criar torneio
        </button>
      </div>
    </section>
  `;
}

function renderApp(data: TournamentData) {
  const grouped =
    groupMatchesByRound(data.matches);

  const tournamentFinished =
    data.tournament?.status === 'finished';

  document.body.innerHTML = `
    <div
      style="
        padding: 30px;
        font-family: Arial;
        background: #101010;
        color: white;
        min-height: 100vh;
      "
    >
      <div
        style="
          margin-bottom: 30px;
        "
      >
        <h1>Battle Manager</h1>

        ${
          data.tournament
            ? `
              <p style="color: #999;">
                ${data.tournament.name}
              </p>
            `
            : ''
        }
      </div>

      ${renderCreateTournamentForm()}

      ${renderChampion(data.champion)}

      <div
        style="
          overflow-x: auto;
        "
      >
        <div
          style="
            display: flex;
            gap: 28px;
            align-items: flex-start;
            min-width: max-content;
          "
        >
          ${buildTreeColumn(
            'Oitavas',
            grouped.oitavas,
            tournamentFinished
          )}

          ${buildTreeColumn(
            'Quartas',
            grouped.quartas,
            tournamentFinished
          )}

          ${buildTreeColumn(
            'Semifinal',
            grouped.semi,
            tournamentFinished
          )}

          ${buildTreeColumn(
            'Final',
            grouped.final,
            tournamentFinished
          )}
        </div>
      </div>
    </div>
  `;

  const createButton =
    document.getElementById(
      'create-tournament-button'
    );

  createButton?.addEventListener(
    'click',
    async () => {
      const tournamentNameInput =
        document.getElementById(
          'tournament-name'
        ) as HTMLInputElement;

      const participantInputs =
        document.querySelectorAll<HTMLInputElement>(
          '.participant-input'
        );

      const participantNames =
        Array.from(participantInputs)
          .map((input) => input.value.trim());

      const hasEmptyParticipant =
  participantNames.some((name) => name.length === 0);

const formError = document.getElementById('form-error');

function showFormError(message: string) {
  if (!formError) {
    return;
  }

  formError.textContent = message;
  formError.style.display = 'block';
}

function clearFormError() {
  if (!formError) {
    return;
  }

  formError.textContent = '';
  formError.style.display = 'none';
}

clearFormError();

if (!tournamentNameInput.value.trim()) {
  showFormError('Digite o nome do torneio.');
  tournamentNameInput.focus();
  return;
}

if (hasEmptyParticipant) {
  showFormError('Preencha os 16 participantes.');
  return;
}

try {
  createButton.setAttribute('disabled', 'true');

  const updatedData =
    await window.battleManager
      .createManualTournament(
        tournamentNameInput.value.trim(),
        participantNames
      );

  renderApp(updatedData);
} catch (error) {
  console.error(error);
  showFormError('Não foi possível criar o torneio. Verifique se todos os campos foram preenchidos.');
} finally {
  createButton.removeAttribute('disabled');
}
    }
  );

  const winnerButtons =
    document.querySelectorAll<HTMLButtonElement>(
      'button[data-action="winner"]'
    );

  winnerButtons.forEach((button) => {
    button.addEventListener(
      'click',
      async () => {
        if (tournamentFinished) {
          return;
        }

        const matchId =
          Number(button.dataset.matchId);

        const winnerId =
          Number(button.dataset.winnerId);

        const currentWinnerId =
          Number(
            button.dataset.currentWinnerId
            || '0'
          );

        if (
          currentWinnerId
          && currentWinnerId !== winnerId
        ) {
          const confirmed =
            window.confirm(
              `
Essa batalha já possui vencedor.

Deseja alterar?
              `
            );

          if (!confirmed) {
            return;
          }
        }

        const updatedData =
          await window.battleManager
            .setMatchWinner(
              matchId,
              winnerId
            );

        renderApp(updatedData);
      }
    );
  });
}

async function init() {
  const data =
    await window.battleManager
      .getTournamentData();

  renderApp(data);
}

init();