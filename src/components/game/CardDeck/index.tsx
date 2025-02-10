import { useState, useEffect } from 'react';
import { Stack, Text, rem, Card } from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';
import type { Card as CardType } from '@/core/game/types';
import { CardIndicators } from './CardIndicators';
import { useCardControls } from './useCardControls';
import { ScaleIn } from '@/components/animations/Motion';

interface CardDeckProps {
  cards: CardType[];
  onSelect?: (card: CardType) => void;
  canSwipe?: boolean;
  showIndicators?: boolean;
}

export function CardDeck({ 
  cards, 
  onSelect,
  canSwipe = true,
  showIndicators = true
}: CardDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const [showDirections, setShowDirections] = useState(true);
  const { controls, handleSwipe } = useCardControls();

  useEffect(() => {
    // Hide direction indicators after first interaction
    if (direction) {
      setShowDirections(false);
    }
  }, [direction]);

  const handleCardSwipe = async (swipeDirection: 'left' | 'right') => {
    if (!canSwipe) return;

    setDirection(swipeDirection);
    await handleSwipe(swipeDirection);

    if (swipeDirection === 'right' && onSelect) {
      onSelect(cards[currentIndex]);
    }

    setCurrentIndex(prev => Math.min(prev + 1, cards.length - 1));
  };

  if (!cards.length) {
    return (
      <Stack align="center" justify="center" h={rem(400)}>
        <Text c="dimmed">No cards available</Text>
      </Stack>
    );
  }

  return (
    <div className="relative w-full h-[400px] flex items-center justify-center">
      <AnimatePresence>
        {showDirections && showIndicators && (
          <>
            <ScaleIn className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <IconArrowLeft size={32} />
            </ScaleIn>
            <ScaleIn className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              <IconArrowRight size={32} />
            </ScaleIn>
          </>
        )}

        <motion.div
          key={currentIndex}
          className="absolute"
          animate={controls}
          drag={canSwipe ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(e, info) => {
            const offset = info.offset.x;
            if (Math.abs(offset) >= 100) {
              handleCardSwipe(offset > 0 ? 'right' : 'left');
            } else {
              controls.start({ x: 0 });
            }
          }}
          whileDrag={{ scale: 1.05 }}
        >
          <Card
            card={cards[currentIndex]}
            index={currentIndex}
            total={cards.length}
          />
        </motion.div>
      </AnimatePresence>

      {showIndicators && (
        <CardIndicators
          total={cards.length}
          current={currentIndex}
          className="absolute bottom-4"
        />
      )}
    </div>
  );
}