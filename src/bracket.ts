export type Participant = {
  id: number;
  tournament_id: number;
  name: string;
  nickname: string | null;
};

export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];

  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

export function generateFirstRoundMatches(participants: Participant[]) {
  const shuffled = shuffleArray(participants);
  const matches = [];

  for (let i = 0; i < shuffled.length; i += 2) {
    matches.push({
      round: 'oitavas',
      match_order: i / 2 + 1,
      participant1_id: shuffled[i].id,
      participant2_id: shuffled[i + 1].id,
    });
  }

  return matches;
}