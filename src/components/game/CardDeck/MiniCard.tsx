import { Card as MantineCard, Group, Text, Avatar, Stack, rem } from '@mantine/core';
import { motion } from 'framer-motion';
import type { Card as CardType } from '@/core/game/types';
import { IconMoodSmile, IconMoodSad, IconMoodEmpty } from '@tabler/icons-react';

/** Mood types that represent different emotional states */
export type MoodType = 'Positive' | 'Neutral' | 'Reflective';

const moodConfig = {
  Positive: {
    icon: IconMoodSmile,
    color: '#4CAF50',
    glow: '0 0 15px rgba(76, 175, 80, 0.5)'
  },
  Neutral: {
    icon: IconMoodEmpty,
    color: '#2196F3',
    glow: '0 0 15px rgba(33, 150, 243, 0.5)'
  },
  Reflective: {
    icon: IconMoodSad,
    color: '#9C27B0',
    glow: '0 0 15px rgba(156, 39, 176, 0.5)'
  }
};

interface MiniCardProps {
  card: CardType;
  mood?: MoodType;
  isSelected?: boolean;
  onClick?: () => void;
}

export function MiniCard({ card, mood, isSelected = false, onClick }: MiniCardProps) {
  const moodStyles = mood ? moodConfig[mood] : null;
  const IconComponent = moodStyles?.icon;

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={isSelected ? {
        boxShadow: [
          moodStyles?.glow || '0 0 15px rgba(0, 0, 0, 0.2)',
          '0 0 2px rgba(0, 0, 0, 0.1)'
        ]
      } : {}}
      transition={{ duration: 1, repeat: isSelected ? Infinity : 0, repeatType: "reverse" }}
    >
      <MantineCard
        shadow="sm"
        padding="sm"
        radius="md"
        withBorder
        className="w-44 max-w-[90vw] relative"
        style={{
          cursor: onClick ? 'pointer' : 'default',
          borderColor: isSelected ? moodStyles?.color : undefined,
          borderWidth: isSelected ? '2px' : '1px'
        }}
        onClick={onClick}
      >
        <Stack gap="sm">
          {IconComponent && (
            <div
              style={{
                position: 'absolute',
                top: rem(4),
                right: rem(4),
                color: moodStyles?.color
              }}
            >
              <IconComponent size={24} />
            </div>
          )}

          <Text size="sm" fw={500} ta="center" mt={rem(16)}>
            {card.content}
          </Text>

          <Group gap="xs">
            <Avatar size="xs" radius="xl" color="blue">
              {card.contributor_id?.charAt(0).toUpperCase() || '?'}
            </Avatar>
            <Text size="xs" c="dimmed">
              {card.contributor_id || 'Anonymous'}
            </Text>
          </Group>
        </Stack>
      </MantineCard>
    </motion.div>
  );
}