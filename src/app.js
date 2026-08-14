import {
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
      'Hi! Choose and load a local WebGPU model first. After that, coding questions, debugging, refactoring, and code generation run on your device.',
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

  nodes.modelSelect.addEventListener('change', handleModelSelection);
  nodes.loadModelButton.addEventListener('click', handleModelLoad);
  nodes.clearCacheButton.addEventListener('click', handleClearCache);
  nodes.clearButton.addEventListener('click', clearChat);

  nodes.composer.addEventListener('submit', (event) => {
    event.preventDefault();
    sendPrompt(nodes.prompt.value);
  });

  nodes.prompt.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      nodes.composer.requestSubmit();
    }
  });

  nodes.messages.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-copy], button[data-retry]');
    if (!button) return;

    if (button.dataset.copy) copyCode(button.dataset.copy, button);
    if (button.dataset.retry) sendPrompt(lastUserPrompt, { retry: true });
  });
}

function populateModels() {
  const savedModel = localStorage.getItem(MODEL_STORAGE_KEY) || LOCAL_MODELS[0].id;

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
  if (hasWebGPU()) {
    nodes.webgpuStatus.textContent = 'Available';
    nodes.compatibilityMessage.textContent = 'Your browser reports WebGPU support. Model loading may still depend on GPU memory and browser limits.';
    nodes.compatibilityMessage.className = 'compatibility-message success';
    return;
  }

  nodes.webgpuStatus.textContent = 'Unavailable';
  nodes.compatibilityMessage.textContent = 'WebGPU is unavailable. Use a current Chromium-based browser with WebGPU enabled to run local inference.';
  nodes.compatibilityMessage.className = 'compatibility-message error-text';
  nodes.loadModelButton.disabled = true;
}

function handleModelSelection() {
  const selected = getSelectedModel();
  nodes.modelHint.textContent = `${selected.download}. ${selected.fit}`;
  nodes.modelName.textContent = getLoadedModelId() || selected.name;
  localStorage.setItem(MODEL_STORAGE_KEY, selected.id);
}

async function handleModelLoad() {
  const selected = getSelectedModel();
  if (!confirm(`Download/load ${selected.name}?\n\n${selected.download}.\n${selected.fit}\n\nThe model is cached locally where your browser supports it.`)) {
    return;
  }

  setModelLoading(true);
  updateProgress(0, 'Preparing WebLLM runtime…');

  try {
    const loaded = await loadLocalModel(selected.id, ({ progress, text }) => {
      updateProgress(progress, text);
    });

    isModelReady = true;
    nodes.modelName.textContent = loaded.name;
    nodes.runtimeStatus.textContent = 'Local WebGPU';
    nodes.status.textContent = 'Ready — local model';
    nodes.modelHint.textContent = 'Model is loaded. Chat content now stays on this device during generation.';
    setChatEnabled(true);
  } catch (error) {
    isModelReady = false;
    setChatEnabled(false);
    updateProgress(0, 'Model load failed');
    pushError(error instanceof Error ? error.message : 'Could not load the local model.');
  } finally {
    setModelLoading(false);
  }
}

async function handleClearCache() {
  if (!confirm('Clear locally cached model data for this site where the browser allows it? You may need to download the model again.')) {
    return;
  }

  await clearModelCache();
  isModelReady = false;
  setChatEnabled(false);
  updateProgress(0, 'Local cache clear requested');
  nodes.runtimeStatus.textContent = 'Browser-only';
  nodes.modelName.textContent = 'Not loaded';
  nodes.status.textContent = 'Load a model first';
}

async function sendPrompt(rawPrompt, options = {}) {
  const userPrompt = rawPrompt.trim();
  if (!userPrompt || isGenerating || !isModelReady) return;

  lastUserPrompt = userPrompt;
  if (!options.retry) {
    messages.push({ role: 'user', content: userPrompt });
    nodes.prompt.value = '';
  }

  isGenerating = true;
  nodes.status.textContent = 'Generating locally…';
  nodes.sendButton.disabled = true;

  const assistantMessage = { role: 'assistant', content: '' };
  messages.push(assistantMessage);
  renderMessages();

  try {
    const reply = await generateLocalReply(getConversationForModel(), (partial) => {
      assistantMessage.content = partial;
      renderMessages();
    });

    assistantMessage.content = reply || 'No response generated.';
  } catch (error) {
    messages.pop();
    pushError(error instanceof Error ? error.message : 'Unable to generate a local response.');
  } finally {
    isGenerating = false;
    nodes.status.textContent = 'Ready — local model';
    nodes.sendButton.disabled = false;
    saveMessages();
    renderMessages();
  }
}

function getConversationForModel() {
  return messages
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .slice(-20)
    .map(({ role, content }) => ({ role, content }));
}

function renderMessages() {
  nodes.messages.replaceChildren(...messages.map(renderMessage));
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

  if (message.role === 'error' && lastUserPrompt && isModelReady) {
    const retry = document.createElement('button');
    retry.className = 'inline-button';
    retry.type = 'button';
    retry.dataset.retry = String(index);
    retry.textContent = 'Retry';
    header.append(retry);
  }

  const body = document.createElement('div');
  body.className = 'message-body';
  renderMarkdown(body, message.content || '…');

  article.append(header, body);
  return article;
}

function renderMarkdown(parent, content) {
  const parts = content.split(/```/g);

  parts.forEach((part, index) => {
    if (index % 2 === 1) {
      renderCodeBlock(parent, part);
      return;
    }

    renderText(parent, part);
  });
}

function renderText(parent, text) {
  text
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
  const firstLineBreak = rawBlock.indexOf('\n');
  const language = firstLineBreak > -1 ? rawBlock.slice(0, firstLineBreak).trim() : '';
  const code = firstLineBreak > -1 ? rawBlock.slice(firstLineBreak + 1).trim() : rawBlock.trim();

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
  codeNode.className = `language-${language || 'text'}`;
  applyBasicHighlighting(codeNode, code, language);

  pre.append(codeNode);
  toolbar.append(label, copy);
  wrapper.append(toolbar, pre);
  parent.append(wrapper);
}

function applyBasicHighlighting(codeNode, code, language) {
  const highlightedLanguages = new Set(['js', 'jsx', 'ts', 'tsx', 'javascript', 'typescript', 'python', 'py', 'css', 'html']);
  if (!highlightedLanguages.has(language.toLowerCase())) {
    codeNode.textContent = code;
    return;
  }

  const tokenPattern = /(\/\/.*|#.*|"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|`(?:\\.|[^`])*`|\b(?:const|let|var|function|return|if|else|for|while|class|import|from|export|async|await|try|catch|def|lambda|yield|true|false|null|None|and|or|not)\b)/g;
  let cursor = 0;

  for (const match of code.matchAll(tokenPattern)) {
    if (match.index > cursor) {
      codeNode.append(document.createTextNode(code.slice(cursor, match.index)));
    }

    const span = document.createElement('span');
    span.className = classifyToken(match[0]);
    span.textContent = match[0];
    codeNode.append(span);
    cursor = match.index + match[0].length;
  }

  if (cursor < code.length) {
    codeNode.append(document.createTextNode(code.slice(cursor)));
  }
}

function classifyToken(token) {
  if (token.startsWith('//') || token.startsWith('#')) return 'token-comment';
  if (token.startsWith('"') || token.startsWith("'") || token.startsWith('`')) return 'token-string';
  return 'token-keyword';
}

function setModelLoading(isLoading) {
  nodes.loadModelButton.disabled = isLoading || !hasWebGPU();
  nodes.modelSelect.disabled = isLoading;
  nodes.clearCacheButton.disabled = isLoading;
}

function setChatEnabled(enabled) {
  nodes.prompt.disabled = !enabled;
  nodes.sendButton.disabled = !enabled;
}

function updateProgress(progress, text) {
  nodes.downloadProgress.value = progress;
  nodes.downloadPercent.textContent = `${Math.round(progress * 100)}%`;
  nodes.downloadStatus.textContent = text;
}

function clearChat() {
  messages = [...starterMessages];
  lastUserPrompt = '';
  saveMessages();
  renderMessages();
  nodes.prompt.focus();
}

function pushError(content) {
  messages.push({ role: 'error', content });
  saveMessages();
  renderMessages();
}

async function copyCode(code, button) {
  await navigator.clipboard.writeText(code);
  const original = button.textContent;
  button.textContent = 'Copied';
  setTimeout(() => {
    button.textContent = original;
  }, 1200);
}

function getSelectedModel() {
  return LOCAL_MODELS.find((model) => model.id === nodes.modelSelect.value) || LOCAL_MODELS[0];
}

function authorName(role) {
  if (role === 'user') return 'You';
  if (role === 'error') return 'Local runtime error';
  return 'NoLimit Coder';
}

function loadMessages() {
  try {
    const stored = JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY) || 'null');
    return Array.isArray(stored) && stored.length > 0 ? stored : [...starterMessages];
  } catch {
    return [...starterMessages];
  }
}

function saveMessages() {
  localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-40)));
}
