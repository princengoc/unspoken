import {
  Card as MantineCard,
  Group,
  Text,
  Button,
  Avatar,
  Tooltip,
  Badge,
  Stack,
} from "@mantine/core";
import { IconShare2 } from "@tabler/icons-react";
import type { Card as CardType } from "@/core/game/types";

interface GameCardProps {
  card: CardType;
  index?: number | null;
  total?: number | null;
  showExchange?: boolean;
  selected?: boolean;
  showSender?: boolean;
  onSelect?: () => void;
  onExchange?: () => void;
}

// TODO: add props like Minicard to allow showing of player icons in corners
export function GameCard({
  card,
  index = null,
  total = null,
  showExchange = false,
  selected = false,
  showSender = false,
  onSelect,
  onExchange,
}: GameCardProps) {
  const isSelectable = !!onSelect;

  return (
    <MantineCard
      shadow="md"
      padding="md"
      radius="md"
      withBorder
      style={{
        cursor: isSelectable ? "pointer" : "default",
        border: selected ? "2px solid blue" : undefined,
        width: "320px",
        maxWidth: "90vw",
      }}
      onClick={isSelectable ? onSelect : undefined}
    >
      <Stack gap="xs">
        {/* Card Header */}
        <Group justify="space-between">
          {index && total && (
            <Badge variant="light" size="md">
              {index + 1}/{total}
            </Badge>
          )}
          {showExchange && onExchange && (
            <Tooltip label="Exchange this card">
              <Button
                variant="subtle"
                size="sm"
                leftSection={<IconShare2 size={16} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onExchange();
                }}
              >
                Exchange
              </Button>
            </Tooltip>
          )}
        </Group>

        {/* Card Content */}
        <Text size="lg" fw={500} ta="center" py="xl">
          {card.content}
        </Text>

        {/* Card Footer */}
        {showSender && (
          <Group justify="flex-start" gap="sm">
            <Avatar size="sm" radius="xl" color="blue">
              {card.contributor_id?.charAt(0).toUpperCase() || "?"}
            </Avatar>
            <Text size="sm" c="dimmed">
              {card.contributor_id || "Anonymous"}
            </Text>
          </Group>
        )}
      </Stack>
    </MantineCard>
  );
}

// Export the component
export { GameCard as Card };
