-- ============================================
-- Urban Cruise CMS Database Setup
-- ============================================

-- Drop database if exists (use with caution!)
-- DROP DATABASE IF EXISTS urban_cruise;

-- Create database
CREATE DATABASE IF NOT EXISTS urban_cruise;
USE urban_cruise;

-- ============================================
-- Users Table
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  role ENUM('admin', 'manager', 'user') DEFAULT 'user',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL,
  INDEX idx_email (email),
  INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Insert Test Users (Password: Test123!)
-- ============================================

-- Admin User (password: Admin123!)
INSERT INTO users (username, email, password_hash, full_name, role, is_active) 
VALUES (
  'admin',
  'admin@urbancruise.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.kZzNqYiKZ5hvj5ZyZq9X5xX5xX5', -- Admin123!
  'Admin User',
  'admin',
  TRUE
);

-- Manager User (password: Manager123!)
INSERT INTO users (username, email, password_hash, full_name, role, is_active) 
VALUES (
  'manager',
  'manager@urbancruise.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.kZzNqYiKZ5hvj5ZyZq9X5xX5xX5', -- Manager123!
  'Manager User',
  'manager',
  TRUE
);

-- Regular User (password: John123!)
INSERT INTO users (username, email, password_hash, full_name, role, is_active) 
VALUES (
  'john_doe',
  'john@example.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.kZzNqYiKZ5hvj5ZyZq9X5xX5xX5', -- John123!
  'John Doe',
  'user',
  TRUE
);

-- Another Regular User (password: Sarah123!)
INSERT INTO users (username, email, password_hash, full_name, role, is_active) 
VALUES (
  'sarah_johnson',
  'sarah@example.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.kZzNqYiKZ5hvj5ZyZq9X5xX5xX5', -- Sarah123!
  'Sarah Johnson',
  'user',
  TRUE
);

-- ============================================
-- Verify Users
-- ============================================
SELECT id, username, email, full_name, role, is_active, created_at FROM users;

-- ============================================
-- Optional: Additional Tables for Cruise System
-- ============================================

-- Cruises Table
CREATE TABLE IF NOT EXISTS cruises (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  destination VARCHAR(200) NOT NULL,
  duration VARCHAR(50) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_destination (destination)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cruise_id INT NOT NULL,
  user_id INT NOT NULL,
  booking_date DATE NOT NULL,
  guests INT DEFAULT 1,
  total_amount DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cruise_id) REFERENCES cruises(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_booking_date (booking_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cruise_id INT NOT NULL,
  user_id INT NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  status ENUM('pending', 'published', 'rejected') DEFAULT 'pending',
  helpful_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cruise_id) REFERENCES cruises(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_rating (rating),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample Cruise Data
INSERT INTO cruises (name, destination, duration, price, description, status) VALUES
('Mediterranean Cruise', 'Greece, Italy, Spain', '7 days', 2450.00, 'Explore the beautiful Mediterranean coast with stops in Greece, Italy, and Spain.', 'published'),
('Caribbean Paradise', 'Bahamas, Jamaica', '5 days', 1890.00, 'Enjoy the crystal clear waters and white sandy beaches of the Caribbean.', 'published'),
('Alaskan Adventure', 'Alaska, Canada', '10 days', 4200.00, 'Witness the majestic glaciers and wildlife of Alaska and Canada.', 'draft'),
('Norwegian Fjords', 'Norway, Denmark', '8 days', 3600.00, 'Cruise through the stunning Norwegian fjords and visit charming Nordic cities.', 'published'),
('Asian Discovery', 'Japan, Thailand', '12 days', 5200.00, 'Experience the rich culture and cuisine of Japan and Thailand.', 'archived');

-- Sample Bookings
INSERT INTO bookings (cruise_id, user_id, booking_date, guests, total_amount, status) VALUES
(1, 3, '2024-02-15', 2, 4900.00, 'confirmed'),
(2, 4, '2024-02-14', 4, 7560.00, 'pending'),
(3, 3, '2024-02-13', 2, 8400.00, 'completed'),
(4, 5, '2024-02-12', 3, 10800.00, 'cancelled'),
(1, 5, '2024-02-11', 2, 4900.00, 'confirmed');

-- Sample Reviews
INSERT INTO reviews (cruise_id, user_id, rating, comment, status, helpful_count) VALUES
(1, 3, 5, 'Amazing experience! The crew was fantastic and the destinations were breathtaking.', 'published', 12),
(2, 4, 4, 'Great cruise overall. The food could have been better, but the views made up for it.', 'published', 8),
(3, 3, 5, 'Absolutely incredible! The glaciers were stunning and we saw so much wildlife.', 'published', 15),
(4, 5, 3, 'Good but not great. Expected more activities on board.', 'published', 3);

-- ============================================
-- Show all tables
-- ============================================
SHOW TABLES;

-- ============================================
-- Query to view all data
-- ============================================
SELECT 
  u.id,
  u.username,
  u.email,
  u.full_name,
  u.role,
  COUNT(b.id) as total_bookings,
  IFNULL(SUM(b.total_amount), 0) as total_spent
FROM users u
LEFT JOIN bookings b ON u.id = b.user_id
GROUP BY u.id;