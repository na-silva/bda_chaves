import { app, BrowserWindow, ipcMain } from 'electron';
import {
  createTestTournament,
  createTournamentWithParticipants,
  getTournamentData,
  resetTestData,
  setMatchWinner,
} from './participants';

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
  mainWindow.webContents.openDevTools();
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
    return getTournamentData();
  }
);

ipcMain.handle('get-tournament-data', async () => {
  return getTournamentData();
});

ipcMain.handle(
  'set-match-winner',
  async (_event, payload: { matchId: number; winnerId: number }) => {
    setMatchWinner(payload.matchId, payload.winnerId);
    return getTournamentData();
  }
);

app.whenReady().then(() => {
  console.log('Aplicação iniciada');
  createWindow();
});