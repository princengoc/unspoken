// src/components/game/GamePhases/Listening.tsx

import { Stack, Text } from '@mantine/core';
import { GameCard } from '../Card';
import { ListenerReactions } from '../ListenerReactions';
import { useGameStore } from '@/lib/hooks/useGameStore';

export function Listening() {
  const { 
    isSpeakerSharing, 
    cardsInPlay, 
    discardPile,
    setGamePhase
  } = useGameStore();
  
  // When speaker is done, move back to speaking phase for next turn
  if (!isSpeakerSharing) {
    setGamePhase('speaking');
    return null;
  }
  
  return (
    <Stack gap="md">
      {!isSpeakerSharing ? (
        <>
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
        </>
      ) : (
        <div style={{ position: 'relative' }}>
          {cardsInPlay[0] && (
            <GameCard
              card={cardsInPlay[0]}
              index={0}
              total={1}
            />
          )}
          <div style={{ position: 'absolute', bottom: '1rem', left: 0, right: 0 }}>
            <ListenerReactions />
          </div>
        </div>
      )}
    </Stack>
  );
}