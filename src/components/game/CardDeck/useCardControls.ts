import { useAnimation } from 'framer-motion';

export function useCardControls() {
  const controls = useAnimation();

  // We're not using handleSwipe anymore as the logic is in the component
  // Just exposing controls for direct animation management
  
  return {
    controls
  };
}