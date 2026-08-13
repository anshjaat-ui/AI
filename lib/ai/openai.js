export async function createOpenAIChatCompletion({ apiKey, model, systemPrompt, messages }) {
  if (!apiKey) {
    throw new Error('Missing AI_API_KEY.');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.error?.message || `OpenAI request failed with status ${response.status}.`;
    throw new Error(message);
  }

  return {
    provider: 'openai',
    model,
    content: data?.choices?.[0]?.message?.content || '',
  };
}
