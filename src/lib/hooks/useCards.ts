// src/lib/hooks/useCards.ts
import { useState, useEffect } from 'react';
import { cardsTable } from '../supabase/client';
import type { Card } from '../supabase/types';

export function useCards(options?: { 
  category?: string;
  depth?: 1 | 2 | 3;
}) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadCards() {
      try {
        let data: Card[];
        if (options?.category) {
          data = await cardsTable.getByCategory(options.category);
        } else if (options?.depth) {
          data = await cardsTable.getByDepth(options.depth);
        } else {
          data = await cardsTable.getAll();
        }
        setCards(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    loadCards();
  }, [options?.category, options?.depth]);

  return { cards, loading, error };
}
