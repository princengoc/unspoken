import { useEffect, useState } from 'react';
import { Paper, Group, Avatar, Text, Badge, Stack, useMantineTheme, ScrollArea } from '@mantine/core';
import { IconSparkles, IconHeart, IconBulb, IconRipple, IconLock, IconWorld } from '@tabler/icons-react';
import { reactionsService, ListenerReaction, ReactionType } from '@/services/supabase/reactions';
import { motion, AnimatePresence } from 'framer-motion';

// Define reaction display config
const REACTION_CONFIG = {
  inspiring: { icon: IconSparkles, color: 'blue', label: 'Inspiring' },
  resonates: { icon: IconHeart, color: 'pink', label: 'Resonates' },
  metoo: { icon: IconBulb, color: 'yellow', label: 'Me too!' },
} as const;

type ReactionGroup = {
  type: ReactionType;
  reactions: (ListenerReaction & { username?: string })[];
};

interface ReactionsFeedProps {
  gameStateId: string;
  speakerId: string;
  cardId: string;
  currentUserId: string;
  membersMap: Record<string, { username: string | null }>;
}

export function ReactionsFeed({ gameStateId, speakerId, cardId, currentUserId, membersMap }: ReactionsFeedProps) {
  const [reactionGroups, setReactionGroups] = useState<ReactionGroup[]>([]);
  const [ripples, setRipples] = useState<(ListenerReaction & { username?: string })[]>([]);
  const theme = useMantineTheme();

  // Load and subscribe to reactions
  useEffect(() => {
    if (!gameStateId || !speakerId || !cardId) return;

    // Initial load of reactions
    const loadReactions = async () => {
      try {
        // We're using a specific RPC to get all reactions for a card/speaker
        // This includes reactions from all listeners, not just the current user
        const { data } = await reactionsService.getReactionsForSpeaker(gameStateId, speakerId, cardId);
        processReactions(data || []);
      } catch (error) {
        console.error('Failed to load reactions for speaker:', error);
      }
    };

    loadReactions();

    // Subscribe to all reactions for this game state
    const subscription = reactionsService.subscribeToReactions(
      gameStateId,
      (allReactions) => {
        // Filter to only get reactions relevant to this speaker/card
        const relevantReactions = allReactions.filter(
          r => r.speakerId === speakerId && r.cardId === cardId
        );
        processReactions(relevantReactions);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [gameStateId, speakerId, cardId, membersMap]);

  // Process and group reactions
  const processReactions = (reactions: ListenerReaction[]) => {
    // Enhance reactions with usernames
    const enhancedReactions = reactions.map(reaction => ({
      ...reaction,
      username: membersMap[reaction.listenerId]?.username || 'Anonymous'
    }));

    // Filter and group by type
    const reactionsByType = Object.keys(REACTION_CONFIG).reduce<Record<string, (ListenerReaction & { username?: string })[]>>((acc, type) => {
      acc[type] = enhancedReactions.filter(r => 
        r.type === type && 
        (!r.isPrivate || r.listenerId === currentUserId || r.speakerId === currentUserId)
      );
      return acc;
    }, {});

    // Create final grouped structure
    const groups = Object.entries(reactionsByType).map(([type, reactions]) => ({
      type: type as ReactionType,
      reactions
    })).filter(group => group.reactions.length > 0);

    // Handle ripples separately
    const relevantRipples = enhancedReactions.filter(r => 
      r.rippleMarked && 
      (!r.isPrivate || r.listenerId === currentUserId || r.speakerId === currentUserId)
    );

    setReactionGroups(groups);
    setRipples(relevantRipples);
  };

  // Early return if no reactions
  if (reactionGroups.length === 0 && ripples.length === 0) {
    return null;
  }

  return (
    <Paper 
      p="sm" 
      radius="md" 
      shadow="sm" 
      withBorder
      style={{ 
        maxWidth: '100%',
      }}
    >
      <Stack gap="xs">
        <Text size="sm" fw={500} c="dimmed">Reactions</Text>
        
        <ScrollArea h={200} type="auto">
          <Stack gap="md">
            <AnimatePresence>
              {/* Standard reactions */}
              {reactionGroups.map((group) => {
                const { icon: Icon, color, label } = REACTION_CONFIG[group.type];
                return (
                  <motion.div
                    key={group.type}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Paper p="xs" radius="sm" withBorder>
                      <Stack gap="xs">
                        <Group justify="apart">
                          <Group gap="xs">
                            <Icon color={theme.colors[color][6]} size={18} />
                            <Text size="sm" fw={500}>{label}</Text>
                          </Group>
                          <Badge size="sm" color={color}>
                            {group.reactions.length}
                          </Badge>
                        </Group>
                        
                        <Group gap="xs">
                          {group.reactions.map((reaction) => (
                            <motion.div
                              key={reaction.id}
                              initial={{ scale: 0.8 }}
                              animate={{ scale: 1 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Avatar 
                                size="sm" 
                                radius="xl" 
                                color={color}
                                style={{ opacity: reaction.isPrivate ? 0.7 : 1 }}
                              >
                                {reaction.username?.charAt(0) || '?'}
                              </Avatar>
                              {reaction.isPrivate && (
                                <div style={{ 
                                  position: 'absolute', 
                                  bottom: -2, 
                                  right: -2,
                                  background: theme.white,
                                  borderRadius: '50%',
                                  padding: 2
                                }}>
                                  <IconLock size={10} />
                                </div>
                              )}
                            </motion.div>
                          ))}
                        </Group>
                      </Stack>
                    </Paper>
                  </motion.div>
                );
              })}

              {/* Ripples section */}
              {ripples.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Paper p="xs" radius="sm" withBorder>
                    <Stack gap="xs">
                      <Group justify="apart">
                        <Group gap="xs">
                          <IconRipple color={theme.colors.violet[6]} size={18} />
                          <Text size="sm" fw={500}>Saved for later</Text>
                        </Group>
                        <Badge size="sm" color="violet">
                          {ripples.length}
                        </Badge>
                      </Group>
                      
                      <Group gap="xs">
                        {ripples.map((reaction) => (
                          <motion.div
                            key={reaction.id}
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Avatar 
                              size="sm" 
                              radius="xl" 
                              color="violet"
                              style={{ opacity: reaction.isPrivate ? 0.7 : 1 }}
                            >
                              {reaction.username?.charAt(0) || '?'}
                            </Avatar>
                            {reaction.isPrivate && (
                              <div style={{ 
                                position: 'absolute', 
                                bottom: -2, 
                                right: -2,
                                background: theme.white,
                                borderRadius: '50%',
                                padding: 2
                              }}>
                                <IconLock size={10} />
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </Group>
                    </Stack>
                  </Paper>
                </motion.div>
              )}
            </AnimatePresence>
          </Stack>
        </ScrollArea>
      </Stack>
    </Paper>
  );
}