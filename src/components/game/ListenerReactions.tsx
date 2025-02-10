import { Group, ActionIcon, Tooltip, Paper, Divider } from '@mantine/core';
import { IconSparkles, IconHeart, IconBulb, IconRipple} from '@tabler/icons-react';
import { useReactions } from '@/hooks/game/useReactions';

// Map reaction icons
const ICON_MAP = {
  'sparkles': IconSparkles,
  'heart': IconHeart,
  'bulb': IconBulb
} as const;

interface ListenerReactionsProps {
  sessionId: string;
}

export function ListenerReactions({ sessionId }: ListenerReactionsProps) {
  const { 
    activeReactions, 
    isRippled, 
    toggleReaction, 
    toggleRipple,
    availableReactions 
  } = useReactions(sessionId);

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
        {availableReactions.map(({ id, label, icon }) => {
          const Icon = ICON_MAP[icon as keyof typeof ICON_MAP];
          return (
            <Tooltip key={id} label={label}>
              <ActionIcon
                variant={activeReactions.includes(id) ? "filled" : "subtle"}
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