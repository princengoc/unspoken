import { Card as MantineCard, Group, Text, Avatar, Stack, rem } from '@mantine/core';
import { motion } from 'framer-motion';
import type { Card as CardType } from '@/core/game/types';
import { IconCirclesRelation, IconIkosaedr, IconCell } from '@tabler/icons-react';

/** Mood types that represent different emotional states */
export type MoodType = 'Expansive' | 'Centered' | 'Introspective';

const moodConfig = {
  Expansive: {
    icon: IconCirclesRelation,
    color: '#E67E22', // Warm orange
    glow: '0 0 15px rgba(230, 126, 34, 0.5)'
  },
  Centered: {
    icon: IconIkosaedr,
    color: '#8E44AD', // Rich purple
    glow: '0 0 15px rgba(142, 68, 173, 0.5)'
  },
  Introspective: {
    icon: IconCell,
    color: '#C0392B', // Deep red
    glow: '0 0 15px rgba(192, 57, 43, 0.5)'
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
        style={{
          cursor: onClick ? 'pointer' : 'default',
          borderColor: isSelected ? moodStyles?.color : undefined,
          borderWidth: isSelected ? '2px' : '1px',
          width: '176px', // Fixed width
          height: '200px', // Fixed height
        }}
        onClick={onClick}
      >
        <Stack gap="sm" h="100%">
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

          <Text 
            size="sm" 
            fw={500} 
            ta="center" 
            mt={rem(16)}
            style={{
              flex: 1,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
              lineHeight: '1.4'
            }}
          >
            {card.content}
          </Text>

          <Group gap="xs">
            <Avatar size="xs" radius="xl" color="gray">
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