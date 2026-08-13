const STORAGE_KEY = 'nolimit-coder-ai-messages';
const starterMessages = [
  {
    role: 'assistant',
    content:
      'Hi! I am ready to help with coding questions, debugging, refactoring, tests, and complete file generation. Ask me what you want to build or fix.',
  },
];

let messages = loadMessages();
let lastUserPrompt = '';
let isLoading = false;

const messagesNode = document.querySelector('#messages');
const promptInput = document.querySelector('#prompt');
const composer = document.querySelector('#composer');
const sendButton = document.querySelector('#sendButton');
const clearButton = document.querySelector('#clearButton');
const statusNode = document.querySelector('#status');
const providerName = document.querySelector('#providerName');
const modelName = document.querySelector('#modelName');

renderMessages();

composer.addEventListener('submit', (event) => {
  event.preventDefault();
  sendPrompt(promptInput.value);
});

promptInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    composer.requestSubmit();
  }
});

clearButton.addEventListener('click', () => {
  messages = [...starterMessages];
  lastUserPrompt = '';
  saveMessages();
  renderMessages();
  promptInput.focus();
});

messagesNode.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-copy], button[data-retry]');
  if (!button) return;

  if (button.dataset.copy) {
    copyCode(button.dataset.copy, button);
  }

  if (button.dataset.retry) {
    sendPrompt(lastUserPrompt, { retry: true });
  }
});

async function sendPrompt(rawPrompt, options = {}) {
  const userPrompt = rawPrompt.trim();
  if (!userPrompt || isLoading) return;

  lastUserPrompt = userPrompt;
  if (!options.retry) {
    messages.push({ role: 'user', content: userPrompt });
    promptInput.value = '';
  }

  setLoading(true);
  renderMessages();

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: messages
          .filter((message) => message.role === 'user' || message.role === 'assistant')
          .slice(-40),
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}.`);
    }

    providerName.textContent = data.provider || 'Server configured';
    modelName.textContent = data.model || 'Server configured';
    messages.push({ role: 'assistant', content: data.message?.content || 'No response content.' });
  } catch (error) {
    messages.push({
      role: 'error',
      content: error instanceof Error ? error.message : 'Unable to connect to the AI service.',
    });
  } finally {
    setLoading(false);
    saveMessages();
    renderMessages();
  }
}

function setLoading(nextLoading) {
  isLoading = nextLoading;
  sendButton.disabled = nextLoading;
  statusNode.textContent = nextLoading ? 'Thinking…' : 'Ready';
}

function renderMessages() {
  messagesNode.replaceChildren(...messages.map(renderMessage));
  messagesNode.scrollTop = messagesNode.scrollHeight;
}

function renderMessage(message, index) {
  const article = document.createElement('article');
  article.className = `message ${message.role}`;

  const header = document.createElement('div');
  header.className = 'message-header';

  const author = document.createElement('strong');
  author.textContent = authorName(message.role);
  header.append(author);

  if (message.role === 'error' && lastUserPrompt) {
    const retry = document.createElement('button');
    retry.className = 'inline-button';
    retry.type = 'button';
    retry.dataset.retry = String(index);
    retry.textContent = 'Retry';
    header.append(retry);
  }

  const body = document.createElement('div');
  body.className = 'message-body';
  renderContent(body, message.content);

  article.append(header, body);
  return article;
}

function renderContent(parent, content) {
  const parts = content.split(/```/g);

  parts.forEach((part, index) => {
    if (index % 2 === 1) {
      const firstLineBreak = part.indexOf('\n');
      const language = firstLineBreak > -1 ? part.slice(0, firstLineBreak).trim() : '';
      const code = firstLineBreak > -1 ? part.slice(firstLineBreak + 1).trim() : part.trim();

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
      codeNode.textContent = code;
      pre.append(codeNode);
      toolbar.append(label, copy);
      wrapper.append(toolbar, pre);
      parent.append(wrapper);
      return;
    }

    if (part.trim()) {
      const paragraph = document.createElement('p');
      paragraph.textContent = part.trim();
      parent.append(paragraph);
    }
  });
}

async function copyCode(code, button) {
  await navigator.clipboard.writeText(code);
  const original = button.textContent;
  button.textContent = 'Copied';
  setTimeout(() => {
    button.textContent = original;
  }, 1200);
}

function authorName(role) {
  if (role === 'user') return 'You';
  if (role === 'error') return 'Connection/Error';
  return 'NoLimit Coder';
}

function loadMessages() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return Array.isArray(stored) && stored.length > 0 ? stored : [...starterMessages];
  } catch {
    return [...starterMessages];
  }
}

function saveMessages() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
}
