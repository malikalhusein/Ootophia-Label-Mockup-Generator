import { useState, useRef, useEffect, useCallback } from 'react';

export function useHistory<T>(initialState: T, debounceMs: number = 300) {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [localState, setLocalState] = useState<T>(initialState);
  
  const currentIndexRef = useRef(currentIndex);
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const set = useCallback((updater: T | ((prev: T) => T)) => {
    setLocalState((prev) => {
      const nextState = typeof updater === 'function' ? (updater as any)(prev) : updater;
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        setHistory((currentHistory) => {
          const currentIdx = currentIndexRef.current;
          const currentHistoryState = currentHistory[currentIdx];
          if (JSON.stringify(nextState) !== JSON.stringify(currentHistoryState)) {
            const newHistory = currentHistory.slice(0, currentIdx + 1);
            newHistory.push(nextState);
            setCurrentIndex(newHistory.length - 1);
            return newHistory;
          }
          return currentHistory;
        });
      }, debounceMs);

      return nextState;
    });
  }, []);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setLocalState(history[prevIndex]);
    }
  }, [currentIndex, history]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setLocalState(history[nextIndex]);
    }
  }, [currentIndex, history]);

  return {
    state: localState,
    set,
    undo,
    redo,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
  };
}
