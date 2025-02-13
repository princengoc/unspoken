import { Stack, Button, Group } from '@mantine/core';
import { motion } from 'framer-motion';
import { useGameState } from '@/context/GameStateProvider';
import { useRoom } from '@/context/RoomProvider';
import { ListenerReactions } from '../ListenerReactions';
import { Card } from '../Card';
import { useCardsInGame } from '@/context/CardsInGameProvider';

type SpeakingProp = {
  gameStateId: string
}

export function Speaking({ gameStateId }: SpeakingProp) {
  const { activePlayerId } = useGameState();
  const { isActiveSpeaker, currentSpeakerHasStarted, startSpeaking, finishSpeaking } = useRoom();
  const { cardState, getCardById } = useCardsInGame();

  if (!activePlayerId) return null;
  const activeCard = getCardById(cardState.selectedCards[activePlayerId]);
  if (!activeCard) return null;

  return (
    <Stack spacing="md">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card card={activeCard} index={0} total={1} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {isActiveSpeaker ? (
          <Button
            onClick={currentSpeakerHasStarted ? finishSpeaking : startSpeaking}
            fullWidth
            size="lg"
            variant="filled"
            color={currentSpeakerHasStarted ? 'green' : 'blue'}
          >
            {currentSpeakerHasStarted ? 'Finish Sharing' : 'Start Sharing'}
          </Button>
        ) : (
          <ListenerReactions
            speakerId={activePlayerId}
            cardId={activeCard.id}
            gameStateId={gameStateId}
          />
        )}
      </motion.div>
    </Stack>
  );
}