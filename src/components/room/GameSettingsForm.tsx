// src/components/room/GameSettingsForm.tsx
import { useState } from 'react';
import { Switch, Select, Group } from '@mantine/core';
import type { RoomSettings } from '@/core/game/types';

interface GameSettingsFormProps {
  initialSettings?: Partial<RoomSettings>;
  onChange: (settings: Partial<RoomSettings>) => void;
  rippleOnlyDescription?: string;
}

export function GameSettingsForm({ 
  initialSettings = {}, 
  onChange,
  rippleOnlyDescription = "If enabled, only Ripple and Exchanged cards can be used."
}: GameSettingsFormProps) {
  const [settings, setSettings] = useState<Partial<RoomSettings>>({
    ripple_only: initialSettings.ripple_only || false,
    card_depth: initialSettings.card_depth || null
  });

  const handleSettingChange = (updatedSettings: Partial<RoomSettings>) => {
    const newSettings = { ...settings, ...updatedSettings };
    setSettings(newSettings);
    onChange(newSettings);
  };

  return (
    <Group gap="xs" justify='flex-start'>
      <Switch
        label="Ripple and Exchange only"
        description={rippleOnlyDescription}
        checked={settings.ripple_only}
        onChange={(event) => {
          handleSettingChange({ ripple_only: event.currentTarget.checked });
        }}
      />
      
      <Select
        label="Card Depth"
        description={settings.ripple_only ? 
          "Need to disable ripple_only" : 
          "Only draw cards from this level"}
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
        disabled={settings.ripple_only}
      />
    </Group>
  );
}