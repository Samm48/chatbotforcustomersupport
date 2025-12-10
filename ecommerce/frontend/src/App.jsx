const API_BASE = window.API_BASE_URL || '';
import React, { useState, useEffect } from 'react';
import ChatbotWidget from './components/ChatbotWidget';
import './App.css';

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('${API_BASE}/api/products');
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      // Add this temporary login section before the products section
<section className="login-section" style={{ padding: '20px', background: '#f8f9fa', textAlign: 'center' }}>
  <h3>Test Login</h3>
  <button onClick={testLogin} className="btn btn-primary">
    Test Login API
  </button>
</section>

// Add this function to your App component
const testLogin = async () => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'demo@example.com',
        password: 'demo123'
      })
    });
    
    const data = await response.json();
    console.log('Login result:', data);
    alert(data.success ? 'Login successful!' : `Login failed: ${data.error}`);
  } catch (error) {
    console.error('Login error:', error);
    alert('Login failed: ' + error.message);
  }
};
      // Fallback to mock products if API fails
      setProducts([
        {
          id: 1,
          name: "Wireless Headphones",
          description: "High-quality wireless headphones with noise cancellation",
          price: 199.99,
          category: "Electronics"
        },
        {
          id: 2,
          name: "Smart Watch",
          description: "Feature-rich smartwatch with health monitoring",
          price: 299.99,
          category: "Electronics"
        },
        {
          id: 3,
          name: "Running Shoes",
          description: "Comfortable running shoes for all terrains",
          price: 89.99,
          category: "Sports"
        },
        {
          id: 4,
          name: "Coffee Maker",
          description: "Automatic coffee maker with programmable settings",
          price: 149.99,
          category: "Home"
        },
        {
          id: 5,
          name: "Backpack",
          description: "Durable backpack with laptop compartment",
          price: 79.99,
          category: "Accessories"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            <h1 className="logo">🛍️ ShopSmart</h1>
            <nav className="nav">
              <a href="#products">Products</a>
              <a href="#about">About</a>
              <a href="#contact">Contact</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h2>Welcome to ShopSmart</h2>
            <p>Discover amazing products with AI-powered customer support</p>
            <a href="#products" className="btn btn-primary">Shop Now</a>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="products-section">
        <div className="container">
          <h2>Featured Products</h2>
          {loading ? (
            <div className="loading">Loading products...</div>
          ) : (
            // In the products-grid section, update the product card:
<div className="products-grid">
  {products.map(product => (
    <div key={product.id} className="product-card">
      {/* Add product image */}
      {product.image_url && (
        <img 
          src={product.image_url} 
          alt={product.name}
          className="product-image"
          onError={(e) => {
            e.target.style.display = 'none'; // Hide broken images
          }}
        />
      )}
      <h3>{product.name}</h3>
      <p className="product-description">{product.description}</p>
      <div className="product-price">${product.price}</div>
      <div className="product-category">{product.category}</div>
      <button className="btn btn-primary" style={{ marginTop: '15px' }}>
        View Details
      </button>
    </div>
  ))}
</div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section">
        <div className="container">
          <h2>About Our AI Assistant</h2>
          <div className="about-content">
            <div className="about-text">
              <p>Our AI-powered chatbot is available 24/7 to help you with:</p>
              <ul>
                <li>Product information and recommendations</li>
                <li>Order tracking and status updates</li>
                <li>Shipping and delivery questions</li>
                <li>Returns and refund assistance</li>
                <li>General customer support</li>
              </ul>
              <p>Click the chat button in the bottom right to get started!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <div className="container">
          <h2>Contact Us</h2>
          <div className="contact-content">
            <p>Have questions? Our support team is here to help!</p>
            <div className="contact-info">
              <p>📧 Email: support@shopsmart.com</p>
              <p>📞 Phone: 1-800-SHOP-SMART</p>
              <p>🕒 Hours: 24/7 AI Support + 9AM-6PM Human Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; 2024 ShopSmart. All rights reserved.</p>
        </div>
      </footer>

      {/* AI Chatbot Widget */}
      <ChatbotWidget />
    </div>
  );
}

export default App;