import { useEffect, useRef } from 'react';

const HEARTBEAT_INTERVAL = 10000; // 10 seconds

/**
 * Hook to send periodic heartbeat to keep player status active
 */
export function usePlayerHeartbeat(playerId: string | null, enabled: boolean = true) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!playerId || !enabled) {
      return;
    }

    // Send initial heartbeat
    sendHeartbeat(playerId);

    // Set up interval
    intervalRef.current = setInterval(() => {
      sendHeartbeat(playerId);
    }, HEARTBEAT_INTERVAL);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [playerId, enabled]);

  async function sendHeartbeat(id: string) {
    try {
      await fetch(`/api/players/${id}/heartbeat`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to send heartbeat:', error);
    }
  }
}
