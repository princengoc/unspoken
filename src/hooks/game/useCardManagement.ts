import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase/client';
import { Card } from '@/core/game/types';
import { sessionsService } from '@/services/supabase/sessions';
import { WILD_CARDS_COUNT } from '@/core/game/constants';

// Helper function to fetch cards by their IDs
const fetchCardsByIds = async (cardIds: string[]): Promise<Card[]> => {
  if (!cardIds.length) return [];
  
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .in('id', cardIds);
    
  if (error) throw error;
  return data as Card[];
};

export function useCardManagement(sessionId: string | null, userId: string | null) {
  const [playerHands, setPlayerHands] = useState<Record<string, Card[]>>({});
  const [cardsInPlay, setCardsInPlay] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    const subscription = sessionsService.subscribeToChanges(sessionId, async (session) => {
      try {
        // Fetch full card objects when we receive card IDs
        if (session.cards_in_play) {
          const cards = await fetchCardsByIds(session.cards_in_play);
          setCardsInPlay(cards);
        }
        
        // Update player hands with full card objects
        if (session.player_hands) {
          const updatedHands: Record<string, Card[]> = {};
          
          for (const [playerId, cardIds] of Object.entries(session.player_hands)) {
            const cards = await fetchCardsByIds(cardIds);
            updatedHands[playerId] = cards;
          }
          
          setPlayerHands(updatedHands);
        }
      } catch (error) {
        console.error('Failed to fetch cards:', error);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [sessionId]);

  const dealInitialCards = async () => {
    if (!sessionId || !userId) return;
    
    try {
      setLoading(true);
      const cards = await sessionsService.dealCards(sessionId, userId);
      setPlayerHands(prev => ({
        ...prev,
        [userId]: cards
      }));
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
      setSelectedCards(prev => ({
        ...prev,
        [playerId]: cardId
      }));

      const updatedCardsInPlay = [...cardsInPlay.map(c => c.id), cardId];
      
      // Update session with card ID
      await sessionsService.update(sessionId, {
        cards_in_play: updatedCardsInPlay
      });

      // Fetch and update the full card objects
      const cards = await fetchCardsByIds(updatedCardsInPlay);
      setCardsInPlay(cards);

    } catch (error) {
      console.error('Failed to select card:', error);
      throw error;
    }
  };

  const addWildCards = async () => {
    if (!sessionId) return;
    
    try {
      setLoading(true);
      const currentCardIds = cardsInPlay.map(card => card.id);
      
      // Get random cards not already in play
      const { data: wildCards } = await supabase
        .from('cards')
        .select('*')
        // .not('id', 'in', currentCardIds)
        // .order('RANDOM()')
        .limit(WILD_CARDS_COUNT);

      if (!wildCards) throw new Error('Failed to get wild cards');
      
      const allCardIds = [...currentCardIds, ...wildCards.map(c => c.id)];
      
      // Update session with card IDs
      await sessionsService.update(sessionId, {
        cards_in_play: allCardIds
      });
      
      // Update local state with full card objects
      setCardsInPlay([...cardsInPlay, ...wildCards]);
    } catch (error) {
      console.error('Failed to add wild cards:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

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