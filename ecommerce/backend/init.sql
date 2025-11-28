-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock_quantity INTEGER NOT NULL,
    image_url VARCHAR(500),
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    shipping_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    message TEXT NOT NULL,
    response TEXT,
    is_bot BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample products
INSERT INTO products (name, description, price, stock_quantity, category, image_url) VALUES
('Wireless Headphones', 'High-quality wireless headphones with active noise cancellation, 30-hour battery life, and premium sound quality. Perfect for music lovers and professionals.', 199.99, 50, 'Electronics', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'),
('Smart Watch', 'Feature-rich smartwatch with heart rate monitoring, GPS, water resistance up to 50m, and smartphone connectivity. Track your fitness and stay connected.', 299.99, 30, 'Electronics', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'),
('Running Shoes', 'Comfortable running shoes designed for all terrains. Features advanced cushioning, breathable mesh, and durable rubber soles for maximum performance.', 89.99, 100, 'Sports', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'),
('Coffee Maker', 'Automatic coffee maker with programmable settings, 12-cup capacity, and built-in grinder. Start your day with the perfect brew every morning.', 149.99, 25, 'Home', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400'),
('Laptop Backpack', 'Durable backpack with laptop compartment, multiple pockets, and ergonomic design. Perfect for work, travel, or everyday use.', 79.99, 75, 'Accessories', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400'),
('Smartphone', 'Latest smartphone with high-resolution camera, fast processor, and all-day battery life. Stay connected and capture every moment.', 699.99, 40, 'Electronics', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400'),
('Yoga Mat', 'Premium non-slip yoga mat with extra cushioning. Perfect for yoga, pilates, and floor exercises. Eco-friendly materials.', 49.99, 80, 'Sports', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400'),
('Desk Lamp', 'Modern LED desk lamp with adjustable brightness and color temperature. USB charging ports and sleek design for any workspace.', 39.99, 60, 'Home', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- Insert a demo user (password: demo123)
INSERT INTO users (email, password, first_name, last_name) VALUES
('demo@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Demo', 'User')
ON CONFLICT (email) DO NOTHING;

-- Sample order for demo user
INSERT INTO orders (user_id, total_amount, status, shipping_address) VALUES
(1, 289.98, 'delivered', '123 Main St, City, State 12345')
ON CONFLICT DO NOTHING;

INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
(1, 1, 1, 199.99),
(1, 5, 1, 89.99)
ON CONFLICT DO NOTHING;