ALTER TABLE quick_call_requests
  ADD COLUMN city VARCHAR(100) NULL AFTER phone_number,
  ADD INDEX idx_quick_call_requests_city (city);
