import { create } from 'zustand';

export type GamePhase = 'setup' | 'speaking' | 'listening';
export type Card = {
  id: number;
  text: string;
  contributor: string;
};

interface GameState {
  gamePhase: GamePhase;
  currentCard: number;
  isSpeakerSharing: boolean;
  activeReactions: string[];
  isRippled: boolean;
  cards: Card[];
  discardPile: Card[];
  
  // Actions
  setGamePhase: (phase: GamePhase) => void;
  setCurrentCard: (index: number) => void;
  setSpeakerSharing: (isSharing: boolean) => void;
  toggleReaction: (reaction: string) => void;
  toggleRipple: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  gamePhase: 'setup',
  currentCard: 0,
  isSpeakerSharing: false,
  activeReactions: [],
  isRippled: false,
  cards: [
    { id: 1, text: "Share a moment when you felt truly proud of yourself", contributor: 'sarah' },
    { id: 2, text: "What's a small act of kindness that left a lasting impression?", contributor: 'alex' },
    { id: 3, text: "Describe a challenge that helped shape who you are", contributor: 'you' }
  ],
  discardPile: [
    { id: 4, text: "What's a belief you've changed your mind about?", contributor: 'mike' },
    { id: 5, text: "Share a moment of unexpected joy", contributor: 'emma' }
  ],

  // Actions
  setGamePhase: (phase) => set({ gamePhase: phase }),
  setCurrentCard: (index) => set({ currentCard: index }),
  setSpeakerSharing: (isSharing) => set({ isSpeakerSharing: isSharing }),
  toggleReaction: (reaction) => 
    set((state) => ({
      activeReactions: state.activeReactions.includes(reaction)
        ? state.activeReactions.filter(r => r !== reaction)
        : [...state.activeReactions, reaction]
    })),
  toggleRipple: () => set((state) => ({ isRippled: !state.isRippled }))
}));