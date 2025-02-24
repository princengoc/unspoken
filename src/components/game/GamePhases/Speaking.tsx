import { Stack, Button, Group, Box, Text } from '@mantine/core';
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
import { useDisclosure } from '@mantine/hooks';
import { PlayerAvatar } from '../PlayerAvatar';

type SpeakingProp = {
  roomId: string
}

export function Speaking({ roomId }: SpeakingProp) {
  const { user } = useAuth();
  const { room } = useRoom();
  const { isActiveSpeaker, finishSpeaking } = useFullRoom();
  
  const { cardState, getCardById } = useCardsInGame();
  const { members } = useRoomMembers();
  const [isSpeaking, { toggle }] = useDisclosure(false);  

  if (!room?.active_player_id) return null;
  const activeCard = getCardById(cardState.selectedCards[room.active_player_id]);
  if (!activeCard) return null;

  const playerAssignments = getPlayerAssignments(members, roomId);

  const handleSpeakButtonClick = () => {
    if (isSpeaking) {
      finishSpeaking();
    }
    toggle();
  };  

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
            <Button
              onClick={handleSpeakButtonClick}
              justify="center"
              size="xs"
              variant="filled"
              color={isSpeaking ? 'green' : 'blue'}
            >
              {isSpeaking ? 'Finish Speaking' : 'Start Speaking'}
            </Button>      
        ) : (
          <Stack>
            <Group>
              <PlayerAvatar
                 assignment={playerAssignments.get(room.active_player_id)!}
                 size="xs"
                 showTooltip={false}
               /> <span>is sharing</span>
            </Group>
            <ListenerReactions
              speakerId={room.active_player_id}
              cardId={activeCard.id}
              roomId={roomId}
            />
          </Stack>
        )}

        <Box mt="md">
          <ReactionsFeed
            roomId={roomId}
            speakerId={room.active_player_id}
            cardId={activeCard.id}
            currentUserId={user.id}
            playerAssignments={playerAssignments}
          />
        </Box>        
      </motion.div>
    </Stack>
  );
}