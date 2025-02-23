// src/components/game/ExchangeRequests/ExchangeTab.tsx
// TODO: maybe sort the requests by (matched) then (unmatched), and within it, sort by last updated. 
import React, { useState } from 'react';
import { Box, Text, Loader, Stack, Alert, Group, Paper, Badge, Button, Modal, Divider, Avatar } from '@mantine/core';
import { IconInfoCircle, IconExchange, IconArrowRight, IconArrowLeft, IconCheck, IconX, IconCards } from '@tabler/icons-react';
import { useCardsInGame } from '@/context/CardsInGameProvider';
import { useRoomMembers } from '@/context/RoomMembersProvider';
import { MiniCard } from '../CardDeck/MiniCard';
import { MiniDeck } from '../CardDeck/MiniDeck';
import { useExchanges } from '@/context/ExchangesProvider';
import type { EnrichedExchangeRequest } from '@/context/ExchangesProvider';
import { useAuth } from '@/context/AuthProvider';

export function ExchangeTab() {
  const { user } = useAuth();
  const { cardState, getCardsByIds } = useCardsInGame();
  const { members } = useRoomMembers();
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  const {
    incomingRequests,
    outgoingRequests,
    loading,
    requestExchange,
    acceptRequest,
    declineRequest,
    hasMatch
  } = useExchanges();

  if (loading) {
    return (
      <Box p="xl" ta="center">
        <Loader size="sm" />
        <Text mt="sm" size="sm" c="dimmed">Loading exchange requests...</Text>
      </Box>
    );
  }

  // Get all other players
  const otherPlayers = members.filter(m => m.id !== user?.id);
  
  if (otherPlayers.length === 0) {
    return (
      <Box p="xl" ta="center">
        <Alert icon={<IconInfoCircle size={16} />} color="blue">
          <Text size="sm">
            No other players are available for exchanges.
          </Text>
        </Alert>
      </Box>
    );
  }

  const handleExchangeAction = (playerId: string, action: 'send' | 'accept' | 'decline') => {
    if (action === 'send') {
      setSelectedPlayer(playerId);
      setModalOpen(true);
    } else if (action === 'accept') {
      const request = incomingRequests.find(r => r.from_id === playerId);
      if (request) acceptRequest(request.id);
    } else if (action === 'decline') {
      const request = incomingRequests.find(r => r.from_id === playerId);
      if (request) declineRequest(request.id);
    }
  };

  const handleSubmitCard = (cardId: string) => {
    if (!selectedPlayer) return;
    
    requestExchange(selectedPlayer, cardId);
    setModalOpen(false);
    setSelectedPlayer(null);
  };

  // Helper to get color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'matched': return 'green';
      case 'accepted': return 'blue';
      case 'declined':
      case 'auto-declined': 
        return 'red';
      default: return 'yellow';
    }
  };

  const renderRequestCard = (
    request: EnrichedExchangeRequest
  ) => {
    return (
      <Stack gap="xs" align="center">
        <Box style={{ width: '120px' }}>
          <MiniCard 
            card={request.card!} 
            size="sm"
          />
        </Box>
        <Badge 
          color={getStatusColor(request.status)}
          size="sm"
        >
          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
        </Badge>
      </Stack>
    );    
  }

  // render incoming request card
  const renderIncomingRequestCard = (
    request: EnrichedExchangeRequest | null | undefined
  ) => {
    if (!request || !request.card) {
      return (
        <Box>
          <Text size="sm" c="dimmed" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <IconArrowLeft size={16} />
            Their Request Will Appear Here
          </Text>
        </Box>          
      );      
    } 
    return renderRequestCard(request);
  }

  const renderOutgoingRequestCard = (
    request: EnrichedExchangeRequest | null | undefined, 
    playerId: string
  ) => {
    if (!request || !request.card) {    
      return (
        <Box>
        <Button 
          variant="subtle" 
          size="sm"
          leftSection={<IconArrowRight size={16} />}
          onClick={() => handleExchangeAction(playerId, 'send')}
        >
          Send Request
        </Button>
      </Box>              
      );
  }
  return renderRequestCard(request);
  }

  return (
    <Box>
      <Alert icon={<IconInfoCircle size={16} />} color="blue" mb="md">
        <Text size="sm">
          Exchange requests let players challenge each other with cards from the discard pile.
          When both players accept, these cards will be available in encore rounds.
        </Text>
      </Alert>
      
      <Stack gap="md">
        {otherPlayers.map((player) => {
          const outgoing = outgoingRequests.find(r => r.to_id === player.id);
          const incoming = incomingRequests.find(r => r.from_id === player.id);
          const isMatched = outgoing?.status === 'matched' && incoming?.status === 'matched';

          return (
            <Paper key={player.id} p="md" withBorder>
              <Stack gap="md">
                <Group justify="center" gap="md">
                  <Group>
                    <Avatar radius="xl" color="blue">
                      {player.username?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Text fw={500}>{player.username}</Text>
                    
                    {isMatched && (
                      <Badge color="green">Matched</Badge>
                    )}
                  </Group>
                  
                  {/* Actions */}
                  {incoming?.status === 'pending' && (
                    <Group gap="xs">
                      <Button
                        variant="outline"
                        color="red"
                        size="xs"
                        leftSection={<IconX size={14} />}
                        onClick={() => handleExchangeAction(player.id, 'decline')}
                      >
                        Decline
                      </Button>
                      <Button
                        variant="outline"
                        color="green"
                        size="xs"
                        leftSection={<IconCheck size={14} />}
                        onClick={() => handleExchangeAction(player.id, 'accept')}
                      >
                        Accept
                      </Button>
                    </Group>
                  )}
                </Group>
                
                <Divider />
                
                <Group gap="md" justify="center">
                  <Stack gap="xs" align="center">
                    <Text size="sm" fw={500}>Your Request</Text>
                    {renderOutgoingRequestCard(outgoing, player.id)}
                  </Stack>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconExchange size={24} stroke={1.5} />
                  </Box>
                  
                  <Stack gap="xs" align="center">
                    <Text size="sm" fw={500}>Their Request</Text>
                    {renderIncomingRequestCard(incoming)}
                  </Stack>
                </Group>
              </Stack>
            </Paper>
          );
        })}
      </Stack>

      {/* Card selection modal */}
      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Send an exchange request"
        size="lg"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Select a card from the discard pile:
          </Text>
          
          {cardState.discardPile.length > 0 ? (
            <MiniDeck
              cards={getCardsByIds(cardState.discardPile)}
              onSelect={handleSubmitCard}
            />
          ) : (
            <Alert icon={<IconCards size={16} />} color="yellow">
              <Text>No cards are available in the discard pile yet.</Text>
            </Alert>
          )}
        </Stack>
      </Modal>
    </Box>
  );
}