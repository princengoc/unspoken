import { useState, useEffect } from 'react';

export const useScrollPosition = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);

    // Initial check
    handleScroll();

    // Clean up
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return { scrollY };
};