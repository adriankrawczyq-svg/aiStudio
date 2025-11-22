
export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface CatMarker {
  id: string;
  x: number; // Normalized 0-1000
  y: number; // Normalized 0-1000
  found: boolean;
  box: BoundingBox;
}

export enum GameState {
  IDLE = 'IDLE',
  GENERATING_IMAGE = 'GENERATING_IMAGE',
  ANALYZING_IMAGE = 'ANALYZING_IMAGE',
  PLAYING = 'PLAYING',
  WON = 'WON',
  GAME_OVER = 'GAME_OVER',
  ERROR = 'ERROR',
  LEADERBOARD = 'LEADERBOARD'
}

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export type ArtStyle = 'MINECRAFT' | 'IMPRESSIONISM' | 'REALISTIC' | 'CARTOON' | 'SKETCH' | 'ABSTRACT';

export interface GameData {
  imageBase64: string;
  cats: CatMarker[];
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  difficulty: string;
  date: string;
}
