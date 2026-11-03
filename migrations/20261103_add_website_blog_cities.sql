ALTER TABLE website_blogs
  ADD COLUMN cities JSON NULL AFTER categories;

UPDATE website_blogs
SET cities = JSON_ARRAY()
WHERE cities IS NULL;

ALTER TABLE website_blogs
  MODIFY COLUMN cities JSON NOT NULL;
