# NoLimit Coder AI

NoLimit Coder AI is a free, local-first coding assistant UI. It is designed for programming workflows like code generation, debugging, tests, architecture, refactoring, and review.

The app does **not** include a paid hosted model or credit system. Instead, it connects to a model server that the user runs locally with [Ollama](https://ollama.com/). That is the practical way to offer unlimited in-app usage: compute happens on the user's own machine.

## Features

- Coding-focused chat interface
- Editable local model endpoint
- Editable model name, such as `codellama:7b`, `deepseek-coder`, or any model installed in Ollama
- Editable system instruction
- No app-side metering, credit balance, or paywall

## Requirements

- Node.js 20+
- Ollama installed and running locally
- A coding model pulled into Ollama

## Quick start

```bash
ollama pull codellama:7b
ollama serve
npm run start
```

Open http://localhost:5173 and send a coding request. The app is intentionally dependency-free, so `npm install` is not required for the current prototype.

## Browser CORS note

If your browser blocks requests to Ollama, start Ollama with an allowed origin for local development:

```bash
OLLAMA_ORIGINS=http://localhost:5173 ollama serve
```

## Why local models?

Commercial APIs cost money per token, so a truly free app cannot honestly promise unlimited use against those APIs. NoLimit Coder AI avoids app credits by letting users bring their own local compute.


## Files added to this repo

- `index.html` — app shell and coding assistant UI
- `src/app.js` — chat state, Ollama request handling, and safe message rendering
- `src/styles.css` — responsive dark interface styling
- `docs/PROJECT_STRUCTURE.md` — repository layout and next-step guidance
- `.gitignore` — common local, dependency, cache, and editor exclusions
