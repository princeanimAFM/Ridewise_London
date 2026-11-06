import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';

/**
 * Live services: whether a service is on now, and the comments and prayer requests sent during it.
 * Both update in real time. Prayer requests are only ever returned to their sender and the ministry
 * team (the database enforces this), so the same query works for everyone.
 */
export type LiveSession = { id: string; title: string; started_at: string; notified_count: number };
export type LiveMessage = {
  id: number;
  session_id: string;
  user_id: string;
  name: string;
  is_team: boolean;
  kind: 'comment' | 'prayer';
  body: string;
  hidden: boolean;
  created_at: string;
};

/** The service that is live right now, or null. */
export function useLiveSession() {
  const [session, setSession] = useState<LiveSession | null>(null);
  const [loading, setLoading] = useState(!!supabase);

  const load = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from('live_sessions')
      .select('id, title, started_at, notified_count')
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setSession((data as LiveSession) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    load();
    const channel = supabase
      .channel('live-sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_sessions' }, () => load())
      .subscribe();
    return () => {
      supabase?.removeChannel(channel);
    };
  }, [load]);

  return { session, loading, reload: load };
}

/** Messages for one session, oldest first, kept up to date. */
export function useLiveMessages(sessionId: string | undefined) {
  const [messages, setMessages] = useState<LiveMessage[]>([]);

  useEffect(() => {
    setMessages([]);
    if (!supabase || !sessionId) return;
    let alive = true;
    supabase
      .from('live_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(150)
      .then(({ data }) => {
        if (alive && data) setMessages((data as LiveMessage[]).reverse());
      });
    const channel = supabase
      .channel(`live-messages-${sessionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_messages', filter: `session_id=eq.${sessionId}` }, (change) => {
        setMessages((list) => {
          if (change.eventType === 'DELETE') return list.filter((m) => m.id !== (change.old as LiveMessage).id);
          const m = change.new as LiveMessage;
          const rest = list.filter((x) => x.id !== m.id);
          return [...rest, m].sort((a, b) => a.created_at.localeCompare(b.created_at)).slice(-150);
        });
      })
      .subscribe();
    return () => {
      alive = false;
      supabase?.removeChannel(channel);
    };
  }, [sessionId]);

  /** Shows a message the sender just posted straight away, before the live update arrives. */
  const add = useCallback((m: LiveMessage) => setMessages((list) => (list.some((x) => x.id === m.id) ? list : [...list, m])), []);
  const remove = useCallback((id: number) => setMessages((list) => list.filter((m) => m.id !== id)), []);
  return { messages, add, remove };
}

export async function sendLiveMessage(sessionId: string, kind: 'comment' | 'prayer', body: string): Promise<LiveMessage> {
  const { data, error } = await supabase!.from('live_messages').insert({ session_id: sessionId, kind, body }).select('*').single();
  if (error) {
    if (/row-level security/i.test(error.message)) {
      throw new Error('Please wait a few seconds between messages. If the service has just ended, messages are closed.');
    }
    throw error;
  }
  return data as LiveMessage;
}

/** Ministry team: hide a comment from everyone. */
export async function hideLiveMessage(id: number) {
  const { error } = await supabase!.from('live_messages').update({ hidden: true }).eq('id', id);
  if (error) throw error;
}

/** Ministry team: start or end a live service (sends the "Live now" notification on start). */
export async function goLive(action: 'start' | 'end', title?: string): Promise<{ sent?: number }> {
  const { data, error } = await supabase!.functions.invoke('go-live', { body: { action, title } });
  if (error) {
    const ctx = (error as { context?: Response }).context;
    const detail = ctx && typeof ctx.json === 'function' ? await ctx.json().catch(() => null) : null;
    throw new Error(detail?.error ?? error.message);
  }
  return data ?? {};
}
