import { Stack, Button, Group, Box } from '@mantine/core';
import { motion } from 'framer-motion';
import { useGameState } from '@/context/GameStateProvider';
import { useRoom } from '@/context/RoomProvider';
import { ListenerReactions } from '../ListenerReactions';
import { Card } from '../Card';
import { useCardsInGame } from '@/context/CardsInGameProvider';
import { useRoomMembers } from '@/context/RoomMembersProvider';
import { ReactionsFeed } from '../ReactionsFeed';
import { useAuth } from '@/context/AuthProvider';

type SpeakingProp = {
  gameStateId: string
}

export function Speaking({ gameStateId }: SpeakingProp) {
  const { user } = useAuth();
  const { activePlayerId } = useGameState();
  const { isActiveSpeaker, currentSpeakerHasStarted, startSpeaking, finishSpeaking } = useRoom();
  const { cardState, getCardById } = useCardsInGame();
  const { members } = useRoomMembers();

 // Convert members array to a map for easier lookup
  const membersMap = members.reduce((acc, member) => {
    acc[member.id] = { username: member.username };
      return acc;
  }, {} as Record<string, { username: string | null }>);


  if (!activePlayerId) return null;
  const activeCard = getCardById(cardState.selectedCards[activePlayerId]);
  if (!activeCard) return null;

  return (
    <Stack gap="md">
      <Group justify='center'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card card={activeCard} index={0} total={1} />
      </motion.div>
      </Group>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {isActiveSpeaker ? (
          <>
            <Button
              onClick={currentSpeakerHasStarted ? finishSpeaking : startSpeaking}
              fullWidth
              size="lg"
              variant="filled"
              color={currentSpeakerHasStarted ? 'green' : 'blue'}
            >
              {currentSpeakerHasStarted ? 'Finish Sharing' : 'Start Sharing'}
            </Button>
            {/* Show reactions to the speaker */}
            {currentSpeakerHasStarted && user && (
                 <Box mt="md">
                   <ReactionsFeed
                     gameStateId={gameStateId}
                     speakerId={activePlayerId}
                     cardId={activeCard.id}
                     currentUserId={user.id}
                     membersMap={membersMap}
                   />
                 </Box>
               )}            
          </>
        ) : (
          <>
            <ListenerReactions
              speakerId={activePlayerId}
              cardId={activeCard.id}
              gameStateId={gameStateId}
            />
            {/* Show reactions to everyone if not private */}
            {user && currentSpeakerHasStarted && (
                 <Box mt="md">
                   <ReactionsFeed
                     gameStateId={gameStateId}
                     speakerId={activePlayerId}
                     cardId={activeCard.id}
                     currentUserId={user.id}
                     membersMap={membersMap}
                   />
                 </Box>
               )}            
          </>
        )}
      </motion.div>
    </Stack>
  );
}