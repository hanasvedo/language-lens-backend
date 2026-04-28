// server.js - Simple backend for Language Lens
// Deploy this on Railway, Render, or Vercel for free

const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 3000;

// IMPORTANT: Set your API key as environment variable ANTHROPIC_API_KEY
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'Language Lens API is running' });
});

// Object detection endpoint
app.post('/api/detect', async (req, res) => {
  try {
    const { image, language } = req.body;

    if (!image || !language) {
      return res.status(400).json({ error: 'Missing image or language' });
    }

    console.log(`Processing request for language: ${language}`);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: image
            }
          },
          {
            type: 'text',
            text: `Identify the main object in the center of this image. Then provide:
1. Object name in English
2. Translation in ${language}
3. Phonetic pronunciation (IPA or simplified)

Respond ONLY with valid JSON in this exact format (no markdown, no preamble):
{
  "object": "object name in English",
  "translation": "translated word",
  "phonetic": "pronunciation guide",
  "language": "${language}"
}`
          }
        ]
      }]
    });

    const responseText = message.content.find(item => item.type === 'text')?.text || '';
    const cleanText = responseText.replace(/```json\n?|\n?```/g, '').trim();
    const result = JSON.parse(cleanText);

    res.json(result);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Failed to process image',
      details: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Language Lens API server running on port ${PORT}`);
});
