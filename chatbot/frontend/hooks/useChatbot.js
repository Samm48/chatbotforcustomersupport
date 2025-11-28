import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import io from 'socket.io-client';

const useChatbot = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  // Initialize socket connection
  useEffect(() => {
    if (!user) return;

    const socketUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to chat server');
      
      // Join user room
      newSocket.emit('join_chat', user.id);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from chat server');
    });

    newSocket.on('receive_message', (data) => {
      setMessages(prev => [...prev, {
        id: data.id || Date.now(),
        text: data.text,
        isBot: data.isBot,
        timestamp: new Date(data.timestamp),
        context: data.context
      }]);
      setIsLoading(false);
    });

    newSocket.on('chat_history', (data) => {
      if (data.messages) {
        setMessages(data.messages.map(msg => ({
          id: msg.id,
          text: msg.message,
          isBot: msg.is_bot,
          timestamp: new Date(msg.created_at),
          context: msg.context
        })));
      }
    });

    newSocket.on('chat_error', (data) => {
      console.error('Chat error:', data.error);
      setIsLoading(false);
      // Optionally show error to user
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  // Send message via socket or HTTP fallback
  const sendMessage = useCallback(async (messageText) => {
    if (!user) throw new Error('User not authenticated');

    const userMessage = {
      id: Date.now(),
      text: messageText,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      if (socket && isConnected) {
        // Use WebSocket for real-time communication
        socket.emit('send_message', {
          message: messageText,
          userId: user.id,
          context: {}
        });
      } else {
        // Fallback to HTTP API
        const response = await fetch('/api/chat/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ 
            message: messageText,
            context: {}
          })
        });

        const data = await response.json();
        
        if (data.success) {
          setMessages(prev => [...prev, {
            id: data.botMessage.id,
            text: data.botMessage.message,
            isBot: true,
            timestamp: new Date(data.botMessage.created_at)
          }]);
        } else {
          throw new Error(data.error);
        }
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: "Sorry, I'm having trouble responding right now. Please try again.",
        isBot: true,
        timestamp: new Date()
      }]);
      
      setIsLoading(false);
      throw error;
    }
  }, [user, socket, isConnected]);

  // Load chat history
  const loadHistory = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/chat/history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success && data.messages) {
        setMessages(data.messages.map(msg => ({
          id: msg.id,
          text: msg.message,
          isBot: msg.is_bot,
          timestamp: new Date(msg.created_at),
          context: msg.context
        })));
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  }, [user]);

  // Clear chat history
  const clearHistory = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/chat/clear', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  }, [user]);

  // Get chat suggestions
  const getSuggestions = useCallback(async () => {
    try {
      const response = await fetch('/api/chat/suggestions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      return data.success ? data.suggestions : [];
    } catch (error) {
      console.error('Error getting suggestions:', error);
      return [];
    }
  }, []);

  return {
    messages,
    isLoading,
    isConnected,
    sendMessage,
    clearHistory,
    loadHistory,
    getSuggestions
  };
};

export default useChatbot;