# NoLimit Coder AI

NoLimit Coder AI is a Vercel-hosted, browser-local coding assistant. Vercel serves the static website, while AI inference runs in the user's browser through WebGPU/WebAssembly and a locally cached WebLLM model.

No API credits are required because normal chat inference runs on the user's device. Performance is not unlimited: practical speed, memory capacity, and model size depend on the user's browser, GPU, available memory, storage, and selected model.

## Architecture

```text
Browser UI → WebGPU/WebAssembly → locally cached WebLLM model → coding assistant
```

There is no server-side model call in the normal chat path. The browser loads WebLLM, downloads the selected model with user confirmation, caches model artifacts where supported by the browser, and streams generated tokens locally.

## WebGPU requirements

A browser with WebGPU support is required for model inference. Current Chromium-based desktop browsers generally provide the best experience. Some mobile browsers/devices may not expose enough WebGPU capability or memory for these models.

The app detects `navigator.gpu` on first load and blocks model loading with a clear compatibility message when WebGPU is unavailable.

## Supported local models

| Model | Approximate requirement | Best for |
| --- | --- | --- |
| Qwen2.5 Coder 0.5B q4f16 | About 1 GB first download, around 945 MB VRAM | First run, broadest compatibility |
| Qwen2.5 Coder 1.5B q4f16 | About 2 GB first download, roughly 1.7–2.0 GB VRAM | Better coding quality on stronger devices |
| Qwen2.5 Coder 3B q4f16 | About 3–4 GB first download, roughly 2.8–3.5 GB VRAM | Desktop-class WebGPU devices |

The model identifiers are configured in `src/local-webllm.js` and use MLC/WebLLM model builds intended for browser inference.

## First-run setup

1. Open the deployed website.
2. Confirm WebGPU status is available.
3. Select a model.
4. Click **Download / Load model**.
5. Review the approximate download and memory requirements.
6. Confirm the download.
7. Wait for progress to reach 100%.
8. Start chatting.

The app does not automatically download a large model.

## Local caching

WebLLM uses browser cache/storage backends where available. After a model is downloaded and cached, later visits can often reload without downloading all model artifacts again. Offline behavior depends on browser cache retention and whether the WebLLM runtime and model artifacts are already cached by the browser.

Use **Clear local cache** to request cache deletion for this site where the browser permits it. The browser may manage storage eviction independently.

## Privacy

Normal chat prompts and generated code are processed by the local model in the user's browser. The app does not collect prompts, add analytics, or send chat content to a remote model provider. The first model download still retrieves model/runtime assets from public hosting/CDN sources.

## Local development

Developer tooling requires Node.js, but end users only need to open the deployed website in a compatible browser.

```bash
npm install
npm run dev
```

Then open `http://localhost:5173`.

## Vercel deployment

1. Push this repository to GitHub.
2. Import the repository into Vercel.
3. Deploy as a static frontend.
4. Do not configure AI provider keys; none are required for normal chat.
5. Open the deployment URL in a WebGPU-capable browser.

## Security notes

- No AI provider secret is needed or exposed.
- No hidden tracking, credential collection, background mining, or unauthorized device access is implemented.
- Local inference runs only after the user explicitly loads a model and sends a chat request.
- Cross-origin isolation headers are configured to support high-performance browser ML runtimes.

## Project structure

See `docs/PROJECT_STRUCTURE.md` for the file map and extension points.
