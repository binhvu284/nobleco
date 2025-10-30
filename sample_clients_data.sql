-- ============================================
-- INSERT SAMPLE CLIENTS DATA
-- ============================================

INSERT INTO public.clients (
  name, phone, email, birthday, location, description, created_by
) VALUES
(
  'John Smith',
  '+1 (555) 123-4567',
  'john.smith@example.com',
  '1990-05-15',
  'United States',
  'Regular customer, prefers premium products',
  NULL
),
(
  'Sarah Wilson',
  '+1 (555) 987-6543',
  'sarah.wilson@example.com',
  '1985-08-22',
  'Canada',
  'VIP client, bulk orders',
  NULL
),
(
  'Michael Davis',
  '+1 (555) 456-7890',
  'michael.davis@example.com',
  '1992-11-10',
  'United States',
  'New client, interested in organic products',
  NULL
),
(
  'Emily Chen',
  '+1 (555) 321-0987',
  'emily.chen@example.com',
  '1988-03-25',
  'United States',
  'Loyal customer, frequent orders',
  NULL
),
(
  'David Rodriguez',
  '+1 (555) 654-3210',
  'david.rodriguez@example.com',
  '1995-07-08',
  'Mexico',
  'B2B client, wholesale orders',
  NULL
),
(
  'Lisa Anderson',
  '+1 (555) 789-0123',
  'lisa.anderson@example.com',
  '1991-12-03',
  'United States',
  'Interested in health and wellness products',
  NULL
),
(
  'James Taylor',
  '+44 20 1234 5678',
  'james.taylor@example.com',
  '1987-01-18',
  'United Kingdom',
  'International client, prefers express shipping',
  NULL
),
(
  'Maria Garcia',
  '+34 91 123 4567',
  'maria.garcia@example.com',
  '1993-09-14',
  'Spain',
  'New client, first order pending',
  NULL
),
(
  'Robert Brown',
  '+1 (555) 234-5678',
  'robert.brown@example.com',
  '1989-06-20',
  'United States',
  'Regular customer, prefers subscription model',
  NULL
),
(
  'Jennifer Lee',
  '+1 (555) 345-6789',
  'jennifer.lee@example.com',
  '1994-02-28',
  'United States',
  'Price-sensitive customer, looks for deals',
  NULL
);

