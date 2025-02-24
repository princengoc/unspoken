export const DEFAULT_GAME_CONFIG = {
  allowExchanges: true,
  allowRipples: true,
  roundsPerPlayer: 1,
  cardSelectionTime: 120, // seconds
  baseSharingTime: 300   // seconds
} as const;

export const DEFAULT_TOTAL_ROUNDS = 1;
export const INITIAL_CARDS_PER_PLAYER = 3;

export type ReactionIcon = 'sparkles' | 'heart' | 'bulb';

export const REACTIONS = [
  { id: 'inspiring', label: 'Inspiring', icon: 'sparkles' as ReactionIcon },
  { id: 'resonates', label: 'Resonates', icon: 'heart' as ReactionIcon },
  { id: 'metoo', label: 'Me too', icon: 'bulb' as ReactionIcon }
] as const;

export const ERRORS = {
  INVALID_PHASE: 'Invalid game phase transition',
  INVALID_PLAYER: 'Invalid player action',
  INVALID_CARD: 'Invalid card operation',
  INVALID_STATUS: 'Invalid player status transition',
  ROUND_ERROR: 'Invalid round operation',
  SPEAK_ORDER_ERROR: 'Invalid speaking order operation'
} as const;