import React from 'react';
import { Avatar, Indicator, Tooltip } from '@mantine/core';
import { type PlayerAssignment } from './statusBarUtils';

interface PlayerAvatarProps {
  // Required props
  assignment: PlayerAssignment;
  
  // Optional styling and behavior
  size?: 'xs' | 'sm' | 'md' | 'lg';
  opacity?: number;
  highlighted?: boolean;
  highlightColor?: string;
  onClick?: () => void;
  
  // Optional tooltip
  showTooltip?: boolean;
  tooltipLabel?: string;
  
  // Optional indicator
  showIndicator?: boolean;
  indicatorIcon?: React.ReactNode;
  indicatorColor?: string;
  indicatorProcessing?: boolean;
}

/**
 * Reusable player avatar component that can be used across the application
 * with consistent styling and behavior.
 */
export function PlayerAvatar({
  // Required props
  assignment,
  
  // Optional styling
  size = 'md',
  opacity = 1,
  highlighted = false,
  highlightColor = 'green',
  onClick,
  
  // Optional tooltip
  showTooltip = false,
  tooltipLabel = '',
  
  // Optional indicator
  showIndicator = false,
  indicatorIcon = null,
  indicatorColor = 'yellow',
  indicatorProcessing = false,
  
}: PlayerAvatarProps) {
  const { Icon, bgColor } = assignment;
  
  // Determine icon size based on avatar size
  const getIconSize = (avatarSize: string): number => {
    switch (avatarSize) {
      case 'xs': return 12;
      case 'sm': return 16;
      case 'md': return 20;
      case 'lg': return 24;
      default: return 20;
    }
  };

  const avatar = (
    <Avatar
      radius="xl"
      size={size}
      styles={(theme) => ({
        root: {
          border: highlighted ? `2px solid ${highlightColor}` : 'none',
          boxSizing: 'content-box',
          padding: highlighted ? '2px' : '0',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all 0.2s ease',
        }
      })}
      style={{
        backgroundColor: bgColor,
        opacity: opacity,
      }}
      onClick={onClick}
    >
      <Icon
        size={getIconSize(size)}
        color="white"
      />
    </Avatar>
  );

  // Apply indicator if needed
  const avatarWithIndicator = showIndicator ? (
    <Indicator
      size={16}
      offset={2}
      position="bottom-end"
      color={indicatorColor}
      processing={indicatorProcessing}
      label={indicatorIcon}
    >
      {avatar}
    </Indicator>
  ) : avatar;

  // Apply tooltip if needed
  return showTooltip ? (
    <Tooltip label={tooltipLabel} position="top" withArrow>
      {avatarWithIndicator}
    </Tooltip>
  ) : avatarWithIndicator;
}