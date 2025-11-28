import React, { useState, useEffect, useRef } from 'react';
import './ChatbotWidget.css';

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: inputMessage,
          userId: 1
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const botMessage = {
          id: Date.now() + 1,
          text: data.botMessage.message,
          isBot: true,
          timestamp: new Date(data.botMessage.timestamp)
        };
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "Sorry, I'm having trouble responding right now. Please try again.",
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickReplies = [
    "What products do you have?",
    "How do I track my order?",
    "What's your return policy?",
    "Do you offer free shipping?"
  ];

  const handleQuickReply = (reply) => {
    setInputMessage(reply);
  };

  return (
    <div className="chatbot-widget">
      {isOpen && (
        <div className="chatbot-container">
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">🤖</div>
              <div>
                <h3>AI Shopping Assistant</h3>
                <div className="connection-status">
                  <span className="status-dot connected"></span>
                  Online
                </div>
              </div>
            </div>
            <button 
              className="close-btn"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.length === 0 && (
              <div className="welcome-message">
                <div className="welcome-avatar">👋</div>
                <div className="welcome-content">
                  <h4>Hello! I'm your AI shopping assistant</h4>
                  <p>I can help you with:</p>
                  <ul>
                    <li>Product information</li>
                    <li>Order tracking</li>
                    <li>Shipping questions</li>
                    <li>Returns & refunds</li>
                    <li>General support</li>
                  </ul>
                  
                  <div className="quick-replies">
                    <p>Try asking:</p>
                    {quickReplies.map((reply, index) => (
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
                key={message.id}
                className={`message ${message.isBot ? 'bot-message' : 'user-message'}`}
              >
                {message.isBot && (
                  <div className="message-avatar">🤖</div>
                )}
                <div className="message-content">
                  <div className="message-text">
                    {message.text}
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

            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="chatbot-input-form">
            <div className="input-container">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={isLoading}
              />
              <button 
                type="submit" 
                disabled={!inputMessage.trim() || isLoading}
                className="send-button"
              >
                {isLoading ? '⏳' : '📤'}
              </button>
            </div>
          </form>
        </div>
      )}

      <button 
        className={`chatbot-toggle-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? '✕' : '💬'}
        {messages.length > 0 && !isOpen && (
          <span className="message-indicator"></span>
        )}
      </button>
    </div>
  );
};

export default ChatbotWidget;