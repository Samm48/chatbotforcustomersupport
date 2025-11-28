const { pool } = require('../../config/database');

class ChatbotService {
  constructor() {
    this.context = new Map(); // Store user context for conversation flow
  }

  // Enhanced AI response generator with context awareness
  async generateAIResponse(userMessage, userId = null) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));

    const message = userMessage.toLowerCase().trim();
    
    // Update user context
    const userContext = this.getUserContext(userId);
    userContext.lastMessage = message;

    // Check for greetings
    if (this.isGreeting(message)) {
      userContext.conversationState = 'greeted';
      return this.getGreetingResponse();
    }

    // Check if user wants to speak to human
    if (this.wantsHumanSupport(message)) {
      userContext.conversationState = 'human_requested';
      return this.getHumanSupportResponse();
    }

    // Product inquiries with enhanced responses
    if (this.isProductInquiry(message, userContext)) {
      return await this.handleProductInquiry(message, userId);
    }

    // Order-related queries
    if (this.isOrderInquiry(message)) {
      return await this.handleOrderInquiry(message, userId);
    }

    // Shipping inquiries
    if (this.isShippingInquiry(message)) {
      return this.handleShippingInquiry();
    }

    // Return and refund inquiries
    if (this.isReturnInquiry(message)) {
      return this.handleReturnInquiry();
    }

    // Account and technical support
    if (this.isAccountInquiry(message)) {
      return this.handleAccountInquiry();
    }

    // Price and discount inquiries
    if (this.isPriceInquiry(message)) {
      return this.handlePriceInquiry();
    }

    // Fallback to context-aware response or general help
    return this.getContextAwareResponse(userContext);
  }

  // Greeting detection
  isGreeting(message) {
    const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'];
    return greetings.some(greeting => message.includes(greeting));
  }

  getGreetingResponse() {
    const greetings = [
      "Hello! Welcome to our e-commerce store! How can I assist you today?",
      "Hi there! I'm your AI shopping assistant. What can I help you with?",
      "Welcome! I'm here to help with products, orders, or any questions you might have."
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // Product inquiry handling
  async handleProductInquiry(message, userId) {
    try {
      // Extract product keywords
      const productKeywords = this.extractProductKeywords(message);
      
      if (productKeywords.length > 0) {
        // Search for products in database
        const products = await this.searchProducts(productKeywords);
        
        if (products.length > 0) {
          return this.formatProductResponse(products, message);
        }
      }

      // General product information
      return `I'd be happy to help you with products! We have a wide range of items including electronics, clothing, home goods, and more. You can browse our catalog on the products page, or tell me what specific product you're looking for and I'll provide more details.`;

    } catch (error) {
      console.error('Error handling product inquiry:', error);
      return "I'm having trouble accessing product information right now. Please try browsing our products page for the most up-to-date information.";
    }
  }

  // Search products in database
  async searchProducts(keywords) {
    const query = `
      SELECT * FROM products 
      WHERE name ILIKE ANY($1) OR description ILIKE ANY($1) OR category ILIKE ANY($1)
      LIMIT 3
    `;
    const keywordPatterns = keywords.map(keyword => `%${keyword}%`);
    
    const result = await pool.query(query, [keywordPatterns]);
    return result.rows;
  }

  // Extract product-related keywords
  extractProductKeywords(message) {
    const productTerms = [
      'headphone', 'watch', 'shoe', 'phone', 'laptop', 'camera', 'tablet',
      'shirt', 'dress', 'pants', 'jacket', 'electronics', 'clothing',
      'home', 'kitchen', 'sports', 'book', 'game', 'tool', 'beauty'
    ];
    
    return productTerms.filter(term => message.includes(term));
  }

  // Format product response
  formatProductResponse(products, originalMessage) {
    if (products.length === 1) {
      const product = products[0];
      return `I found "${product.name}" - ${product.description}. It's priced at $${product.price} and is currently ${product.stock_quantity > 0 ? 'in stock' : 'out of stock'}. Would you like to know more about this product?`;
    } else if (products.length > 1) {
      let response = `I found several products that might interest you:\n`;
      products.forEach((product, index) => {
        response += `\n${index + 1}. ${product.name} - $${product.price} (${product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'})`;
      });
      response += `\n\nYou can view these products on our website or let me know if you'd like details about a specific one.`;
      return response;
    }
    
    return "I couldn't find specific products matching your query. Could you provide more details or check our products page for our full catalog?";
  }

  // Order inquiry handling
  async handleOrderInquiry(message, userId) {
    if (!userId) {
      return "To check your order status, please log in to your account. You can then view all your orders in the 'My Orders' section.";
    }

    try {
      // Get user's recent orders
      const orders = await this.getUserOrders(userId);
      
      if (orders.length === 0) {
        return "I don't see any orders in your account yet. Once you place an order, you'll be able to track its status here.";
      }

      const recentOrder = orders[0];
      return `Your most recent order #${recentOrder.id} is currently "${recentOrder.status}". ${this.getOrderStatusDetails(recentOrder.status)} You can view all your orders in the 'My Orders' section of your account.`;

    } catch (error) {
      console.error('Error handling order inquiry:', error);
      return "I'm having trouble accessing your order information. Please check the 'My Orders' section in your account for the most up-to-date status.";
    }
  }

  async getUserOrders(userId) {
    const result = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId]
    );
    return result.rows;
  }

  getOrderStatusDetails(status) {
    const statusDetails = {
      'pending': 'Your order is being processed and will ship soon.',
      'shipped': 'Your order is on its way! You should receive tracking information shortly.',
      'delivered': 'Your order has been delivered. We hope you enjoy your purchase!',
      'cancelled': 'This order has been cancelled.',
      'processing': 'We are currently preparing your order for shipment.'
    };
    return statusDetails[status] || 'Your order is being processed.';
  }

  // Shipping inquiries
  handleShippingInquiry() {
    return `We offer several shipping options:\n\n• **Free Standard Shipping**: 5-7 business days (orders over $50)\n• **Express Shipping**: 2-3 business days ($15)\n• **Overnight Shipping**: Next business day ($25)\n\nShipping times may vary based on your location and product availability. You can see estimated delivery dates during checkout.`;
  }

  // Return inquiries
  handleReturnInquiry() {
    return `Our return policy:\n\n• **30-Day Return Period**: Items can be returned within 30 days of delivery\n• **Condition**: Items must be in original condition with tags attached\n• **Refund Method**: Refunds are issued to your original payment method\n• **Process**: Initiate returns from your 'My Orders' page\n\nFor defective items, please contact our support team for immediate assistance.`;
  }

  // Account inquiries
  handleAccountInquiry() {
    return `I can help with account-related questions:\n\n• **Password Reset**: Use the 'Forgot Password' link on the login page\n• **Account Information**: Update your details in the 'Account Settings' section\n• **Email Changes**: Contact support for email address changes\n• **Privacy**: Review our privacy policy for data handling information\n\nFor security-sensitive changes, our support team will be happy to assist you.`;
  }

  // Price and discount inquiries
  handlePriceInquiry() {
    return `We strive to offer competitive pricing on all our products:\n\n• **Price Matching**: Contact us about our price match policy\n• **Discounts**: Check our promotions page for current sales\n• **Seasonal Sales**: Major holidays often feature special discounts\n• **Newsletter**: Subscribe for exclusive subscriber discounts\n\nIs there a specific product you're interested in? I can check its current price for you.`;
  }

  // Context management
  getUserContext(userId) {
    if (!userId) return { conversationState: 'new' };
    
    if (!this.context.has(userId)) {
      this.context.set(userId, {
        conversationState: 'new',
        lastMessage: '',
        mentionedProducts: [],
        inquiryType: null
      });
    }
    return this.context.get(userId);
  }

  // Response selection based on context
  getContextAwareResponse(userContext) {
    const { conversationState } = userContext;

    if (conversationState === 'greeted') {
      return "Is there anything specific I can help you with today? I can assist with products, orders, shipping, returns, or general questions.";
    }

    const generalResponses = [
      "I'm here to help with your e-commerce needs! You can ask me about products, orders, shipping, returns, or anything else shopping-related.",
      "How can I assist you today? I can provide product information, help with orders, or answer questions about our services.",
      "I'd be happy to help! Feel free to ask about our products, your orders, shipping information, or anything else you'd like to know."
    ];

    return generalResponses[Math.floor(Math.random() * generalResponses.length)];
  }

  // Helper methods for intent detection
  isProductInquiry(message, context) {
    const productTerms = ['product', 'item', 'buy', 'purchase', 'looking for', 'searching for'];
    return productTerms.some(term => message.includes(term)) || 
           context.conversationState === 'product_discussion';
  }

  isOrderInquiry(message) {
    const orderTerms = ['order', 'track', 'status', 'delivery', 'when will', 'ship'];
    return orderTerms.some(term => message.includes(term));
  }

  isShippingInquiry(message) {
    const shippingTerms = ['shipping', 'delivery', 'arrive', 'when get', 'ship time'];
    return shippingTerms.some(term => message.includes(term));
  }

  isReturnInquiry(message) {
    const returnTerms = ['return', 'refund', 'exchange', 'send back', 'cancel order'];
    return returnTerms.some(term => message.includes(term));
  }

  isAccountInquiry(message) {
    const accountTerms = ['account', 'login', 'password', 'email', 'profile'];
    return accountTerms.some(term => message.includes(term));
  }

  isPriceInquiry(message) {
    const priceTerms = ['price', 'cost', 'expensive', 'cheap', 'discount', 'sale', 'offer'];
    return priceTerms.some(term => message.includes(term));
  }

  wantsHumanSupport(message) {
    const humanTerms = ['human', 'person', 'agent', 'representative', 'real person', 'talk to someone'];
    return humanTerms.some(term => message.includes(term));
  }

  getHumanSupportResponse() {
    return "I understand you'd like to speak with a human agent. Our customer support team is available Monday-Friday, 9AM-6PM EST at 1-800-123-4567. For faster service, you can also email support@ecommerce.com. Is there anything I can help with in the meantime?";
  }

  // Clean up old contexts (call this periodically)
  cleanupOldContexts() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    for (const [userId, context] of this.context.entries()) {
      if (context.lastActivity && context.lastActivity < oneHourAgo) {
        this.context.delete(userId);
      }
    }
  }
}

module.exports = new ChatbotService();