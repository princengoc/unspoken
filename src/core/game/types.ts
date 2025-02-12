import { PLAYER_STATUS } from "./constants";

// Core game types
export type GamePhase = 'setup' | 'speaking';
export type PlayerStatus = (typeof PLAYER_STATUS)[keyof typeof PLAYER_STATUS];


export type Player = {
  id: string;
  username: string | null;
  isOnline: boolean;
  status: PlayerStatus;
  selectedCard?: string; // ID of their chosen card
  hasSpoken: boolean;    // for current round
  speakOrder?: number;   // order in speaking queue
};

export type CardHistory = {
  id: string;
  userId: string;
  cardId: string;
  gameSessionId: string;
  roundNumber: number;
  answeredAt: string;
};

export type GameState = {
  id: string;
  room_id: string;
  phase: GamePhase;
  players: Player[];
  cardsInPlay: Card[];             // Cards chosen during setup
  discardPile: Card[];             // Cards discarded during setup
  currentRound: number;            // Current round number
  totalRounds: number;             // Total rounds to play
  activePlayerId: string | null;   // Current speaker
  isSpeakerSharing: boolean;       // Whether speaker is actively sharing
  playerHands: Record<string, Card[]>
};

export type Exchange = {
  id: string;
  game_state_id: string;
  requester_id: string;
  recipient_id: string;
  offered_card_id: string;
  requested_card_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export type GameAction = {
  type: string;
  payload?: any;
};

export type GameConfig = {
  allowExchanges: boolean;
  allowRipples: boolean;
  roundsPerPlayer: number;
  cardSelectionTime: number;
  baseSharingTime: number;
};


export type Card = {
  id: string;
  content: string;
  category: string;
  depth: 1 | 2 | 3;
  created_at?: string;
  contributor_id?: string;
}

export type Room = {
  id: string;
  passcode: string;
  created_by: string;
  name: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  game_mode: 'irl' | 'remote';
  game_state_id?: string;
  players: Player[];
  settings?: RoomSettings;
}

export type RoomSettings = {
  allow_card_exchanges: boolean;
  allow_ripple_effects: boolean;
  rounds_per_player: number;
  card_selection_time: number;  // in seconds
  base_sharing_time: number;    // in seconds
}

export type RoomInvite = {
  id: string;
  room_id: string;
  passcode: string;
  created_at: string;
  expires_at: string;
  created_by: string;
  is_valid: boolean;
}

// some utility types
export type UniqueCardsById<T extends { id: string }> = Map<string, T>;
export const deduplicateCardsById = (cards: Card[]): Card[] => {
  const uniqueCards = new Map(cards.map(card => [card.id, card]));
  return Array.from(uniqueCards.values());
};
export const mergeCardsWithDeduplication = (existingCards: Card[], newCards: Card[]): Card[] => {
  const uniqueCards = new Map(
    [...existingCards, ...newCards].map(card => [card.id, card])
  );
  return Array.from(uniqueCards.values());
};

export function hasSelected(player: Player): boolean {
  return player.status !== PLAYER_STATUS.CHOOSING && player.selectedCard != null;
}
