// src/hooks/game/useCardManagement.ts
import { useState } from 'react';
import { gameStatesService } from '@/services/supabase/gameStates';
import { useGameState } from '@/context/GameStateProvider';
import { gameActions } from '@/core/game/actions';
import { hasSelected } from '@/core/game/types';

export function useCardManagement(gameStateId: string | null, userId: string | null) {
  const stateMachine = useGameState();
  const [loading, setLoading] = useState(false);

  // Deals initial cards to the given user.
  const dealInitialCards = async () => {
    if (!gameStateId || !userId) return;
    
    try {
      setLoading(true);
      const cards = await gameStatesService.dealCards(gameStateId, userId);
      
      // Update the state machine with the dealt cards.
      stateMachine.dispatch(gameActions.cardsDealt(userId, cards));
    } catch (error) {
      console.error('Failed to deal cards:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Select a card to add to the pool.
  // Note: Previously, if all players had selected, this would automatically trigger a phase transition.
  // With the new design, that transition is manually triggered by the room creator.
  const selectCardForPool = async (playerId: string, cardId: string) => {
    if (!gameStateId) return;
  
    try {
      const currentState = stateMachine.getState();
      
      // Prevent duplicate selection if the card is already in play.
      const isCardAlreadyInPlay = currentState.cardsInPlay.some(card => card.id === cardId);
      if (isCardAlreadyInPlay) {
        return;
      }
  
      // Dispatch the card selection action.
      stateMachine.dispatch(gameActions.selectCard(playerId, cardId));
      
      // Get the updated state from the state machine.
      const updatedState = stateMachine.getState();
      
      // Sync the updated state (cards in play and players) with the server.
      await gameStatesService.update(gameStateId, {
        cardsInPlay: updatedState.cardsInPlay,
        players: updatedState.players
      });
  
    } catch (error) {
      console.error('Failed to select card:', error);
      throw error;
    }
  };
  
  // Read current state values.
  const state = stateMachine.getState();
  const playerHands = state.playerHands;
  const cardsInPlay = state.cardsInPlay;
  const discardPile = state.discardPile;
  const selectedCards = state.players.reduce((acc, player) => ({
    ...acc,
    [player.id]: hasSelected(player)
  }), {});  

  return {
    playerHands,
    cardsInPlay,
    discardPile,
    selectedCards,
    loading,
    dealInitialCards,
    selectCardForPool,
  };
}
