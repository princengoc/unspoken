import { Stack, Text } from '@mantine/core';
import { GameCard } from '../Card';
import { ListenerReactions } from '../ListenerReactions';
import { useGameStore } from '@/lib/hooks/useGameStore';

export function Listening() {
  const { isSpeakerSharing, cards, currentCard, discardPile } = useGameStore();
  
  if (!isSpeakerSharing) {
    return (
      <Stack gap="md">
        <Text ta="center" c="dimmed" size="sm">
          Browse previous cards while waiting
        </Text>
        <div style={{ position: 'relative', height: '24rem' }}>
          {discardPile.map((card, index) => (
            <div key={card.id} style={{ position: 'absolute', width: '100%' }}>
              <GameCard
                card={card}
                index={index}
                total={discardPile.length}
                showExchange
              />
            </div>
          ))}
        </div>
      </Stack>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <GameCard
        card={cards[currentCard]}
        index={0}
        total={1}
      />
      <div style={{ position: 'absolute', bottom: '1rem', left: 0, right: 0 }}>
        <ListenerReactions />
      </div>
    </div>
  );
}