import { useState, useMemo } from 'react';
import { Group, ActionIcon, Tooltip } from '@mantine/core';
import { IconSparkles, IconHeart, IconBulb, IconRipple } from '@tabler/icons-react';
import { useAuth } from '@/context/AuthProvider';
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
  gameStateId: string;
}

export function ListenerReactions({ speakerId, cardId, gameStateId }: ListenerReactionsProps) {
  const { user } = useAuth();
  if (!user || !gameStateId) return null;

  const { toggleReaction, toggleRipple, hasReaction, isRippled, reactions } = useReactions({
    gameStateId,
    speakerId,
    listenerId: user.id,
    cardId
  });

  // ✅ Store temporary "button disabled" state
  const [disabledButtons, setDisabledButtons] = useState<Record<ReactionType, boolean>>({});
  const [rippleDisabled, setRippleDisabled] = useState(false);

  // ✅ Use `useMemo` to prevent unnecessary re-renders
  const activeReactions = useMemo(
    () =>
      Object.fromEntries(
        REACTIONS.map(({ id }) => [id, hasReaction(id)])
      ) as Record<ReactionType, boolean>,
    [reactions]
  );

  const rippled = useMemo(() => isRippled(), [reactions]);

  const handleReactionClick = (id: ReactionType) => {
    // optimistic UI update
    toggleReaction(id);
    
    // Disable button to prevent spam clicking
    setDisabledButtons((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setDisabledButtons((prev) => ({ ...prev, [id]: false }));
    }, 500);
  };

  const handleRippleClick = () => {
    toggleRipple();

    // ✅ Disable ripple button for 2 seconds
    setRippleDisabled(true);
    setTimeout(() => {
      setRippleDisabled(false);
    }, 2000);
  };

  return (
    <Group justify="center" gap="xs">
      {REACTIONS.map(({ id, icon: Icon, label }) => (
        <Tooltip key={id} label={label}>
          <ActionIcon
            variant={activeReactions[id] ? 'filled' : 'subtle'}
            color="blue"
            onClick={() => handleReactionClick(id)}
            radius="xl"
            size="lg"
            disabled={disabledButtons[id]} // ✅ Gray out when disabled
            style={disabledButtons[id] ? { opacity: 0.5 } : {}}
          >
            <Icon size={18} />
          </ActionIcon>
        </Tooltip>
      ))}

      <Tooltip label="Save for later (Ripple)">
        <ActionIcon
          variant={rippled ? 'filled' : 'subtle'}
          color="violet"
          onClick={handleRippleClick}
          radius="xl"
          size="lg"
          disabled={rippleDisabled} // ✅ Gray out ripple button when disabled
          style={rippleDisabled ? { opacity: 0.5 } : {}}
        >
          <IconRipple size={18} />
        </ActionIcon>
      </Tooltip>
    </Group>
  );
}
