import { Group } from '@mantine/core';

interface CardIndicatorsProps {
  total: number;
  current: number;
  className?: string;
}

export function CardIndicators({ total, current, className }: CardIndicatorsProps) {
  return (
    <Group gap={4} className={className}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 rounded-full transition-all duration-300 ${
            i === current 
              ? 'w-4 bg-blue-500' 
              : 'w-1 bg-gray-300'
          }`}
        />
      ))}
    </Group>
  );
}