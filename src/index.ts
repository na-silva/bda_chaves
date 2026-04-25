//varios imports 
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import {
  createTestTournament,
  createTournamentWithParticipants,
  getTournamentData,
  resetTestData,
  setMatchWinner,
} from './participants';
import {
  saveTournamentBackup,
} from './backup';
import {
  exportTournamentResult,
} from './resultsExporter';
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

if (require('electron-squirrel-startup')) {
  app.quit();
}
const createWindow = (): void => {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  let canClose = false;

mainWindow.on('close', (event) => {
  if (canClose) {
    return;
  }

  event.preventDefault();

  const result = dialog.showMessageBoxSync(mainWindow, {
    type: 'warning',

    buttons: ['Voltar', 'Fechar app'],

    defaultId: 0,

    cancelId: 0,

    title: 'Fechar aplicativo',

    message:
      'Tem certeza que deseja fechar o aplicativo?\n\nIsso pode interromper um torneio em andamento.',
  });

  if (result === 1) {
    canClose = true;
    mainWindow.close();
  }
});
  // mainWindow.webContents.openDevTools();
};

ipcMain.handle('generate-test-tournament', async () => {
  resetTestData();
  createTestTournament();
  return getTournamentData();
});

ipcMain.handle(
  'create-manual-tournament',
  async (_event, payload: { tournamentName: string; participantNames: string[] }) => {
    resetTestData();
    createTournamentWithParticipants(payload.tournamentName, payload.participantNames);
    const data =
  getTournamentData();

saveTournamentBackup(data);

return data;
  }
);

ipcMain.handle('get-tournament-data', async () => {
  return getTournamentData();
});

ipcMain.handle(
  'set-match-winner',
  async (_event, payload: { matchId: number; winnerId: number }) => {
    setMatchWinner(payload.matchId, payload.winnerId);
    const data =
  getTournamentData();

saveTournamentBackup(data);
      if (
        data.tournament?.status
        === 'finished'
      ) {
        exportTournamentResult(data);
      }

return data;
  }
);

app.whenReady().then(() => {
  console.log('Aplicação iniciada');
  createWindow();
});