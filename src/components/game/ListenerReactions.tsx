import { Group, ActionIcon, Tooltip, Paper, Stack, Avatar } from '@mantine/core';
import { IconSparkles, IconHeart, IconBulb, IconRipple } from '@tabler/icons-react';
import { useAuth } from '@/context/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { useReactions } from '@/hooks/game/useReactions';
import type { ReactionType } from '@/services/supabase/reactions';

const REACTIONS = [
  { id: 'inspiring' as ReactionType, icon: IconSparkles, label: 'Inspiring' },
  { id: 'resonates' as ReactionType, icon: IconHeart, label: 'Resonates' },
  { id: 'metoo' as ReactionType, icon: IconBulb, label: 'Me too!' }
] as const;

interface ListenerReactionsProps {
  speakerId: string;
  cardId: string;
  gameStateId: string
}

export function ListenerReactions({ 
  speakerId,
  cardId, 
  gameStateId
}: ListenerReactionsProps) {
  const { user } = useAuth();
  
  if (!user || !gameStateId) return null;

  const { 
    reactions,
    loading,
    toggleReaction,
    toggleRipple,
    hasReaction,
    isRippled
  } = useReactions({
    gameStateId,
    speakerId,
    listenerId: user.id,
    cardId
  });

  // Group reactions by user for display
  const reactionsByUser = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.listenerId]) {
      acc[reaction.listenerId] = [];
    }
    acc[reaction.listenerId].push(reaction);
    return acc;
  }, {} as Record<string, typeof reactions>);

  return (
    <Stack spacing="md">
      {/* Active Reactions Display */}
      <Paper p="md" radius="md" withBorder>
        <AnimatePresence>
          {Object.entries(reactionsByUser).map(([userId, userReactions]) => (
            <motion.div
              key={userId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Group spacing="xs" align="center">
                <Avatar size="sm" radius="xl">
                  {userId.charAt(0).toUpperCase()}
                </Avatar>
                <Group spacing={4}>
                  {userReactions.map((reaction) => {
                    const ReactionIcon = REACTIONS.find(r => r.id === reaction.type)?.icon;
                    return ReactionIcon ? (
                      <motion.div
                        key={reaction.id}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      >
                        <Paper
                          p={4}
                          radius="xl"
                          bg="gray.0"
                        >
                          <ReactionIcon size={16} />
                        </Paper>
                      </motion.div>
                    ) : null;
                  })}
                </Group>
              </Group>
            </motion.div>
          ))}
        </AnimatePresence>
      </Paper>

      {/* Reaction Controls */}
      <Paper 
        p="xs"
        radius="xl"
        withBorder
        sx={(theme) => ({
          backgroundColor: theme.white,
          backdropFilter: 'blur(8px)',
        })}
      >
        <Group spacing="xs">
          {REACTIONS.map(({ id, icon: Icon, label }) => {
            const isActive = hasReaction(id);
            
            return (
              <Tooltip key={id} label={label}>
                <ActionIcon
                  variant={isActive ? "filled" : "subtle"}
                  color="blue"
                  onClick={() => toggleReaction(id)}
                  radius="xl"
                  size="lg"
                  loading={loading}
                >
                  <Icon size={18} />
                </ActionIcon>
              </Tooltip>
            );
          })}

          <Tooltip label="Save for later (Ripple)">
            <ActionIcon
              variant={isRippled() ? "filled" : "subtle"}
              color="violet"
              onClick={toggleRipple}
              radius="xl"
              size="lg"
              loading={loading}
            >
              <IconRipple size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Paper>
    </Stack>
  );
}