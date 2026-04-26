import express from 'express';

const router = express.Router();

const MODELS = [
  'minimax/minimax-m2.5:free',
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
];

let modelIndex = 0;

router.post('/chat', async (req, res) => {
  const apiKey = process.env.OPEN_ROUTER_API_KEY;
  if (!apiKey) return res.status(500).json({ success: false, error: 'OPEN_ROUTER_API_KEY not set in .env' });

  const { messages, max_tokens = 600 } = req.body;
  if (!messages?.length) return res.status(400).json({ success: false, error: 'messages required' });

  const model = MODELS[modelIndex % MODELS.length];
  modelIndex++;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:4200',
        'X-Title': 'SLM Notes App',
      },
      body: JSON.stringify({ model, messages, max_tokens }),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ success: false, error: text, model });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    res.json({ success: true, content, model });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
