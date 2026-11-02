CREATE TABLE IF NOT EXISTS quote_request_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  quote_id INT NOT NULL,
  event_type ENUM('verified', 'submitted') NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_quote_request_events_quote (quote_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
