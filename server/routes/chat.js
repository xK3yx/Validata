const express = require('express');
const { chatAboutIdea } = require('../groq');
const { body, ChatSchema } = require('../middleware/validate');

const router = express.Router();

// POST /api/chat
router.post('/', body(ChatSchema), async (req, res) => {
  const { messages, report, idea_title } = req.body;
  try {
    // Only the last 10 messages are sent to keep within token limits.
    const reply = await chatAboutIdea({ messages: messages.slice(-10), report, idea_title });
    return res.json({ reply });
  } catch (err) {
    console.error('Chat error:', err);
    return res.status(502).json({ error: 'Failed to get an AI response. Please try again.' });
  }
});

module.exports = router;
