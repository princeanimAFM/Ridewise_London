// Shared helpers for AFM HUB edge functions (Supabase / Deno).
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
}

/** Service-role client: bypasses row-level security. Only use after checking the caller. */
export function adminClient(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });
}

/** Returns the signed-in caller if they are the owner/admin, otherwise null. */
export async function requireAdmin(req: Request): Promise<{ id: string } | null> {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const db = adminClient();
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) return null;
  const { data: profile } = await db.from('profiles').select('is_admin').eq('id', data.user.id).single();
  return profile?.is_admin ? { id: data.user.id } : null;
}

export function publicUrl(bucket: string, path: string) {
  return `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/${bucket}/${path.split('/').map(encodeURIComponent).join('/')}`;
}
