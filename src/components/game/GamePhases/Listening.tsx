import { Text } from '@mantine/core';
import { GameCard } from '../Card';
import { ListenerReactions } from '../ListenerReactions';
import { Card } from '@/core/game/types';

interface ListeningProps {
  cardsInPlay: Card[];
  isSpeakerSharing: boolean;
  sessionId: string;
  discardPile?: Card[];
}

export function Listening({ 
  cardsInPlay, 
  isSpeakerSharing,
  sessionId,
  discardPile = []
}: ListeningProps) {
  if (!isSpeakerSharing) {
    return (
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
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {cardsInPlay[0] && (
        <GameCard
          card={cardsInPlay[0]}
          index={0}
          total={cardsInPlay.length}
        />
      )}
      <div style={{ position: 'absolute', bottom: '1rem', left: 0, right: 0 }}>
        <ListenerReactions sessionId={sessionId}/>
      </div>
    </div>
  );
}