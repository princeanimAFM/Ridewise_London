/**
 * AFM Assistant server — a Cloudflare Worker that answers questions for the
 * AFM Assistant in The AFM HUB app using Claude.
 *
 * POST /  { messages: [{ role: "user" | "assistant", content: string }, ...] }
 *   ->    { text: string }
 *
 * The Anthropic API key stays here on the server (a Worker secret), never in
 * the app. See README.md for setup.
 */
import Anthropic from "@anthropic-ai/sdk";
import { INSTRUCTIONS } from "./instructions";

export interface Env {
  ANTHROPIC_API_KEY: string;
  /** Optional: override the model, e.g. "claude-haiku-4-5" for lower cost. */
  MODEL?: string;
  /** Optional: restrict browser access to one origin (the app itself needs none). */
  ALLOWED_ORIGIN?: string;
}

const DEFAULT_MODEL = "claude-opus-5";
const MAX_TURNS = 12;
const MAX_CHARS = 2000;
const RATE_LIMIT = { requests: 20, windowMs: 60_000 };

// Best-effort per-IP limit (per Worker instance). Add a Cloudflare rate
// limiting rule for a hard limit.
const hits = new Map<string, { count: number; reset: number }>();

function rateLimited(ip: string) {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.reset < now) {
    hits.set(ip, { count: 1, reset: now + RATE_LIMIT.windowMs });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT.requests;
}

function cors(env: Env): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(body: unknown, status: number, env: Env) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...cors(env) } });
}

/** Validates and trims the chat history sent by the app. */
function parseMessages(body: unknown): Anthropic.Beta.BetaMessageParam[] | null {
  const raw = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const turns: Anthropic.Beta.BetaMessageParam[] = [];
  for (const m of raw.slice(-MAX_TURNS)) {
    const role = (m as { role?: unknown })?.role;
    const content = (m as { content?: unknown })?.content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string" || !content.trim()) return null;
    turns.push({ role, content: content.slice(0, MAX_CHARS) });
  }
  while (turns[0]?.role === "assistant") turns.shift();
  if (!turns.length || turns[turns.length - 1].role !== "user") return null;
  return turns;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") return new Response(null, { headers: cors(env) });
    if (request.method !== "POST") return json({ error: "Use POST" }, 405, env);

    const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
    if (rateLimited(ip)) return json({ error: "Too many requests. Please wait a minute." }, 429, env);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400, env);
    }
    const messages = parseMessages(body);
    if (!messages) return json({ error: "Send { messages: [...] } ending with a user message." }, 400, env);

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const model = env.MODEL || DEFAULT_MODEL;
    const isOpus5 = model.startsWith("claude-opus-5");

    try {
      const response = await client.beta.messages.create({
        model,
        max_tokens: 2048,
        // The large, unchanging instructions are cached so repeat questions cost less.
        system: [{ type: "text", text: INSTRUCTIONS, cache_control: { type: "ephemeral" } }],
        messages,
        // Short, friendly chat answers: low effort keeps replies quick.
        ...(isOpus5
          ? { output_config: { effort: "low" as const }, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }
          : {}),
      });

      if (response.stop_reason === "refusal") {
        return json({ text: "I'm not able to help with that one. Is there something about the ministry or the app I can help you find?" }, 200, env);
      }
      const text = response.content
        .flatMap((block) => (block.type === "text" ? [block.text] : []))
        .join("\n")
        .trim();
      return json({ text: text || "Sorry, I couldn't come up with an answer. Please try asking another way." }, 200, env);
    } catch (err) {
      if (err instanceof Anthropic.RateLimitError) return json({ error: "The assistant is busy. Please try again shortly." }, 429, env);
      if (err instanceof Anthropic.APIError) {
        console.error("Anthropic API error", err.status, err.message);
        return json({ error: "The assistant is unavailable right now." }, 502, env);
      }
      console.error("Unexpected error", err);
      return json({ error: "The assistant is unavailable right now." }, 500, env);
    }
  },
};
