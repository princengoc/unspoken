// Provide coordinate across all context providers
// and turn them into convenient game logic functions for components
// We use this when we have joined a room already
// Components that deal with joining/creation of rooms use the useRoomAPI hook. 
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from 'react';
import { useRoom } from './RoomProvider';
import { RoomMembersProvider, useRoomMembers } from './RoomMembersProvider';
import { CardsInGameProvider, useCardsInGame } from './CardsInGameProvider';
import { ExchangesProvider } from './ExchangesProvider';
import type { Card, RoomSettings, GamePhase } from '@/core/game/types';
import { PLAYER_STATUS } from '@/core/game/constants';

interface FullRoomContextType {
  completeSetup: (cardId: string) => Promise<void>;
  startSpeaking: () => Promise<void>;
  finishSpeaking: () => Promise<void>;
  handleCardSelection: (cardId: string) => Promise<void>;
  initiateSpeakingPhase: () => Promise<void>;
  dealCards: (playerId: string) => Promise<Card[]>;

  // TODO: overhaul the transition to be more specific to the front-end button
  // eg: finishSpeaking: --> get next speaker, update everyone's statuses, broadcast. Seems like should be done SERVER-SIDE. 
  // TODO: simplify these booleans as needed for the Setup/Speaking/Endgame components
  canStartDrawCards: boolean;
  canStartChoosing: boolean;
  currentSpeakerHasStarted: boolean;
  isActiveSpeaker: boolean;
  isSetupComplete: boolean;
  isCreator: boolean;
  startNextRound: (settings: Partial<RoomSettings>) => Promise<void>;
}

const FullRoomContext = createContext<FullRoomContextType | null>(null);

interface FullRoomProviderProps {
  roomId: string;
  children: ReactNode;
}

function FullRoomProviderInner({ children }: {children: ReactNode}) {
  const { room, updateRoom, finishSpeaking: roomFinishSpeaking, startNextRound: roomStartNextRound } = useRoom();

  if (!room) return; 

  const {
    members,
    currentMember,
    isAllMembersReady,
    updateMember,
    resetAllPlayers, 
    updateAllExcept
  } = useRoomMembers();

  const {
    cardState,
    dealCardsToPlayer,
    completePlayerSetup,
    emptyPlayerHand
  } = useCardsInGame();

  const [currentSpeakerHasStarted, setCurrentSpeakerHasStarted] = useState(false);
  // Flag to signal that finishSpeaking has completed its database and state updates
  const [startNextRoundPending, setStartNextRoundPending] = useState(false);

  // Destructure currentMember values for easier dependency management
  const currentMemberId = currentMember?.id;
  const currentMemberStatus = currentMember?.status;
  const currentMemberSelectedCardId = currentMemberId && cardState.selectedCards[currentMemberId] !== undefined
    ? cardState.selectedCards[currentMemberId]
    : null;

    const currentMemberPlayerHand = currentMemberId && cardState.playerHands[currentMemberId] !== undefined
    ? cardState.playerHands[currentMemberId]
    : null;
  
  // can start choosing if there are cards in hand
  const canStartChoosing = Array.isArray(currentMemberPlayerHand) && currentMemberPlayerHand.length > 0 
    && currentMemberStatus === PLAYER_STATUS.CHOOSING;
  
  // can draw cards if hand is empty or null
  const canStartDrawCards = (!currentMemberPlayerHand || currentMemberPlayerHand.length === 0) 
    && currentMemberStatus === PLAYER_STATUS.CHOOSING;  

  const isActiveSpeaker =
    currentMemberId === room.active_player_id &&
    !currentMember?.hasSpoken;

  const isSetupComplete = isAllMembersReady;

  const isCreator = currentMemberId === room.created_by;

  /**
   * Helper: returns a random member who has not yet spoken.
   * If every member has spoken, returns null.
   */
  const getRandomNotSpokenMember = useCallback(() => {
    const notSpokenMembers = members.filter((m) => !m.hasSpoken);
    if (notSpokenMembers.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * notSpokenMembers.length);
    return notSpokenMembers[randomIndex];
  }, [members]);

  // complete setup phase for currentMember (they chose a card)
  // TODO: remove the callback, remove currentMemberId just use user.id from useAuth, and room.phase is checked server-sid
  const completeSetup = useCallback(
    async (cardId: string) => {
      if (!currentMemberId || room.phase !== 'setup') return;
      try {
        await completePlayerSetup(currentMemberId, cardId);
      } catch (error) {
        console.error('Failed to complete setup:', error);
        throw error;
      }
    },
    [currentMemberId, room?.phase, completePlayerSetup]
  );

  // TODO: simplify callback: only dependent on user.id
  const finishSpeaking = useCallback(async () => {
    if (!currentMemberId || !isActiveSpeaker) {
      console.log(`Invalid finishSpeaking call: member ID ${currentMemberId}, isActiveSpeaker ${isActiveSpeaker}`);
      return;
    }
    try {
      await roomFinishSpeaking(currentMemberId);
    } catch (error) {
      console.error('Failed to finish speaking:', error);
      throw error;
    }
  }, [currentMemberId, isActiveSpeaker, roomFinishSpeaking]);

  const startSpeaking = useCallback(async () => {
    if (!currentMemberId || room.phase !== 'speaking') return;
    try {
      await updateAllExcept(currentMemberId, PLAYER_STATUS.LISTENING, PLAYER_STATUS.SPEAKING);
      setCurrentSpeakerHasStarted(true);
    } catch (error) {
      console.error('Failed to start speaking:', error);
      throw error;
    }
  }, [
    currentMemberId,
    members,
    updateAllExcept,
    setCurrentSpeakerHasStarted,    
  ]);

  const initiateSpeakingPhase = useCallback(async () => {
    if (!currentMemberId || !isCreator) {
      console.warn('Only the room creator can start the speaking phase.');
      return;
    }
    if (!isSetupComplete) {
      console.warn('Not all members are ready.');
      return;
    }
    const firstSpeaker = getRandomNotSpokenMember();
    if (!firstSpeaker) {
      console.error('No available members to speak.');
      return;
    }
    try {
      await updateRoom({
        phase: 'speaking' as GamePhase, 
        active_player_id: firstSpeaker.id
      })
    } catch (error) {
      console.error(`Failed to initiate speaking phase: ${JSON.stringify(error)}`);
      throw error;
    }
  }, [
    currentMemberId,
    isCreator,
    isSetupComplete,
    getRandomNotSpokenMember,
  ]);

  const handleCardSelection = useCallback(
    async (cardId: string) => {
      if (!currentMemberId || room.phase !== 'setup') return;
      await completeSetup(cardId);
    },
    [currentMemberId, room.phase, completeSetup]
  );

  // Update the handleDealCards function to use new dealCardsToPlayer
  const handleDealCards = useCallback(async (playerId: string) => {
    try {
      const dealtCards = await dealCardsToPlayer(playerId);
      return dealtCards;
    } catch (error) {
      console.error('Failed to deal cards:', error);
      throw error;
    }
  }, [dealCardsToPlayer]);

  // Generalized method to start next round (regular or encore)
  const startNextRound = useCallback(async (settings: Partial<RoomSettings>): Promise<void> => {
    if (!currentMemberId || !isCreator) {
      console.warn('Only the room creator can start the next round.');
      return;
    }
  
    try {
      await roomStartNextRound(currentMemberId, settings);
    } catch (error) {
      console.error('Failed to start next round:', error);
      throw error;
    }
  }, [currentMemberId, isCreator, roomStartNextRound]);

  const value = {
    completeSetup,
    startSpeaking,
    finishSpeaking,
    handleCardSelection,
    initiateSpeakingPhase,
    dealCards: handleDealCards,
    canStartDrawCards,
    canStartChoosing,
    currentSpeakerHasStarted,
    isActiveSpeaker,
    isSetupComplete,
    isCreator, 
    startNextRound, 
  };

  return <FullRoomContext.Provider value={value}>{children}</FullRoomContext.Provider>;
}

export function FullRoomProvider({ roomId, children }: FullRoomProviderProps) {
  // get the room from RoomProvider and then subsequent contexts can just refer to the room state via useRoom()
  return (
    <RoomMembersProvider roomId={roomId}>
      <CardsInGameProvider roomId={roomId}>
        <ExchangesProvider roomId={roomId}>
          <FullRoomProviderInner>
            {children}
          </FullRoomProviderInner>
        </ExchangesProvider>
      </CardsInGameProvider>
    </RoomMembersProvider>
  );
}

export function useFullRoom() {
  const context = useContext(FullRoomContext);
  if (!context) {
    throw new Error('useFullRoom must be used within FullRoomProvider');
  }
  return context;
}