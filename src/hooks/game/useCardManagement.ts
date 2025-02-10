import { useState } from 'react';
import { gameStatesService } from '@/services/supabase/gameStates';
import { WILD_CARDS_COUNT } from '@/core/game/constants';
import { useGameState } from '@/context/GameStateProvider';
import { gameActions } from '@/core/game/actions';
import { supabase } from '@/services/supabase/client';
import { Card } from '@/core/game/types';

export function useCardManagement(sessionId: string | null, userId: string | null) {
  const stateMachine = useGameState();
  const [loading, setLoading] = useState(false);

  const dealInitialCards = async () => {
    if (!sessionId || !userId) return;
    
    try {
      setLoading(true);
      const cards = await gameStatesService.dealCards(sessionId, userId);
      
      // Update state machine
      stateMachine.dispatch(gameActions.cardsDealt(userId, cards));
      
    } catch (error) {
      console.error('Failed to deal cards:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const selectCardForPool = async (playerId: string, cardId: string) => {
    if (!sessionId) return;

    try {
      // Update state machine first
      stateMachine.dispatch(gameActions.selectCard(playerId, cardId));
      
      const state = stateMachine.getState();
      const selectedCard = state.playerHands[playerId]?.find(card => card.id === cardId) as Card;
      const updatedCardsInPlay = [...state.cardsInPlay, selectedCard];
      
      // Then sync with Supabase
      await gameStatesService.update(sessionId, {
        cardsInPlay: updatedCardsInPlay
      });

      // Fetch and update the full card objects
      const { data: cards } = await supabase
        .from('cards')
        .select('*')
        .in('id', updatedCardsInPlay);

      if (cards) {
        stateMachine.dispatch(gameActions.cardsSelected(cards));
      }

    } catch (error) {
      console.error('Failed to select card:', error);
      throw error;
    }
  };

  const addWildCards = async () => {
    if (!sessionId) return;
    
    try {
      setLoading(true);
      const state = stateMachine.getState();
      
      // Get current cards in play
      const currentCardIds = state.cardsInPlay.map(card => card.id);
      
      // Get random wild cards
      // this supabase function returns entries of cards table, which can be directly casted
      const { data: wildCards, error: wildCardsError } = await supabase.rpc(
        'get_random_cards',
        {
          limit_count: WILD_CARDS_COUNT,
          exclude_ids: currentCardIds,
        }
      );
  
      if (wildCardsError) throw wildCardsError;
      if (!wildCards) throw new Error('Failed to get wild cards');

      const wildCardsCasted = wildCards as Card[];

      // Update Supabase first
      await gameStatesService.update(sessionId, {
        cardsInPlay: [...state.cardsInPlay, ...wildCardsCasted]
      });

      // Then update state machine
      stateMachine.dispatch(gameActions.cardsSelected(wildCardsCasted));
      
    } catch (error) {
      console.error('Failed to add wild cards:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Get current state values
  const state = stateMachine.getState();
  const playerHands = state.playerHands;
  const cardsInPlay = state.cardsInPlay;
  const selectedCards = state.players.reduce((acc, player) => ({
    ...acc,
    [player.id]: player.hasSelected
  }), {});

  return {
    playerHands,
    cardsInPlay,
    selectedCards,
    loading,
    dealInitialCards,
    selectCardForPool,
    addWildCards
  };
}