import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from 'react';
import { GameStateProvider, useGameState } from './GameStateProvider';
import { RoomMembersProvider, useRoomMembers } from './RoomMembersProvider';
import { CardsInGameProvider, useCardsInGame } from './CardsInGameProvider';
import type { Room, Card, RoomSettings } from '@/core/game/types';
import { roomsService } from '@/services/supabase/rooms';
import { PLAYER_STATUS } from '@/core/game/constants';

interface RoomContextType {
  completeSetup: (cardId: string) => Promise<void>;
  startSpeaking: () => Promise<void>;
  finishSpeaking: () => Promise<void>;
  handleCardSelection: (cardId: string) => Promise<void>;
  initiateSpeakingPhase: () => Promise<void>;
  dealCards: (playerId: string) => Promise<Card[]>;

  canStartDrawCards: boolean;
  canStartChoosing: boolean;
  currentSpeakerHasStarted: boolean;
  isActiveSpeaker: boolean;
  isSetupComplete: boolean;
  isCreator: boolean;
  startNextRound: (settings: Partial<RoomSettings>) => Promise<void>;
  room: Room | null;  // TODO: is this a good idea to pass room around?
}

const RoomContext = createContext<RoomContextType | null>(null);

interface RoomProviderProps {
  room: Room;
  children: ReactNode;
}

function RoomProviderInner({ room, children }: { room: Room; children: ReactNode }) {
  const {
    phase,
    activePlayerId,
    setPhase,
    setActivePlayer,
    completeRound,
  } = useGameState();

  const {
    members,
    currentMember,
    isAllMembersReady,
    updateMemberStatus,
    markMemberAsSpoken,
  } = useRoomMembers();

  const {
    cardState,
    dealCardsToPlayer,
    moveCardsToDiscard,
    markCardAsSelected, 
    emptyPlayerHand
  } = useCardsInGame();

  const [currentSpeakerHasStarted, setCurrentSpeakerHasStarted] = useState(false);
  // Flag to signal that finishSpeaking has completed its database and state updates
  const [finishSpeakingPending, setFinishSpeakingPending] = useState(false);

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
    currentMemberId === activePlayerId &&
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
  const completeSetup = useCallback(
    async (cardId: string) => {
      if (!currentMemberId || phase !== 'setup') return;
      try {
        const cardsNotChosenIds = currentMemberPlayerHand 
        ? currentMemberPlayerHand.filter( c => c !== cardId)
        : [];
              
        await Promise.all([
          updateMemberStatus(currentMemberId, PLAYER_STATUS.BROWSING),
          moveCardsToDiscard(cardsNotChosenIds),
          markCardAsSelected(cardId, currentMemberId),
        ]);
      } catch (error) {
        console.error('Failed to complete setup:', error);
        throw error;
      }
    },
    [
      currentMemberId,
      phase,
      currentMemberPlayerHand,
      updateMemberStatus,
      moveCardsToDiscard,
      markCardAsSelected,
    ]
  );

  const finishSpeaking = useCallback(async () => {
    if (!currentMemberId || !isActiveSpeaker) return;
    try {
      await Promise.all([
        updateMemberStatus(currentMemberId, PLAYER_STATUS.LISTENING),
        markMemberAsSpoken(currentMemberId, true), 
        emptyPlayerHand(currentMemberId)
      ]);
      setFinishSpeakingPending(true);
    } catch (error) {
      console.error('Failed to finish speaking:', error);
      throw error;
    }
  }, [
    currentMemberId,
    isActiveSpeaker,
    currentMemberSelectedCardId,
    updateMemberStatus,
    markMemberAsSpoken,
    emptyPlayerHand
  ]);

  // after async updates of finishSpeaking and states have been re-rendered
  // we now get and set next speaker
  useEffect(() => {
    if (finishSpeakingPending) {
      const nextSpeaker = getRandomNotSpokenMember(); 
      if (nextSpeaker) {
        setActivePlayer(nextSpeaker.id)
        .then(() =>
          console.log(`finishSpeaking: set next speaker. Members status: ${JSON.stringify(members)}`)
        )
        .catch((err) => console.error('Error setting next speaker', err));
      } else {
        completeRound();
      }
      // reset flag
      setFinishSpeakingPending(false);
    }
  }, [
    finishSpeakingPending, 
    members,
    getRandomNotSpokenMember, 
    setActivePlayer, 
    completeRound
  ]);

  const startSpeaking = useCallback(async () => {
    if (!currentMemberId || phase !== 'speaking') return;
    try {
      await Promise.all([
        updateMemberStatus(currentMemberId, PLAYER_STATUS.SPEAKING),
        ...members
          .filter((m) => m.id !== currentMemberId)
          .map((m) => updateMemberStatus(m.id, PLAYER_STATUS.LISTENING)),
      ]);
      setCurrentSpeakerHasStarted(true);
    } catch (error) {
      console.error('Failed to start speaking:', error);
      throw error;
    }
  }, [
    currentMemberId,
    phase,
    members,
    updateMemberStatus,
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
      await Promise.all([setPhase('speaking'), setActivePlayer(firstSpeaker.id)]);
    } catch (error) {
      console.error('Failed to initiate speaking phase:', error);
      throw error;
    }
  }, [
    currentMemberId,
    isCreator,
    isSetupComplete,
    getRandomNotSpokenMember,
    setPhase,
    setActivePlayer,
  ]);

  const handleCardSelection = useCallback(
    async (cardId: string) => {
      if (!currentMemberId || phase !== 'setup') return;
      await completeSetup(cardId);
    },
    [currentMemberId, phase, completeSetup]
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
      // Reset player statuses and spoken flags
      await Promise.all(
        members.map(member => Promise.all([
          updateMemberStatus(member.id, PLAYER_STATUS.CHOOSING),
          markMemberAsSpoken(member.id, false), 
          emptyPlayerHand(member.id)
        ]))
      );
      
      // Update game state to start new round
      await setPhase('setup');
      
      // Update room settings for the next round
      await roomsService.updateSettings(room.id, {
        ...room.settings,
        ...settings
      });
      
    } catch (error) {
      console.error('Failed to start next round:', error);
      throw error;
    }
  }, [
    currentMemberId,
    isCreator,
    members,
    updateMemberStatus,
    markMemberAsSpoken,
    emptyPlayerHand,
    setPhase,
    room
  ]);

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
    room
  };

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}

export function RoomProvider({ room, children }: RoomProviderProps) {
  return (
    <RoomMembersProvider roomId={room.id}>
      <CardsInGameProvider roomId={room.id}>
        <GameStateProvider roomId={room.id} gameStateId={room.game_state_id!}>
          <RoomProviderInner room={room}>{children}</RoomProviderInner>
        </GameStateProvider>
      </CardsInGameProvider>
    </RoomMembersProvider>
  );
}

export function useRoom() {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within RoomProvider');
  }
  return context;
}