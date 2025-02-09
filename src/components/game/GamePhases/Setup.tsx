'use client';
import { Stack } from '@mantine/core';
import { GameCard } from '../Card';
import { useGameStore } from '@/lib/hooks/useGameStore';

export function Setup() {
  const cards = useGameStore(state => state.cards);
  
  return (
    <Stack gap="md" style={{ position: 'relative', height: '24rem' }}>
      {cards.map((card, index) => (
        <div key={card.id} style={{ position: 'absolute', width: '100%' }}>
          <GameCard
            card={card}
            index={index}
            total={cards.length}
          />
        </div>
      ))}
    </Stack>
  );
}
