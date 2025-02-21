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
  const { room, updateRoom } = useRoom();

  if (!room) return; 

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
  const completeSetup = useCallback(
    async (cardId: string) => {
      if (!currentMemberId || room.phase !== 'setup') return;
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
      currentMemberPlayerHand,
      room.phase,
      updateMemberStatus,
      moveCardsToDiscard,
      markCardAsSelected,
    ]
  );

  const finishSpeaking = useCallback(async () => {
    if (!currentMemberId || !isActiveSpeaker) {
      console.log(`Calling finishSpeaking but member ID is ${currentMemberId} and ${isActiveSpeaker} \n
        Members status: ${members}
        `);
      return;
    }
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
        updateRoom({active_player_id: nextSpeaker.id})
        .then(() =>
          {
            console.log(`finishSpeaking: set next speaker. Members status: ${JSON.stringify(members)}`); 
          }
        )
        .catch((err) => console.error(`Error setting next speaker ${JSON.stringify(err)}`));
      } else {
        const updates = {
          phase: 'endgame' as GamePhase, 
          active_player_id: null
        };
        updateRoom(updates)
        .catch((err) => console.error(`Error udpateRoom at endgame ${JSON.stringify(err)}`));
      } 
    }
    // optimistically runs ahead so that we trigger the above async calls only once (even if they fail)
    setFinishSpeakingPending(false); 
  }, [finishSpeakingPending, members, getRandomNotSpokenMember, updateRoom]);

  const startSpeaking = useCallback(async () => {
    if (!currentMemberId || room.phase !== 'speaking') return;
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
      // Reset player statuses and spoken flags
      console.log(`Members before update: ${JSON.stringify(members)}`);
      await Promise.all([
        ...members.flatMap(member => [
          updateMemberStatus(member.id, PLAYER_STATUS.CHOOSING),
          markMemberAsSpoken(member.id, false),
          emptyPlayerHand(member.id)
        ]),
        // Update room settings for the next round
        updateRoom(settings)
      ]);
      setStartNextRoundPending(true);
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
    updateRoom
  ]);

  useEffect(() => {
    if (startNextRoundPending) {
      updateRoom({phase: 'setup' as GamePhase});
      console.log(`Members after startNextRoundPending: ${JSON.stringify(members)}`);
    }
    // reset flag
    setStartNextRoundPending(false);
  }, [startNextRoundPending, updateRoom]);

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