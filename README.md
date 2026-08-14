# NoLimit Coder AI

NoLimit Coder AI is a Vercel-hosted, browser-local coding assistant. Vercel serves the static website, while AI inference runs in the user's browser through WebGPU/WebAssembly and a locally cached WebLLM model.

No API credits are required because normal chat inference runs on the user's device. Performance is not unlimited: practical speed, memory capacity, and model size depend on the user's browser, GPU, available memory, storage, and selected model.

## Architecture

```text
Browser UI → WebGPU/WebAssembly → locally cached WebLLM model → coding assistant