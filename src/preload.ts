import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('battleManager', {
  generateTestTournament: () => ipcRenderer.invoke('generate-test-tournament'),
  createManualTournament: (tournamentName: string, participantNames: string[]) =>
    ipcRenderer.invoke('create-manual-tournament', {
      tournamentName,
      participantNames,
    }),
  getTournamentData: () => ipcRenderer.invoke('get-tournament-data'),
  setMatchWinner: (matchId: number, winnerId: number) =>
    ipcRenderer.invoke('set-match-winner', { matchId, winnerId }),
});