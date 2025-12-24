export type Database = {
  public: {
    Tables: {
      mysteries: {
        Row: {
          id: string;
          title: string;
          description: string;
          image_path: string | null;
          innocent_words: string[];
          guilty_words: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          image_path?: string | null;
          innocent_words: string[];
          guilty_words: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          image_path?: string | null;
          innocent_words?: string[];
          guilty_words?: string[];
          created_at?: string;
        };
      };
      character_sheets: {
        Row: {
          id: string;
          mystery_id: string;
          role: 'investigator' | 'guilty' | 'innocent';
          dark_secret: string;
          alibi: string;
          image_path: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          mystery_id: string;
          role: 'investigator' | 'guilty' | 'innocent';
          dark_secret: string;
          alibi: string;
          image_path?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          mystery_id?: string;
          role?: 'investigator' | 'guilty' | 'innocent';
          dark_secret?: string;
          alibi?: string;
          image_path?: string | null;
          created_at?: string;
        };
      };
      game_sessions: {
        Row: {
          id: string;
          status: 'lobby' | 'playing' | 'completed';
          join_code: string;
          current_mystery_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          status?: 'lobby' | 'playing' | 'completed';
          join_code: string;
          current_mystery_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          status?: 'lobby' | 'playing' | 'completed';
          join_code?: string;
          current_mystery_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      players: {
        Row: {
          id: string;
          session_id: string;
          name: string;
          status: 'active' | 'quit' | 'accused';
          last_heartbeat: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          name: string;
          status?: 'active' | 'quit' | 'accused';
          last_heartbeat?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          name?: string;
          status?: 'active' | 'quit' | 'accused';
          last_heartbeat?: string;
          created_at?: string;
        };
      };
      player_assignments: {
        Row: {
          id: string;
          session_id: string;
          player_id: string;
          sheet_id: string;
          mystery_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          player_id: string;
          sheet_id: string;
          mystery_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          player_id?: string;
          sheet_id?: string;
          mystery_id?: string;
          created_at?: string;
        };
      };
      rounds: {
        Row: {
          id: string;
          session_id: string;
          mystery_id: string;
          investigator_player_id: string;
          accused_player_id: string;
          was_correct: boolean;
          accusation_timestamp: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          mystery_id: string;
          investigator_player_id: string;
          accused_player_id: string;
          was_correct: boolean;
          accusation_timestamp?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          mystery_id?: string;
          investigator_player_id?: string;
          accused_player_id?: string;
          was_correct?: boolean;
          accusation_timestamp?: string;
        };
      };
      player_ready_states: {
        Row: {
          session_id: string;
          player_id: string;
          mystery_id: string | null;
          is_ready: boolean;
          updated_at: string;
        };
        Insert: {
          session_id: string;
          player_id: string;
          mystery_id?: string | null;
          is_ready?: boolean;
          updated_at?: string;
        };
        Update: {
          session_id?: string;
          player_id?: string;
          mystery_id?: string | null;
          is_ready?: boolean;
          updated_at?: string;
        };
      };
    };
  };
};
