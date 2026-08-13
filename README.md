# NoLimit Coder AI

NoLimit Coder AI is a secure, browser-based coding assistant UI that can be deployed to Vercel. It helps with coding questions, code generation, debugging, explaining code, refactoring, optimization suggestions, tests, and complete-file drafting.

The browser never receives an AI provider API key. The frontend calls the server-side `/api/chat` route, and the Vercel function calls the configured provider using private environment variables.

## Architecture

```text
Browser UI → /api/chat → provider abstraction → AI provider
```

- `index.html` keeps the polished coding-AI interface.
- `src/app.js` manages multi-turn chat, retry, clear conversation, Enter-to-send, Shift+Enter newlines, and copyable code blocks.
- `api/chat.js` validates requests, limits payload size, applies safe errors, and calls the provider layer.
- `lib/ai/provider.js` selects the configured provider and owns the coding-focused system prompt.
- `lib/ai/openai.js` and `lib/ai/anthropic.js` contain provider-specific API calls.

## Environment variables

Create `.env.local` for local development. Never commit real secrets.

```bash
AI_API_KEY=your_secret_provider_key
AI_PROVIDER=openai
AI_MODEL=gpt-4o-mini
```

Supported provider values:

- `openai`
- `anthropic`

See `.env.example` for placeholder values.

## Local development

```bash
npm install
cp .env.example .env.local
# Edit .env.local and set AI_API_KEY.
npm run dev
```

Then open the local Vercel URL printed in the terminal, usually `http://localhost:3000`.

## Vercel deployment

1. Push this repository to GitHub.
2. Open Vercel and import the GitHub repository.
3. In Vercel Project Settings → Environment Variables, add:
   - `AI_API_KEY`
   - `AI_PROVIDER`
   - `AI_MODEL`
4. Deploy.
5. Open the Vercel deployment URL and start chatting.

## Security considerations

- API keys are read only inside the server-side API route.
- No secret values are placed in HTML, client JavaScript, or public environment variables.
- `.env` and `.env.local` files are ignored by Git.
- The API validates message roles and content.
- Request body size, message count, and individual message length are limited.
- Provider/internal errors are converted to safe public messages.

For a public production launch, add user authentication, stronger rate limiting, abuse monitoring, and billing controls based on your provider costs. This app does not bypass provider limits and should not claim unlimited AI usage unless your backend arrangement truly supports it.

## Project structure

See `docs/PROJECT_STRUCTURE.md` for the full file map and extension points.
