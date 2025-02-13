import React, {
    createContext,
    useContext,
    ReactNode,
    useCallback,
  } from 'react';
  import { GameStateProvider, useGameState } from './GameStateProvider';
  import { RoomMembersProvider, useRoomMembers } from './RoomMembersProvider';
  import type { Room, Card } from '@/core/game/types';
  import { PLAYER_STATUS } from '@/core/game/constants';
  
  interface RoomContextType {
    completeSetup: (cardId: string) => Promise<void>;
    startSpeaking: () => Promise<void>;
    finishSpeaking: () => Promise<void>;
    handleCardSelection: (cardId: string) => Promise<void>;
    initiateSpeakingPhase: () => Promise<void>;
    dealCards: (playerId: string) => Promise<Card[]>;
  
    canStartSpeaking: boolean;
    isActiveSpeaker: boolean;
    isSetupComplete: boolean;
    isCreator: boolean;
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
      moveMultipleCardsToDiscardById,
      completeRound, 
      dealCards
    } = useGameState();
  
    const {
      members,
      currentMember,
      isAllMembersReady,
      updateMemberStatus,
      updateMemberCard,
      updateMemberHand,
      markMemberAsSpoken,
    } = useRoomMembers();
  
    // Destructure currentMember values for easier dependency management.
    const currentMemberId = currentMember?.id;
    const currentMemberStatus = currentMember?.status;
    const currentMemberSelectedCardId = currentMember?.selectedCard;
    const currentMemberPlayerHand = currentMember?.playerHand;
  
    const canStartSpeaking =
      phase === 'speaking' &&
      !currentMember?.hasSpoken &&
      currentMemberId === activePlayerId &&
      currentMemberStatus === PLAYER_STATUS.BROWSING;
  
    const isActiveSpeaker =
      phase === 'speaking' &&
      currentMemberId === activePlayerId &&
      currentMemberStatus === PLAYER_STATUS.SPEAKING;
  
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
  
    // currentMember chose a card in setup phase
    const completeSetup = useCallback(
      async (cardId: string) => {
        if (!currentMemberId || phase !== 'setup') return;
        try {
          const cardsNotChosenIds: string[] = currentMemberPlayerHand
          ?.filter((c: Card) => c.id !== cardId)
          .map((c: Card) => c.id) || [];        
          await Promise.all([
            updateMemberCard(currentMemberId, cardId),
            updateMemberStatus(currentMemberId, PLAYER_STATUS.BROWSING),
            moveMultipleCardsToDiscardById(cardsNotChosenIds);
            // Reset their hands
            updateMemberHand(currentMemberId, []);
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
        updateMemberCard,
        updateMemberStatus
      ]
    );
  
    // Only the room creator can initiate the speaking phase.
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
      room.created_by,
      isSetupComplete,
      getRandomNotSpokenMember,
      setPhase,
      setActivePlayer,
    ]);
  
    // Start speaking by updating the current user's status and setting listeners.
    const startSpeaking = useCallback(async () => {
      if (!currentMemberId || !canStartSpeaking) return;
      try {
        await Promise.all([
          updateMemberStatus(currentMemberId, PLAYER_STATUS.SPEAKING),
          ...members
            .filter((m) => m.id !== currentMemberId)
            .map((m) => updateMemberStatus(m.id, PLAYER_STATUS.LISTENING)),
        ]);
      } catch (error) {
        console.error('Failed to start speaking:', error);
        throw error;
      }
    }, [
      currentMemberId,
      canStartSpeaking,
      members,
      updateMemberStatus,
    ]);
  
    // Finish speaking: mark the current speaker as done and select the next speaker.
    const finishSpeaking = useCallback(async () => {
      if (!currentMemberId || !isActiveSpeaker) return;
      try {
        await Promise.all([
          updateMemberStatus(currentMemberId, PLAYER_STATUS.LISTENING),
          markMemberAsSpoken(currentMemberId, true)
        ]);
        if (currentMemberSelectedCardId) {
          await moveMultipleCardsToDiscardById([currentMemberSelectedCardId]);
        }
        const nextSpeaker = getRandomNotSpokenMember();
        if (nextSpeaker) {
          await setActivePlayer(nextSpeaker.id);
        } else {
          // The round finishes when there is no one left who has not spoken
          await completeRound();
        }
      } catch (error) {
        console.error('Failed to finish speaking:', error);
        throw error;
      }
    }, [
      currentMemberId,
      isActiveSpeaker,
      currentMemberSelectedCardId,
      getRandomNotSpokenMember,
      updateMemberStatus,
      markMemberAsSpoken,
      moveCardToDiscardById,
      setActivePlayer,
      setPhase,
    ]);
  
    const handleCardSelection = useCallback(
      async (cardId: string) => {
        if (!currentMemberId || phase !== 'setup') return;
        await completeSetup(cardId);
      },
      [currentMemberId, phase, completeSetup]
    );

    // Update the handleDealCards function
    const handleDealCards = useCallback(async (playerId: string) => {
      try {
        const dealtCards = await dealCards(playerId);
        // Make sure we update the member's hand in state
        await updateMemberHand(playerId, dealtCards);
        return dealtCards;
      } catch (error) {
        console.error('Failed to deal cards:', error);
        throw error;
      }
    }, [dealCards, updateMemberHand]);    
  
    const value = {
      completeSetup,
      startSpeaking,
      finishSpeaking,
      handleCardSelection,
      initiateSpeakingPhase,
      dealCards: handleDealCards,
      canStartSpeaking,
      isActiveSpeaker,
      isSetupComplete,
      isCreator
    };
  
    return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
  }
  
  export function RoomProvider({ room, children }: RoomProviderProps) {
    return (
      <RoomMembersProvider roomId={room.id}>
        <GameStateProvider roomId={room.id} gameStateId={room.game_state_id!}>
          <RoomProviderInner room={room}>{children}</RoomProviderInner>
        </GameStateProvider>
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
  