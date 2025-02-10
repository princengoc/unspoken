import { useState } from 'react';
import { Stack, Text, rem } from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';
import type { Card as CardType } from '@/core/game/types';
import { Card } from '../Card';
import { CardIndicators } from './CardIndicators';
import { useCardControls } from './useCardControls';

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
  showIndicators = true,
}: CardDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { controls } = useCardControls();

  // Flip page variants:
  // - When a new card mounts, it starts rotated -90° (facing away) and flips into 0°.
  // - When the current card exits, it flips to 90°.
  const flipVariants = {
    initial: {
      rotateY: -30,
      opacity: 0,
    },
    animate: {
      rotateY: 0,
      opacity: 1,
      transition: { duration: 0.5 },
    },
    exit: {
      rotateY: 40,
      opacity: 0,
      transition: { duration: 0.5 },
    },
  };

  const handleCardSwipe = async (swipeDirection: 'left' | 'right') => {
    if (!canSwipe) return;

    // If swiped right, trigger selection callback
    if (swipeDirection === 'right') {
      onSelect?.(cards[currentIndex]);
    }

    // Update to the next card (with wrap-around)
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  if (!cards.length) {
    return (
      <Stack align="center" justify="center" h={rem(400)}>
        <Text c="dimmed">No cards available</Text>
      </Stack>
    );
  }

  return (
    <div
      className="relative w-full h-[400px] overflow-hidden"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // Enable the 3D perspective for the flip effect
        perspective: 1000,
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          variants={flipVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          drag={canSwipe ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={(e, info) => {
            const offset = info.offset.x;
            const threshold = 100;
            if (Math.abs(offset) > threshold) {
              handleCardSwipe(offset > 0 ? 'right' : 'left');
            } else {
              controls.start({ x: 0 });
            }
          }}
          whileDrag={{ scale: 1.05 }}
          className="absolute"
          style={{
            zIndex: 2,
            top: '50%',
            transform: 'translateY(-50%)',
            // Ensure the 3D transform is preserved and the backside is hidden
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
          }}
        >
          <Card card={cards[currentIndex]} index={currentIndex} total={cards.length} />
        </motion.div>
      </AnimatePresence>

      {showIndicators && (
        <CardIndicators
          total={cards.length}
          current={currentIndex}
          className="absolute bottom-4"
          style={{ zIndex: 3 }}
        />
      )}
    </div>
  );
}
