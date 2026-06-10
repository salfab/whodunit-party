import type { Database } from '@/types/database';

export type CharacterSheet = Database['public']['Tables']['character_sheets']['Row'];
export type Player = Database['public']['Tables']['players']['Row'];
export type AssignedRole = 'investigator' | 'guilty' | 'innocent';

// Only the mystery fields the play screen needs. The full row is deliberately
// not loaded client-side: the word pool partition must stay server-only.
export interface PlayMysteryInfo {
  id: string;
  title: string;
  description: string;
  image_path: string | null;
}

export interface PlayerOption {
  id: string;
  name: string;
  characterName?: string;
  occupation?: string;
}

export interface CharacterWithWords extends CharacterSheet {
  assignedRole: AssignedRole;
  wordsToPlace: string[];
  mystery: PlayMysteryInfo;
  playerIndex: number;
}

export interface PlayerScore {
  id: string;
  name: string;
  score: number;
}

export interface AvailableMystery {
  id: string;
  title: string;
  synopsis?: string;
  author?: string;
  character_count?: number;
  language?: string;
  cover_image_url?: string;
  image_path?: string;
}

export interface AccusationResult {
  wasCorrect: boolean;
  role: string;
  gameComplete: boolean;
  message: string;
  guiltyPlayer?: {
    id: string;
    name: string;
    characterName: string;
    occupation?: string;
    imagePath?: string;
    darkSecret?: string;
    playerIndex: number;
  };
}

export interface SuspectInfo {
  id: string;
  playerName: string;
  characterName: string;
  occupation?: string | null;
  imagePath?: string | null;
}
