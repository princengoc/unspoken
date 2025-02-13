import { useState } from 'react';
import { Group, Button, Stack } from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';
import type { Card as CardType } from '@/core/game/types';
import { Card } from '../Card';
import { MiniCard, MoodType, moods } from './MiniCard';
import { MiniDeck } from './MiniDeck';

interface CardDeckProps {
  cards: CardType[];
  onSelect?: (cardId: string) => void;
}

export function CardDeck({
  cards,
  onSelect,
}: CardDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [assignedMoods, setAssignedMoods] = useState<Record<number, MoodType>>({});

  const flipVariants = {
    initial: { rotateY: -30, opacity: 0 },
    animate: { rotateY: 0, opacity: 1, transition: { duration: 0.5 } },
    exit: { rotateY: 40, opacity: 0, transition: { duration: 0.5 } },
  };

  const handleAssign = (mood: MoodType) => {
    setAssignedMoods((prev) => ({ ...prev, [currentIndex]: mood }));
    setCurrentIndex((prev) => prev + 1);
  };

  return (
    <Stack spacing="xs">
      {/* Main area container */}
        {currentIndex < cards.length ? (
          <>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                variants={flipVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                style={{ transformOrigin: 'center' }}
              >
                <Card card={cards[currentIndex]} index={currentIndex} total={cards.length} />
              </motion.div>
            </AnimatePresence>
          </>
        ) : <MiniDeck cards={cards} assignedMoods={assignedMoods} onSelect={onSelect}/>}

      {currentIndex < cards.length && (
        <>
          <Group justify="center" mt="xs" spacing="sm">
            {moods.map(({ type, icon: Icon, color }) => (
                <Button key={type}
                  onClick={() => handleAssign(type)}
                  variant="light"
                  size="lg"
                  p={8}
                  style={{
                    color: color,
                    backgroundColor: `${color}15`,
                    '&:hover': {
                      backgroundColor: `${color}25`
                    }
                  }}
                >
                  <Icon size={24} />
                </Button>
            ))}
          </Group>

          <MiniDeck cards={cards.slice(0, currentIndex)} assignedMoods={assignedMoods} onSelect={onSelect}/>
        </>
      )}
    </Stack>
  );
}