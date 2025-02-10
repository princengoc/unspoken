import { motion, type PanInfo } from 'framer-motion';
import { ReactNode } from 'react';

interface SwipeableProps {
  children: ReactNode;
  onSwipe?: (direction: 'left' | 'right') => void;
  onDragEnd?: (direction: 'left' | 'right' | null) => void;
  swipeThreshold?: number;
  className?: string;
}

export function Swipeable({ 
  children, 
  onSwipe, 
  onDragEnd,
  swipeThreshold = 100,
  className 
}: SwipeableProps) {
  const handleDragEnd = (event: any, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    
    // Trigger swipe if velocity is high enough or drag distance exceeds threshold
    if (Math.abs(velocity) >= 500 || Math.abs(offset) >= swipeThreshold) {
      const direction = offset > 0 ? 'right' : 'left';
      onSwipe?.(direction);
      onDragEnd?.(direction);
      
      // Trigger haptic feedback on mobile
      if (window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    } else {
      onDragEnd?.(null);
    }
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      className={className}
      whileDrag={{ 
        scale: 1.05,
        cursor: 'grabbing'
      }}
      style={{ 
        cursor: 'grab'
      }}
    >
      {children}
    </motion.div>
  );
}

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function FadeIn({ children, delay = 0, className }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface SlideInProps {
  children: ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  delay?: number;
  className?: string;
}

export function SlideIn({ 
  children, 
  direction = 'right', 
  delay = 0,
  className 
}: SlideInProps) {
  const directionMap = {
    left: { x: -100, y: 0 },
    right: { x: 100, y: 0 },
    up: { x: 0, y: -100 },
    down: { x: 0, y: 100 }
  };

  return (
    <motion.div
      initial={directionMap[direction]}
      animate={{ x: 0, y: 0 }}
      exit={directionMap[direction]}
      transition={{ 
        type: 'spring',
        stiffness: 500,
        damping: 30,
        delay 
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface ScaleInProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function ScaleIn({ children, delay = 0, className }: ScaleInProps) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ 
        type: 'spring',
        stiffness: 500,
        damping: 30,
        delay 
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}