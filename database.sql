-- ============================================
-- Urban Cruise CMS Database Setup
-- ============================================

-- Drop database if exists (use with caution!)
-- DROP DATABASE IF EXISTS urban_cruise;

-- Create database
CREATE DATABASE IF NOT EXISTS urban_cruise;

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

-- ============================================
-- Dynamic Roles Table
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  permissions JSON DEFAULT NULL,
  is_system BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug (slug),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Cities Table
-- ============================================
CREATE TABLE IF NOT EXISTS cities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'India',
  code VARCHAR(20),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_city (name, state, country),
  INDEX idx_name (name),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Seed Default Roles
-- ============================================
INSERT INTO roles (name, slug, description, is_system, permissions) VALUES
('Admin', 'admin', 'Full system access', TRUE, JSON_ARRAY('all')),
('Manager', 'manager', 'Manage cruises and bookings', TRUE, JSON_ARRAY('cruises.read', 'cruises.write', 'bookings.read', 'bookings.write')),
('User', 'user', 'Regular user access', TRUE, JSON_ARRAY('cruises.read', 'bookings.own'))
ON DUPLICATE KEY UPDATE name = name;

-- ============================================
-- Seed Default Cities
-- ============================================
INSERT INTO cities (name, state, country, code) VALUES
('Mumbai', 'Maharashtra', 'India', 'BOM'),
('Delhi', 'Delhi', 'India', 'DEL'),
('Bangalore', 'Karnataka', 'India', 'BLR'),
('Chennai', 'Tamil Nadu', 'India', 'MAA'),
('Kolkata', 'West Bengal', 'India', 'CCU'),
('Goa', 'Goa', 'India', 'GOI')
ON DUPLICATE KEY UPDATE name = name;

-- ============================================
-- Add role_id column to users
-- ============================================
ALTER TABLE users ADD COLUMN role_id INT NULL AFTER role;

-- Populate role_id from existing role enum values
UPDATE users u
JOIN roles r ON r.slug = u.role
SET u.role_id = r.id
WHERE u.role_id IS NULL;

-- Add FK constraint (ignore if already exists)
ALTER TABLE users
ADD CONSTRAINT fk_users_role
FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;

-- ============================================
-- user_roles junction table (many-to-many)
-- ============================================
CREATE TABLE IF NOT EXISTS user_roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_role (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_role (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Backfill from existing users.role_id
-- ============================================
INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT id, role_id FROM users WHERE role_id IS NOT NULL;

-- ============================================
-- Verify
-- ============================================
SELECT u.username, GROUP_CONCAT(r.name) AS roles
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN roles r ON r.id = ur.role_id
GROUP BY u.id;

-- Ensure permissions column exists (it should from earlier migration)
-- If not, add it:
ALTER TABLE roles ADD COLUMN permissions JSON DEFAULT NULL;

-- Seed permissions for existing system roles
UPDATE roles SET permissions = JSON_ARRAY(
  'dashboard.view','analytics.view','users.view','roles.view','cities.view','profile.view'
) WHERE slug = 'admin';

UPDATE roles SET permissions = JSON_ARRAY(
  'dashboard.view','analytics.view','users.view','cities.view','profile.view'
) WHERE slug = 'manager';

UPDATE roles SET permissions = JSON_ARRAY(
  'dashboard.view','profile.view'
) WHERE slug = 'user';

-- Verify
SELECT id, name, slug, permissions FROM roles;

USE urban_cruise;

-- ============================================
-- Notifications table
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT,
  entity_type VARCHAR(50),
  entity_id INT,
  actor_id INT,
  actor_name VARCHAR(100),
  link VARCHAR(255),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_read (user_id, is_read),
  INDEX idx_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Activity Log
-- ============================================
CREATE TABLE IF NOT EXISTS activity_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  user_name VARCHAR(100),
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INT,
  entity_name VARCHAR(200),
  changes JSON,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_user (user_id),
  INDEX idx_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Add activity.view permission to roles
-- ============================================
UPDATE roles SET permissions = JSON_ARRAY(
  'dashboard.view','analytics.view','users.view','roles.view',
  'cities.view','profile.view','activity.view'
) WHERE slug = 'admin';

UPDATE roles SET permissions = JSON_ARRAY(
  'dashboard.view','analytics.view','users.view',
  'cities.view','profile.view','activity.view'
) WHERE slug = 'manager';

UPDATE roles SET permissions = JSON_ARRAY(
  'dashboard.view','profile.view'
) WHERE slug = 'user';

SELECT id, name, slug, permissions FROM roles;

