// src/components/room/GameSettingsForm.tsx
import { useState } from 'react';
import { Switch, Select, Group } from '@mantine/core';
import type { RoomSettings } from '@/core/game/types';

interface GameSettingsFormProps {
  initialSettings?: Partial<RoomSettings>;
  onChange: (settings: Partial<RoomSettings>) => void;
  dealExtrasDescription?: string;
}

export function GameSettingsForm({ 
  initialSettings = {}, 
  onChange,
  dealExtrasDescription = "If disabled, only Ripple and Exchanged cards can be used."
}: GameSettingsFormProps) {
  const [settings, setSettings] = useState<Partial<RoomSettings>>({
    deal_extras: initialSettings.deal_extras || true,
    card_depth: initialSettings.card_depth || null, 
    is_encore: initialSettings.is_encore || false
  });

  const handleSettingChange = (updatedSettings: Partial<RoomSettings>) => {
    const newSettings = { ...settings, ...updatedSettings };
    setSettings(newSettings);
    onChange(newSettings);
  };

  return (
    <Group gap="xs" justify='flex-start'>
      <Switch
        label="Deal New Cards"
        description={dealExtrasDescription}
        checked={settings.deal_extras}
        onChange={(event) => {
          handleSettingChange({ deal_extras: event.currentTarget.checked });
        }}
      />
      
      <Select
        label="Card Depth"
        description={!settings.deal_extras ? 
          "Need to enable Deal New Cards" : 
          "Only deal new cards from this level"}
        data={[
          { value: 'all', label: 'All Depths' },
          { value: '1', label: 'Light (Level 1)' },
          { value: '2', label: 'Medium (Level 2)' },
          { value: '3', label: 'Deep (Level 3)' }
        ]}
        value={settings.card_depth ? settings.card_depth.toString() : 'all'}
        onChange={(value) => handleSettingChange({
          card_depth: value === 'all' ? null : parseInt(value as string) as 1 | 2 | 3
        })}
        disabled={!settings.deal_extras}
      />
    </Group>
  );
}