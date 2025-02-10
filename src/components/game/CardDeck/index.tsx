import { useState, useEffect } from 'react';
import { Stack, Text, rem } from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';
import type { Card as CardType } from '@/core/game/types';
import { Card } from '../Card';
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
  const [highlightedCard, setHighlightedCard] = useState<string | null>(null);
  const { controls } = useCardControls();

  useEffect(() => {
    if (direction) {
      setShowDirections(false);
    }
  }, [direction]);

  const handleCardSwipe = async (swipeDirection: 'left' | 'right') => {
    if (!canSwipe) return;

    setDirection(swipeDirection);
    setHighlightedCard(null);

    // Smooth transition with minimal animation
    await controls.start({ 
      x: swipeDirection === 'right' ? 100 : -100,
      opacity: 0,
      transition: { duration: 0.2, ease: 'easeOut' }
    });

    // Update index with cycling
    setCurrentIndex(prev => {
      if (swipeDirection === 'right') {
        return prev === cards.length - 1 ? 0 : prev + 1;
      } else {
        return prev === 0 ? cards.length - 1 : prev - 1;
      }
    });

    // Reset position smoothly
    await controls.set({ x: swipeDirection === 'right' ? -50 : 50, opacity: 0 });
    await controls.start({ 
      x: 0, 
      opacity: 1,
      transition: { duration: 0.2, ease: 'easeOut' }
    });
  };

  const handleCardTap = () => {
    const currentCard = cards[currentIndex];
    if (highlightedCard === currentCard.id) {
      // If already highlighted, select it
      onSelect?.(currentCard);
      setHighlightedCard(null);
    } else {
      // First tap highlights
      setHighlightedCard(currentCard.id);
    }
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
          onClick={handleCardTap}
          whileDrag={{ scale: 1.02 }}
        >
          <Card
            card={cards[currentIndex]}
            index={currentIndex}
            total={cards.length}
            selected={highlightedCard === cards[currentIndex].id}
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