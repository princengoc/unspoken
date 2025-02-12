import { Stack, Text, Button, Group } from '@mantine/core';
import { useGameState } from '@/context/GameStateProvider';
import { useRoomMembers } from '@/context/RoomMembersProvider';
import { useRoom } from '@/context/RoomProvider';
import { ListenerReactions } from '../ListenerReactions';
import { Card } from '../Card';
import { PlayerStatusBar } from '../PlayerStatus';
import { PLAYER_STATUS } from '@/core/game/constants';

type SpeakingProps = {
  gameStateId: string;
}

export function Speaking({gameStateId}: SpeakingProps) {
  const { 
    activePlayerId,
    currentRound,
    totalRounds,
    cardsInPlay 
  } = useGameState();
  
  const { members, currentMember } = useRoomMembers();
  
  const {
    canStartSpeaking,
    isActiveSpeaker,
    startSpeaking,
    finishSpeaking
  } = useRoom();

  // Find the current speaker from members
  const currentSpeaker = members.find(m => m.id === activePlayerId);

  // Browser Mode: User is waiting to speak
  if (currentMember?.status === PLAYER_STATUS.BROWSING) {
    return (
      <Stack gap="lg">
        {cardsInPlay.map((card, index) => (
          <Card
            key={card.id}
            card={card}
            index={index}
            total={cardsInPlay.length}
            showExchange={false}
          />
        ))}
        {canStartSpeaking && (
          <Button onClick={startSpeaking} fullWidth size="lg" variant="filled">
            Start Sharing
          </Button>
        )}
      </Stack>
    );
  }

  // Active Speaker or Listener Mode
  return (
    <Stack gap="lg">
      {currentSpeaker && (
        <>
          <Group position="apart">
            <PlayerStatusBar 
              members={[currentSpeaker]} 
              activePlayerId={activePlayerId}
              variant="full"
            />
            <Text size="sm" c="dimmed">
              Round {currentRound} of {totalRounds}
            </Text>
          </Group>
          
          {currentSpeaker.selectedCard && (
            <Card
              card={cardsInPlay.find((c) => c.id === currentSpeaker.selectedCard)!}
              index={0}
              total={1}
            />
          )}
          
          {isActiveSpeaker ? (
            <Button
              onClick={finishSpeaking}
              fullWidth
              size="lg"
              variant="filled"
              color="green"
            >
              Finish Sharing
            </Button>
          ) : (
            <ListenerReactions
              speakerId={currentSpeaker.id}
              cardId={currentSpeaker.selectedCard!}
              gameStateId={gameStateId}
            />
          )}
        </>
      )}
    </Stack>
  );
}