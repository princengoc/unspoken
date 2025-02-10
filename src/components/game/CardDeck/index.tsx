import { useState } from 'react';
import { Group, Text, Button } from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';
import { IconMoodSmile, IconMoodSad, IconMoodEmpty } from '@tabler/icons-react';
import type { Card as CardType } from '@/core/game/types';
import { Card } from '../Card';
import { MiniCard, MoodType } from './MiniCard';
import { CardIndicators } from './CardIndicators';

interface CardDeckProps {
  cards: CardType[];
  onSelect?: (card: CardType) => void;
  showIndicators?: boolean;
}

export function CardDeck({
  cards,
  onSelect,
  showIndicators = true,
}: CardDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [assignedMoods, setAssignedMoods] = useState<Record<number, MoodType>>({});
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);

  // Animation variants for the flip effect used on the main card
  const flipVariants = {
    initial: { rotateY: -30, opacity: 0 },
    animate: { rotateY: 0, opacity: 1, transition: { duration: 0.5 } },
    exit: { rotateY: 40, opacity: 0, transition: { duration: 0.5 } },
  };

  // Available moods for card categorization
  const moods: { type: MoodType; icon: typeof IconMoodSmile; label: string }[] = [
    { type: 'Positive', icon: IconMoodSmile, label: 'Uplifting' },
    { type: 'Neutral', icon: IconMoodEmpty, label: 'Balanced' },
    { type: 'Reflective', icon: IconMoodSad, label: 'Contemplative' },
  ];

  const handleAssign = (mood: MoodType) => {
    setAssignedMoods((prev) => ({ ...prev, [currentIndex]: mood }));
    setCurrentIndex((prev) => prev + 1);
  };

  const handlePeripheralCardClick = (index: number) => {
    if (currentIndex >= cards.length) {
      setSelectedCardIndex(index);
      onSelect?.(cards[index]);
    }
  };

  return (
    <div>
      {/* Main area container */}
      <div
        style={{
          height: '300px',
          perspective: 1000,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {currentIndex < cards.length ? (
          // In-progress: show the animated main card with its indicators.
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
            {showIndicators && (
              <CardIndicators
                total={cards.length}
                current={currentIndex}
                style={{ position: 'absolute', bottom: '10px', zIndex: 3 }}
              />
            )}
          </>
        ) : (
          // Finished: display a centered mini card group with a small instruction.
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Text size="sm" ta="center" fw={400} mb={8}>
              Select one
            </Text>
            <Group spacing="xs" position="center">
              {Object.entries(assignedMoods).map(([key, mood]) => {
                const index = Number(key);
                return (
                  <MiniCard
                    key={index}
                    card={cards[index]}
                    mood={mood}
                    isSelected={selectedCardIndex === index}
                    onClick={() => handlePeripheralCardClick(index)}
                  />
                );
              })}
            </Group>
          </div>
        )}
      </div>

      {/* While categorization is in progress, show mood buttons and a row of peripheral mini cards */}
      {currentIndex < cards.length && (
        <>
          <Group justify="center" mt="xs" spacing="sm">
            {moods.map(({ type, icon: Icon, label }) => (
              <Button
                key={type}
                onClick={() => handleAssign(type)}
                leftSection={<Icon size={16} />}
                variant="light"
                size="sm"
              >
                {label}
              </Button>
            ))}
          </Group>

          <Group justify="center" gap="xs" mt="sm">
            {Object.entries(assignedMoods).map(([key, mood]) => {
              const index = Number(key);
              return (
                <MiniCard
                  key={index}
                  card={cards[index]}
                  mood={mood}
                  isSelected={selectedCardIndex === index}
                  onClick={() => handlePeripheralCardClick(index)}
                />
              );
            })}
          </Group>
        </>
      )}
    </div>
  );
}
