import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
const API_URL = process.env.REACT_APP_API_URL || '';

const fetchCartItems = async () => {
  const response = await axios.get(`${API_URL}/api/cart`);
  // ... rest of code
};
const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      const response = await axios.get('/api/cart');
      setCartItems(response.data.cartItems);
    } catch (error) {
      console.error('Error fetching cart items:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    try {
      await axios.put(`/api/cart/${itemId}`, { quantity: newQuantity });
      fetchCartItems();
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const removeItem = async (itemId) => {
    try {
      await axios.delete(`/api/cart/${itemId}`);
      fetchCartItems();
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const checkout = async () => {
    try {
      const items = cartItems.map(item => ({
        productId: item.product_id,
        quantity: item.quantity
      }));
      
      await axios.post('/api/orders', {
        items,
        shippingAddress: '123 Main St, City, State' // In real app, get from user input
      });
      
      alert('Order placed successfully!');
      navigate('/orders');
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Error placing order');
    }
  };

  const totalAmount = cartItems.reduce(
    (total, item) => total + (item.price * item.quantity), 
    0
  );

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="container">
      <h1>Shopping Cart</h1>
      
      {cartItems.length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <>
          <div>
            {cartItems.map(item => (
              <div key={item.id} className="cart-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  {item.image_url && (
                    <img 
                      src={item.image_url} 
                      alt={item.name}
                      style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                    />
                  )}
                  <div>
                    <h4>{item.name}</h4>
                    <p>ksh {item.price}</p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="btn btn-secondary"
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="btn btn-secondary"
                    disabled={item.quantity >= item.stock_quantity}
                  >
                    +
                  </button>
                  
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="btn btn-secondary"
                    style={{ marginLeft: '15px' }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ marginTop: '30px', padding: '20px', background: 'white', borderRadius: '8px' }}>
            <h3>Total: ${totalAmount.toFixed(2)}</h3>
            <button 
              onClick={checkout}
              className="btn btn-primary"
              style={{ marginTop: '15px' }}
            >
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;