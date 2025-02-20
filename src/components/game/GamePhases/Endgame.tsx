// src/components/game/GamePhases/Endgame.tsx
import { useEffect, useState } from 'react';
import { Container, Stack, Title, Text, Group, Button, Paper, Switch, Select, SimpleGrid } from '@mantine/core';
import { IconRepeat, IconArrowRight } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { motion } from 'framer-motion';
import { useRoomMembers } from '@/context/RoomMembersProvider';
import { useCardsInGame } from '@/context/CardsInGameProvider';
import { useRoom } from '@/context/RoomProvider';
import { SlideIn, FadeIn } from '@/components/animations/Motion';
import { MiniCard } from '../CardDeck/MiniCard';
import { getPlayerAssignments } from '../statusBarUtils';
import { RoomSettings } from '@/core/game/types';
import { GameSettingsForm } from '@/components/room/GameSettingsForm';


type EndgameProp = {
  roomId: string | undefined
}

export function Endgame({roomId}: EndgameProp) {
  const { members } = useRoomMembers();
  const { cardState, getCardById } = useCardsInGame();
  const { isCreator, startNextRound, room } = useRoom();
  const [showingCards, setShowingCards] = useState(false);
  const [nextRoundSettings, setNextRoundSettings] = useState<Partial<RoomSettings>>({
      ripple_only: false,
      card_depth: null,
  });
  const [loading, setLoading] = useState(false);
  
  if (!roomId) return null;  
  const playerAssignments = getPlayerAssignments(members, roomId);

  useEffect(() => {
    // Delay showing cards for a dramatic effect
    const timer = setTimeout(() => {
      setShowingCards(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (room?.settings?.card_depth) {
      setNextRoundSettings(prev => ({
        ...prev,
        card_depth: room?.settings?.card_depth
      }));
    }
  }, [room?.settings?.card_depth]);  
  
  // Get player to card mapping
  const playerCards = Object.entries(cardState.selectedCards).map(([playerId, cardId]) => {
    const player = members.find(m => m.id === playerId);
    const card = getCardById(cardId);

    const contributorId = card?.contributor_id;
    const contributor = contributorId 
      ? members.find(m => m.id === contributorId) 
      : undefined;    
    return { 
      playerId, 
      playerName: player?.username || "Unknown Player", 
      playerAssignments: playerAssignments.get(playerId),
      card, 
      contributorName: contributor?.username, 
      contributorAssignment: contributorId ? playerAssignments.get(contributorId) : undefined
    };
  });

  const handleStartEncore = async () => {
    if (!isCreator) return;
    
    setLoading(true);
    try {
      await startNextRound(nextRoundSettings);
      notifications.show({
        title: 'Success',
        message: 'Encore round started!',
        color: 'green'
      });
    } catch (error) {
      console.error('Failed to start encore:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to start encore round',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };  

  return (
    <Container size="lg" py="md">
      <Stack gap="xs">
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
            <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="xs" verticalSpacing='xs'>
                {playerCards.map(({ playerId, playerName, playerAssignments, card, contributorAssignment, contributorName }, index) => (
                card && (
                  <SlideIn key={playerId} delay={index * 0.1}>
                        <MiniCard
                          card={card}
                          showSender={true}
                          playerAssignment={playerAssignments}
                          playerName={playerName}
                          contributorAssignment={contributorAssignment}
                          contributorName={contributorName}
                        />
                  </SlideIn>
                )
              ))}
            </SimpleGrid>
          </motion.div>
        )}
        
        {isCreator && (
         <Paper p="md" radius="md" withBorder mt="md">
           <Stack gap="md">
             <Title order={4}>Play an Encore Round</Title>
             
             <GameSettingsForm 
             initialSettings={room?.settings || {}}
              onChange={setNextRoundSettings}
              rippleOnlyDescription='Use rippled cards from previous round'
              />
                         
             <Group justify="center" mt="sm">
               <Button
                 size="md"
                 leftSection={<IconRepeat size={18} />}
                 onClick={handleStartEncore}
                 color="indigo"
                 loading={loading}
               >
                 Start Encore Round
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
           </Stack>
         </Paper>
        )}
        
        {!isCreator && (
          <Paper p="md" radius="md">
            <Text ta="center">
              Waiting for room creator to start an encore or end the game...
            </Text>
          </Paper>
        )}
      </Stack>
    </Container>
  );
}