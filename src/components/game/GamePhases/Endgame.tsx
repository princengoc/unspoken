// src/components/game/GamePhases/Endgame.tsx
import { useEffect, useState } from 'react';
import { Container, Stack, Title, Text, Group, Button, Paper, Divider, Badge } from '@mantine/core';
import { IconRepeat, IconArrowRight } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { useRoomMembers } from '@/context/RoomMembersProvider';
import { useCardsInGame } from '@/context/CardsInGameProvider';
import { Card } from '../Card';
import { useRoom } from '@/context/RoomProvider';
import { SlideIn, FadeIn } from '@/components/animations/Motion';

export function Endgame() {
  const { members } = useRoomMembers();
  const { cardState, getCardById } = useCardsInGame();
  const { isCreator } = useRoom();
  const [showingCards, setShowingCards] = useState(false);

  useEffect(() => {
    // Delay showing cards for a dramatic effect
    const timer = setTimeout(() => {
      setShowingCards(true);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Get player → card mapping
  const playerCards = Object.entries(cardState.selectedCards).map(([playerId, cardId]) => {
    const player = members.find(m => m.id === playerId);
    const card = getCardById(cardId);
    return { 
      playerId, 
      playerName: player?.username || "Unknown Player", 
      card 
    };
  });

  const handleEncoreClick = () => {
    // TODO: Implement Encore feature
    alert('Encore feature coming soon! This will allow playing with rippled and exchanged cards.');
  };

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <FadeIn>
          <Title order={1} ta="center">Game Complete</Title>
          <Text ta="center" size="lg">
            Thanks for playing! Here's what everyone shared:
          </Text>
        </FadeIn>

        {showingCards && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Stack gap="lg">
              {playerCards.map(({ playerId, playerName, card }, index) => (
                <SlideIn key={playerId} delay={index * 0.2}>
                  <Paper p="md" radius="md" withBorder>
                    <Group align="normal" mb="xs">
                      <Group>
                        <Badge size="lg" color="blue">{playerName}</Badge>
                      </Group>
                    </Group>
                    <Divider mb="md" />
                    {card && (
                      <Group align="center">
                        <Card card={card} index={0} total={1} showSender={false} />
                      </Group>
                    )}
                  </Paper>
                </SlideIn>
              ))}
            </Stack>
          </motion.div>
        )}
        
        {isCreator && (
          <Group justify="center" mt="xl">
            <Button
              size="lg"
              leftSection={<IconRepeat size={20} />}
              onClick={handleEncoreClick}
              color="indigo"
            >
              Play Encore Round
            </Button>
            <Button
              size="lg"
              rightSection={<IconArrowRight size={20} />}
              variant="outline"
              color="gray"
              onClick={() => window.location.href = '/'}
            >
              Exit Game
            </Button>
          </Group>
        )}
        
        {!isCreator && (
          <Paper p="md" radius="md" withBorder>
            <Text ta="center">
              Waiting for room creator to start an encore or end the game...
            </Text>
          </Paper>
        )}
      </Stack>
    </Container>
  );
}