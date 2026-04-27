export {};
let timerSeconds = 45;
let currentSeconds = timerSeconds;
let timerInterval: number | null = null;

type MatchRow = {
  id: number;
  round: string;
  match_order: number;
  winner_id: number | null;
  participant1_id: number;
  participant1_name: string;
  participant2_id: number;
  participant2_name: string;
  win_type: string;
};

type TournamentData = {
  tournament: {
    id: number;
    name: string;
    status: string;
    created_at: string;
    battle_type: string;
  } | null;
  matches: MatchRow[];
  champion: {
  id: number;
  participant_key: string;
  name: string;
} | null;
};

declare global {
  interface Window {
    battleManager: {
      generateTestTournament: () => Promise<TournamentData>;

      createManualTournament: (
        tournamentName: string,
        participantNames: string[],
        battleType: string
      ) => Promise<TournamentData>;

      getTournamentData: () => Promise<TournamentData>;

      setMatchWinner: (
        matchId: number,
        winnerId: number,
        winType: string
      ) => Promise<TournamentData>;
    };
  }
}

function loadTimerValue() {
  const saved = localStorage.getItem(
    'battle-manager-timer'
  );

  if (!saved) {
    timerSeconds = 45;
    currentSeconds = 45;
    return;
  }

  const parsed = Number(saved);

  if (Number.isNaN(parsed)) {
    timerSeconds = 45;
    currentSeconds = 45;
    return;
  }

  timerSeconds = parsed;
  currentSeconds = parsed;
}

function saveTimerValue() {
  localStorage.setItem(
    'battle-manager-timer',
    String(timerSeconds)
  );
}

function formatTimer(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${String(mins).padStart(2, '0')}:${String(
    secs
  ).padStart(2, '0')}`;
}

function updateTimerDisplay() {
  const display =
    document.getElementById(
      'timer-display'
    );

  if (!display) {
    return;
  }

  display.textContent =
    formatTimer(currentSeconds);

  if (currentSeconds <= 5) {
  const shouldBlink =
    currentSeconds % 2 === 0;

  display.setAttribute(
    'style',
    `
      font-size:32px;

      font-weight:bold;

      color:
        ${
          shouldBlink
            ? '#ff2222'
            : '#ffffff'
        };

      background:
        ${
          shouldBlink
            ? '#3a0000'
            : 'transparent'
        };

      border-radius:12px;

      padding:8px;

      min-width:120px;

      text-align:center;
    `
  );

  return;
}

if (currentSeconds <= 10) {
  display.setAttribute(
    'style',
    `
      font-size:32px;
      font-weight:bold;
      color:#ff4d4d;
      min-width:120px;
      text-align:center;
    `
  );

  return;
}

  display.setAttribute(
    'style',
    `
      font-size:32px;
      font-weight:bold;
      color:white;
      min-width:120px;
      text-align:center;
    `
  );
}

function stopTimer() {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function startTimer() {
  if (timerInterval !== null) {
    return;
  }

  timerInterval = window.setInterval(
    () => {
      if (currentSeconds <= 0) {
        stopTimer();
        return;
      }

      currentSeconds -= 1;
      updateTimerDisplay();
    },
    1000
  );
}

function resetTimer() {
  stopTimer();

  currentSeconds = timerSeconds;

  updateTimerDisplay();
}

function renderTimerControls() {
  return `
    <div
      style="
        display:flex;
        align-items:center;
        gap:10px;

        background:#151515;
        border:1px solid #333;

        padding:12px;
        border-radius:14px;
      "
    >
      <button
        id="timer-minus"

        style="
          width:40px;
          height:40px;
          border:none;
          border-radius:8px;
          cursor:pointer;
          font-size:20px;
        "
      >
        -
      </button>

      <div
        id="timer-display"

        style="
          font-size:32px;
          font-weight:bold;
          color:white;
          min-width:120px;
          text-align:center;
        "
      >
        00:45
      </div>

      <button
        id="timer-plus"

        style="
          width:40px;
          height:40px;
          border:none;
          border-radius:8px;
          cursor:pointer;
          font-size:20px;
        "
      >
        +
      </button>

      <button
        id="timer-start"

        style="
          padding:10px 14px;
          border:none;
          border-radius:8px;
          cursor:pointer;
          font-weight:bold;
        "
      >
        Iniciar
      </button>

      <button
        id="timer-pause"

        style="
          padding:10px 14px;
          border:none;
          border-radius:8px;
          cursor:pointer;
        "
      >
        Pausar
      </button>

      <button
        id="timer-reset"

        style="
          padding:10px 14px;
          border:none;
          border-radius:8px;
          cursor:pointer;
        "
      >
        Reset
      </button>
    </div>
  `;
}

function bindTimerControls() {
  const minusButton =
    document.getElementById(
      'timer-minus'
    );

  const plusButton =
    document.getElementById(
      'timer-plus'
    );

  const startButton =
    document.getElementById(
      'timer-start'
    );

  const pauseButton =
    document.getElementById(
      'timer-pause'
    );

  const resetButton =
    document.getElementById(
      'timer-reset'
    );

  minusButton?.addEventListener(
    'click',
    () => {
      if (timerSeconds <= 5) {
        return;
      }

      timerSeconds -= 5;
      currentSeconds = timerSeconds;

      saveTimerValue();
      updateTimerDisplay();
    }
  );

  plusButton?.addEventListener(
    'click',
    () => {
      timerSeconds += 5;
      currentSeconds = timerSeconds;

      saveTimerValue();
      updateTimerDisplay();
    }
  );

  startButton?.addEventListener(
    'click',
    () => {
      startTimer();
    }
  );

  pauseButton?.addEventListener(
    'click',
    () => {
      stopTimer();
    }
  );

  resetButton?.addEventListener(
    'click',
    () => {
      resetTimer();
    }
  );

  updateTimerDisplay();
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
    <div style="background:
  linear-gradient(
    180deg,
    rgba(25,15,35,0.95),
    rgba(10,10,15,0.95)
  );border:1px solid rgba(57,255,20,0.55);border-radius:12px;padding:14px;min-width:240px;box-shadow:
  0 0 10px rgba(57,255,20,0.12);">
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
            <div
        style="
          display:flex;
          justify-content:flex-end;
          margin-bottom:10px;
          font-size:12px;
          color:#aaa;
        "
      >
        <label
          style="
            display:flex;
            align-items:center;
            gap:6px;
            cursor:pointer;
          "
        >
          <input
            type="checkbox"
            class="rounds-checkbox"
            data-match-id="${match.id}"
          />

          Vitória por 2x1
        </label>
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

function getRoundSpacing(
  roundTitle: string
) {
  switch (roundTitle) {
    case 'Oitavas':
      return {
        gap: 18,
        marginTop: 0,
      };

    case 'Quartas':
      return {
        gap: 90,
        marginTop: 60,
      };

    case 'Semifinal':
      return {
        gap: 220,
        marginTop: 180,
      };

    case 'Final':
      return {
        gap: 0,
        marginTop: 620,
      };

    default:
      return {
        gap: 20,
        marginTop: 0,
      };
  }
}

function buildTreeColumn(
  title: string,

  matches: MatchRow[],

  tournamentFinished: boolean
) {
  if (matches.length === 0) {
    return '';
  }

  const spacing =
    getRoundSpacing(title);

  return `
    <div
      style="
        min-width: 290px;

        display: flex;

        flex-direction: column;

        gap: ${spacing.gap}px;

        margin-top:
          ${spacing.marginTop}px;
      "
    >
      <h2
        color:#39ff14;

text-shadow:
  0 0 8px rgba(57,255,20,0.55);

border-bottom:
  2px solid #b026ff;

padding-bottom:6px;

width:max-content;

letter-spacing:1px;
        "
      >
        ${title}
      </h2>

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
        `Resultado: ${match.win_type || '2x0'}`,
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
    <div
      style="
        margin-bottom:30px;

        padding:24px;

        border-radius:16px;

        background:
          linear-gradient(
            135deg,
            #ffd700,
            #8b5a00
          );

        color:#1a1200;

        border:
          1px solid #ffd700;

        box-shadow:
          0 0 18px rgba(255,215,0,0.45),
          0 0 40px rgba(255,180,0,0.18);
      "
    >
      <div
        style="
          font-size:14px;

          font-weight:bold;

          letter-spacing:1px;
        "
      >
        CAMPEÃO
      </div>

      <div
        style="
          font-size:38px;

          font-weight:800;

          margin-top:8px;

          text-shadow:
            0 0 10px rgba(255,255,255,0.35);
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
<div
  style="
    margin-bottom:20px;
    display:flex;
    gap:20px;
  "
>
  <label>
    <input
      type="radio"
      name="battle-type"
      value="sangue"
      checked
    />

    Sangue
  </label>

  <label>
    <input
      type="radio"
      name="battle-type"
      value="conhecimento"
    />

    Conhecimento
  </label>
</div>
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
  <div
  style="
    padding:30px;

    font-family:Arial;

    color:white;

    min-height:100vh;

    background:
      radial-gradient(
        circle at top left,
        rgba(120,0,180,0.18),
        transparent 30%
      ),

      radial-gradient(
        circle at bottom right,
        rgba(0,255,120,0.08),
        transparent 25%
      ),

      #05050a;
  "
>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-bottom:30px;color:#39ff14;text-shadow:0 0 14px rgba(57,255,20,0.45);">
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

        ${renderTimerControls()}

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
  bindTimerControls();
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
    const battleTypeInput = document.querySelector<HTMLInputElement>('input[name="battle-type"]:checked');
    const battleType = battleTypeInput?.value || 'sangue';

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
        participantNames,
        battleType
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
  const exportButton =
    document.getElementById('export-button');

  const exportModal =
    document.getElementById('export-modal');

  const exportContent =
    document.getElementById(
      'export-content'
    ) as HTMLTextAreaElement | null;

  const closeButton =
    document.getElementById(
      'close-export-modal'
    );

  const copyButton =
    document.getElementById(
      'copy-export-button'
    );

  exportButton?.addEventListener(
    'click',
    () => {
      if (
        !exportModal
        || !exportContent
      ) {
        return;
      }

      exportContent.value =
        buildTournamentSummary(data);

      exportModal.style.display =
        'block';
    }
  );

  closeButton?.addEventListener(
    'click',
    () => {
      if (!exportModal) {
        return;
      }

      exportModal.style.display =
        'none';
    }
  );

  copyButton?.addEventListener(
    'click',
    async () => {
      if (!exportContent) {
        return;
      }

      await navigator.clipboard
        .writeText(
          exportContent.value
        );

      copyButton.textContent =
        'Copiado!';

      setTimeout(() => {
        if (!copyButton) {
          return;
        }

        copyButton.textContent =
          'Copiar resultado';
      }, 2000);
    }
  );

  document.addEventListener(
    'keydown',
    (event) => {
      if (event.key !== 'Escape') {
        return;
      }

      if (!exportModal) {
        return;
      }

      if (
        exportModal.style.display
        === 'block'
      ) {
        exportModal.style.display =
          'none';
      }
    }
  );
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
const roundsCheckbox =
  document.querySelector(
    `.rounds-checkbox[data-match-id="${matchId}"]`
  ) as HTMLInputElement;

console.log(
  'checkbox',
  roundsCheckbox
);

console.log(
  'checked',
  roundsCheckbox?.checked
);

const winType =
  roundsCheckbox?.checked
    ? '2x1'
    : '2x0';

console.log(
  'winType',
  winType
);

      const updatedData = await window.battleManager.setMatchWinner(matchId, winnerId, winType);
      renderApp(updatedData, false);
    });
  });
}

async function init() {
  loadTimerValue();
  const data = await window.battleManager.getTournamentData();
  renderApp(data, data.tournament === null);
}

init();