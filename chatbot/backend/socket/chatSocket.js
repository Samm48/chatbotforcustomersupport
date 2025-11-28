const chatService = require('../services/chatService');
const { pool } = require('../../config/database');

class ChatSocketHandler {
  constructor(io) {
    this.io = io;
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('User connected to chat:', socket.id);

      // Join user-specific room
      socket.on('join_chat', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined chat room`);
        
        // Send welcome message
        this.sendWelcomeMessage(socket, userId);
      });

      // Handle incoming messages
      socket.on('send_message', async (data) => {
        try {
          const { message, userId, context = {} } = data;
          
          if (!userId || !message) {
            socket.emit('chat_error', { error: 'Missing user ID or message' });
            return;
          }

          // Save user message to database
          const userMessage = await this.saveMessage(userId, message, false, context);
          
          // Emit user message back for immediate display
          socket.to(`user_${userId}`).emit('receive_message', {
            id: userMessage.id,
            text: message,
            isBot: false,
            timestamp: new Date(),
            context
          });

          // Generate AI response
          const aiResponse = await chatService.generateAIResponse(message, userId);
          
          // Save AI response to database
          const botMessage = await this.saveMessage(userId, aiResponse, true, context);
          
          // Emit AI response
          this.io.to(`user_${userId}`).emit('receive_message', {
            id: botMessage.id,
            text: aiResponse,
            isBot: true,
            timestamp: new Date(),
            context
          });

          // Update user's online status
          this.updateUserActivity(userId);

        } catch (error) {
          console.error('Error processing chat message:', error);
          socket.emit('chat_error', { 
            error: 'Failed to process message. Please try again.' 
          });
        }
      });

      // Handle typing indicators
      socket.on('typing_start', (data) => {
        const { userId } = data;
        if (userId) {
          socket.to(`user_${userId}`).emit('user_typing', { typing: true });
        }
      });

      socket.on('typing_stop', (data) => {
        const { userId } = data;
        if (userId) {
          socket.to(`user_${userId}`).emit('user_typing', { typing: false });
        }
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log('User disconnected from chat:', socket.id, reason);
      });

      // Handle chat history request
      socket.on('get_chat_history', async (data) => {
        try {
          const { userId } = data;
          const history = await this.getChatHistory(userId);
          socket.emit('chat_history', { messages: history });
        } catch (error) {
          console.error('Error fetching chat history:', error);
          socket.emit('chat_error', { error: 'Failed to load chat history' });
        }
      });
    });
  }

  async saveMessage(userId, message, isBot = false, context = {}) {
    const result = await pool.query(
      `INSERT INTO chat_messages (user_id, message, is_bot, context) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [userId, message, isBot, context]
    );
    return result.rows[0];
  }

  async getChatHistory(userId) {
    const result = await pool.query(
      `SELECT * FROM chat_messages 
       WHERE user_id = $1 
       ORDER BY created_at ASC 
       LIMIT 50`,
      [userId]
    );
    return result.rows;
  }

  async sendWelcomeMessage(socket, userId) {
    const welcomeMessage = "Hello! I'm your AI shopping assistant. How can I help you today?";
    
    // Check if this is first interaction today
    const hasRecentMessages = await this.hasRecentMessages(userId);
    
    if (!hasRecentMessages) {
      setTimeout(() => {
        socket.emit('receive_message', {
          text: welcomeMessage,
          isBot: true,
          timestamp: new Date(),
          isWelcome: true
        });
      }, 1000);
    }
  }

  async hasRecentMessages(userId) {
    const result = await pool.query(
      `SELECT COUNT(*) FROM chat_messages 
       WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
      [userId]
    );
    return parseInt(result.rows[0].count) > 0;
  }

  async updateUserActivity(userId) {
    // Update user's last activity timestamp
    // This could be used for analytics or support routing
    console.log(`User ${userId} active in chat`);
  }

  // Broadcast message to all support agents (for human takeover)
  broadcastToAgents(message, userId) {
    this.io.to('support_agents').emit('customer_message', {
      userId,
      message,
      timestamp: new Date()
    });
  }
}

module.exports = ChatSocketHandler;