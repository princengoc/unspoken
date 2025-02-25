import { Stack, Button, Group, Box } from "@mantine/core";
import { motion } from "framer-motion";
import { useFullRoom } from "@/context/FullRoomProvider";
import { ListenerReactions } from "../ListenerReactions";
import { Card } from "../Card";
import { useCardsInGame } from "@/context/CardsInGameProvider";
import { useRoomMembers } from "@/context/RoomMembersProvider";
import { ReactionsFeed } from "../ReactionsFeed";
import { useAuth } from "@/context/AuthProvider";
import { getPlayerAssignments } from "../statusBarUtils";
import { useRoom } from "@/context/RoomProvider";
import { useDisclosure } from "@mantine/hooks";
import { AudioMessageContainer } from "@/components/AudioMessage";
import { AudioMessagesProvider } from "@/context/AudioMessagesProvider";

type SpeakingProp = {
  roomId: string;
};

export function Speaking({ roomId }: SpeakingProp) {
  const { user } = useAuth();
  const { room } = useRoom();
  const { isActiveSpeaker, finishSpeaking } = useFullRoom();
  const [isSpeaking, { toggle }] = useDisclosure(false);
  const { cardState, getCardById } = useCardsInGame();
  const { members  } = useRoomMembers();

  const playerAssignments = getPlayerAssignments(members, roomId);

  const handleSpeakButtonClick = () => {
    if (isSpeaking) {
      finishSpeaking();
    }
    toggle();
  };

  if (!room?.active_player_id) return null;
  const activeCard = getCardById(
    cardState.selectedCards[room.active_player_id],
  );
  const activeSpeakerIcon = playerAssignments.get(room?.active_player_id);
  const activeSpeakerName =
    members.find((member) => member.id === room.active_player_id)?.username ||
    "";
  if (!activeCard) return null;
  if (!activeSpeakerIcon) return null;

  return (
    <Stack gap="md">
      <Group justify="center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card
            card={activeCard}
            index={0}
            total={1}
            playerAssignment={activeSpeakerIcon}
            playerName={activeSpeakerName}
          />
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
            color={isSpeaking ? "green" : "blue"}
          >
            {isSpeaking ? "Finish Speaking" : "Start Speaking"}
          </Button>
        ) : (
          <Stack>
            <ListenerReactions
              speakerId={room.active_player_id}
              cardId={activeCard.id}
              roomId={roomId}
              userId={user.id}
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

      <AudioMessagesProvider roomId={roomId}>
        <AudioMessageContainer />
      </AudioMessagesProvider>
    </Stack>
  );
}
