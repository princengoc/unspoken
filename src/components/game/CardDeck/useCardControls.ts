import { useAnimation } from 'framer-motion';

export function useCardControls() {
  const controls = useAnimation();

  const handleSwipe = async (direction: 'left' | 'right') => {
    const xOffset = direction === 'right' ? 200 : -200;
    
    await controls.start({
      x: xOffset,
      opacity: 0,
      transition: { duration: 0.3 }
    });

    // Reset position for next card
    await controls.set({ x: -xOffset });
    await controls.start({ x: 0, opacity: 1 });

    // Trigger haptic feedback on mobile
    if (window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
  };

  return {
    controls,
    handleSwipe
  };
}