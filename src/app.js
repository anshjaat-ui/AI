const defaultSystemPrompt = `You are NoLimit Coder AI, a senior software engineer.
Focus only on coding: architecture, debugging, refactoring, tests, security, performance, and developer tooling.
Return practical code, concise explanations, and clear next steps.`;

const messages = [
  {
    role: 'assistant',
    content:
      'Hi! Connect me to your local Ollama model and I can help code without app credits or subscription limits. Try: “Build a React auth form with validation.”',
  },
];

const endpointInput = document.querySelector('#endpoint');
const modelInput = document.querySelector('#model');
const systemPromptInput = document.querySelector('#systemPrompt');
const messagesNode = document.querySelector('#messages');
const promptInput = document.querySelector('#prompt');
const composer = document.querySelector('#composer');
const sendButton = document.querySelector('#sendButton');
const statusNode = document.querySelector('#status');

systemPromptInput.value = defaultSystemPrompt;
renderMessages();

composer.addEventListener('submit', async (event) => {
  event.preventDefault();
  const userPrompt = promptInput.value.trim();
  if (!userPrompt) return;

  messages.push({ role: 'user', content: userPrompt });
  promptInput.value = '';
  setLoading(true);
  renderMessages();

  try {
    const endpoint = endpointInput.value.replace(/\/$/, '');
    const response = await fetch(`${endpoint}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelInput.value.trim(),
        stream: false,
        messages: [
          { role: 'system', content: systemPromptInput.value },
          ...messages.map(({ role, content }) => ({ role, content })),
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama returned ${response.status}. Check that the model is pulled and CORS is enabled.`);
    }

    const data = await response.json();
    messages.push({ role: 'assistant', content: data.message?.content || 'No response content.' });
  } catch (error) {
    messages.push({
      role: 'assistant',
      content: `Connection problem: ${error instanceof Error ? error.message : 'Could not connect to your local model.'}`,
    });
  } finally {
    setLoading(false);
    renderMessages();
  }
});

function setLoading(isLoading) {
  sendButton.disabled = isLoading;
  statusNode.textContent = isLoading ? 'Thinking…' : 'Ready';
}

function renderMessages() {
  messagesNode.replaceChildren(
    ...messages.map((message, index) => {
      const article = document.createElement('article');
      article.className = `message ${message.role}`;

      const author = document.createElement('strong');
      author.textContent = message.role === 'user' ? 'You' : 'NoLimit Coder';

      const body = document.createElement('pre');
      body.textContent = message.content;

      article.append(author, body);
      article.dataset.index = String(index);
      return article;
    }),
  );
}
