import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`/api/products/${id}`);
      setProduct(response.data.product);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      await axios.post('/api/cart/add', {
        productId: product.id,
        quantity: quantity
      });
      alert('Product added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Error adding product to cart');
    }
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  if (!product) {
    return <div className="container">Product not found</div>;
  }

  return (
    <div className="container">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '20px' }}>
        <div>
          {product.image_url && (
            <img 
              src={product.image_url} 
              alt={product.name}
              style={{ width: '100%', borderRadius: '8px' }}
            />
          )}
        </div>
        
        <div>
          <h1>{product.name}</h1>
          <p style={{ fontSize: '1.5rem', color: '#007bff', margin: '20px 0' }}>
            ksh{product.price}
          </p>
          <p>{product.description}</p>
          
          <div style={{ margin: '30px 0' }}>
            <label style={{ display: 'block', marginBottom: '10px' }}>
              Quantity:
            </label>
            <input
              type="number"
              min="1"
              max={product.stock_quantity}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              style={{ 
                padding: '8px', 
                border: '1px solid #ddd', 
                borderRadius: '4px',
                width: '80px'
              }}
            />
          </div>
          
          <button 
            onClick={addToCart}
            className="btn btn-primary"
            style={{ marginRight: '10px' }}
          >
            Add to Cart
          </button>
          
          <button className="btn btn-secondary">
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;