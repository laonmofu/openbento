import { useState, useCallback, useEffect, useRef } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface UseSaveStatusReturn {
  status: SaveStatus;
  lastSavedAt: number | null;
  timeAgo: string;
  setSaving: () => void;
  setSaved: () => void;
  setError: () => void;
  setIdle: () => void;
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = Math.floor((now - timestamp) / 1000);

  if (diff < 5) return 'Just now';
  if (diff < 60) return `${diff}s ago`;

  const minutes = Math.floor(diff / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function useSaveStatus(): UseSaveStatusReturn {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [timeAgo, setTimeAgo] = useState<string>('');
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update timeAgo periodically
  useEffect(() => {
    if (!lastSavedAt) return;

    const updateTimeAgo = () => {
      setTimeAgo(formatTimeAgo(lastSavedAt));
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 10000); // Update every 10s

    return () => clearInterval(interval);
  }, [lastSavedAt]);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current);
      }
    };
  }, []);

  const setSaving = useCallback(() => {
    if (savedTimeoutRef.current) {
      clearTimeout(savedTimeoutRef.current);
      savedTimeoutRef.current = null;
    }
    setStatus('saving');
  }, []);

  const setSaved = useCallback(() => {
    setStatus('saved');
    setLastSavedAt(Date.now());

    // Return to idle after 1.5s
    savedTimeoutRef.current = setTimeout(() => {
      setStatus('idle');
    }, 1500);
  }, []);

  const setError = useCallback(() => {
    setStatus('error');

    // Return to idle after 3s
    savedTimeoutRef.current = setTimeout(() => {
      setStatus('idle');
    }, 3000);
  }, []);

  const setIdle = useCallback(() => {
    if (savedTimeoutRef.current) {
      clearTimeout(savedTimeoutRef.current);
      savedTimeoutRef.current = null;
    }
    setStatus('idle');
  }, []);

  return {
    status,
    lastSavedAt,
    timeAgo,
    setSaving,
    setSaved,
    setError,
    setIdle,
  };
}
