const express = require('express');
const router = express.Router();
const { chatAboutIdea } = require('../groq');

// POST /api/chat
router.post('/', async (req, res) => {
  const { messages, report, idea_title } = req.body;

  if (!messages || !report || !idea_title) {
    return res.status(400).json({ error: 'messages, report, and idea_title are required.' });
  }

  // Limit conversation history to last 10 messages to stay within token limits
  const trimmedMessages = messages.slice(-10);

  try {
    const reply = await chatAboutIdea({ messages: trimmedMessages, report, idea_title });
    return res.json({ reply });
  } catch (err) {
    console.error('Chat error:', err);
    return res.status(500).json({ error: 'Failed to get AI response.' });
  }
});

module.exports = router;
