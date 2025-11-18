-- Create coworker_permissions table
CREATE TABLE IF NOT EXISTS coworker_permissions (
    id SERIAL PRIMARY KEY,
    coworker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    page_path VARCHAR(255) NOT NULL,
    page_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(coworker_id, page_path)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_coworker_permissions_coworker_id ON coworker_permissions(coworker_id);
CREATE INDEX IF NOT EXISTS idx_coworker_permissions_page_path ON coworker_permissions(page_path);

-- Add initial permissions for all existing coworkers
-- This will grant access to all admin pages except admin-admin-users
INSERT INTO coworker_permissions (coworker_id, page_path, page_name)
SELECT 
    u.id as coworker_id,
    page_data.page_path,
    page_data.page_name
FROM users u
CROSS JOIN (
    VALUES 
        ('/admin-dashboard', 'Dashboard'),
        ('/admin-clients', 'Clients'),
        ('/admin-products', 'Products'),
        ('/admin-categories', 'Categories'),
        ('/admin-orders', 'Orders'),
        ('/admin-commission', 'Commission'),
        ('/admin-request', 'Withdraw Request'),
        ('/admin-discount', 'Discount Code')
) AS page_data(page_path, page_name)
WHERE u.role = 'coworker'
ON CONFLICT (coworker_id, page_path) DO NOTHING;

