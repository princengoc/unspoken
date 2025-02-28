import { useEffect, useState } from "react";
import { Group, Avatar, Tooltip, useMantineTheme, Box, Badge, Text } from "@mantine/core";
import {
  IconHeart,
  IconRipple,
  IconMessageCircle,
  IconQuestionMark,
} from "@tabler/icons-react";
import {
  reactionsService,
  ListenerReaction,
  ReactionType,
} from "@/services/supabase/reactions";
import { motion } from "framer-motion";
import type { PlayerAssignment } from "./statusBarUtils";
import { PlayerAvatar } from "./PlayerAvatar";

// Define reaction display config
const REACTION_CONFIG = {
  resonates: { icon: IconHeart, color: "pink", label: "Resonates" },
  metoo: { icon: IconMessageCircle, color: "blue", label: "Recording" },
  tellmemore: { icon: IconQuestionMark, color: "orange", label: "Requesting response" },
} as const;

interface ReactionsFeedProps {
  roomId: string;
  speakerId: string;      // The player who owns the card
  cardId: string;         // The card ID
  currentUserId: string;  // Current user viewing the reactions
  playerAssignments: Map<string, PlayerAssignment>;
}

/**
 * ReactionsFeed shows incoming reactions directed at the specified player/card
 * If speakerId === currentUserId: Shows reactions from others to the current user
 * If speakerId !== currentUserId: This component should not display anything
 */
export function ReactionsFeed({
  roomId,
  speakerId,
  cardId,
  currentUserId,
  playerAssignments,
}: ReactionsFeedProps) {
  const [reactions, setReactions] = useState<ListenerReaction[]>([]);
  const [loading, setLoading] = useState(true);
  const theme = useMantineTheme();

  // Only show if user is looking at their own card
  const isShowingUserOwnCard = speakerId === currentUserId;
  
  // Load reactions from other players directed to this player/card
  useEffect(() => {
    if (!roomId || !speakerId || !cardId) return;
    
    // Don't fetch if this isn't for the current user's card
    if (!isShowingUserOwnCard) {
      setLoading(false);
      return;
    }

    const loadReactions = async () => {
      setLoading(true);
      try {
        // Get all reactions for this speaker's card
        const { data } = await reactionsService.getReactionsForSpeaker(
          roomId,
          speakerId,
          cardId,
        );
        
        // Filter out reactions from the current user
        const reactionsFromOthers = data.filter(r => r.listenerId !== currentUserId);
        setReactions(reactionsFromOthers);
      } catch (error) {
        console.error("Failed to load reactions:", error);
      } finally {
        setLoading(false);
      }
    };

    loadReactions();

    // Subscribe to all reactions for this room
    const subscription = reactionsService.subscribeToReactions(
      roomId,
      (allReactions) => {
        // Filter to only get reactions from others to this user's card
        const relevantReactions = allReactions.filter(
          (r) => r.speakerId === speakerId && 
                 r.cardId === cardId && 
                 r.listenerId !== currentUserId
        );
        setReactions(relevantReactions);
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [roomId, speakerId, cardId, currentUserId, isShowingUserOwnCard]);

  // Only show reactions feed for user's own card
  if (!isShowingUserOwnCard) {
    return null;
  }

  // Group reactions by type
  const reactionsByType = new Map<ReactionType, ListenerReaction[]>();
  const rippleReactions: ListenerReaction[] = [];
  
  // Sort reactions into groups
  reactions.forEach(reaction => {
    if (reaction.rippleMarked) {
      rippleReactions.push(reaction);
    } else if (reaction.type) {
      if (!reactionsByType.has(reaction.type)) {
        reactionsByType.set(reaction.type, []);
      }
      reactionsByType.get(reaction.type)!.push(reaction);
    }
  });

  // Special handling for "recording" indicator
  const someoneIsRecording = reactionsByType.get("metoo").length > 0;
  
  // Special handling for "requesting response" indicator
  const someoneWantsResponse = reactionsByType.get("tellmemore")?.length > 0;

  // If no reactions, show nothing
  if (reactions.length === 0 && !loading) {
    return null;
  }

  // Show loading state
  if (loading) {
    return <Text size="xs" c="dimmed">Loading reactions...</Text>;
  }

  return (
    <Box>
      {/* Recording indicator */}
      {someoneIsRecording && (
        <Box my="sm">
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
            <Badge 
              color="blue" 
              size="md" 
              radius="sm" 
              leftSection={<IconMessageCircle size={14} />}
            >
              {reactionsByType.get("metoo")?.length === 1 
                ? "Someone is recording a response for you"
                : `${reactionsByType.get("metoo")?.length} people are recording for you`
              }
            </Badge>
          </motion.div>
        </Box>
      )}

      {/* Response request indicator */}
      {someoneWantsResponse && (
        <Box my="sm">
          <Badge 
            color="orange" 
            size="md" 
            radius="sm" 
            leftSection={<IconQuestionMark size={14} />}
          >
            {reactionsByType.get("tellmemore")?.length === 1 
              ? "Someone wants a response from you"
              : `${reactionsByType.get("tellmemore")?.length} people want a response from you`
            }
          </Badge>
        </Box>
      )}

      {/* Other reaction types */}
      <Group justify="center" gap="xl">
        {/* Display resonates reactions */}
        {reactionsByType.has("resonates") && reactionsByType.get("resonates")!.length > 0 && (
          <Group gap="xs" justify="center">
            <IconHeart color={theme.colors.pink[6]} size={16} />
            {reactionsByType.get("resonates")!.slice(0, 3).map((reaction, index) => (
              <Box 
                key={reaction.id}
                style={{ 
                  marginLeft: index > 0 ? -8 : 0,
                  position: "relative" 
                }}
              >
                <PlayerAvatar
                  assignment={playerAssignments.get(reaction.listenerId)!}
                  size="xs"
                  highlighted={false}
                />
              </Box>
            ))}
            {reactionsByType.get("resonates")!.length > 3 && (
              <Tooltip label={`${reactionsByType.get("resonates")!.length - 3} more`}>
                <Avatar
                  size="xs"
                  radius="xl"
                  color="pink"
                  style={{
                    marginLeft: -8,
                    border: `1px solid ${theme.white}`,
                  }}
                >
                  {reactionsByType.get("resonates")!.length - 3}
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
                  assignment={playerAssignments.get(reaction.listenerId)!}
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