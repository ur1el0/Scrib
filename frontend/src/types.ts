export interface BoardItem {
  id: string;
  row: number;
  col: number;
  letter: string;
  is_wildcard?: boolean;
}

export interface TrayItem {
  id: string;
  letter: string;
}

export interface ScoreData {
  id: number;
  player_name: string;
  score: number;
  words: string[];
  created_at: string;
}
