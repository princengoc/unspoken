import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { cardsInRoomsService } from '@/services/supabase/cardsInRooms';
import { supabase } from '@/services/supabase/client';
import { reactionsService } from '@/services/supabase/reactions';
import { INITIAL_CARDS_PER_PLAYER } from '@/core/game/constants';
import type { Card, CardState, MatchedExchange } from '@/core/game/types';

interface CardsInGameContextType {
  // Card states
  cardState: CardState;
  
  // Card dictionary
  getCardById: (cardId: string) => Card | undefined;
  getCardsByIds: (cardIds: string[]) => Card[];
  
  // Operations
  addNewCards: (cardIds: string[]) => Promise<void>;
  addNewCardsToPlayer: (cardIds: string[], playerId: string) => Promise<void>;
  moveCardsToDiscard: (cardIds: string[]) => Promise<void>;
  markCardAsSelected: (cardId: string, playerId: string) => Promise<void>;
  moveCardsToPlayerHand: (cardIds: string[], playerId: string) => Promise<void>;
  emptyPlayerHand: (playerId: string) => Promise<void>; // convenient function to reset cards_in_game state: empty all cards in player hand to discard
  
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
  const addNewCards = async (cardIds: string[]) => {
    await cardsInRoomsService.addNewCards(roomId, cardIds);
    await updateCardDictionary(cardIds);
  };

  const addNewCardsToPlayer = async (cardIds: string[], playerId: string) => {
    await cardsInRoomsService.addNewCardsToPlayer(roomId, cardIds, playerId);
    await updateCardDictionary(cardIds);
  };

  const moveCardsToDiscard = async (cardIds: string[]) => {
    await cardsInRoomsService.moveCardsToDiscard(roomId, cardIds);
  };

  const markCardAsSelected = async (cardId: string, playerId: string) => {
    await cardsInRoomsService.markCardAsSelected(roomId, cardId, playerId);
  };

  const moveCardsToPlayerHand = async (cardIds: string[], playerId: string) => {
    await cardsInRoomsService.moveCardsToPlayerHand(roomId, cardIds, playerId);
  };

  const emptyPlayerHand = async (playerId: string) => {
    const player_hand = cardState.playerHands[playerId]; 
    if (player_hand) {
      cardsInRoomsService.moveCardsToDiscard(roomId, player_hand);
    }
  };
  
  // Helper to deal new cards to a player
  const dealCardsToPlayer = async (playerId: string): Promise<Card[]> => {
    // Get room settings card depth
    const { data: roomData } = await supabase.from('rooms').select('card_depth, deal_extras').eq('id', roomId).single();
    const cardDepth = roomData?.card_depth;
    const deal_extras = roomData?.deal_extras || true;
    
    // 1. Get rippled cards first
    const rippledCardsIds = await reactionsService.getRippledCards(roomId, playerId);
    console.log(`rippled Cards Ids: ${JSON.stringify(rippledCardsIds)}`);
    
    // 2. Get mutually accepted exchange cards (for encore rounds)
    // We need useExchanges hook, but we can't use hooks inside this function
    // So we'll use the service directly
    const { data: matchedExchanges } = await supabase.rpc('get_matched_exchange_requests', { room_id_param: roomId });
    const exchangeCardIds = (matchedExchanges as MatchedExchange[] || [])
      .filter(match => match.player1 === playerId || match.player2 === playerId)
      .map(match => match.player1 === playerId ? match.player2_card : match.player1_card);
    
    // Combine rippled and exchange cards
    const availableCardIds = [...rippledCardsIds, ...exchangeCardIds];

    // if does not deal extras, only use ripple and exchange cards
    if (!deal_extras) {
      if (availableCardIds.length > 0) {
        await moveCardsToPlayerHand(availableCardIds, playerId);
        const availableCards = getCardsByIds(availableCardIds);
        return availableCards;
      } else {
        // Player has no rippled cards in a ripple-only round
        // Return empty array, this player will skip card selection
        return [];
      }
    }
        
    // Get random cards from the cards table
    const { data: randomCards } = await supabase.rpc('get_random_cards', {
      limit_count: INITIAL_CARDS_PER_PLAYER,
      exclude_ids: cardState.roomPile, 
      depth: cardDepth
    });

    if (!randomCards?.length) {
      throw new Error('No cards available to deal');
    }
    
    // Add cards to the game and player's hand
    await Promise.all(
        [
            addNewCardsToPlayer(randomCards.map((c: Card) => c.id), playerId), 
            moveCardsToPlayerHand(availableCardIds, playerId)
        ]
    )

    // return all the cards in player's hand
    const availableCards = getCardsByIds(availableCardIds);
    return [...randomCards, ...availableCards];
  };

  const hasSelected = (playerId: string): boolean => {
    return playerId in cardState.selectedCards && cardState.selectedCards[playerId] !== null;
  };  

  const value = {
    cardState,
    getCardById,
    getCardsByIds,
    addNewCards,
    addNewCardsToPlayer,
    moveCardsToDiscard,
    markCardAsSelected,
    moveCardsToPlayerHand,
    emptyPlayerHand,
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