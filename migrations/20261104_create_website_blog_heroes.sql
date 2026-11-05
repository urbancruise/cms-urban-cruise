CREATE TABLE IF NOT EXISTS website_blog_heroes (
  city_id INT NOT NULL PRIMARY KEY,
  content JSON NOT NULL,
  status ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  updated_by INT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_website_blog_heroes_city
    FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO website_blog_heroes (city_id, content, status, updated_by)
SELECT city.id, legacy.content, legacy.status, legacy.updated_by
FROM website_blog_hero AS legacy
CROSS JOIN cities AS city
WHERE legacy.id = 1
  AND city.is_active = 1
  AND NOT EXISTS (
    SELECT 1
    FROM website_blog_heroes AS existing
    WHERE existing.city_id = city.id
  );
