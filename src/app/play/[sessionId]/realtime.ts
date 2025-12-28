import { createClient } from '@/lib/supabase/client';

export function setupRealtimeSubscription(
  sessionId: string,
  onUpdate: () => void
): () => void {
  console.log('Setting up realtime subscription for session:', sessionId);
  const supabase = createClient();
  
  const channel = supabase
    .channel(`room-${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'players',
        filter: `session_id=eq.${sessionId}`,
      },
      async (payload) => {
        console.log('Player updated in play page:', payload.new);
        onUpdate();
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'rounds',
        filter: `session_id=eq.${sessionId}`,
      },
      async (payload) => {
        console.log('Round created:', payload.new);
        onUpdate();
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'player_assignments',
        filter: `session_id=eq.${sessionId}`,
      },
      async (payload) => {
        console.log('Assignment changed:', payload.eventType, payload.new);
        if (payload.eventType === 'DELETE') {
          console.log('Assignment deleted, skipping reload to avoid race condition');
          return;
        }
        onUpdate();
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'game_sessions',
        filter: `id=eq.${sessionId}`,
      },
      async (payload) => {
        console.log('Session updated via broadcast:', payload.new);
        onUpdate();
      }
    )
    .subscribe((status, err) => {
      console.log('Realtime connection status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('✅ Connected to game updates');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Realtime channel error:', err);
      } else if (status === 'TIMED_OUT') {
        console.error('❌ Realtime connection timed out');
      }
    });

  return () => {
    console.log('Cleaning up play page realtime subscription');
    supabase.removeChannel(channel);
  };
}

export function setupVoteSubscription(
  sessionId: string,
  onVoteUpdate: (voteCounts: Record<string, number>) => void
): () => void {
  const supabase = createClient();
  
  const channel = supabase
    .channel(`session-${sessionId}-votes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'mystery_votes',
        filter: `session_id=eq.${sessionId}`,
      },
      async () => {
        // Recalculate vote counts
        const tallyResponse = await fetch(`/api/sessions/${sessionId}/tally-votes`);
        if (tallyResponse.ok) {
          const { voteCounts } = await tallyResponse.json();
          onVoteUpdate(voteCounts);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
