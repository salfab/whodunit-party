import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Hook to track player presence using Supabase Presence.
 * 
 * This replaces the old HTTP heartbeat approach. Instead of polling an API
 * every 10 seconds (which triggered realtime events on player updates),
 * this uses WebSocket-based presence tracking.
 * 
 * Benefits:
 * - No database updates = no spurious realtime events triggering re-renders
 * - Real-time presence tracking with automatic cleanup on disconnect
 * - Lower server load (no HTTP requests every 10 seconds per player)
 * 
 * @param sessionId - The game session ID to track presence in
 * @param playerId - The current player's ID
 * @param playerName - The current player's name (for presence state)
 * @param enabled - Whether presence tracking is enabled (default: true)
 */
export function usePlayerPresence(
  sessionId: string | null,
  playerId: string | null,
  playerName: string | null,
  enabled: boolean = true
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!sessionId || !playerId || !enabled) {
      return;
    }

    // Create presence channel for this session
    const channel = supabase.channel(`presence:${sessionId}`, {
      config: {
        presence: {
          key: playerId,
        },
      },
    });

    // Track presence state
    channel
      .on('presence', { event: 'sync' }, () => {
        // Presence state synced - could be used for online indicators
        const state = channel.presenceState();
        console.log('Presence sync:', Object.keys(state).length, 'players online');
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('Player joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('Player left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track this player's presence
          await channel.track({
            player_id: playerId,
            player_name: playerName,
            online_at: new Date().toISOString(),
          });
          console.log('Presence tracking started for player:', playerId);
        }
      });

    channelRef.current = channel;

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        console.log('Cleaning up presence channel');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [sessionId, playerId, playerName, enabled, supabase]);

  // Return nothing for now - could return presence state if needed for UI
  return null;
}
