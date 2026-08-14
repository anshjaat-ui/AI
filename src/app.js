<import {
  LOCAL_MODELS,
  clearModelCache,
  generateLocalReply,
  getLoadedModelId,
  hasWebGPU,
  loadLocalModel,
} from './local-webllm.js';

const CHAT_STORAGE_KEY = 'nolimit-coder-ai-local-chat';
const MODEL_STORAGE_KEY = 'nolimit-coder-ai-selected-model';

const starterMessages = [
  {
    role: 'assistant',
    content:
      'Hi! Choose and load a local WebGPU coding model first. After that, coding questions, debugging, refactoring, testing, and code generation run directly on your device.',
  },
];

let messages = loadMessages();
let lastUserPrompt = '';
let isGenerating = false;
let isModelReady = false;

const nodes = {
  webgpuStatus: document.querySelector('#webgpuStatus'),
  modelName: document.querySelector('#modelName'),
  runtimeStatus: document.querySelector('#runtimeStatus'),
  compatibilityMessage: document.querySelector('#compatibilityMessage'),

  modelSelect: document.querySelector('#modelSelect'),
  loadModelButton: document.querySelector('#loadModelButton'),
  clearCacheButton: document.querySelector('#clearCacheButton'),

  downloadStatus: document.querySelector('#downloadStatus'),
  downloadPercent: document.querySelector('#downloadPercent'),
  downloadProgress: document.querySelector('#downloadProgress'),
  modelHint: document.querySelector('#modelHint'),

  messages: document.querySelector('#messages'),
  prompt: document.querySelector('#prompt'),
  composer: document.querySelector('#composer'),
  sendButton: document.querySelector('#sendButton'),
  clearButton: document.querySelector('#clearButton'),
  status: document.querySelector('#status'),
};

init();

function init() {
  populateModels();
  updateWebGPUStatus();
  renderMessages();
  setChatEnabled(false);

  if (nodes.modelSelect) {
    nodes.modelSelect.addEventListener('change', handleModelSelection);
  }

  if (nodes.loadModelButton) {
    nodes.loadModelButton.addEventListener('click', handleModelLoad);
  }

  if (nodes.clearCacheButton) {
    nodes.clearCacheButton.addEventListener('click', handleClearCache);
  }

  if (nodes.clearButton) {
    nodes.clearButton.addEventListener('click', clearChat);
  }

  if (nodes.composer) {
    nodes.composer.addEventListener('submit', (event) => {
      event.preventDefault();
      sendPrompt(nodes.prompt.value);
    });
  }

  if (nodes.prompt) {
    nodes.prompt.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        nodes.composer.requestSubmit();
      }
    });
  }

  if (nodes.messages) {
    nodes.messages.addEventListener('click', handleMessageActions);
  }
}

function handleMessageActions(event) {
  const button = event.target.closest(
    'button[data-copy], button[data-retry]',
  );

  if (!button) return;

  if (button.dataset.copy) {
    copyCode(button.dataset.copy, button);
  }

  if (button.dataset.retry) {
    sendPrompt(lastUserPrompt, { retry: true });
  }
}

function populateModels() {
  if (!nodes.modelSelect || !Array.isArray(LOCAL_MODELS)) return;

  const savedModel =
    localStorage.getItem(MODEL_STORAGE_KEY) || LOCAL_MODELS[0]?.id;

  nodes.modelSelect.replaceChildren(
    ...LOCAL_MODELS.map((model) => {
      const option = document.createElement('option');

      option.value = model.id;
      option.textContent = `${model.name} — ${model.size}`;
      option.selected = model.id === savedModel;

      return option;
    }),
  );

  handleModelSelection();
}

function updateWebGPUStatus() {
  if (!nodes.webgpuStatus) return;

  if (hasWebGPU()) {
    nodes.webgpuStatus.textContent = 'Available';

    if (nodes.compatibilityMessage) {
      nodes.compatibilityMessage.textContent =
        'WebGPU is available. Model loading may still depend on your GPU memory, browser, and device capabilities.';

      nodes.compatibilityMessage.className =
        'compatibility-message success';
    }

    if (nodes.runtimeStatus) {
      nodes.runtimeStatus.textContent = 'Browser WebGPU';
    }

    return;
  }

  nodes.webgpuStatus.textContent = 'Unavailable';

  if (nodes.compatibilityMessage) {
    nodes.compatibilityMessage.textContent =
      'WebGPU is unavailable. Use a current Chromium-based browser with WebGPU support enabled.';

    nodes.compatibilityMessage.className =
      'compatibility-message error-text';
  }

  if (nodes.runtimeStatus) {
    nodes.runtimeStatus.textContent = 'WebGPU unavailable';
  }

  if (nodes.loadModelButton) {
    nodes.loadModelButton.disabled = true;
  }

  if (nodes.prompt) {
    nodes.prompt.disabled = true;
  }

  if (nodes.sendButton) {
    nodes.sendButton.disabled = true;
  }

  if (nodes.status) {
    nodes.status.textContent = 'WebGPU unavailable';
  }
}

function handleModelSelection() {
  const selected = getSelectedModel();

  if (!selected) return;

  localStorage.setItem(MODEL_STORAGE_KEY, selected.id);

  if (nodes.modelHint) {
    nodes.modelHint.textContent =
      `${selected.download}. ${selected.fit}`;
  }

  if (nodes.modelName) {
    nodes.modelName.textContent =
      getLoadedModelId() === selected.id
        ? selected.name
        : 'Not loaded';
  }

  if (!isModelReady && nodes.status) {
    nodes.status.textContent = hasWebGPU()
      ? 'Load a model first'
      : 'WebGPU unavailable';
  }
}

async function handleModelLoad() {
  const selected = getSelectedModel();

  if (!selected) {
    pushError('No local model is available.');
    return;
  }

  if (!hasWebGPU()) {
    pushError(
      'WebGPU is unavailable. Please use a compatible browser and device.',
    );
    return;
  }

  const confirmed = window.confirm(
    `Download/load ${selected.name}?\n\n` +
      `${selected.download}.\n` +
      `${selected.fit}\n\n` +
      'The model will run locally in your browser.',
  );

  if (!confirmed) return;

  setModelLoading(true);
  updateProgress(0, 'Preparing WebLLM runtime…');

  try {
    const loaded = await loadLocalModel(
      selected.id,
      ({ progress, text }) => {
        updateProgress(progress, text);
      },
    );

    isModelReady = true;

    if (nodes.modelName) {
      nodes.modelName.textContent = loaded.name;
    }

    if (nodes.runtimeStatus) {
      nodes.runtimeStatus.textContent = 'Local WebGPU';
    }

    if (nodes.status) {
      nodes.status.textContent = 'Ready — local model';
    }

    if (nodes.modelHint) {
      nodes.modelHint.textContent =
        'Model loaded successfully. Chat generation now runs locally on this device.';
    }

    updateProgress(1, 'Model ready');

    setChatEnabled(true);
  } catch (error) {
    isModelReady = false;

    setChatEnabled(false);

    updateProgress(0, 'Model load failed');

    pushError(
      error instanceof Error
        ? error.message
        : 'Could not load the local model.',
    );
  } finally {
    setModelLoading(false);
  }
}

async function handleClearCache() {
  const confirmed = window.confirm(
    'Clear locally cached model data for this site?\n\n' +
      'You may need to download the model again afterward.',
  );

  if (!confirmed) return;

  try {
    await clearModelCache();

    isModelReady = false;

    setChatEnabled(false);

    updateProgress(0, 'Local cache clear requested');

    if (nodes.runtimeStatus) {
      nodes.runtimeStatus.textContent = 'Browser-only';
    }

    if (nodes.modelName) {
      nodes.modelName.textContent = 'Not loaded';
    }

    if (nodes.status) {
      nodes.status.textContent = hasWebGPU()
        ? 'Load a model first'
        : 'WebGPU unavailable';
    }

    if (nodes.modelHint) {
      nodes.modelHint.textContent =
        'Model cache cleared. Choose a model and load it again when ready.';
    }
  } catch (error) {
    pushError(
      error instanceof Error
        ? error.message
        : 'Could not clear the local model cache.',
    );
  }
}

async function sendPrompt(rawPrompt, options = {}) {
  const userPrompt = String(rawPrompt || '').trim();

  if (!userPrompt || isGenerating || !isModelReady) {
    return;
  }

  lastUserPrompt = userPrompt;

  if (!options.retry) {
    messages.push({
      role: 'user',
      content: userPrompt,
    });

    nodes.prompt.value = '';
  }

  isGenerating = true;

  if (nodes.status) {
    nodes.status.textContent = 'Generating locally…';
  }

  if (nodes.sendButton) {
    nodes.sendButton.disabled = true;
  }

  const assistantMessage = {
    role: 'assistant',
    content: '',
  };

  messages.push(assistantMessage);

  renderMessages();

  try {
    const reply = await generateLocalReply(
      getConversationForModel(),
      (partial) => {
        assistantMessage.content = partial;
        renderMessages();
      },
    );

    assistantMessage.content =
      reply || 'No response was generated.';
  } catch (error) {
    messages.pop();

    pushError(
      error instanceof Error
        ? error.message
        : 'Unable to generate a local response.',
    );
  } finally {
    isGenerating = false;

    if (nodes.status) {
      nodes.status.textContent = 'Ready — local model';
    }

    if (nodes.sendButton) {
      nodes.sendButton.disabled = !isModelReady;
    }

    saveMessages();
    renderMessages();
  }
}

function getConversationForModel() {
  return messages
    .filter(
      (message) =>
        message.role === 'user' ||
        message.role === 'assistant',
    )
    .slice(-20)
    .map(({ role, content }) => ({
      role,
      content,
    }));
}

function renderMessages() {
  if (!nodes.messages) return;

  nodes.messages.replaceChildren(
    ...messages.map((message, index) =>
      renderMessage(message, index),
    ),
  );

  nodes.messages.scrollTop = nodes.messages.scrollHeight;
}

function renderMessage(message, index) {
  const article = document.createElement('article');

  article.className = `message ${message.role}`;

  const header = document.createElement('div');
  header.className = 'message-header';

  const author = document.createElement('strong');
  author.textContent = authorName(message.role);

  header.append(author);

  if (
    message.role === 'error' &&
    lastUserPrompt &&
    isModelReady
  ) {
    const retry = document.createElement('button');

    retry.className = 'inline-button';
    retry.type = 'button';
    retry.dataset.retry = String(index);
    retry.textContent = 'Retry';

    header.append(retry);
  }

  const body = document.createElement('div');

  body.className = 'message-body';

  renderMarkdown(
    body,
    message.content || '…',
  );

  article.append(header, body);

  return article;
}

function renderMarkdown(parent, content) {
  const parts = String(content).split(/```/g);

  parts.forEach((part, index) => {
    if (index % 2 === 1) {
      renderCodeBlock(parent, part);
      return;
    }

    renderText(parent, part);
  });
}

function renderText(parent, text) {
  String(text)
    .split(/\n{2,}/)
    .map((value) => value.trim())
    .filter(Boolean)
    .forEach((paragraphText) => {
      const paragraph = document.createElement('p');

      paragraph.textContent = paragraphText;

      parent.append(paragraph);
    });
}

function renderCodeBlock(parent, rawBlock) {
  const block = String(rawBlock);

  const firstLineBreak = block.indexOf('\n');

  const language =
    firstLineBreak > -1
      ? block.slice(0, firstLineBreak).trim()
      : '';

  const code =
    firstLineBreak > -1
      ? block.slice(firstLineBreak + 1).trim()
      : block.trim();

  const wrapper = document.createElement('div');

  wrapper.className = 'code-block';

  const toolbar = document.createElement('div');

  toolbar.className = 'code-toolbar';

  const label = document.createElement('span');

  label.textContent = language || 'code';

  const copy = document.createElement('button');

  copy.className = 'inline-button';
  copy.type = 'button';
  copy.dataset.copy = code;
  copy.textContent = 'Copy';

  const pre = document.createElement('pre');

  const codeNode = document.createElement('code');

  codeNode.className =
    `language-${language || 'text'}`;

  applyBasicHighlighting(
    codeNode,
    code,
    language,
  );

  pre.append(codeNode);

  toolbar.append(label, copy);

  wrapper.append(toolbar, pre);

  parent.append(wrapper);
}

function applyBasicHighlighting(
  codeNode,
  code,
  language,
) {
  const highlightedLanguages = new Set([
    'js',
    'jsx',
    'ts',
    'tsx',
    'javascript',
    'typescript',
    'python',
    'py',
    'css',
    'html',
  ]);

  const normalizedLanguage =
    String(language).toLowerCase();

  if (!highlightedLanguages.has(normalizedLanguage)) {
    codeNode.textContent = code;
    return;
  }

  const tokenPattern =
    /(\/\/.*|#.*|"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|`(?:\\.|[^`])*`|\b(?:const|let|var|function|return|if|else|for|while|class|import|from|export|async|await|try|catch|def|lambda|yield|true|false|null|None|and|or|not)\b)/g;

  let cursor = 0;

  for (const match of code.matchAll(tokenPattern)) {
    const matchIndex = match.index ?? 0;

    if (matchIndex > cursor) {
      codeNode.append(
        document.createTextNode(
          code.slice(cursor, matchIndex),
        ),
      );
    }

    const span = document.createElement('span');

    span.className = classifyToken(match[0]);

    span.textContent = match[0];

    codeNode.append(span);

    cursor = matchIndex + match[0].length;
  }

  if (cursor < code.length) {
    codeNode.append(
      document.createTextNode(
        code.slice(cursor),
      ),
    );
  }
}

function classifyToken(token) {
  if (
    token.startsWith('//') ||
    token.startsWith('#')
  ) {
    return 'token-comment';
  }

  if (
    token.startsWith('"') ||
    token.startsWith("'") ||
    token.startsWith('`')
  ) {
    return 'token-string';
  }

  return 'token-keyword';
}

function setModelLoading(isLoading) {
  if (nodes.loadModelButton) {
    nodes.loadModelButton.disabled =
      isLoading || !hasWebGPU();
  }

  if (nodes.modelSelect) {
    nodes.modelSelect.disabled = isLoading;
  }

  if (nodes.clearCacheButton) {
    nodes.clearCacheButton.disabled = isLoading;
  }
}

function setChatEnabled(enabled) {
  if (nodes.prompt) {
    nodes.prompt.disabled = !enabled;
  }

  if (nodes.sendButton) {
    nodes.sendButton.disabled =
      !enabled || isGenerating;
  }
}

function updateProgress(progress, text) {
  const safeProgress = Math.min(
    1,
    Math.max(0, Number(progress) || 0),
  );

  if (nodes.downloadProgress) {
    nodes.downloadProgress.value = safeProgress;
  }

  if (nodes.downloadPercent) {
    nodes.downloadPercent.textContent =
      `${Math.round(safeProgress * 100)}%`;
  }

  if (nodes.downloadStatus) {
    nodes.downloadStatus.textContent =
      text || 'Loading model…';
  }
}

function clearChat() {
  messages = [...starterMessages];

  lastUserPrompt = '';

  saveMessages();
  renderMessages();

  if (isModelReady && nodes.prompt) {
    nodes.prompt.focus();
  }
}

function pushError(content) {
  messages.push({
    role: 'error',
    content,
  });

  saveMessages();
  renderMessages();
}

async function copyCode(code, button) {
  try {
    await navigator.clipboard.writeText(code);

    const originalText =
      button.textContent;

    button.textContent = 'Copied';

    window.setTimeout(() => {
      button.textContent = originalText;
    }, 1200);
  } catch {
    button.textContent = 'Copy failed';

    window.setTimeout(() => {
      button.textContent = 'Copy';
    }, 1200);
  }
}

function getSelectedModel() {
  if (!Array.isArray(LOCAL_MODELS)) {
    return null;
  }

  return (
    LOCAL_MODELS.find(
      (model) =>
        model.id === nodes.modelSelect?.value,
    ) ||
    LOCAL_MODELS[0] ||
    null
  );
}

function authorName(role) {
  if (role === 'user') {
    return 'You';
  }

  if (role === 'error') {
    return 'Local runtime error';
  }

  return 'NoLimit Coder';
}

function loadMessages() {
  try {
    const stored = JSON.parse(
      localStorage.getItem(CHAT_STORAGE_KEY) ||
        'null',
    );

    if (
      Array.isArray(stored) &&
      stored.length > 0
    ) {
      return stored;
    }
  } catch {
    // Ignore invalid local storage.
  }

  return [...starterMessages];
}

function saveMessages() {
  try {
    localStorage.setItem(
      CHAT_STORAGE_KEY,
      JSON.stringify(messages.slice(-40)),
    );
  } catch {
    // Ignore storage errors.
  }
}
}
