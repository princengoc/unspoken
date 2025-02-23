import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { cardsInRoomsService } from '@/services/supabase/cardsInRooms';
import { supabase } from '@/services/supabase/client';
import type { Card, CardState } from '@/core/game/types';

interface CardsInGameContextType {
  // Card states
  cardState: CardState;
  
  // Card dictionary
  getCardById: (cardId: string) => Card | undefined;
  getCardsByIds: (cardIds: string[]) => Card[];
  
  // Operations
  completePlayerSetup: (playerId: string, selectedCardId: string) => Promise<void>;
  
  // Card dealing helper that includes fetching new cards
  dealCardsToPlayer: (playerId: string) => Promise<Card[]>;

  // utility functions
  hasSelected: (playerId: string) => boolean;
}

const CardsInGameContext = createContext<CardsInGameContextType | null>(null);

interface CardsInGameProviderProps {
  roomId: string;
  children: ReactNode;
}

async function fetchCardsByIds(cardIds: string[]): Promise<Card[]> {
  if (!cardIds.length) return [];
  
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .in('id', cardIds);
    
  if (error) throw error;
  return data;
}

export function CardsInGameProvider({ roomId, children }: CardsInGameProviderProps) {
  // Track the current state of cards in the room
  const [cardState, setCardState] = useState<CardState>({
    roomPile: [],
    discardPile: [], 
    playerHands: {},
    selectedCards: {}
  });

  // Card dictionary for quick lookups
  const [cardDictionary, setCardDictionary] = useState<Map<string, Card>>(new Map());

  // Helper to update card dictionary with new cards
  const updateCardDictionary = async (cardIds: string[]) => {
    // Filter out cards we already have
    const newCardIds = cardIds.filter(id => !cardDictionary.has(id));
    if (newCardIds.length === 0) return;

    // Fetch new cards and update dictionary
    const newCards = await fetchCardsByIds(newCardIds);
    setCardDictionary(prev => {
      const next = new Map(prev);
      newCards.forEach(card => next.set(card.id, card));
      return next;
    });
  };

  // Initialize card state and dictionary
  useEffect(() => {
    const initializeCards = async () => {
      try {
        // Get initial card state
        const initialState = await cardsInRoomsService.fetchCurrentCardState(roomId);
        setCardState(initialState);

        // Initialize card dictionary with all cards in the room
        await updateCardDictionary(initialState.roomPile);
      } catch (error) {
        console.error('Failed to initialize cards:', error);
      }
    };

    initializeCards();

    // Subscribe to card state changes
    const subscription = cardsInRoomsService.subscribeToCardStateChanges(
      roomId,
      async (newState) => {
        // Update dictionary with any new cards
        await updateCardDictionary(newState.roomPile);
        setCardState(newState);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [roomId]);

  // Card lookup helpers
  const getCardById = (cardId: string) => cardDictionary.get(cardId);
  
  const getCardsByIds = (cardIds: string[]) => 
    cardIds.map(id => cardDictionary.get(id)).filter((card): card is Card => !!card);

  // Card operations
  const completePlayerSetup = async (playerId: string, selectedCardId: string) => {
    try {
      await cardsInRoomsService.completePlayerSetup(roomId, playerId, selectedCardId);
    } catch (error) {
      console.error('Failed to complete player setup:', error);
      throw error;
    }
  }
  
  const dealCardsToPlayer = async (playerId: string): Promise<Card[]> => {
    // Get both dealt cards and new state
    const { cardIds, newState } = 
      await cardsInRoomsService.dealCardsToPlayer(roomId, playerId);

    // update the card dictionary to keep getCardsByIds fresh
    await updateCardDictionary(newState.roomPile);
    setCardState(newState);
  
    return getCardsByIds(cardIds);
  };

  const hasSelected = (playerId: string): boolean => {
    return playerId in cardState.selectedCards && cardState.selectedCards[playerId] !== null;
  };  

  const value = {
    cardState,
    getCardById,
    getCardsByIds,
    completePlayerSetup,
    dealCardsToPlayer,
    hasSelected
  };

  return (
    <CardsInGameContext.Provider value={value}>
      {children}
    </CardsInGameContext.Provider>
  );
}

export function useCardsInGame() {
  const context = useContext(CardsInGameContext);
  if (!context) {
    throw new Error('useCardsInGame must be used within CardsInGameProvider');
  }
  return context;
}