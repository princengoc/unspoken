// src/lib/supabase/types.ts
export type Card = {
    id: string;
    content: string;
    category: string;
    depth: 1 | 2 | 3;
    created_at?: string;
    contributor_id?: string;
  }
  
  export type GameSession = {
    id: string;
    current_phase: 'setup' | 'speaking' | 'listening';
    active_player_id: string;
    created_at: string;
    cards_in_play: string[];  // Card IDs
    discard_pile: string[];   // Card IDs
  }
  
  export type Exchange = {
    id: string;
    session_id: string;
    requester_id: string;
    recipient_id: string;
    offered_card_id: string;
    requested_card_id: string;
    status: 'pending' | 'accepted' | 'rejected';
    created_at: string;
  }
  