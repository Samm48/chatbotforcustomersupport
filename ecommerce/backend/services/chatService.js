const { pool } = require('../config/database');

// Mock AI response generator
const generateAIResponse = async (userMessage) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const message = userMessage.toLowerCase();
  
  // Product inquiries
  if (message.includes('product') || message.includes('item')) {
    if (message.includes('wireless') || message.includes('headphone')) {
      return "Our wireless headphones feature noise cancellation, 30-hour battery life, and premium sound quality. They're currently priced at $199.99 and are in stock.";
    }
    if (message.includes('watch') || message.includes('smartwatch')) {
      return "The smart watch includes health monitoring, GPS, and water resistance up to 50m. It's available for $299.99 with free shipping.";
    }
    if (message.includes('shoe') || message.includes('running')) {
      return "Our running shoes are designed for comfort and durability across all terrains. They're priced at $89.99 and available in multiple sizes.";
    }
    
    // General product info
    return "We have a wide range of products including electronics, sports gear, and home appliances. You can browse our catalog on the products page. Is there a specific product you'd like to know more about?";
  }
  
  // Order status
  if (message.includes('order') || message.includes('track') || message.includes('status')) {
    return "I can help you check your order status. Please provide your order ID, or you can view all your orders in the 'My Orders' section of your account.";
  }
  
  // Shipping
  if (message.includes('shipping') || message.includes('delivery') || message.includes('arrive')) {
    return "We offer free standard shipping on orders over $50. Express shipping is available for an additional $15. Most orders are delivered within 3-5 business days.";
  }
  
  // Returns
  if (message.includes('return') || message.includes('refund') || message.includes('exchange')) {
    return "We have a 30-day return policy for all items in original condition. To initiate a return, please visit the 'My Orders' section and select the item you wish to return.";
  }
  
  // Payment
  if (message.includes('payment') || message.includes('pay') || message.includes('card')) {
    return "We accept all major credit cards, PayPal, and Apple Pay. All payments are processed securely through encrypted channels.";
  }
  
  // Account issues
  if (message.includes('account') || message.includes('login') || message.includes('password')) {
    return "For account-related issues, you can reset your password using the 'Forgot Password' link on the login page. If you're still having trouble, please contact our support team.";
  }
  
  // Default response
  const defaultResponses = [
    "I'm here to help with your e-commerce needs! How can I assist you today?",
    "I can help you with product information, order status, shipping details, returns, and general inquiries. What would you like to know?",
    "Welcome to our customer support! Feel free to ask me about our products, orders, or any other questions you might have."
  ];
  
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
};

module.exports = { generateAIResponse };