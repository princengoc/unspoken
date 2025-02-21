import { Stack, Button, Group, Box } from '@mantine/core';
import { motion } from 'framer-motion';
import { useFullRoom } from '@/context/FullRoomProvider';
import { ListenerReactions } from '../ListenerReactions';
import { Card } from '../Card';
import { useCardsInGame } from '@/context/CardsInGameProvider';
import { useRoomMembers } from '@/context/RoomMembersProvider';
import { ReactionsFeed } from '../ReactionsFeed';
import { useAuth } from '@/context/AuthProvider';
import { getPlayerAssignments } from '../statusBarUtils';
import { useRoom } from '@/context/RoomProvider';

type SpeakingProp = {
  roomId: string
}

export function Speaking({ roomId }: SpeakingProp) {
  const { user } = useAuth();
  const { room } = useRoom();
  const { isActiveSpeaker, currentSpeakerHasStarted, startSpeaking, finishSpeaking } = useFullRoom();
  const { cardState, getCardById } = useCardsInGame();
  const { members } = useRoomMembers();

  if (!room?.active_player_id) return null;
  const activeCard = getCardById(cardState.selectedCards[room.active_player_id]);
  if (!activeCard) return null;

  const playerAssignments = getPlayerAssignments(members, roomId);

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
              justify='center'
              size="xs"
              variant="filled"
              color={currentSpeakerHasStarted ? 'green' : 'blue'}
            >
              {currentSpeakerHasStarted ? 'Finish Sharing' : 'Start Sharing'}
            </Button>
            {/* Show reactions to the speaker */}
            {currentSpeakerHasStarted && user && (
                 <Box mt="md">
                   <ReactionsFeed
                     roomId={roomId}
                     speakerId={room.active_player_id}
                     cardId={activeCard.id}
                     currentUserId={user.id}
                     playerAssignments={playerAssignments}
                   />
                 </Box>
               )}            
          </>
        ) : (
          <>
            <ListenerReactions
              speakerId={room.active_player_id}
              cardId={activeCard.id}
              roomId={roomId}
            />
            {/* Show reactions to everyone if not private */}
            {user && currentSpeakerHasStarted && (
                 <Box mt="md">
                   <ReactionsFeed
                     roomId={roomId}
                     speakerId={activePlayerId}
                     cardId={activeCard.id}
                     currentUserId={user.id}
                     playerAssignments={playerAssignments}
                   />
                 </Box>
               )}            
          </>
        )}
      </motion.div>
    </Stack>
  );
}