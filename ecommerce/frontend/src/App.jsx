import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backendUrl, setBackendUrl] = useState('');

  useEffect(() => {
    // Determine backend URL
    const url = window.location.hostname.includes('localhost') 
      ? 'http://localhost:5000' 
      : 'https://ecommerce-backend.onrender.com';
    
    setBackendUrl(url);
    fetchProducts(url);
  }, []);

  const fetchProducts = async (url) => {
    try {
      console.log('Fetching from:', `${url}/api/products`);
      const response = await fetch(`${url}/api/products`);
      const data = await response.json();
      console.log('Products received:', data);
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      // Fallback products
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
      <header style={{ background: '#007bff', color: 'white', padding: '20px', textAlign: 'center' }}>
        <h1>🛍️ ShopSmart</h1>
        <p>AI-Powered E-Commerce Platform</p>
        <small>Backend: {backendUrl}</small>
      </header>

      <main style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <section style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2>Welcome to ShopSmart</h2>
          <p>Your intelligent shopping assistant</p>
        </section>

        <section>
          <h2 style={{ textAlign: 'center' }}>Our Products</h2>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>Loading products from backend...</p>
              <div style={{ margin: '20px' }}>
                <button 
                  onClick={() => fetchProducts(backendUrl)}
                  style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
                >
                  Retry Loading
                </button>
              </div>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
              gap: '20px',
              marginTop: '20px'
            }}>
              {products.map(product => (
                <div key={product.id} style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  textAlign: 'center'
                }}>
                  <h3>{product.name}</h3>
                  <p style={{ color: '#007bff', fontSize: '1.5rem', fontWeight: 'bold' }}>
                    ${product.price}
                  </p>
                  <p style={{ color: '#666' }}>{product.category}</p>
                  <button style={{
                    padding: '10px 20px',
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    marginTop: '15px',
                    cursor: 'pointer'
                  }}>
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer style={{ 
        background: '#333', 
        color: 'white', 
        textAlign: 'center', 
        padding: '20px',
        marginTop: '40px'
      }}>
        <p>© 2024 ShopSmart. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;