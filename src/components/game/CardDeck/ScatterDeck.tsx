import { useState } from 'react';
import { Paper, Stack, Group, Text, Box } from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from '@mantine/hooks';
import type { Card as CardType } from '@/core/game/types';
import { MoodType, moodConfig } from './MiniCard';


interface ScatterDeckProps {
  cards: CardType[];
  assignedMoods?: Record<number, MoodType>;
  onSelect?: (cardId: string) => void;
}

export function ScatterDeck({ cards, assignedMoods = {}, onSelect }: ScatterDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Constants for animation
  const CARD_WIDTH = isMobile ? 300 : 360;
  const CARD_OFFSET = isMobile ? 60 : 80;
  const CARD_Y_OFFSET = isMobile ? 10 : 15;

  // Card variants for Framer Motion
  const cardVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
      rotate: direction > 0 ? 5 : -5,
    }),
    center: {
      x: 0,
      opacity: 1,
      rotate: 0,
      zIndex: 3,
      scale: 1,
    },
    beforeCenter: {
      x: -CARD_OFFSET,
      y: -CARD_Y_OFFSET,
      opacity: 0.8,
      rotate: -3,
      zIndex: 2,
      scale: 0.95,
    },
    afterCenter: {
      x: CARD_OFFSET,
      y: CARD_Y_OFFSET,
      opacity: 0.8,
      rotate: 3,
      zIndex: 2,
      scale: 0.95,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 50 : -50,
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.3, ease: "easeOut" }, // Match CSS timing      
      rotate: direction < 0 ? -5 : 5,
    }),
  };

  const handleDragEnd = (event: any, info: any) => {
    const swipe = info.offset.x;
    const swipeThreshold = 50;

    if (Math.abs(swipe) > swipeThreshold) {
      const direction = swipe > 0 ? -1 : 1;
      const newIndex = currentIndex + direction;
      
      if (newIndex >= 0 && newIndex < cards.length) {
        setCurrentIndex(newIndex);
      }
    }
  };

  const getCardPosition = (index: number) => {
    const offset = index - currentIndex;
    if (offset === 0) return 'center';
    if (offset === -1) return 'beforeCenter';
    if (offset === 1) return 'afterCenter';
    return '';
  };
  

  return (
    <Box 
      pos="relative" 
      h={400} 
      sx={(theme) => ({
        background: theme.fn.linearGradient(45, theme.colors.gray[0], theme.colors.gray[1]),
        borderRadius: theme.radius.lg,
        overflow: 'hidden',
      })}
    >
      <Stack align="center" justify="center" h="100%" spacing={0}>
        <AnimatePresence initial={false} custom={1}>
          {cards.map((card, index) => {
            const position = getCardPosition(index);
            if (!position) return null;

            const mood = assignedMoods[index];
            const moodStyles = mood ? moodConfig[mood] : null;            
            
            return (
              <motion.div
                key={card.id}
                custom={1}
                variants={cardVariants}
                initial="enter"
                animate={position}
                exit="exit"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.7}
                onDragEnd={handleDragEnd}
                transition={{
                  x: { type: "spring", stiffness: 150, damping: 25 },
                  opacity: { duration: 0.3 },
                  rotate: { duration: 0.3 },
                }}
                style={{
                  position: 'absolute',
                  width: CARD_WIDTH,
                  cursor: 'grab',
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98, cursor: 'grabbing' }}
              >
                <Paper
                  p="xl"
                  h={280}
                  radius="md"
                  withBorder
                  onClick={() => {
                    if (position !== "center") {
                      setCurrentIndex(index); // Move clicked card to the front
                    } else {
                        onSelect?.(card.id)
                    }
                  }}
                  sx={(theme) => ({
                    position: 'relative',
                    backgroundColor: moodStyles?.color || theme.white,
                    transition: 'box-shadow 0.2s ease',
                    '&:hover': {
                      boxShadow: theme.shadows.md,
                    },
                  })}
                >
                  <Stack h="100%" spacing="xs" justify="center" align="center">
                    <Text 
                      size="lg" 
                      weight={500} 
                      align="center"
                      sx={{ lineHeight: 1.6 }}
                    >
                      {card.content}
                    </Text>
                    
                    {position === 'center' && (
                      <Text 
                        size="sm" 
                        color="dimmed"
                        sx={(theme) => ({
                          position: 'absolute',
                          bottom: theme.spacing.md,
                          left: 0,
                          right: 0,
                          textAlign: 'center',
                        })}
                      >
                        Tap to exchange with someone
                      </Text>
                    )}

                    {mood && (
                      <Box
                        sx={(theme) => ({
                          position: 'absolute',
                          top: theme.spacing.xs,
                          right: theme.spacing.xs,
                          padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
                          borderRadius: theme.radius.sm,
                          backgroundColor: theme.fn.rgba(theme.black, 0.05),
                        })}
                      >
                        <Text size="sm">{card.category}</Text>
                      </Box>
                    )}
                  </Stack>
                </Paper>
              </motion.div>
            );
          })}
        </AnimatePresence>

      </Stack>
    </Box>
  );
}

export default ScatterDeck;