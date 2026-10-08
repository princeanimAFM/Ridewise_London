import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';

export type Announcement = {
  id: string;
  title: string;
  body: string;
  sms_text: string | null;
  flyer_path: string | null;
  event_date: string | null;
  created_at: string;
  sent_at: string | null;
  sent_count: number;
  failed_count: number;
  published: boolean;
  send_email: boolean;
  send_sms: boolean;
};

/** Published announcements, newest first. */
export function useAnnouncements(limit = 30) {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(!!supabase);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase.from('announcements').select('*').eq('published', true).order('created_at', { ascending: false }).limit(limit);
    setItems((data as Announcement[]) ?? []);
    setError(error ? 'Could not load announcements. Check your connection.' : '');
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, loading, error, reload: load };
}
