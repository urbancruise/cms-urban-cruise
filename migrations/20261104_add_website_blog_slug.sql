ALTER TABLE website_blogs
  ADD COLUMN slug VARCHAR(255) NULL AFTER title;

UPDATE website_blogs
SET slug = CONCAT('blog-', id)
WHERE slug IS NULL;

ALTER TABLE website_blogs
  MODIFY COLUMN slug VARCHAR(255) NOT NULL,
  ADD UNIQUE INDEX uq_website_blogs_slug (slug);
