const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get cart items
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ci.*, p.name, p.price, p.image_url, p.stock_quantity
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = $1`,
      [req.user.userId]
    );
    
    res.json({ cartItems: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add to cart
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    // Check if item already in cart
    const existingItem = await pool.query(
      'SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2',
      [req.user.userId, productId]
    );
    
    if (existingItem.rows.length > 0) {
      // Update quantity
      await pool.query(
        'UPDATE cart_items SET quantity = quantity + $1 WHERE user_id = $2 AND product_id = $3',
        [quantity, req.user.userId, productId]
      );
    } else {
      // Add new item
      await pool.query(
        'INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3)',
        [req.user.userId, productId, quantity]
      );
    }
    
    res.json({ message: 'Item added to cart' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update cart item
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { quantity } = req.body;
    
    await pool.query(
      'UPDATE cart_items SET quantity = $1 WHERE id = $2 AND user_id = $3',
      [quantity, req.params.id, req.user.userId]
    );
    
    res.json({ message: 'Cart updated' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove from cart
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM cart_items WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.userId]
    );
    
    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;