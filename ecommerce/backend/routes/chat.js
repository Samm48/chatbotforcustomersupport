const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { generateAIResponse } = require('../services/chatService');

const router = express.Router();

// Get chat history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM chat_messages WHERE user_id = $1 ORDER BY created_at ASC',
      [req.user.userId]
    );
    
    res.json({ messages: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send message
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    
    // Save user message
    const userMessageResult = await pool.query(
      'INSERT INTO chat_messages (user_id, message, is_bot) VALUES ($1, $2, $3) RETURNING *',
      [req.user.userId, message, false]
    );
    
    // Generate AI response
    const aiResponse = await generateAIResponse(message);
    
    // Save bot response
    const botMessageResult = await pool.query(
      'INSERT INTO chat_messages (user_id, message, response, is_bot) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.userId, aiResponse, aiResponse, true]
    );
    
    res.json({
      userMessage: userMessageResult.rows[0],
      botMessage: botMessageResult.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;