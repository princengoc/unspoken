// src/utils/exchangeUtils.ts
import { supabase } from "@/services/supabase/client";
import { Card, Player, ExchangeRequest, EnrichedExchangeRequest } from "@/core/game/types";

/**
 * Fetches all matched exchanges for a room
 * 
 * @param roomId - The ID of the room to get exchanges for
 * @returns Promise<ExchangeRequest[]> - All matched exchanges in the room
 */
export async function getAllMatchedExchanges(roomId: string): Promise<ExchangeRequest[]> {
  try {
    const { data, error } = await supabase
      .from("exchange_requests")
      .select("*")
      .eq("room_id", roomId)
      .eq("status", "matched");
    
    if (error) {
      console.error("Error fetching matched exchanges:", error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error("Failed to fetch matched exchanges:", error);
    return [];
  }
}

/**
 * Enriches matched exchanges with card data and player info
 * 
 * @param exchanges - The exchanges to enrich
 * @param getCardById - Function to get a card by ID
 * @param members - List of players in the room
 * @returns EnrichedExchangeRequest[] - Exchanges with card and player data
 */
export function enrichExchanges(
  exchanges: ExchangeRequest[],
  getCardById: (cardId: string) => Card | undefined,
  members: Player[]
): EnrichedExchangeRequest[] {
  return exchanges
    .map(exchange => {
      const card = getCardById(exchange.card_id);
      if (!card) return null;
      
      // For each exchange, the "otherPlayer" is the from_id (sender)
      const otherPlayer = members.find(m => m.id === exchange.from_id);
      
      return {
        ...exchange,
        card,
        otherPlayer: otherPlayer ? {
          id: otherPlayer.id,
          username: otherPlayer.username
        } : undefined
      };
    })
    .filter(exchange => exchange !== null) as EnrichedExchangeRequest[];
}

/**
 * Groups exchanges by the receiving player (to_id)
 * 
 * @param exchanges - Enriched exchanges to group
 * @returns Map<string, EnrichedExchangeRequest[]> - Map of player IDs to their exchanges
 */
export function groupExchangesByReceiver(
  exchanges: EnrichedExchangeRequest[]
): Map<string, EnrichedExchangeRequest[]> {
  const exchangesByReceiver = new Map<string, EnrichedExchangeRequest[]>();
  
  exchanges.forEach(exchange => {
    const receiverId = exchange.to_id;
    
    if (!exchangesByReceiver.has(receiverId)) {
      exchangesByReceiver.set(receiverId, []);
    }
    
    exchangesByReceiver.get(receiverId)!.push(exchange);
  });
  
  return exchangesByReceiver;
}