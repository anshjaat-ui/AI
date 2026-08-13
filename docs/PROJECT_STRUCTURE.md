# Project Structure

This repository contains a Vercel-compatible browser coding AI named **NoLimit Coder AI**.

```text
.
├── api/
│   └── chat.js             # Secure Vercel serverless endpoint for AI chat
├── docs/
│   └── PROJECT_STRUCTURE.md
├── lib/
│   └── ai/
│       ├── anthropic.js    # Anthropic provider implementation
│       ├── openai.js       # OpenAI provider implementation
│       └── provider.js     # Provider selection and coding system prompt
├── scripts/
│   └── verify.js           # Build-time repository checks
├── src/
│   ├── app.js              # Browser chat UI logic
│   └── styles.css          # Responsive visual design
├── .env.example            # Placeholder environment variables only
├── .gitignore
├── index.html              # Main app markup
├── package.json            # Development, build, and check scripts
└── vercel.json             # Vercel configuration and headers
```

## Request flow

1. The browser renders the static UI from `index.html`, `src/app.js`, and `src/styles.css`.
2. The browser sends conversation messages to `/api/chat`.
3. The Vercel function validates input and applies the server-side coding system prompt.
4. The provider abstraction calls the configured AI provider using server-side environment variables.
5. The browser renders the assistant response, including copyable code blocks.

## Extension points

- Add providers in `lib/ai/` and register them in `lib/ai/provider.js`.
- Add authentication or rate limiting before production public launch.
- Add streaming responses by extending `/api/chat` and the client renderer.
- Add project-file context later with a separate authenticated upload/indexing workflow.
