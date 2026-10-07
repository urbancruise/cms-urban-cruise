-- ============================================================
-- URBAN CRUISE CMS DATABASE
-- CLEAN / DUPLICATE-FREE VERSION
-- MySQL 8.0+
-- ============================================================

-- ============================================================
-- 1. DATABASE
-- ============================================================

CREATE DATABASE IF NOT EXISTS urban_cruise
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE urban_cruise;


-- ============================================================
-- 2. USERS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,

    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,

    full_name VARCHAR(100),

    -- Keep existing role for backward compatibility
    role ENUM('admin', 'manager', 'user') DEFAULT 'user',

    -- New dynamic role reference
    role_id INT NULL,

    is_active BOOLEAN DEFAULT TRUE,

    reset_token VARCHAR(255) NULL,
    reset_token_expiry TIMESTAMP NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    last_login TIMESTAMP NULL,

    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_role_id (role_id)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 3. ROLES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,

    description TEXT,

    permissions JSON DEFAULT NULL,

    is_system BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_slug (slug),
    INDEX idx_active (is_active)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 4. CITIES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS cities (
    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    code VARCHAR(20),

    description TEXT,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_city (name, state, country),

    INDEX idx_name (name),
    INDEX idx_active (is_active)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 5. CRUISES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS cruises (
    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(200) NOT NULL,
    destination VARCHAR(200) NOT NULL,
    duration VARCHAR(50) NOT NULL,

    price DECIMAL(10,2) NOT NULL,

    description TEXT,
    image_url VARCHAR(500),

    status ENUM(
        'draft',
        'published',
        'archived'
    ) DEFAULT 'draft',

    created_by INT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    INDEX idx_status (status),
    INDEX idx_destination (destination)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 6. BOOKINGS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,

    cruise_id INT NOT NULL,
    user_id INT NOT NULL,

    booking_date DATE NOT NULL,

    guests INT DEFAULT 1,

    total_amount DECIMAL(10,2) NOT NULL,

    status ENUM(
        'pending',
        'confirmed',
        'completed',
        'cancelled'
    ) DEFAULT 'pending',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (cruise_id)
        REFERENCES cruises(id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    INDEX idx_status (status),
    INDEX idx_booking_date (booking_date)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 7. REVIEWS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,

    cruise_id INT NOT NULL,
    user_id INT NOT NULL,

    rating INT,

    comment TEXT,

    status ENUM(
        'pending',
        'published',
        'rejected'
    ) DEFAULT 'pending',

    helpful_count INT DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (cruise_id)
        REFERENCES cruises(id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_review_rating
        CHECK (rating >= 1 AND rating <= 5),

    INDEX idx_rating (rating),
    INDEX idx_status (status)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 8. USER ROLES - MANY TO MANY
-- ============================================================

CREATE TABLE IF NOT EXISTS user_roles (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,
    role_id INT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_user_role (user_id, role_id),

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (role_id)
        REFERENCES roles(id)
        ON DELETE CASCADE,

    INDEX idx_user (user_id),
    INDEX idx_role (role_id)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 9. USER CITIES
-- ============================================================

CREATE TABLE IF NOT EXISTS user_cities (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,
    city_id INT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_user_city (user_id, city_id),

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (city_id)
        REFERENCES cities(id)
        ON DELETE CASCADE,

    INDEX idx_user (user_id),
    INDEX idx_city (city_id)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 10. USER CITY PERMISSIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS user_city_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,
    city_id INT NOT NULL,

    permission_key VARCHAR(120) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_user_city_perm (
        user_id,
        city_id,
        permission_key
    ),

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (city_id)
        REFERENCES cities(id)
        ON DELETE CASCADE,

    INDEX idx_user (user_id),
    INDEX idx_city (city_id)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 11. NOTIFICATIONS TABLE
-- ============================================================

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

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    INDEX idx_user_read (user_id, is_read),
    INDEX idx_created (created_at DESC)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 12. ACTIVITY LOG
-- ============================================================

CREATE TABLE IF NOT EXISTS activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NULL,
    user_name VARCHAR(100),

    action VARCHAR(50) NOT NULL,

    entity_type VARCHAR(50) NOT NULL,
    entity_id INT,
    entity_name VARCHAR(200),

    changes JSON,

    ip_address VARCHAR(45),
    user_agent VARCHAR(500),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_entity (
        entity_type,
        entity_id
    ),

    INDEX idx_user (user_id),

    INDEX idx_created (created_at DESC)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 13. DEFAULT ROLES
-- ============================================================

INSERT INTO roles (
    name,
    slug,
    description,
    is_system,
    permissions
)
VALUES

(
    'Admin',
    'admin',
    'Full system access',
    TRUE,
    JSON_ARRAY(
        'dashboard.view',
        'analytics.view',
        'users.view',
        'roles.view',
        'cities.view',
        'profile.view',
        'activity.view'
    )
),

(
    'Manager',
    'manager',
    'Manage cruises and bookings',
    TRUE,
    JSON_ARRAY(
        'dashboard.view',
        'analytics.view',
        'users.view',
        'cities.view',
        'profile.view',
        'activity.view'
    )
),

(
    'User',
    'user',
    'Regular user access',
    TRUE,
    JSON_ARRAY(
        'dashboard.view',
        'profile.view'
    )
)

ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    permissions = VALUES(permissions);


-- ============================================================
-- 14. DEFAULT CITIES
-- ============================================================

INSERT INTO cities (
    name,
    state,
    country,
    code
)
VALUES

(
    'Mumbai',
    'Maharashtra',
    'India',
    'BOM'
),

(
    'Delhi',
    'Delhi',
    'India',
    'DEL'
),

(
    'Bangalore',
    'Karnataka',
    'India',
    'BLR'
),

(
    'Chennai',
    'Tamil Nadu',
    'India',
    'MAA'
),

(
    'Kolkata',
    'West Bengal',
    'India',
    'CCU'
),

(
    'Goa',
    'Goa',
    'India',
    'GOI'
)

ON DUPLICATE KEY UPDATE
    name = VALUES(name);


-- ============================================================
-- 15. CONNECT EXISTING USER ROLE
-- ============================================================

UPDATE users u
JOIN roles r
    ON r.slug = u.role
SET u.role_id = r.id
WHERE u.role_id IS NULL;


-- ============================================================
-- 16. ADD EXISTING USERS TO USER_ROLES
-- ============================================================

INSERT IGNORE INTO user_roles (
    user_id,
    role_id
)
SELECT
    id,
    role_id
FROM users
WHERE role_id IS NOT NULL;


-- ============================================================
-- 17. SAMPLE CRUISE DATA
-- ============================================================
-- Uncomment if you want sample data.

-- INSERT INTO cruises
-- (
--     name,
--     destination,
--     duration,
--     price,
--     description,
--     status
-- )
-- VALUES
-- (
--     'Mediterranean Cruise',
--     'Greece, Italy, Spain',
--     '7 days',
--     2450.00,
--     'Explore the beautiful Mediterranean coast with stops in Greece, Italy, and Spain.',
--     'published'
-- ),
-- (
--     'Caribbean Paradise',
--     'Bahamas, Jamaica',
--     '5 days',
--     1890.00,
--     'Enjoy the crystal clear waters and white sandy beaches of the Caribbean.',
--     'published'
-- ),
-- (
--     'Alaskan Adventure',
--     'Alaska, Canada',
--     '10 days',
--     4200.00,
--     'Witness the majestic glaciers and wildlife of Alaska and Canada.',
--     'draft'
-- ),
-- (
--     'Norwegian Fjords',
--     'Norway, Denmark',
--     '8 days',
--     3600.00,
--     'Cruise through the stunning Norwegian fjords and visit charming Nordic cities.',
--     'published'
-- ),
-- (
--     'Asian Discovery',
--     'Japan, Thailand',
--     '12 days',
--     5200.00,
--     'Experience the rich culture and cuisine of Japan and Thailand.',
--     'archived'
-- );


-- ============================================================
-- 18. SAMPLE USERS
-- ============================================================
-- IMPORTANT:
-- Generate a REAL bcrypt password hash before inserting users.
--
-- Node.js example:
--
-- node -e "console.log(require('bcryptjs').hashSync('Admin123!', 10))"
--
-- Then replace <REAL_BCRYPT_HASH> below.


-- INSERT INTO users
-- (
--     username,
--     email,
--     password_hash,
--     full_name,
--     role,
--     role_id,
--     is_active
-- )
-- SELECT
--     'admin',
--     'admin@urbancruise.com',
--     '<REAL_BCRYPT_HASH>',
--     'Admin User',
--     'admin',
--     id,
--     TRUE
-- FROM roles
-- WHERE slug = 'admin'
-- LIMIT 1;


-- ============================================================
-- 19. VERIFY TABLES
-- ============================================================

SHOW TABLES;


-- ============================================================
-- 20. VERIFY USERS
-- ============================================================

SELECT
    id,
    username,
    email,
    full_name,
    role,
    role_id,
    is_active,
    created_at
FROM users
ORDER BY id;


-- ============================================================
-- 21. VERIFY ROLES
-- ============================================================

SELECT
    id,
    name,
    slug,
    permissions,
    is_system,
    is_active
FROM roles
ORDER BY id;


-- ============================================================
-- 22. VERIFY CITIES
-- ============================================================

SELECT
    id,
    name,
    state,
    country,
    code,
    is_active
FROM cities
ORDER BY id;


-- ============================================================
-- 23. VERIFY USER ROLES
-- ============================================================

SELECT
    u.id AS user_id,
    u.username,
    r.id AS role_id,
    r.name AS role_name,
    r.slug
FROM users u
LEFT JOIN user_roles ur
    ON ur.user_id = u.id
LEFT JOIN roles r
    ON r.id = ur.role_id
ORDER BY u.id;


-- ============================================================
-- 24. USER BOOKING SUMMARY
-- ============================================================

SELECT
    u.id,
    u.username,
    u.email,
    u.full_name,
    u.role,

    COUNT(b.id) AS total_bookings,

    IFNULL(
        SUM(b.total_amount),
        0
    ) AS total_spent

FROM users u

LEFT JOIN bookings b
    ON u.id = b.user_id

GROUP BY
    u.id,
    u.username,
    u.email,
    u.full_name,
    u.role

ORDER BY u.id;


-- ============================================================
-- SEO MANAGEMENT TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS seo_pages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    city_id INT NULL,
    page_path VARCHAR(500) NOT NULL,
    slug VARCHAR(255) NULL,
    page_type VARCHAR(50) NOT NULL,
    page_title VARCHAR(255) NULL,
    favicon_url VARCHAR(2048) NULL,
    meta_title VARCHAR(255) NULL,
    meta_description TEXT NULL,
    focus_keyword VARCHAR(255) NULL,
    meta_keywords TEXT NULL,
    secondary_keywords JSON NULL,
    content_json JSON NULL,
    canonical_url VARCHAR(2048) NULL,
    robots_meta VARCHAR(255) NOT NULL DEFAULT 'index, follow',
    is_indexable BOOLEAN NOT NULL DEFAULT TRUE,
    og_title VARCHAR(255) NULL,
    og_description TEXT NULL,
    og_image VARCHAR(2048) NULL,
    og_url VARCHAR(2048) NULL,
    og_type VARCHAR(50) NOT NULL DEFAULT 'website',
    feature_image VARCHAR(2048) NULL,
    feature_image_public_id VARCHAR(255) NULL,
    twitter_card VARCHAR(50) NOT NULL DEFAULT 'summary_large_image',
    twitter_domain VARCHAR(255) NULL,
    twitter_url VARCHAR(2048) NULL,
    twitter_image VARCHAR(2048) NULL,
    twitter_title VARCHAR(255) NULL,
    twitter_description TEXT NULL,
    schema_json JSON NULL,
    seo_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    word_count INT UNSIGNED NOT NULL DEFAULT 0,
    readability_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_seo_pages_path (page_path),
    INDEX idx_seo_pages_city (city_id),
    INDEX idx_seo_pages_type (page_type),
    INDEX idx_seo_pages_indexable (is_indexable),
    INDEX idx_seo_pages_updated (updated_at),
    CONSTRAINT fk_seo_pages_city FOREIGN KEY (city_id)
        REFERENCES cities(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add content_json to seo_pages tables created before the content editor.
SET @seo_pages_content_json_migration = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE seo_pages ADD COLUMN content_json JSON NULL AFTER secondary_keywords',
        'SELECT 1'
    )
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'seo_pages'
      AND COLUMN_NAME = 'content_json'
);
PREPARE seo_pages_content_json_stmt FROM @seo_pages_content_json_migration;
EXECUTE seo_pages_content_json_stmt;
DEALLOCATE PREPARE seo_pages_content_json_stmt;

CREATE TABLE IF NOT EXISTS seo_keywords (
    id INT AUTO_INCREMENT PRIMARY KEY,
    keyword VARCHAR(255) NOT NULL,
    keyword_type VARCHAR(50) NOT NULL DEFAULT 'secondary',
    search_volume INT UNSIGNED NOT NULL DEFAULT 0,
    difficulty DECIMAL(5,2) NOT NULL DEFAULT 0,
    current_rank INT UNSIGNED NULL,
    target_rank INT UNSIGNED NULL,
    page_path VARCHAR(500) NULL,
    city_id INT NULL,
    is_tracked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_seo_keywords_keyword (keyword),
    INDEX idx_seo_keywords_type (keyword_type),
    INDEX idx_seo_keywords_city (city_id),
    INDEX idx_seo_keywords_tracked (is_tracked),
    CONSTRAINT fk_seo_keywords_city FOREIGN KEY (city_id)
        REFERENCES cities(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS seo_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value LONGTEXT NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS seo_schemas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    city_id INT NULL,
    page_path VARCHAR(500) NULL,
    schema_type VARCHAR(100) NOT NULL,
    schema_json JSON NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_seo_schemas_type (schema_type),
    INDEX idx_seo_schemas_path (page_path(191)),
    INDEX idx_seo_schemas_active (is_active),
    CONSTRAINT fk_seo_schemas_city FOREIGN KEY (city_id)
        REFERENCES cities(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS seo_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    city_id INT NULL,
    page_path VARCHAR(500) NOT NULL,
    image_url VARCHAR(2048) NOT NULL,
    public_id VARCHAR(255) NULL,
    alt_text TEXT NULL,
    has_alt BOOLEAN NOT NULL DEFAULT FALSE,
    title_text VARCHAR(255) NULL,
    caption TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_seo_images_path (page_path(191)),
    INDEX idx_seo_images_city (city_id),
    INDEX idx_seo_images_alt (has_alt),
    CONSTRAINT fk_seo_images_city FOREIGN KEY (city_id)
        REFERENCES cities(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS seo_internal_links (
    id INT AUTO_INCREMENT PRIMARY KEY,
    source_path VARCHAR(500) NOT NULL,
    target_path VARCHAR(2048) NOT NULL,
    anchor_text VARCHAR(1000) NULL,
    is_broken BOOLEAN NOT NULL DEFAULT FALSE,
    last_checked_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_seo_links_source (source_path(191)),
    INDEX idx_seo_links_target (target_path(191)),
    INDEX idx_seo_links_broken (is_broken)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS seo_technical (
    id INT AUTO_INCREMENT PRIMARY KEY,
    check_type VARCHAR(100) NOT NULL,
    check_key VARCHAR(500) NULL,
    status ENUM('ok', 'warning', 'error') NOT NULL,
    message TEXT NULL,
    checked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_seo_technical_type (check_type),
    INDEX idx_seo_technical_checked (checked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS seo_core_web_vitals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    page_path VARCHAR(500) NOT NULL,
    device ENUM('mobile', 'desktop') NOT NULL,
    lcp DECIMAL(8,3) NULL,
    fid DECIMAL(8,3) NULL,
    cls DECIMAL(8,4) NULL,
    inp DECIMAL(8,3) NULL,
    ttfb DECIMAL(8,3) NULL,
    status ENUM('good', 'needs_improvement', 'poor', 'no_data') NOT NULL,
    measured_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_seo_cwv_page_device (page_path(191), device),
    INDEX idx_seo_cwv_measured (measured_at),
    INDEX idx_seo_cwv_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SHOW TABLES LIKE 'seo_%';

-- ============================================================
-- END OF URBAN CRUISE CMS DATABASE
-- ============================================================