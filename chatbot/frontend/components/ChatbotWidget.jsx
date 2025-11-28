import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import useChatbot from '../hooks/useChatbot';
import './ChatbotWidget.css';

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = setIsOpenState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { user } = useAuth();
  
  const {
    messages,
    isLoading,
    isConnected,
    sendMessage,
    clearHistory,
    loadHistory
  } = useChatbot();

  // Initialize chat when widget opens
  useEffect(() => {
    if (isOpen && user) {
      loadHistory();
      // Focus input when opening
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen, user, loadHistory]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'nearest'
    });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isLoading || !user) return;

    const messageText = inputMessage.trim();
    setInputMessage('');
    
    try {
      await sendMessage(messageText);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Optionally show error to user
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleQuickReply = (replyText) => {
    setInputMessage(replyText);
    // Auto-send after a short delay
    setTimeout(() => {
      if (inputRef.current) {
        handleSendMessage({ preventDefault: () => {} });
      }
    }, 100);
  };

  const formatMessage = (text) => {
    // Simple markdown-style formatting
    return text.split('\n').map((line, index) => (
      <div key={index}>
        {line.split('**').map((part, i) => 
          i % 2 === 1 ? <strong key={i}>{part}</strong> : part
        )}
      </div>
    ));
  };

  const getQuickReplies = () => {
    if (messages.length === 0) {
      return [
        "What products do you have?",
        "How do I track my order?",
        "What's your return policy?"
      ];
    }

    // Context-aware quick replies based on last message
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.isBot) {
      if (lastMessage.text.toLowerCase().includes('product')) {
        return [
          "Tell me more about electronics",
          "Show me clothing items",
          "What's on sale?"
        ];
      }
      if (lastMessage.text.toLowerCase().includes('order')) {
        return [
          "Where's my package?",
          "How to return an item?",
          "Contact customer service"
        ];
      }
    }

    return [
      "Product information",
      "Order status",
      "Shipping questions"
    ];
  };

  if (!user) return null;

  return (
    <div className="chatbot-widget">
      {isOpen && (
        <div className="chatbot-container">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">🤖</div>
              <div>
                <h3>Shopping Assistant</h3>
                <div className="connection-status">
                  <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
                  {isConnected ? 'Online' : 'Connecting...'}
                </div>
              </div>
            </div>
            <div className="chatbot-actions">
              <button 
                className="chatbot-action-btn"
                onClick={clearHistory}
                title="Clear chat history"
              >
                🗑️
              </button>
              <button 
                className="close-btn"
                onClick={() => setIsOpen(false)}
                title="Close chat"
              >
                ×
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="chatbot-messages">
            {messages.length === 0 && (
              <div className="welcome-message">
                <div className="welcome-avatar">🎯</div>
                <div className="welcome-content">
                  <h4>Hi {user.firstName}! I'm your AI shopping assistant</h4>
                  <p>I can help you with:</p>
                  <ul>
                    <li>Product information and recommendations</li>
                    <li>Order status and tracking</li>
                    <li>Shipping and delivery questions</li>
                    <li>Returns and refunds</li>
                    <li>Account and technical support</li>
                  </ul>
                  
                  <div className="quick-replies">
                    <p>Quick questions:</p>
                    {getQuickReplies().map((reply, index) => (
                      <button
                        key={index}
                        className="quick-reply-btn"
                        onClick={() => handleQuickReply(reply)}
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id || message.timestamp}
                className={`message ${message.isBot ? 'bot-message' : 'user-message'}`}
              >
                {message.isBot && (
                  <div className="message-avatar">🤖</div>
                )}
                <div className="message-content">
                  <div className="message-text">
                    {formatMessage(message.text)}
                  </div>
                  <div className="message-time">
                    {new Date(message.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
                {!message.isBot && (
                  <div className="message-avatar">👤</div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="message bot-message">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} className="messages-anchor" />
          </div>

          {/* Quick Replies */}
          {messages.length > 0 && getQuickReplies().length > 0 && (
            <div className="quick-replies-bar">
              {getQuickReplies().map((reply, index) => (
                <button
                  key={index}
                  className="quick-reply-chip"
                  onClick={() => handleQuickReply(reply)}
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="chatbot-input-form">
            <div className="input-container">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading || !isConnected}
                maxLength={500}
              />
              <button 
                type="submit" 
                disabled={!inputMessage.trim() || isLoading || !isConnected}
                className="send-button"
              >
                {isLoading ? '⏳' : '📤'}
              </button>
            </div>
            <div className="input-hint">
              Press Enter to send • Shift+Enter for new line
            </div>
          </form>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        className={`chatbot-toggle-btn ${isOpen ? 'active' : ''} ${messages.length > 0 ? 'has-messages' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? '✕' : '💬'}
        {messages.length > 0 && !isOpen && (
          <span className="message-indicator"></span>
        )}
      </button>
    </div>
  );
};

// Custom hook for managing open state with persistence
const setIsOpenState = (initialState) => {
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem('chatbot-open');
    return saved ? JSON.parse(saved) : initialState;
  });

  useEffect(() => {
    localStorage.setItem('chatbot-open', JSON.stringify(isOpen));
  }, [isOpen]);

  return [isOpen, setIsOpen];
};

export default ChatbotWidget;