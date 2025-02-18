// src/components/game/GamePhases/Endgame.tsx
import { useEffect, useState } from 'react';
import { Container, Stack, Title, Text, Group, Button, Paper, Divider, Badge, SimpleGrid } from '@mantine/core';
import { IconRepeat, IconArrowRight } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { useRoomMembers } from '@/context/RoomMembersProvider';
import { useCardsInGame } from '@/context/CardsInGameProvider';
import { useRoom } from '@/context/RoomProvider';
import { SlideIn, FadeIn } from '@/components/animations/Motion';
import { MiniCard } from '../CardDeck/MiniCard';

export function Endgame() {
  const { members } = useRoomMembers();
  const { cardState, getCardById } = useCardsInGame();
  const { isCreator } = useRoom();
  const [showingCards, setShowingCards] = useState(false);

  useEffect(() => {
    // Delay showing cards for a dramatic effect
    const timer = setTimeout(() => {
      setShowingCards(true);
    }, 500);
    
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
    <Container size="lg" py="md">
      <Stack gap="lg">
        <FadeIn>
          <Title order={2} ta="center">Game Complete</Title>
          <Text ta="center" size="md" c="dimmed">
            Here's what everyone shared:
          </Text>
        </FadeIn>

        {showingCards && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
              {playerCards.map(({ playerId, playerName, card }, index) => (
                card && (
                  <SlideIn key={playerId} delay={index * 0.1}>
                    <Paper p="xs" radius="md" withBorder>
                      <Stack gap="xs">
                        <Badge size="sm" radius="sm">{playerName}</Badge>
                        <MiniCard
                          card={card}
                          showSender={false}
                        />
                      </Stack>
                    </Paper>
                  </SlideIn>
                )
              ))}
            </SimpleGrid>
          </motion.div>
        )}
        
        {isCreator && (
          <Group justify="center" mt="md">
            <Button
              size="md"
              leftSection={<IconRepeat size={18} />}
              onClick={handleEncoreClick}
              color="indigo"
            >
              Play Encore Round
            </Button>
            <Button
              size="md"
              rightSection={<IconArrowRight size={18} />}
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