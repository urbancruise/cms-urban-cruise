CREATE TABLE IF NOT EXISTS website_blogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  paragraph MEDIUMTEXT NOT NULL,
  image_url TEXT NOT NULL,
  image_public_id VARCHAR(255) NOT NULL DEFAULT '',
  categories JSON NOT NULL,
  status ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  created_by INT NULL,
  updated_by INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_website_blogs_status_created (status, created_at),
  FULLTEXT INDEX idx_website_blogs_search (title, paragraph)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
