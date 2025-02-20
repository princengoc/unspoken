// src/hooks/game/useExchanges.ts
import { useState, useEffect, useMemo, useCallback } from 'react';
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
  const [subscribed, setSubscribed] = useState(false);

  // Load initial data and set up subscription
  useEffect(() => {
    if (!roomId || !user?.id) {
      return;
    }

    let subscription: any = null;
    let isMounted = true;

    // Initial data load
    const loadInitialData = async () => {
      try {
        const [outgoing, incoming] = await Promise.all([
          exchangeRequestsService.getExchangeRequests(roomId, user.id, 'outgoing'),
          exchangeRequestsService.getExchangeRequests(roomId, user.id, 'incoming')
        ]);
        
        if (isMounted) {
          setOutgoingRequests(outgoing);
          setIncomingRequests(incoming);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to load exchange requests:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Set up subscription first, so we don't miss updates
    const setupSubscription = () => {
      subscription = exchangeRequestsService.subscribeToExchangeRequests(
        roomId,
        user.id,
        (outgoing, incoming) => {
          if (isMounted) {
            setOutgoingRequests(outgoing);
            setIncomingRequests(incoming);
            setLoading(false);
          }
        }
      );
      setSubscribed(true);
    };

    setupSubscription();
    loadInitialData();

    // Cleanup function
    return () => {
      isMounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [roomId, user?.id]);

  // Enhanced requests with player and card data
  const enrichedRequests = useMemo(() => {
    const getPlayerById = (playerId: string) => 
      players.find(p => p.id === playerId);

    return {
      outgoing: outgoingRequests.map(req => ({
        ...req,
        toPlayer: getPlayerById(req.to_id),
        card: getCardById(req.card_id)
      })),
      incoming: incomingRequests.map(req => ({
        ...req,
        fromPlayer: getPlayerById(req.from_id),
        card: getCardById(req.card_id)
      }))
    };
  }, [outgoingRequests, incomingRequests, players, getCardById]);

  // Unified exchange pairs data structure
  const exchangePairs = useMemo(() => {
    if (!user?.id) return [];

    const otherPlayers = players.filter(p => p.id !== user.id);
    
    return otherPlayers.map(player => {
      const outgoing = enrichedRequests.outgoing.find(req => req.to_id === player.id);
      const incoming = enrichedRequests.incoming.find(req => req.from_id === player.id);
      
      const hasMatch = !!(
        outgoing?.status === 'accepted' && 
        incoming?.status === 'accepted'
      );
      
      return {
        playerId: player.id,
        playerName: player.username || 'Unknown Player',
        outgoingRequest: outgoing || null,
        incomingRequest: incoming || null,
        hasMatch
      };
    });
  }, [enrichedRequests, players, user?.id]);

  // Action: Create a new exchange request
  const requestExchange = useCallback(async (toPlayerId: string, cardId: string) => {
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
  }, [roomId, user?.id]);

  // Action: Accept an incoming exchange request
  const acceptRequest = useCallback(async (requestId: string) => {
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
  }, []);

  // Action: Decline an incoming exchange request
  const declineRequest = useCallback(async (requestId: string) => {
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
  }, []);

  // Helper: Check if a specific request has a match
  const hasMatch = useCallback((request: ExchangeRequest): boolean => {
    if (request.status !== 'accepted' || !user?.id) return false;
    
    if (request.from_id === user.id) {
      return incomingRequests.some(req => 
        req.from_id === request.to_id && 
        req.status === 'accepted'
      );
    } else {
      return outgoingRequests.some(req => 
        req.to_id === request.from_id &&
        req.status === 'accepted'
      );
    }
  }, [incomingRequests, outgoingRequests, user?.id]);

  return {
    // Core data
    exchangePairs,
    incomingRequests: enrichedRequests.incoming,
    outgoingRequests: enrichedRequests.outgoing,
    
    // Status
    loading,
    isSubscribed: subscribed,
    
    // Actions
    requestExchange,
    acceptRequest,
    declineRequest,
    hasMatch
  };
}