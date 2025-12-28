import type { Database } from '@/types/database';

export type CharacterSheet = Database['public']['Tables']['character_sheets']['Row'];
export type Player = Database['public']['Tables']['players']['Row'];
export type Mystery = Database['public']['Tables']['mysteries']['Row'];

export interface PlayerOption {
  id: string;
  name: string;
  characterName?: string;
  occupation?: string;
}

export interface CharacterWithWords extends CharacterSheet {
  wordsToPlace: string[];
  mystery: Mystery;
}

export interface PlayerScore {
  id: string;
  name: string;
  score: number;
}

export interface AvailableMystery {
  id: string;
  title: string;
  cover_image_url?: string;
}

export interface AccusationResult {
  wasCorrect: boolean;
  role: string;
  gameComplete: boolean;
  message: string;
}
