import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/orders/my-orders');
      setOrders(response.data.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="container">
      <h1>My Orders</h1>
      
      {orders.length === 0 ? (
        <p>No orders found</p>
      ) : (
        <div>
          {orders.map(order => (
            <div key={order.id} className="order-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3>Order #{order.id}</h3>
                  <p>Date: {new Date(order.created_at).toLocaleDateString()}</p>
                  <p>Status: <strong>{order.status}</strong></p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p>Total: <strong>${order.total_amount}</strong></p>
                </div>
              </div>
              
              {order.items && order.items[0] && (
                <div style={{ marginTop: '15px' }}>
                  <h4>Items:</h4>
                  {order.items.map((item, index) => (
                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                      <span>{item.name}</span>
                      <span>{item.quantity} x ${item.price}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;