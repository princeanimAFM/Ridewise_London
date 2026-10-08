/**
 * draft-announcement — AI writes the newsletter for an announcement from the
 * owner's notes and/or the uploaded flyer. Owner-only.
 *
 * POST { title?: string, notes?: string, event_date?: string, flyer_path?: string }
 *   -> { title, body, sms_text }
 *
 * Secret: ANTHROPIC_API_KEY (optional ANTHROPIC_MODEL, default claude-opus-5).
 */
import Anthropic from 'npm:@anthropic-ai/sdk';
import { adminClient, corsHeaders, json, publicUrl, requireAdmin } from '../_shared/auth.ts';
import { liveBrand } from '../_shared/liveBrand.ts';
import { formatEventDate } from '../_shared/newsletter.ts';

const schema = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Short, clear announcement title (max 80 characters).' },
    body: { type: 'string', description: 'Newsletter body in plain text, 2-4 short paragraphs separated by blank lines.' },
    sms_text: { type: 'string', description: 'One-sentence text message version, max 140 characters, no greeting or links.' },
  },
  required: ['title', 'body', 'sms_text'],
  additionalProperties: false,
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Use POST' }, 405);
  if (!(await requireAdmin(req))) return json({ error: 'Only the owner account can use this.' }, 403);
  if (!Deno.env.get('ANTHROPIC_API_KEY')) return json({ error: 'AI writing is not set up yet (ANTHROPIC_API_KEY missing).' }, 400);

  let input: { title?: string; notes?: string; event_date?: string; flyer_path?: string };
  try {
    input = await req.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }
  const title = (input.title ?? '').slice(0, 150);
  const notes = (input.notes ?? '').slice(0, 4000);
  if (!title && !notes && !input.flyer_path) return json({ error: 'Add a title, some notes or a flyer first.' }, 400);

  const brand = await liveBrand(adminClient());
  const instructions = `You write newsletter announcements for ${brand.name}, the ministry of ${brand.minister} and the AFM Family Network.
The theme for ${brand.theme.year} is "${brand.theme.title}".

Write an announcement from the details below${input.flyer_path ? ' and the attached flyer (read the programme name, date, time, venue and speakers from it)' : ''}.
- The email already starts with "Dear <first name>," and ends with "Blessings, ${brand.name}", so do not add a greeting or sign-off.
- Warm, faith-filled and clear. Say what is happening, when, where, and what to do (attend, join online, invite others).
- Use only facts given in the details or on the flyer. Never invent dates, times, venues, speakers or prices; if something is missing, leave it out.
- 2 to 4 short paragraphs in plain text, no Markdown, no emojis.

Details:
Title: ${title || '(not given)'}
Date: ${input.event_date ? formatEventDate(input.event_date) : '(not given)'}
Notes: ${notes || '(none)'}`;

  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (input.flyer_path) content.push({ type: 'image', source: { type: 'url', url: publicUrl('flyers', input.flyer_path) } });
  content.push({ type: 'text', text: instructions });

  const client = new Anthropic();
  const model = Deno.env.get('ANTHROPIC_MODEL') || 'claude-opus-5';
  try {
    const response = await client.beta.messages.create({
      model,
      max_tokens: 4096,
      messages: [{ role: 'user', content }],
      output_config: { format: { type: 'json_schema', schema }, ...(model.startsWith('claude-opus-5') ? { effort: 'medium' as const } : {}) },
      ...(model.startsWith('claude-opus-5') ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
    });
    if (response.stop_reason === 'refusal') return json({ error: 'The AI could not write this one. Please write it yourself or change the notes.' }, 422);
    const text = response.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
    const draft = JSON.parse(text) as { title: string; body: string; sms_text: string };
    return json({ title: draft.title.slice(0, 150), body: draft.body.slice(0, 5000), sms_text: draft.sms_text.slice(0, 320) });
  } catch (e) {
    if (e instanceof Anthropic.APIError) return json({ error: `AI service error (${e.status}). Try again shortly.` }, 502);
    return json({ error: 'The AI reply could not be read. Please try again.' }, 502);
  }
});
