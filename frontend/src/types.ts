export interface BoardItem {
  row: number;
  col: number;
  letter: string;
}

export interface ScoreData {
  id: number;
  player_name: string;
  score: number;
  words: string[];
  created_at: string;
}
