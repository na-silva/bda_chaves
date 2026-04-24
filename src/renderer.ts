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
  if (!match.winner_id) return 'Pendente';
  if (match.winner_id === match.participant1_id) return match.participant1_name;
  return match.participant2_name;
}

function groupMatchesByRound(matches: MatchRow[]) {
  return {
    oitavas: matches.filter((m) => m.round === 'oitavas'),
    quartas: matches.filter((m) => m.round === 'quartas'),
    semi: matches.filter((m) => m.round === 'semi'),
    final: matches.filter((m) => m.round === 'final'),
  };
}

function buildMatchTreeCard(match: MatchRow, tournamentFinished: boolean) {
  const winnerLabel = getWinnerLabel(match);

  return `
    <div style="background:#181818;border:1px solid #333;border-radius:12px;padding:14px;min-width:240px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
        <strong>Batalha ${match.match_order}</strong>
        <span style="font-size:12px;color:#999;">${winnerLabel}</span>
      </div>

      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px;">
        <div style="padding:8px;border-radius:8px;background:${match.winner_id === match.participant1_id ? '#2d5a27' : '#222'};">
          ${match.participant1_name}
        </div>
        <div style="padding:8px;border-radius:8px;background:${match.winner_id === match.participant2_id ? '#2d5a27' : '#222'};">
          ${match.participant2_name}
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:8px;">
        <button
          data-action="winner"
          data-match-id="${match.id}"
          data-winner-id="${match.participant1_id}"
          data-current-winner-id="${match.winner_id ?? ''}"
          ${tournamentFinished ? 'disabled' : ''}
          style="padding:8px;border-radius:8px;border:none;cursor:${tournamentFinished ? 'not-allowed' : 'pointer'};"
        >
          Vitória: ${match.participant1_name}
        </button>

        <button
          data-action="winner"
          data-match-id="${match.id}"
          data-winner-id="${match.participant2_id}"
          data-current-winner-id="${match.winner_id ?? ''}"
          ${tournamentFinished ? 'disabled' : ''}
          style="padding:8px;border-radius:8px;border:none;cursor:${tournamentFinished ? 'not-allowed' : 'pointer'};"
        >
          Vitória: ${match.participant2_name}
        </button>
      </div>
    </div>
  `;
}

function buildTreeColumn(title: string, matches: MatchRow[], tournamentFinished: boolean) {
  if (matches.length === 0) return '';

  return `
    <div style="min-width:290px;display:flex;flex-direction:column;gap:18px;">
      <h2>${title}</h2>
      ${matches.map((match) => buildMatchTreeCard(match, tournamentFinished)).join('')}
    </div>
  `;
}
function buildTournamentSummary(data: TournamentData) {
  if (!data.tournament) {
    return '';
  }

  const grouped = groupMatchesByRound(data.matches);

  function renderMatchList(title: string, matches: MatchRow[]) {
    if (matches.length === 0) {
      return '';
    }

    const lines = matches.map((match) => {
      const winner = getWinnerLabel(match);

      return [
        `Batalha ${match.match_order}`,
        `${match.participant1_name} vs ${match.participant2_name}`,
        `Vencedor: ${winner}`,
      ].join('\n');
    });

    return [
      title.toUpperCase(),
      '',
      lines.join('\n\n'),
    ].join('\n');
  }

  return [
    data.tournament.name,
    '',
    data.champion
      ? `CAMPEÃO\n${data.champion.name}`
      : '',
    '',
    renderMatchList('Final', grouped.final),
    '',
    renderMatchList('Semifinal', grouped.semi),
    '',
    renderMatchList('Quartas', grouped.quartas),
    '',
    renderMatchList('Oitavas', grouped.oitavas),
  ]
    .filter(Boolean)
    .join('\n');
}

function renderChampion(champion: TournamentData['champion']) {
  if (!champion) return '';

  return `
    <div style="margin-bottom:30px;padding:24px;border-radius:16px;background:linear-gradient(135deg,#d4af37,#8b6b10);color:#111;">
      <div style="font-size:14px;font-weight:bold;">CAMPEÃO</div>
      <div style="font-size:38px;font-weight:800;margin-top:8px;">🏆 ${champion.name}</div>
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
        style="padding:10px;border-radius:8px;border:1px solid #333;background:#181818;color:white;"
      />
    `
  ).join('');

  return `
    <section style="margin-bottom:40px;padding:24px;border-radius:16px;background:#151515;border:1px solid #333;">
      <h2 style="margin-top:0;">Criar novo torneio</h2>

      <div style="display:flex;flex-direction:column;gap:16px;">
        <input
          type="text"
          id="tournament-name"
          placeholder="Nome/data do torneio"
          style="padding:12px;border-radius:8px;border:1px solid #333;background:#181818;color:white;"
        />

        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">
          ${participantInputs}
        </div>

        <div
          id="form-error"
          style="display:none;padding:12px;border-radius:8px;background:#3a1717;color:#ffb3b3;border:1px solid #773333;"
        ></div>

        <button
          id="create-tournament-button"
          style="padding:14px;border-radius:10px;border:none;cursor:pointer;font-weight:bold;"
        >
          Criar torneio
        </button>
      </div>
    </section>
  `;
}
function renderExportModal() {
  return `
    <section
      id="export-modal"
      style="
        display:none;
        position:fixed;
        inset:0;
        background:rgba(0,0,0,0.7);
        z-index:999;
        padding:40px;
      "
    >
      <div
        style="
          max-width:900px;
          margin:0 auto;
          background:#151515;
          border-radius:16px;
          padding:24px;
          border:1px solid #333;
        "
      >
        <div
          style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            margin-bottom:20px;
          "
        >
          <h2 style="margin:0;">
            Exportar resultado
          </h2>

          <button
            id="close-export-modal"
            style="
              padding:10px 14px;
              border:none;
              border-radius:8px;
              cursor:pointer;
            "
          >
            Fechar
            <button
  id="copy-export-button"

  style="
    padding:10px 14px;
    border:none;
    border-radius:8px;
    cursor:pointer;
    margin-left:10px;
  "
>
  Copiar resultado
</button>
          </button>
        </div>

        <textarea
          id="export-content"
          readonly

          style="
            width:100%;
            height:500px;
            resize:none;

            background:#101010;
            color:white;

            border:1px solid #333;
            border-radius:12px;

            padding:16px;

            font-family:monospace;
            font-size:14px;
          "
        ></textarea>
      </div>
    </section>
  `;
}

function renderNewTournamentConfirmation() {
  return `
    <section
      id="new-tournament-confirmation"
      style="display:none;margin-bottom:30px;padding:18px;border-radius:12px;background:#211a10;border:1px solid #8b6b10;color:#ffd98a;"
    >
      <strong>Atenção:</strong>
      criar um novo torneio vai apagar o torneio atual e suas batalhas.

      <div style="display:flex;gap:10px;margin-top:14px;">
        <button
          id="confirm-new-tournament-button"
          style="padding:10px 14px;border-radius:8px;border:none;cursor:pointer;font-weight:bold;"
        >
          Confirmar novo torneio
        </button>

        <button
          id="cancel-new-tournament-button"
          style="padding:10px 14px;border-radius:8px;border:none;cursor:pointer;"
        >
          Cancelar
        </button>
      </div>
    </section>
  `;
}

function renderApp(data: TournamentData, showCreateForm = data.tournament === null) {
  const grouped = groupMatchesByRound(data.matches);
  const tournamentFinished = data.tournament?.status === 'finished';

  document.body.innerHTML = `
    <div style="padding:30px;font-family:Arial;background:#101010;color:white;min-height:100vh;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-bottom:30px;">
        <div>
          <h1>ISSO É BDA CARAI</h1>
          ${
            data.tournament
              ? `
                <p style="color:#999;">${data.tournament.name}</p>
                <p style="color:#888;">
                  ${tournamentFinished ? 'Torneio encerrado' : 'Torneio em andamento'}
                </p>
              `
              : `<p style="color:#999;">Nenhum torneio criado</p>`
          }
        </div>

                ${
          data.tournament
            ? `
              <div style="display:flex;gap:10px;">
                <button
                  id="export-button"
                  style="
                    padding:12px 18px;
                    border-radius:10px;
                    border:none;
                    cursor:pointer;
                    font-weight:bold;
                  "
                >
                  Exportar resultado
                </button>

                <button
                  id="new-tournament-button"
                  style="
                    padding:12px 18px;
                    border-radius:10px;
                    border:none;
                    cursor:pointer;
                    font-weight:bold;
                  "
                >
                  Novo torneio
                </button>
              </div>
            `
            : ''
}
      </div>

      ${renderNewTournamentConfirmation()}
      ${renderExportModal()}
      ${showCreateForm ? renderCreateTournamentForm() : ''}

      ${renderChampion(data.champion)}

      ${
        data.tournament
          ? `
            <div style="overflow-x:auto;">
              <div style="display:flex;gap:28px;align-items:flex-start;min-width:max-content;">
                ${buildTreeColumn('Oitavas', grouped.oitavas, tournamentFinished)}
                ${buildTreeColumn('Quartas', grouped.quartas, tournamentFinished)}
                ${buildTreeColumn('Semifinal', grouped.semi, tournamentFinished)}
                ${buildTreeColumn('Final', grouped.final, tournamentFinished)}
              </div>
            </div>
          `
          : ''
      }
    </div>
  `;

  bindCreateTournamentForm();
  bindNewTournamentConfirmation(data);
  bindExportButton(data);
  bindWinnerButtons(tournamentFinished);
}

function bindCreateTournamentForm() {
  const createButton = document.getElementById('create-tournament-button');
  if (!createButton) return;

  createButton.addEventListener('click', async () => {
    const tournamentNameInput = document.getElementById('tournament-name') as HTMLInputElement;
    const participantInputs = document.querySelectorAll<HTMLInputElement>('.participant-input');
    const formError = document.getElementById('form-error');

    function showFormError(message: string) {
      if (!formError) return;
      formError.textContent = message;
      formError.style.display = 'block';
    }

    function clearFormError() {
      if (!formError) return;
      formError.textContent = '';
      formError.style.display = 'none';
    }

    clearFormError();

    const tournamentName = tournamentNameInput.value.trim();
    const participantNames = Array.from(participantInputs).map((input) => input.value.trim());
    const hasEmptyParticipant = participantNames.some((name) => name.length === 0);

    if (!tournamentName) {
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

      const updatedData = await window.battleManager.createManualTournament(
        tournamentName,
        participantNames
      );

      renderApp(updatedData, false);
    } catch (error) {
      console.error(error);
      showFormError('Não foi possível criar o torneio. Verifique os campos preenchidos.');
    } finally {
      createButton.removeAttribute('disabled');
    }
  });
}

function bindNewTournamentConfirmation(data: TournamentData) {
  const newTournamentButton = document.getElementById('new-tournament-button');
  const confirmationBox = document.getElementById('new-tournament-confirmation');
  const confirmButton = document.getElementById('confirm-new-tournament-button');
  const cancelButton = document.getElementById('cancel-new-tournament-button');

  newTournamentButton?.addEventListener('click', () => {
    if (!confirmationBox) return;
    confirmationBox.style.display = 'block';
  });

  cancelButton?.addEventListener('click', () => {
    if (!confirmationBox) return;
    confirmationBox.style.display = 'none';
  });

  confirmButton?.addEventListener('click', () => {
    renderApp(
      {
        tournament: null,
        matches: [],
        champion: null,
      },
      true
    );
  });
}

function bindExportButton(data: TournamentData) {
  const exportButton = document.getElementById('export-button');
  const exportModal = document.getElementById('export-modal');
  const exportContent = document.getElementById('export-content') as HTMLTextAreaElement | null;
  const closeButton = document.getElementById('close-export-modal');
  const copyButton = document.getElementById('copy-export-button');

  exportButton?.addEventListener('click', () => {
    if (!exportModal || !exportContent) {
      return;
    }

    exportContent.value = buildTournamentSummary(data);
    exportModal.style.display = 'block';
  });

  copyButton?.addEventListener('click', async () => {
    if (!exportContent) {
      return;
    }

    await navigator.clipboard.writeText(
      exportContent.value
    );

    copyButton.textContent =
      'Copiado!';

    setTimeout(() => {
      copyButton.textContent =
        'Copiar resultado';
    }, 2000);
  });

  closeButton?.addEventListener('click', () => {
    if (!exportModal) {
      return;
    }

    exportModal.style.display = 'none';
  });
}

function bindWinnerButtons(tournamentFinished: boolean) {
  const winnerButtons = document.querySelectorAll<HTMLButtonElement>('button[data-action="winner"]');

  winnerButtons.forEach((button) => {
    button.addEventListener('click', async () => {
      if (tournamentFinished) return;

      const matchId = Number(button.dataset.matchId);
      const winnerId = Number(button.dataset.winnerId);
      const currentWinnerId = Number(button.dataset.currentWinnerId || '0');

      if (currentWinnerId && currentWinnerId !== winnerId) {
        const confirmed = window.confirm(
          'Essa batalha já possui vencedor. Deseja alterar?'
        );

        if (!confirmed) return;
      }

      const updatedData = await window.battleManager.setMatchWinner(matchId, winnerId);
      renderApp(updatedData, false);
    });
  });
}

async function init() {
  const data = await window.battleManager.getTournamentData();
  renderApp(data, data.tournament === null);
}

init();