'use client';

import { Group, ActionIcon, Tooltip, Paper, Divider } from '@mantine/core';
import { IconSparkles, IconHeart, IconBulb, IconRipple} from '@tabler/icons-react';
import { useGameStore } from '@/lib/hooks/useGameStore';

const reactions = [
  { icon: IconSparkles, label: "Inspiring" },
  { icon: IconHeart, label: "Resonates" },
  { icon: IconBulb, label: "Me too" }
];

export function ListenerReactions() {
  const { activeReactions, toggleReaction, isRippled, toggleRipple } = useGameStore();

  return (
    <Paper 
      pos="absolute" 
      bottom={16} 
      left={0} 
      right={0} 
      w="fit-content" 
      mx="auto"
      p="xs"
      radius="xl"
      bg="white"
      style={{ backdropFilter: 'blur(8px)' }}
    >
      <Group gap="xs">
        {reactions.map(({ icon: Icon, label }) => (
          <Tooltip key={label} label={label}>
            <ActionIcon
              variant={activeReactions.includes(label) ? "filled" : "subtle"}
              color="blue"
              onClick={() => toggleReaction(label)}
              radius="xl"
              size="lg"
            >
              <Icon size={18} />
            </ActionIcon>
          </Tooltip>
        ))}
        <Divider orientation="vertical" />
        <Tooltip label="Ripple - Save for your turn">
          <ActionIcon
            variant={isRippled ? "filled" : "subtle"}
            color="blue"
            onClick={toggleRipple}
            radius="xl"
            size="lg"
          >
            <IconRipple size={18} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Paper>
  );
}