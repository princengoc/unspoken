import { useState } from 'react';
import { Stack, Group, Text, Paper, Badge, Avatar, Box, Button, Modal } from '@mantine/core';
import { IconCheck, IconX, IconExchange } from '@tabler/icons-react';
import { MiniCard } from '../CardDeck/MiniCard';
import { ExchangeRequest } from '@/services/supabase/exchangeRequests';
import { Card, Player } from '@/core/game/types';
import { MiniDeck } from '../CardDeck/MiniDeck';

interface IncomingRequestsProps {
  requests: Array<ExchangeRequest & { 
    fromPlayer?: Player,
    card?: Card 
  }>;
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
  onCounter: (fromPlayerId: string, cardId: string) => void;
  currentUserCards: string[];
  getCardById: (cardId: string) => Card | undefined;
}

export function IncomingRequests({ 
  requests, 
  onAccept, 
  onDecline, 
  onCounter,
  currentUserCards,
  getCardById
}: IncomingRequestsProps) {
  const [counterModalOpen, setCounterModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ExchangeRequest | null>(null);

  const handleCounter = (requestId: string, fromPlayerId: string) => {
    const request = requests.find(r => r.id === requestId);
    if (request) {
      setSelectedRequest(request);
      setCounterModalOpen(true);
    }
  };

  const handleCounterSubmit = (cardId: string) => {
    if (selectedRequest) {
      onCounter(selectedRequest.from_id, cardId);
      setCounterModalOpen(false);
    }
  };

  return (
    <Stack gap="md">
      {requests.map(request => (
        <Paper key={request.id} p="sm" withBorder>
          <Stack gap="md">
            <Group justify="space-between" align="flex-start">
              {/* Requester info */}
              <Group align="center">
                <Avatar 
                  radius="xl" 
                  color="blue" 
                  size="md"
                >
                  {request.fromPlayer?.username?.charAt(0).toUpperCase() || '?'}
                </Avatar>
                <Box>
                  <Text size="sm" fw={500}>{request.fromPlayer?.username || 'Unknown Player'}</Text>
                  <Badge 
                    color={request.status === 'pending' ? 'blue' : 
                          request.status === 'accepted' ? 'green' : 'red'}
                    variant="light"
                    size="sm"
                  >
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </Badge>
                </Box>
              </Group>

              {/* Requested card */}
              {request.card && (
                <Box style={{ maxWidth: '120px' }}>
                  <Text size="xs" ta="center" mb="xs">Requested Card:</Text>
                  <MiniCard 
                    card={request.card}
                    size="sm"
                  />
                </Box>
              )}
            </Group>

            {/* Actions for pending requests */}
            {request.status === 'pending' && (
              <Group justify="flex-end" mt="xs">
                <Button
                  variant="outline"
                  color="red"
                  size="sm"
                  leftSection={<IconX size={16} />}
                  onClick={() => onDecline(request.id)}
                >
                  Decline
                </Button>
                <Button
                  variant="outline"
                  color="blue"
                  size="sm"
                  leftSection={<IconExchange size={16} />}
                  onClick={() => handleCounter(request.id, request.from_id)}
                >
                  Counter
                </Button>
                <Button
                  variant="filled"
                  color="green"
                  size="sm"
                  leftSection={<IconCheck size={16} />}
                  onClick={() => onAccept(request.id)}
                >
                  Accept
                </Button>
              </Group>
            )}
          </Stack>
        </Paper>
      ))}

      {/* Counter offer modal */}
      <Modal
        opened={counterModalOpen}
        onClose={() => setCounterModalOpen(false)}
        title="Counter with another card"
        size="lg"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Select one of your cards to counter with:
          </Text>
          
          <MiniDeck
            cards={currentUserCards.map(id => getCardById(id)).filter(Boolean)}
            onSelect={handleCounterSubmit}
          />
        </Stack>
      </Modal>
    </Stack>
  );
}