import { useState } from 'react';
import { Stack, Text, Group, Button, Paper, ScrollArea } from '@mantine/core';
import { notifications } from "@mantine/notifications";
import { motion } from 'framer-motion';
import { IconCheck, IconHourglass } from '@tabler/icons-react';
import { useRoomMembers } from '@/context/RoomMembersProvider';
import { useRoom } from '@/context/RoomProvider';
import { Card } from '../Card';
import { PLAYER_STATUS } from '@/core/game/constants';
import { useCardsInGame } from '@/context/CardsInGameProvider';


export function Setup() {
  const { cardState, getCardById, getCardsByIds } = useCardsInGame();
  const { currentMember } = useRoomMembers();
  const {
    handleCardSelection,
    initiateSpeakingPhase,
    dealCards,
    canStartDrawCards,
    canStartChoosing,
    isSetupComplete,
    isCreator
  } = useRoom();

  const [isDealing, setIsDealing] = useState(false);

  const handleDrawCards = async () => {
    if (!currentMember?.id) return;
    
    setIsDealing(true);
    try {
      await dealCards(currentMember.id);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to draw cards. Please try again.',
        color: 'red'
      });
    } finally {
      setIsDealing(false);
    }
  };

  return (
    <Stack spacing="md">
      {canStartDrawCards && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            onClick={handleDrawCards}
            fullWidth
            size="lg"
            variant="filled"
            loading={isDealing}
          >
            Draw Cards
          </Button>
        </motion.div>
      )}

      {canStartChoosing && currentMember?.id && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <ScrollArea>
            <Group spacing="md" style={{ padding: '8px 0' }}>
              {getCardsByIds(cardState.playerHands[currentMember.id]).map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  style={{ minWidth: '250px' }}
                >
                  <Card
                    card={card}
                    onClick={() => handleCardSelection(card.id)}
                    selected={cardState.selectedCards[currentMember.id] === card.id}
                  />
                </motion.div>
              ))}
            </Group>
          </ScrollArea>
        </motion.div>
      )}

      {currentMember?.status === PLAYER_STATUS.BROWSING && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {isCreator ? (
            isSetupComplete && (
              <Button
                fullWidth
                size="lg"
                onClick={initiateSpeakingPhase}
                leftSection={<IconCheck size={18} />}
              >
                Start Game
              </Button>
            )
          ) : (
            <Paper p="md" radius="md" withBorder>
              <Group align="center" spacing="sm">
                <IconHourglass size={18} />
                <Text size="sm">
                  {isSetupComplete
                    ? "Everyone's ready! Waiting for the room creator..."
                    : "Waiting for other players to choose their cards..."}
                </Text>
              </Group>
            </Paper>
          )}

          {cardState.discardPile.length > 0 && (
            <>
              <Text size="sm" c="dimmed" ta="center" mt="md">
                Browse discarded cards while waiting
              </Text>
              <ScrollArea>
                <Group spacing="md" style={{ padding: '8px 0' }}>
                  {cardState.discardPile.map((cardId, index) => {
                    const card = getCardById(cardId);
                    return card ? (
                      <motion.div
                        key={cardId}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        style={{ minWidth: '250px' }}
                      >
                        <Card
                          card={card}
                          index={index}
                          total={cardState.discardPile.length}
                          showExchange
                        />
                      </motion.div>
                    ) : null;
                  })}
                </Group>
              </ScrollArea>
            </>
          )}
        </motion.div>
      )}
    </Stack>
  );
}