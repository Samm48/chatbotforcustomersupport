const express = require('express');
const { pool } = require('../../config/database');
const { authenticateToken } = require('../../middleware/auth');
const chatService = require('../services/chatService');

const router = express.Router();

// Get complete chat history for user
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        id,
        message,
        response,
        is_bot,
        created_at,
        user_id
       FROM chat_messages 
       WHERE user_id = $1 
       ORDER BY created_at ASC`,
      [req.user.userId]
    );
    
    res.json({ 
      success: true,
      messages: result.rows 
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to load chat history' 
    });
  }
});

// Send new message and get AI response
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { message, context = {} } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message cannot be empty'
      });
    }

    // Save user message
    const userMessageResult = await pool.query(
      `INSERT INTO chat_messages (user_id, message, is_bot, context) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [req.user.userId, message.trim(), false, context]
    );

    // Generate AI response
    const aiResponse = await chatService.generateAIResponse(message, req.user.userId);

    // Save bot response
    const botMessageResult = await pool.query(
      `INSERT INTO chat_messages (user_id, message, response, is_bot, context) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [req.user.userId, aiResponse, aiResponse, true, context]
    );

    res.json({
      success: true,
      userMessage: userMessageResult.rows[0],
      botMessage: botMessageResult.rows[0],
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error in chat send:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process message'
    });
  }
});

// Clear chat history for user
router.delete('/clear', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM chat_messages WHERE user_id = $1',
      [req.user.userId]
    );
    
    res.json({
      success: true,
      message: 'Chat history cleared'
    });
  } catch (error) {
    console.error('Error clearing chat history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear chat history'
    });
  }
});

// Get chat suggestions based on common queries
router.get('/suggestions', authenticateToken, async (req, res) => {
  try {
    const suggestions = [
      "What products do you have?",
      "How can I track my order?",
      "What's your return policy?",
      "Do you offer international shipping?",
      "How do I reset my password?",
      "What payment methods do you accept?",
      "When will my order arrive?",
      "Do you have any current promotions?"
    ];

    res.json({
      success: true,
      suggestions: suggestions
    });
  } catch (error) {
    console.error('Error getting suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load suggestions'
    });
  }
});

// Export chat history (optional feature)
router.get('/export', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        created_at as timestamp,
        message as user_message,
        response as bot_response
       FROM chat_messages 
       WHERE user_id = $1 
       ORDER BY created_at ASC`,
      [req.user.userId]
    );

    // Format for export (could be CSV, JSON, etc.)
    const exportData = {
      format: 'json',
      generated_at: new Date().toISOString(),
      message_count: result.rows.length,
      messages: result.rows
    };

    res.json({
      success: true,
      data: exportData
    });

  } catch (error) {
    console.error('Error exporting chat history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export chat history'
    });
  }
});

module.exports = router;