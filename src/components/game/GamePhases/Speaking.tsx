import { Stack, Button, Group, Box, Text } from "@mantine/core";
import { motion } from "framer-motion";
import { useFullRoom } from "@/context/FullRoomProvider";
import { Card } from "../Card";
import { useCardsInGame } from "@/context/CardsInGameProvider";
import { useRoomMembers } from "@/context/RoomMembersProvider";
import { getPlayerAssignments } from "../statusBarUtils";
import { useRoom } from "@/context/RoomProvider";

type SpeakingProp = {
  roomId: string;
};

export function Speaking({ roomId }: SpeakingProp) {
  const { finishSpeaking } = useRoom();
  const { isActiveSpeaker } = useFullRoom();
  const { cardState, getCardById } = useCardsInGame();
  const { members } = useRoomMembers();
  const { room } = useRoom();

  const playerAssignments = getPlayerAssignments(members, roomId);

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
            onClick={finishSpeaking}
            justify="center"
            size="xs"
            variant="filled"
          >
            Finish sharing your story
          </Button>
        ) : (
          <Box ta="center">
            <Text c="dimmed" size="sm">
              Listen to the speaker's story
            </Text>
          </Box>
        )}
      </motion.div>
    </Stack>
  );
}
