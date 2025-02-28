// src/components/game/ReactionsFeed.tsx
import { Group, Avatar, Tooltip, useMantineTheme, Box, Badge, Text } from "@mantine/core";
import {
  IconHeart,
  IconRipple,
  IconRecordMail,
  IconMessages
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { useReactions } from "@/context/ReactionsProvider";
import type { PlayerAssignment } from "./statusBarUtils";
import { PlayerAvatar } from "./PlayerAvatar";

interface ReactionsFeedProps {
  playerAssignments: Map<string, PlayerAssignment>;
}

/**
 * ReactionsFeed shows incoming reactions directed at the current user's card
 */
export function ReactionsFeed({
  playerAssignments,
}: ReactionsFeedProps) {
  const theme = useMantineTheme();
  
  // Use the centralized reactions provider
  const { 
    incomingReactions,
    loading,
  } = useReactions();

  // Filter reactions relevant to this card and user
  const cardReactions = incomingReactions;
  
  // Group reactions by type
  const resonatesReactions = cardReactions.filter(r => r.type === "resonates");
  const rippleReactions = cardReactions.filter(r => r.rippleMarked);
  
  // Special indicators
  const recordingReactions = cardReactions.filter(r => r.type === "metoo");
  const responseRequestReactions = cardReactions.filter(r => r.type === "tellmemore");
  
  const someoneIsRecording = recordingReactions.length > 0;
  const someoneWantsResponse = responseRequestReactions.length > 0;

  // If no reactions, show nothing
  if (cardReactions.length === 0 && !loading) {
    return null;
  }

  // Show loading state
  if (loading && cardReactions.length === 0) {
    return <Text size="xs" c="dimmed">Loading reactions...</Text>;
  }

  return (
    <Box>
      {/* Recording & Response Request Indicators */}
      <Group gap="sm" justify="center" my="sm">
        {/* Recording indicator */}
        {someoneIsRecording && (
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
              opacity: [0.9, 1, 0.9] 
            }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              repeatType: "loop"
            }}
          >
            <Tooltip label={recordingReactions.length === 1 
                ? "Someone is recording a response for you"
                : `${recordingReactions.length} people are recording for you`
            }>
              <Badge 
                color="blue" 
                size="md" 
                radius="sm"
                leftSection={<IconRecordMail size={14} />}
              >
                {recordingReactions.length > 1 ? recordingReactions.length : ""}
              </Badge>
            </Tooltip>
          </motion.div>
        )}

        {/* Response request indicator */}
        {someoneWantsResponse && (
          <Tooltip label={responseRequestReactions.length === 1 
              ? "Someone wants a response from you"
              : `${responseRequestReactions.length} people want a response from you`
          }>
            <Badge 
              color="orange" 
              size="md" 
              radius="sm"
              leftSection={<IconMessages size={14} />}
            >
              {responseRequestReactions.length > 1 ? responseRequestReactions.length : ""}
            </Badge>
          </Tooltip>
        )}
      </Group>

      {/* Other reaction types */}
      <Group justify="center" gap="xl">
        {/* Display resonates reactions */}
        {resonatesReactions.length > 0 && (
          <Group gap="xs" justify="center">
            <IconHeart color={theme.colors.pink[6]} size={16} />
            {resonatesReactions.slice(0, 3).map((reaction, index) => (
              <Box 
                key={reaction.id}
                style={{ 
                  marginLeft: index > 0 ? -8 : 0,
                  position: "relative" 
                }}
              >
                <PlayerAvatar
                  assignment={playerAssignments.get(reaction.fromId)!}
                  size="xs"
                  highlighted={false}
                />
              </Box>
            ))}
            {resonatesReactions.length > 3 && (
              <Tooltip label={`${resonatesReactions.length - 3} more`}>
                <Avatar
                  size="xs"
                  radius="xl"
                  color="pink"
                  style={{
                    marginLeft: -8,
                    border: `1px solid ${theme.white}`,
                  }}
                >
                  {resonatesReactions.length - 3}
                </Avatar>
              </Tooltip>
            )}
          </Group>
        )}
        
        {/* Display ripple reactions */}
        {rippleReactions.length > 0 && (
          <Group gap="xs" justify="center">
            <IconRipple color={theme.colors.violet[6]} size={16} />
            {rippleReactions.slice(0, 3).map((reaction, index) => (
              <Box 
                key={reaction.id}
                style={{ 
                  marginLeft: index > 0 ? -8 : 0,
                  position: "relative" 
                }}
              >
                <PlayerAvatar
                  assignment={playerAssignments.get(reaction.fromId)!}
                  size="xs"
                  highlighted={false}
                />
              </Box>
            ))}
            {rippleReactions.length > 3 && (
              <Tooltip label={`${rippleReactions.length - 3} more`}>
                <Avatar
                  size="xs"
                  radius="xl"
                  color="violet"
                  style={{
                    marginLeft: -8,
                    border: `1px solid ${theme.white}`,
                  }}
                >
                  {rippleReactions.length - 3}
                </Avatar>
              </Tooltip>
            )}
          </Group>
        )}
      </Group>
    </Box>
  );
}