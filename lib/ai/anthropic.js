export async function createAnthropicChatCompletion({ apiKey, model, systemPrompt, messages }) {
  if (!apiKey) {
    throw new Error('Missing AI_API_KEY.');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      temperature: 0.2,
      system: systemPrompt,
      messages,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.error?.message || `Anthropic request failed with status ${response.status}.`;
    throw new Error(message);
  }

  return {
    provider: 'anthropic',
    model,
    content: data?.content?.map((part) => part.text || '').join('\n').trim() || '',
  };
}
