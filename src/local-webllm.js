export const CODING_SYSTEM_PROMPT = `You are NoLimit Coder AI, an expert software engineer running locally in the user's browser.
Help with programming, debugging, architecture, refactoring, tests, performance, security, and developer tooling.
Prefer complete working examples when the user asks for implementation.
Preserve the user's requested language, framework, style, and constraints.
State assumptions and mention uncertainty instead of inventing APIs.
Keep answers practical and concise.`;

export const WEBLLM_CDN_URL = 'https://esm.run/@mlc-ai/web-llm';

export const LOCAL_MODELS = [
  {
    id: 'Qwen2.5-Coder-0.5B-Instruct-q4f16_1-MLC',
    name: 'Qwen2.5 Coder 0.5B',
    size: '≈ 945 MB VRAM',
    download: 'About 1 GB first download',
    fit: 'Best first choice for laptops and newer mobile-class devices with WebGPU.',
  },
  {
    id: 'Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC',
    name: 'Qwen2.5 Coder 1.5B',
    size: '≈ 1.7–2.0 GB VRAM',
    download: 'About 2 GB first download',
    fit: 'Better coding quality; use on devices with more available GPU memory.',
  },
  {
    id: 'Qwen2.5-Coder-3B-Instruct-q4f16_1-MLC',
    name: 'Qwen2.5 Coder 3B',
    size: '≈ 2.8–3.5 GB VRAM',
    download: 'About 3–4 GB first download',
    fit: 'Stronger coding model; desktop-class WebGPU device recommended.',
  },
];

let webllmModule;
let engine;
let loadedModelId = '';

export function hasWebGPU() {
  return Boolean(globalThis.navigator?.gpu);
}

export function getLoadedModelId() {
  return loadedModelId;
}

export async function loadLocalModel(modelId, onProgress) {
  if (!hasWebGPU()) {
    throw new Error('WebGPU is not available in this browser/device. Use a current Chromium-based browser with WebGPU enabled.');
  }

  const selected = LOCAL_MODELS.find((model) => model.id === modelId);
  if (!selected) {
    throw new Error('Selected model is not in the supported local model list.');
  }

  webllmModule ||= await import(WEBLLM_CDN_URL);
  const { CreateWebWorkerMLCEngine } = webllmModule;
  const worker = new Worker(new URL('./webllm-worker.js', import.meta.url), { type: 'module' });

  engine = await CreateWebWorkerMLCEngine(worker, modelId, {
    initProgressCallback: (progress) => {
      onProgress?.({
        progress: clampProgress(progress.progress),
        text: progress.text || 'Loading local model…',
      });
    },
  });

  loadedModelId = modelId;
  onProgress?.({ progress: 1, text: `${selected.name} is ready for local chat.` });
  return selected;
}

export async function generateLocalReply(messages, onToken) {
  if (!engine || !loadedModelId) {
    throw new Error('Load a local model before chatting.');
  }

  const stream = await engine.chat.completions.create({
    stream: true,
    temperature: 0.2,
    messages: [
      { role: 'system', content: CODING_SYSTEM_PROMPT },
      ...messages.map(({ role, content }) => ({ role, content })),
    ],
  });

  let reply = '';
  for await (const chunk of stream) {
    const token = chunk.choices?.[0]?.delta?.content || '';
    if (token) {
      reply += token;
      onToken?.(reply);
    }
  }

  return reply.trim();
}

export async function clearModelCache() {
  if ('caches' in globalThis) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }

  localStorage.removeItem('nolimit-coder-ai-selected-model');
}

function clampProgress(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
