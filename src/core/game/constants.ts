export const DEFAULT_GAME_CONFIG = {
  allowExchanges: true,
  allowRipples: true,
  roundsPerPlayer: 3,
  cardSelectionTime: 30, // seconds
  baseSharingTime: 120   // seconds
};

export const INITIAL_CARDS_PER_PLAYER = 3;
export const WILD_CARDS_COUNT = 2;

export type ReactionIcon = 'sparkles' | 'heart' | 'bulb';

export const REACTIONS = [
  { id: 'inspiring', label: 'Inspiring', icon: 'sparkles' as ReactionIcon },
  { id: 'resonates', label: 'Resonates', icon: 'heart' as ReactionIcon },
  { id: 'metoo', label: 'Me too', icon: 'bulb' as ReactionIcon }
] as const;

export const SHARING_STATES = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
} as const;

export const ERRORS = {
  INVALID_PHASE: 'Invalid game phase transition',
  INVALID_PLAYER: 'Invalid player action',
  INVALID_CARD: 'Invalid card operation',
  INVALID_EXCHANGE: 'Invalid exchange operation'
} as const;
