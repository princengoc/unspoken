import { Stack, Text, Button, Group } from '@mantine/core';
import { useGameState } from '@/context/GameStateProvider';
import { useRoomMembers } from '@/context/RoomMembersProvider';
import { useRoom } from '@/context/RoomProvider';
import { ListenerReactions } from '../ListenerReactions';
import { Card } from '../Card';
import { PlayerStatusBar } from '../PlayerStatus';
import { useCardsInGame } from '@/context/CardsInGameProvider';

type SpeakingProps = {
  gameStateId: string;
  roomId: string
};

export function Speaking({ gameStateId, roomId }: SpeakingProps) {
  const { activePlayerId, currentRound, totalRounds } = useGameState();
  const { members } = useRoomMembers();
  const { isActiveSpeaker, currentSpeakerHasStarted, startSpeaking, finishSpeaking } = useRoom();
  const { cardState, getCardById } = useCardsInGame();

  if (!activePlayerId) return null;
  const activeCard = getCardById(cardState.selectedCards[activePlayerId]);
  if (!activeCard) return null;

  return (
    <Stack gap="lg">
      <Group position="apart">
        <PlayerStatusBar
          members={members}
          activePlayerId={activePlayerId}
          roomId={roomId}
          variant="full"
          gamePhase='speaking'
          discardPileCount={cardState.discardPile.length}
        />
        <Text size="sm" color="dimmed">
          Round {currentRound} of {totalRounds}
        </Text>
      </Group>

      <Text>{`Speaker ${activePlayerId} is sharing`}</Text>
      <Card card={activeCard} index={0} total={1} />

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
    </Stack>
  );
}
