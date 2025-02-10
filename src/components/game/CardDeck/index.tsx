import React, { useState } from 'react';
import { Stack, Text, Box } from '@mantine/core';
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

  const flipVariants = {
    initial: {
      rotateY: -30,
      opacity: 0,
      scale: 0.9,
    },
    animate: {
      rotateY: 0,
      opacity: 1,
      scale: 1,
      transition: { 
        duration: 0.4,
        type: "spring",
        stiffness: 300,
        damping: 30
      },
    },
    exit: {
      rotateY: 30,
      opacity: 0,
      scale: 0.9,
      transition: { duration: 0.3 },
    },
  };

  const handleCardSwipe = async (swipeDirection: 'left' | 'right') => {
    if (!canSwipe) return;

    if (swipeDirection === 'right') {
      onSelect?.(cards[currentIndex]);
    }

    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  if (!cards.length) {
    return (
      <Stack align="center" justify="center" h={400}>
        <Text c="dimmed">No cards available</Text>
      </Stack>
    );
  }

  return (
    <Box 
      pos="relative" 
      h={400} 
      style={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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
          dragElastic={0.9}
          onDragEnd={(e, info) => {
            const offset = info.offset.x;
            const threshold = 100;
            if (Math.abs(offset) > threshold) {
              handleCardSwipe(offset > 0 ? 'right' : 'left');
            } else {
              controls.start({ x: 0 });
            }
          }}
          whileDrag={{ scale: 1.02 }}
          style={{
            position: 'absolute',
            zIndex: 10,
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
          }}
        >
          <Card 
            card={cards[currentIndex]} 
            index={currentIndex} 
            total={cards.length}
          />
        </motion.div>
      </AnimatePresence>

      {showIndicators && (
        <Box 
          pos="absolute" 
          bottom={16} 
          left="50%" 
          style={{ transform: 'translateX(-50%)' }}
          zindex={20}
        >
          <CardIndicators
            total={cards.length}
            current={currentIndex}
          />
        </Box>
      )}
    </Box>
  );
}