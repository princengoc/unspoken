import { useState, useEffect, useCallback } from 'react';
import { exchangeRequestsService, ExchangeRequest } from '@/services/supabase/exchangeRequests';
import { useAuth } from '@/context/AuthProvider';
import { Card, Player } from '@/core/game/types';
import { notifications } from '@mantine/notifications';

interface UseExchangesProps {
  roomId: string;
  players: Player[];
  getCardById: (cardId: string) => Card | undefined;
}

export interface EnrichedExchangeRequest extends ExchangeRequest {
  fromPlayer?: Player;
  toPlayer?: Player;
  card?: Card;
}

export interface ExchangePair {
  playerId: string;
  playerName: string;
  outgoingRequest: EnrichedExchangeRequest | null;
  incomingRequest: EnrichedExchangeRequest | null;
  hasMatch: boolean;
}

export function useExchanges({ roomId, players, getCardById }: UseExchangesProps) {
  const { user } = useAuth();
  const [outgoingRequests, setOutgoingRequests] = useState<ExchangeRequest[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<ExchangeRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Load exchange requests and subscribe to changes
  useEffect(() => {
    if (!roomId || !user?.id) return;
    
    let subscription: ReturnType<typeof exchangeRequestsService.subscribeToExchangeRequests>;

    const subscribeToChanges = () => {
      subscription = exchangeRequestsService.subscribeToExchangeRequests(
        roomId,
        user.id,
        (outgoing, incoming) => {
          setOutgoingRequests(outgoing);
          setIncomingRequests(incoming);
          setLoading(false);
        }
      );
    };

    // Initial load
    const loadRequests = async () => {
      try {
        setLoading(true);
        const [outgoing, incoming] = await Promise.all([
          exchangeRequestsService.getExchangeRequests(roomId, user.id, 'outgoing'),
          exchangeRequestsService.getExchangeRequests(roomId, user.id, 'incoming')
        ]);
        
        setOutgoingRequests(outgoing);
        setIncomingRequests(incoming);
        setLoading(false);
        
        // Subscribe after initial load
        subscribeToChanges();
      } catch (error) {
        console.error('Failed to load exchange requests:', error);
        setLoading(false);
      }
    };

    loadRequests();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [roomId, user?.id]);

  // Create a new exchange request
  const requestExchange = async (toPlayerId: string, cardId: string) => {
    if (!user?.id || !roomId) return;
    
    try {
      await exchangeRequestsService.createRequest(
        roomId,
        user.id,
        toPlayerId,
        cardId
      );
      
      notifications.show({
        title: 'Request Sent',
        message: 'Exchange request has been sent.',
        color: 'blue'
      });
    } catch (error) {
      console.error('Failed to send exchange request:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to send exchange request.',
        color: 'red'
      });
    }
  };

  // Check for mutually accepted exchanges
  const getMutuallyAcceptedExchanges = useCallback(async (playerId: string): Promise<string[]> => {
    try {
      // Get matched/accepted exchange requests
      const matchedRequests = await exchangeRequestsService.getMatchedRequests(roomId);
      
      // Filter exchanges involving this player
      const playerExchanges = matchedRequests.filter(match => 
        match.player1 === playerId || match.player2 === playerId
      );
      
      // Get the card IDs that should be available to this player
      return playerExchanges.map(match => 
        match.player1 === playerId ? match.player2_card : match.player1_card
      );
    } catch (error) {
      console.error('Failed to get mutually accepted exchanges:', error);
      return [];
    }
  }, [roomId]);

  // Accept an incoming exchange request
  const acceptRequest = async (requestId: string) => {
    try {
      await exchangeRequestsService.updateRequestStatus(requestId, 'accepted');
      
      notifications.show({
        title: 'Request Accepted',
        message: 'You accepted the exchange request.',
        color: 'green'
      });
    } catch (error) {
      console.error('Failed to accept exchange request:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to accept exchange request.',
        color: 'red'
      });
    }
  };

  // Decline an incoming exchange request
  const declineRequest = async (requestId: string) => {
    try {
      await exchangeRequestsService.updateRequestStatus(requestId, 'declined');
      
      notifications.show({
        title: 'Request Declined',
        message: 'You declined the exchange request.',
        color: 'yellow'
      });
    } catch (error) {
      console.error('Failed to decline exchange request:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to decline exchange request.',
        color: 'red'
      });
    }
  };

  // Counter an incoming exchange request with a different card
  const counterRequest = async (fromPlayerId: string, cardId: string) => {
    if (!user?.id || !roomId) return;
    
    try {
      await exchangeRequestsService.createRequest(
        roomId,
        user.id,
        fromPlayerId,
        cardId
      );
      
      notifications.show({
        title: 'Counter Offer',
        message: 'You countered with a different card.',
        color: 'blue'
      });
    } catch (error) {
      console.error('Failed to counter exchange request:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to counter exchange request.',
        color: 'red'
      });
    }
  };

  // Helper to find player by ID
  const getPlayerById = (playerId: string): Player | undefined => {
    return players.find(p => p.id === playerId);
  };

  // Prepare requests with player and card data for UI
  const enrichedOutgoingRequests: EnrichedExchangeRequest[] = outgoingRequests.map(req => ({
    ...req,
    toPlayer: getPlayerById(req.to_id),
    card: getCardById(req.card_id)
  }));

  const enrichedIncomingRequests: EnrichedExchangeRequest[] = incomingRequests.map(req => ({
    ...req,
    fromPlayer: getPlayerById(req.from_id),
    card: getCardById(req.card_id)
  }));

  // Get exchange pairs for the unified UI
  const getExchangePairs = useCallback((): ExchangePair[] => {
    if (!user?.id) return [];

    // Filter current user out of players
    const otherPlayers = players.filter(p => p.id !== user.id);
    
    return otherPlayers.map(player => {
      // Find any outgoing requests to this player
      const outgoing = enrichedOutgoingRequests.find(req => req.to_id === player.id);
      
      // Find any incoming requests from this player  
      const incoming = enrichedIncomingRequests.find(req => req.from_id === player.id);
      
      // Check for a match (both sides have accepted)
      const hasMatch = !!(outgoing?.status === 'accepted' && incoming?.status === 'accepted');
      
      return {
        playerId: player.id,
        playerName: player.username || 'Unknown Player',
        outgoingRequest: outgoing || null,
        incomingRequest: incoming || null,
        hasMatch
      };
    });
  }, [user?.id, players, enrichedOutgoingRequests, enrichedIncomingRequests]);

  // Check if there's a match for the given request
  const hasMatch = (request: ExchangeRequest): boolean => {
    // Find a matching request from the other player
    if (request.status !== 'accepted') return false;
    
    const match = request.from_id === user?.id
      ? incomingRequests.find(req => 
          req.from_id === request.to_id && 
          req.status === 'accepted'
        )
      : outgoingRequests.find(req => 
          req.to_id === request.from_id &&
          req.status === 'accepted'
        );
    
    return !!match;
  };

  return {
    outgoingRequests: enrichedOutgoingRequests,
    incomingRequests: enrichedIncomingRequests,
    exchangePairs: getExchangePairs(),
    loading,
    requestExchange,
    acceptRequest,
    declineRequest,
    counterRequest,
    hasMatch, 
    getMutuallyAcceptedExchanges
  };
}