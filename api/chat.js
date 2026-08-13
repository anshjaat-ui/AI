import { createChatCompletion, getConfiguredModel, getProviderName } from '../lib/ai/provider.js';

const MAX_BODY_BYTES = 64_000;
const MAX_MESSAGES = 40;
const MAX_MESSAGE_CHARS = 12_000;
const ALLOWED_ROLES = new Set(['user', 'assistant']);

export default async function handler(req, res) {
  setSecurityHeaders(res);

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const bodySize = Buffer.byteLength(JSON.stringify(req.body || {}), 'utf8');
    if (bodySize > MAX_BODY_BYTES) {
      return res.status(413).json({ error: 'Request is too large.' });
    }

    const messages = validateMessages(req.body?.messages);
    const completion = await createChatCompletion(messages);

    return res.status(200).json({
      message: {
        role: 'assistant',
        content: completion.content,
      },
      provider: completion.provider,
      model: completion.model,
    });
  } catch (error) {
    const publicMessage = toPublicError(error);
    const status = publicMessage.startsWith('Invalid') || publicMessage.includes('required') ? 400 : 500;

    return res.status(status).json({
      error: publicMessage,
      provider: getProviderName(),
      model: getConfiguredModel(),
    });
  }
}

function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('Invalid request: messages array is required.');
  }

  if (messages.length > MAX_MESSAGES) {
    throw new Error(`Invalid request: maximum ${MAX_MESSAGES} messages allowed.`);
  }

  return messages.map((message, index) => {
    if (!message || typeof message !== 'object') {
      throw new Error(`Invalid request: message ${index + 1} must be an object.`);
    }

    const role = String(message.role || '').toLowerCase();
    const content = typeof message.content === 'string' ? message.content.trim() : '';

    if (!ALLOWED_ROLES.has(role)) {
      throw new Error(`Invalid request: message ${index + 1} has an unsupported role.`);
    }

    if (!content) {
      throw new Error(`Invalid request: message ${index + 1} content is required.`);
    }

    if (content.length > MAX_MESSAGE_CHARS) {
      throw new Error(`Invalid request: message ${index + 1} is too long.`);
    }

    return { role, content };
  });
}

function setSecurityHeaders(res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
}

function toPublicError(error) {
  const message = error instanceof Error ? error.message : 'Unable to complete the request.';

  if (message.startsWith('Invalid request')) return message;
  if (message.includes('Missing AI_API_KEY')) return 'Server AI provider is not configured. Set AI_API_KEY in environment variables.';
  if (message.includes('Unsupported AI_PROVIDER')) return message;

  return 'The AI provider could not complete the request. Please try again.';
}
