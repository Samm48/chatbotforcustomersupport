const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Create order
router.post('/', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { items, shippingAddress } = req.body;
    
    // Calculate total
    let totalAmount = 0;
    for (const item of items) {
      const productResult = await client.query(
        'SELECT price FROM products WHERE id = $1',
        [item.productId]
      );
      totalAmount += productResult.rows[0].price * item.quantity;
    }
    
    // Create order
    const orderResult = await client.query(
      'INSERT INTO orders (user_id, total_amount, shipping_address) VALUES ($1, $2, $3) RETURNING *',
      [req.user.userId, totalAmount, shippingAddress]
    );
    
    // Create order items
    for (const item of items) {
      const productResult = await client.query(
        'SELECT price FROM products WHERE id = $1',
        [item.productId]
      );
      
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [orderResult.rows[0].id, item.productId, item.quantity, productResult.rows[0].price]
      );
      
      // Update product stock
      await client.query(
        'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
        [item.quantity, item.productId]
      );
    }
    
    // Clear user's cart
    await client.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.userId]);
    
    await client.query('COMMIT');
    
    res.json({ order: orderResult.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Get user orders
router.get('/my-orders', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, 
              json_agg(
                json_build_object(
                  'product_id', oi.product_id,
                  'quantity', oi.quantity,
                  'price', oi.price,
                  'name', p.name
                )
              ) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [req.user.userId]
    );
    
    res.json({ orders: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;