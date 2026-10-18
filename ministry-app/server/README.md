# AFM Assistant server

The **AFM Assistant** in the app always answers common questions (sermons,
books, the Handbook, contact details) on its own. This small server lets it
answer *anything* using Claude, while keeping your Anthropic API key private.
The key never goes inside the app.

It runs as a free [Cloudflare Worker](https://workers.cloudflare.com/).

## One-time setup (about 10 minutes)

1. **Get an Anthropic API key** at <https://console.anthropic.com/>, under
   API Keys. Add a little credit under Billing.
2. **Create a free Cloudflare account** at <https://dash.cloudflare.com/sign-up>.
3. In this `server` folder, run:

   ```bash
   npm install
   npx wrangler login                      # opens a browser to connect Cloudflare
   npx wrangler secret put ANTHROPIC_API_KEY   # paste your API key when asked
   npm run deploy
   ```

   The last command prints a web address such as
   `https://afm-assistant.your-name.workers.dev`.
4. Put that address in the app, in `src/content/ministry.ts`:

   ```ts
   assistant: {
     name: 'AFM Assistant',
     apiUrl: 'https://afm-assistant.your-name.workers.dev',
   },
   ```

## Keeping it up to date

The assistant knows what the app shows: the biography, Mission Statement,
Handbook, quotes, books and links. After you change the app's content, run
`npm run deploy` again. It rebuilds the assistant's knowledge
(`src/instructions.ts`) from the app's content files first.

## Cost

The server uses `claude-opus-5` by default, the most capable model. The
assistant's knowledge is cached between questions, so repeat questions cost
less. To lower costs further, set a cheaper model in `wrangler.toml`:

```toml
[vars]
MODEL = "claude-haiku-4-5"
```

Then run `npm run deploy`. You can see usage and set a monthly spending limit
in the Anthropic Console.

## Safety limits

- Each device can send at most 20 questions a minute. For a hard limit, add a
  Cloudflare rate-limiting rule for the Worker.
- Only the last 12 messages of a chat are sent, each capped at 2,000 characters.
- The assistant is told to answer only from the app's information, to never
  invent dates, prices or events, and to point people to
  princeanim88@gmail.com for anything it doesn't know.

## Testing it

```bash
curl -X POST https://afm-assistant.your-name.workers.dev \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"What is YouUseMe?"}]}'
```
