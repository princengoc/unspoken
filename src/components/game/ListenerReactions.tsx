// src/components/game/ListenerReactions.tsx

import { useState, useEffect } from 'react';
import { Group, ActionIcon, Tooltip, Paper, Stack, Avatar } from '@mantine/core';
import { IconSparkles, IconHeart, IconBulb, IconRipple } from '@tabler/icons-react';
import { useAuth } from '@/context/AuthProvider';
import { gameStatesService } from '@/services/supabase/gameStates';
import { motion, AnimatePresence } from 'framer-motion';

interface Reaction {
  id: string;
  type: string;
  userId: string;
  timestamp: string;
}

interface ReactionsState {
  activeReactions: Reaction[];
  rippleMarked: boolean;
}

const REACTIONS = [
  { id: 'inspiring', icon: IconSparkles, label: 'Inspiring' },
  { id: 'resonates', icon: IconHeart, label: 'Resonates' },
  { id: 'metoo', icon: IconBulb, label: 'Me too!' }
] as const;

interface ListenerReactionsProps {
  sessionId: string;
}

export function ListenerReactions({ sessionId }: ListenerReactionsProps) {
  const { user } = useAuth();
  const [reactionState, setReactionState] = useState<ReactionsState>({
    activeReactions: [],
    rippleMarked: false
  });

  // Sync reactions with server
  useEffect(() => {
    if (!sessionId) return;

    const loadReactions = async () => {
      try {
        const state = await gameStatesService.get(sessionId);
        if (state.reactions) {
          setReactionState(state.reactions);
        }
      } catch (error) {
        console.error('Failed to load reactions:', error);
      }
    };

    loadReactions();

    // Subscribe to reaction changes
    const subscription = gameStatesService.subscribeToChanges(sessionId, (state) => {
      if (state.reactions) {
        setReactionState(state.reactions);
      }
    });

    return () => subscription.unsubscribe();
  }, [sessionId]);

  const toggleReaction = async (reactionId: string) => {
    if (!user || !sessionId) return;

    try {
      const newReaction: Reaction = {
        id: reactionId,
        type: reactionId,
        userId: user.id,
        timestamp: new Date().toISOString()
      };

      // Check if user already has this reaction
      const hasReaction = reactionState.activeReactions.some(
        r => r.id === reactionId && r.userId === user.id
      );

      let updatedReactions;
      if (hasReaction) {
        // Remove reaction
        updatedReactions = reactionState.activeReactions.filter(
          r => !(r.id === reactionId && r.userId === user.id)
        );
      } else {
        // Add reaction
        updatedReactions = [...reactionState.activeReactions, newReaction];
      }

      // Update local state
      setReactionState(prev => ({
        ...prev,
        activeReactions: updatedReactions
      }));

      // Sync with server
      await gameStatesService.update(sessionId, {
        reactions: {
          ...reactionState,
          activeReactions: updatedReactions
        }
      });
    } catch (error) {
      console.error('Failed to toggle reaction:', error);
    }
  };

  const toggleRipple = async () => {
    if (!user || !sessionId) return;

    try {
      const newState = {
        ...reactionState,
        rippleMarked: !reactionState.rippleMarked
      };

      // Update local state
      setReactionState(newState);

      // Sync with server
      await gameStatesService.update(sessionId, {
        reactions: newState
      });
    } catch (error) {
      console.error('Failed to toggle ripple:', error);
    }
  };

  // Group reactions by user
  const reactionsByUser = reactionState.activeReactions.reduce((acc, reaction) => {
    if (!acc[reaction.userId]) {
      acc[reaction.userId] = [];
    }
    acc[reaction.userId].push(reaction);
    return acc;
  }, {} as Record<string, Reaction[]>);

  return (
    <Stack spacing="md">
      {/* Active Reactions Display */}
      <AnimatePresence>
        {Object.entries(reactionsByUser).map(([userId, reactions]) => (
          <motion.div
            key={userId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Group spacing="xs" align="center">
              <Avatar size="sm" radius="xl">
                {userId.charAt(0).toUpperCase()}
              </Avatar>
              <Group spacing={4}>
                {reactions.map((reaction) => {
                  const ReactionIcon = REACTIONS.find(r => r.id === reaction.type)?.icon;
                  return ReactionIcon ? (
                    <motion.div
                      key={`${reaction.userId}-${reaction.id}`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <ReactionIcon size={16} />
                    </motion.div>
                  ) : null;
                })}
              </Group>
            </Group>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Reaction Controls */}
      <Paper 
        pos="relative" 
        p="xs"
        radius="xl"
        bg="white"
        style={{ 
          backdropFilter: 'blur(8px)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Group spacing="xs">
          {REACTIONS.map(({ id, icon: Icon, label }) => {
            const isActive = reactionState.activeReactions.some(
              r => r.id === id && r.userId === user?.id
            );
            
            return (
              <Tooltip key={id} label={label}>
                <ActionIcon
                  variant={isActive ? "filled" : "subtle"}
                  color="blue"
                  onClick={() => toggleReaction(id)}
                  radius="xl"
                  size="lg"
                >
                  <Icon size={18} />
                </ActionIcon>
              </Tooltip>
            );
          })}

          <Tooltip label="Save for later (Ripple)">
            <ActionIcon
              variant={reactionState.rippleMarked ? "filled" : "subtle"}
              color="violet"
              onClick={toggleRipple}
              radius="xl"
              size="lg"
            >
              <IconRipple size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Paper>
    </Stack>
  );
}