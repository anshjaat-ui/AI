# Project Structure

This repository contains a Vercel-hosted frontend for **NoLimit Coder AI**, a browser-local coding assistant powered by WebGPU and WebLLM.

```text
.
├── docs/
│   └── PROJECT_STRUCTURE.md
├── scripts/
│   ├── dev-server.js       # Node static dev server with browser-ML headers
│   └── verify.js           # Syntax and cleanup verification
├── src/
│   ├── app.js              # Chat UI, model controls, streaming, copy/retry/clear
│   ├── local-webllm.js     # WebGPU checks, model list, WebLLM loading, generation
│   ├── styles.css          # Responsive NoLimit Coder visual design
│   └── webllm-worker.js    # WebLLM worker bridge for non-blocking inference
├── .gitignore
├── index.html              # Static application shell
├── package.json            # Local dev and verification scripts
├── package-lock.json
└── vercel.json             # Static hosting and cross-origin isolation headers
```

## Runtime flow

1. The user opens the static site.
2. `src/app.js` checks WebGPU support through `src/local-webllm.js`.
3. The user selects a supported model and explicitly starts the download/load process.
4. WebLLM downloads model artifacts and caches them where supported by the browser.
5. Chat messages stream through the loaded local model inside the browser.

## Extension points

- Add smaller or larger WebLLM-supported models to `LOCAL_MODELS` in `src/local-webllm.js`.
- Add richer markdown parsing or a dedicated syntax highlighter if a bundled build step is introduced.
- Add a service worker only after confirming cache strategy and model artifact behavior for target browsers.
- Add import/export chat history without sending prompts off-device.
