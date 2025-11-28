import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="container">
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <h1>Welcome to Our E-Commerce Store</h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: '#666' }}>
          Discover amazing products at great prices
        </p>
        <Link to="/products" className="btn btn-primary">
          Shop Now
        </Link>
      </div>
      
      <div style={{ marginTop: '4rem' }}>
        <h2>Featured Categories</h2>
        <div className="products-grid">
          {['Electronics', 'Sports', 'Home', 'Accessories'].map(category => (
            <div key={category} className="product-card">
              <h3>{category}</h3>
              <p>Explore our {category.toLowerCase()} collection</p>
              <Link 
                to={`/products?category=${category}`}
                className="btn btn-secondary"
              >
                Browse
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;