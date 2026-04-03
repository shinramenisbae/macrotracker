import { useState, useEffect, useCallback } from 'react';
import { getGoals } from '../lib/api';
import type { Goals } from '../types';

const DEFAULT_GOALS: Goals = {
  calories: 2000,
  protein_g: 150,
  carbs_g: 250,
  fat_g: 65,
};

export function useGoals() {
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);

  const refresh = useCallback(async () => {
    try {
      const res = await getGoals();
      setGoals(res.goals);
    } catch {
      // Use defaults
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { goals, refresh };
}
