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
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      const response = await fetch(`${backendUrl}/api/products`);
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.log('Using fallback products');
      setProducts([
        { id: 1, name: "Wireless Headphones", price: 199.99, category: "Electronics" },
        { id: 2, name: "Smart Watch", price: 299.99, category: "Electronics" },
        { id: 3, name: "Running Shoes", price: 89.99, category: "Sports" },
        { id: 4, name: "Coffee Maker", price: 149.99, category: "Home" },
        { id: 5, name: "Laptop Backpack", price: 79.99, category: "Accessories" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="header">
        <div className="container">
          <h1 className="logo">🛍️ ShopSmart</h1>
          <p>AI-Powered E-Commerce Platform</p>
        </div>
      </header>

      <main className="container">
        <section className="hero">
          <h2>Welcome to ShopSmart</h2>
          <p>Your intelligent shopping assistant is here to help!</p>
        </section>

        <section className="products-section">
          <h2>Our Products</h2>
          {loading ? (
            <p>Loading products...</p>
          ) : (
            <div className="products-grid">
              {products.map(product => (
                <div key={product.id} className="product-card">
                  <h3>{product.name}</h3>
                  <p className="price">${product.price}</p>
                  <p className="category">{product.category}</p>
                  <button className="btn">View Details</button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          <p>© 2024 ShopSmart. All rights reserved.</p>
        </div>
      </footer>

      <ChatbotWidget />
    </div>
  );
}

export default App;