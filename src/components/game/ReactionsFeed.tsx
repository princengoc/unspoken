import { useEffect, useState } from 'react';
import { Group, Avatar, Tooltip, useMantineTheme, Box } from '@mantine/core';
import { IconSparkles, IconHeart, IconBulb, IconRipple, IconLock, IconWorld } from '@tabler/icons-react';
import { reactionsService, ListenerReaction, ReactionType } from '@/services/supabase/reactions';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlayerAssignment } from './statusBarUtils';
import { PlayerAvatar } from './PlayerAvatar';

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
  roomId: string;
  speakerId: string;
  cardId: string;
  currentUserId: string;
  playerAssignments: Map<string, PlayerAssignment>;
}

export function ReactionsFeed({ roomId, speakerId, cardId, currentUserId, playerAssignments }: ReactionsFeedProps) {
  const [reactionGroups, setReactionGroups] = useState<ReactionGroup[]>([]);
  const [ripples, setRipples] = useState<(ListenerReaction & { username?: string })[]>([]);
  const theme = useMantineTheme();

  // Load and subscribe to reactions
  useEffect(() => {
    if (!roomId || !speakerId || !cardId) return;

    // Initial load of reactions
    const loadReactions = async () => {
      try {
        // We're using a specific RPC to get all reactions for a card/speaker
        // This includes reactions from all listeners, not just the current user
        const { data } = await reactionsService.getReactionsForSpeaker(roomId, speakerId, cardId);
        processReactions(data || []);
      } catch (error) {
        console.error('Failed to load reactions for speaker:', error);
      }
    };

    loadReactions();

    // Subscribe to all reactions for this room
    const subscription = reactionsService.subscribeToReactions(
      roomId,
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
  }, [roomId, speakerId, cardId, playerAssignments]);

  // Process and group reactions
  const processReactions = (reactions: ListenerReaction[]) => {
    // Filter and group by type
    const reactionsByType = Object.keys(REACTION_CONFIG).reduce<Record<string, (ListenerReaction & { username?: string })[]>>((acc, type) => {
      acc[type] = reactions.filter(r => 
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
    const relevantRipples = reactions.filter(r => 
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
      <Group justify="center" gap="xl">
        <AnimatePresence>
          {/* Compact reaction groups */}
          {reactionGroups.map((group) => {
            const { icon: Icon, color, label } = REACTION_CONFIG[group.type];
            return (
              <Tooltip
                key={group.type}
                label={`${label} (${group.reactions.length})`}
                position="top"
                withArrow
              >
                <Group gap='xs' justify='center'>
                  <Icon color={theme.colors[color][6]} size={16} />
                  {group.reactions.slice(0, 3).map((reaction, index) => (
                    <motion.div
                      key={reaction.id}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.2, delay: index * 0.1 }}
                      style={{ marginLeft: -8 * index }}
                    >
                        <Box style={{ position: 'relative' }}>
                          <PlayerAvatar
                            assignment={playerAssignments.get(reaction.listenerId)!}
                            size="md"
                            highlighted={reaction.listenerId === currentUserId}
                            highlightColor='green'
                            showIndicator={true}
                            indicatorColor={reaction.isPrivate ? 'yellow' : 'green'}
                            indicatorIcon = {reaction.isPrivate ? <IconLock size={10}/> : <IconWorld size={10}/>}
                          />
                        {reaction.isPrivate && (
                           <Box 
                             style={{ 
                               position: 'absolute', 
                               bottom: -2, 
                               right: -2, 
                               background: theme.white,
                               borderRadius: '50%',
                               width: 12,
                               height: 12,
                               display: 'flex',
                               alignItems: 'center',
                               justifyContent: 'center'
                             }}
                           >
                             <IconLock size={8} />
                           </Box>
                         )}
                       </Box>
                    </motion.div>
                  ))}
                  {group.reactions.length > 3 && (
                    <Tooltip label={`${group.reactions.length - 3} more`}>
                      <Avatar 
                        size="md" 
                        radius="xl" 
                        color={color}
                        style={{ 
                          marginLeft: -8,
                          border: `1px solid ${theme.white}`,
                        }}
                      >
                        {group.reactions.length - 3}
                      </Avatar>
                    </Tooltip>
                  )}
                </Group>
              </Tooltip>
            );
          })}
          {/* Compact ripples */}
          {ripples.length > 0 && (
            <Tooltip 
              label={`Saved for later (${ripples.length})`}
              position="top"
              withArrow
            >
              <Group gap="xs" justify='center'>
                <IconRipple color={theme.colors.violet[6]} size={16} />
                {ripples.slice(0, 3).map((reaction, index) => (
                  <motion.div
                    key={reaction.id}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2, delay: index * 0.1 }}
                    style={{ marginLeft: -8 * index }}
                  >
                    <Box style={{ position: 'relative' }}>
                      <PlayerAvatar
                        assignment={playerAssignments.get(reaction.listenerId)!}
                        size="md"
                        highlighted={reaction.listenerId === currentUserId}
                        highlightColor='green'
                        showIndicator={true}
                        indicatorColor={reaction.isPrivate ? 'yellow' : 'green'}
                        indicatorIcon = {reaction.isPrivate ? <IconLock size={10}/> : <IconWorld size={10}/>}
                      />
                      {reaction.isPrivate && (
                         <Box 
                           style={{ 
                             position: 'absolute', 
                             bottom: -2, 
                             right: -2, 
                             background: theme.white,
                             borderRadius: '50%',
                             width: 12,
                             height: 12,
                             display: 'flex',
                             alignItems: 'center',
                             justifyContent: 'center'
                           }}
                         >
                           <IconLock size={8} />
                         </Box>
                       )}
                     </Box>
                  </motion.div>
                ))}
                {ripples.length > 3 && (
                  <Tooltip label={`${ripples.length - 3} more`}>
                    <Avatar 
                      size="xs" 
                      radius="xl" 
                      color="violet"
                      style={{ 
                        marginLeft: -8,
                        border: `1px solid ${theme.white}`,
                      }}
                    >
                      {ripples.length - 3}
                    </Avatar>
                  </Tooltip>
                )}
              </Group>
            </Tooltip>
          )}
          </AnimatePresence>
     </Group>
  );
}