import { useGameState } from '@/context/GameStateProvider';
import { useRoomMembers } from '@/context/RoomMembersProvider';
import { useRoom } from '@/context/RoomProvider';
import type { GamePhase, PlayerStatus } from '@/core/game/types';

interface UseGamePhaseReturn {
  // Current state
  phase: GamePhase;
  playerStatus: PlayerStatus;
  currentRound: number;
  totalRounds: number;
  isLoading: boolean;
  isSetupComplete: boolean;

  // Phase-specific operations
  initializeGame: () => Promise<void>;
  startSpeaking: () => Promise<void>;
  finishSpeaking: () => Promise<void>;
  handleCardSelection: (cardId: string) => Promise<void>;
}

export function useGamePhase(): UseGamePhaseReturn {
  const { 
    phase,
    currentRound,
    totalRounds,
  } = useGameState();

  const {
    currentMember
  } = useRoomMembers();

  const {
    isSetupComplete,
    startSpeaking,
    finishSpeaking,
    handleCardSelection,
  } = useRoom();

  // Initialize game state if needed
  const initializeGame = async () => {
    // Note: Most initialization now happens automatically in providers
    // This is kept for any additional setup needed
  };

  return {
    // State
    phase,
    playerStatus: currentMember?.status || 'choosing',
    currentRound,
    totalRounds,
    isLoading: false, // Now handled by providers
    isSetupComplete,

    // Operations
    initializeGame,
    startSpeaking,
    finishSpeaking,
    handleCardSelection,
  };
}