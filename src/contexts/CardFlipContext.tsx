'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface CardFlipContextType {
  hasEverBeenFlipped: boolean;
  markAsFlipped: () => void;
}

const CardFlipContext = createContext<CardFlipContextType | undefined>(undefined);

export function CardFlipProvider({ children }: { children: ReactNode }) {
  const [hasEverBeenFlipped, setHasEverBeenFlipped] = useState(false);

  const markAsFlipped = () => {
    setHasEverBeenFlipped(true);
  };

  return (
    <CardFlipContext.Provider value={{ hasEverBeenFlipped, markAsFlipped }}>
      {children}
    </CardFlipContext.Provider>
  );
}

export function useCardFlip() {
  const context = useContext(CardFlipContext);
  if (context === undefined) {
    throw new Error('useCardFlip must be used within a CardFlipProvider');
  }
  return context;
}
