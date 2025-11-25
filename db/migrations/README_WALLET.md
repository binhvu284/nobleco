# Wallet and Withdraw Request Database Migration

This document describes the database schema for the Wallet and Withdraw Request functionality.

## Migration File

**File:** `db/migrations/create_wallet_tables.sql`

## What This Migration Does

### 1. Creates `withdraw_request` Table
Stores user withdrawal requests for converting points to VND currency:

**Required Columns:**
- `id` - Primary key (auto-increment)
- `user_id` - Foreign key to users table (the user requesting withdrawal)
- `amount` - Amount in VND currency (must be >= 0)
- `point` - Number of points to withdraw (must be > 0)
- `request_date` - Timestamp when request was created (defaults to now)
- `completed_date` - Timestamp when request was processed (nullable)
- `status` - Request status: `pending`, `approve`, or `reject` (defaults to `pending`)

**Optional Columns:**
- `exchange_rate` - Points to VND conversion rate (if variable)
- `processed_by` - Foreign key to users table (admin who processed the request)
- `admin_notes` - Notes from admin (e.g., rejection reason)
- `created_at` - Timestamp (defaults to now)
- `updated_at` - Timestamp (auto-updated on changes)

**Features:**
- Auto-updates `completed_date` when status changes to `approve` or `reject`
- Cascades deletion when user is deleted
- Indexes for efficient querying by user, status, and dates

### 2. Creates `wallet_log` Table
Transaction log for user wallet activities:

**Required Columns:**
- `id` - Primary key (auto-increment)
- `user_id` - Foreign key to users table (the wallet owner)
- `log_time` - Timestamp when transaction occurred (defaults to now)
- `log_type` - Type of transaction:
  - `My order commission` - Commission from user's own orders
  - `Level 1 commission` - Commission from level 1 referrals
  - `Level 2 commission` - Commission from level 2 referrals
  - `Withdraw` - Points withdrawn via withdrawal request
- `point_amount` - Point amount (positive for additions, negative for withdrawals)

**Optional Columns:**
- `balance_after` - Wallet balance after this transaction (for historical reference)
- `related_order_id` - Foreign key to orders table (for commission logs)
- `related_withdraw_request_id` - Foreign key to withdraw_request table (for withdraw logs)
- `description` - Additional details about the transaction
- `created_at` - Timestamp (defaults to now)

**Features:**
- Links commission logs to orders
- Links withdraw logs to withdrawal requests
- Indexes for efficient querying by user, log type, and time
- Cascades deletion when user is deleted

## How to Run

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `create_wallet_tables.sql`
4. Click "Run" to execute the migration

## Verification

After running the migration, verify:

1. **withdraw_request table** exists:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'withdraw_request'
ORDER BY ordinal_position;
```

2. **wallet_log table** exists:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'wallet_log'
ORDER BY ordinal_position;
```

3. **Indexes are created**:
```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('withdraw_request', 'wallet_log');
```

4. **Triggers are created**:
```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table IN ('withdraw_request', 'wallet_log');
```

## Usage Examples

### Create a Withdrawal Request
```sql
INSERT INTO public.withdraw_request (user_id, amount, point, exchange_rate)
VALUES (1, 1000000, 1000, 1000);
-- Creates a withdrawal request for 1000 points = 1,000,000 VND
```

### Approve a Withdrawal Request
```sql
UPDATE public.withdraw_request
SET status = 'approve',
    processed_by = 2,  -- Admin user ID
    admin_notes = 'Approved and processed'
WHERE id = 1;
-- The completed_date will be automatically set by the trigger
```

### Log a Commission Transaction
```sql
INSERT INTO public.wallet_log (
    user_id, 
    log_type, 
    point_amount, 
    related_order_id,
    description
)
VALUES (
    1, 
    'My order commission', 
    500, 
    123,
    'Commission from order ORD-2024-00123'
);
```

### Log a Withdrawal Transaction
```sql
INSERT INTO public.wallet_log (
    user_id, 
    log_type, 
    point_amount, 
    related_withdraw_request_id,
    description
)
VALUES (
    1, 
    'Withdraw', 
    -1000,  -- Negative for withdrawal
    1,
    'Withdrawal request #1 processed'
);
```

### Query User's Wallet History
```sql
SELECT 
    log_time,
    log_type,
    point_amount,
    balance_after,
    description
FROM public.wallet_log
WHERE user_id = 1
ORDER BY log_time DESC;
```

### Query Pending Withdrawal Requests
```sql
SELECT 
    wr.id,
    u.name AS user_name,
    u.email,
    wr.amount,
    wr.point,
    wr.request_date
FROM public.withdraw_request wr
JOIN public.users u ON wr.user_id = u.id
WHERE wr.status = 'pending'
ORDER BY wr.request_date ASC;
```

## Notes

- The migration uses `IF NOT EXISTS` to be idempotent (safe to run multiple times)
- All foreign keys use appropriate `ON DELETE` actions:
  - `CASCADE` for user relationships (delete user = delete their requests/logs)
  - `SET NULL` for optional relationships (preserve logs even if order/request is deleted)
- Indexes are optimized for common query patterns:
  - User-specific queries
  - Status filtering
  - Date range queries
  - Combined filters (status + date)
- The `completed_date` is automatically set when status changes to `approve` or `reject`
- The `balance_after` field in `wallet_log` can be calculated on-the-fly or stored for historical reference

## Integration with Application

### When Creating a Withdrawal Request:
1. Insert into `withdraw_request` table
2. Verify user has sufficient points
3. Optionally create a `wallet_log` entry with negative point_amount

### When Approving a Withdrawal Request:
1. Update `withdraw_request` status to `approve`
2. Set `processed_by` to current admin user ID
3. Deduct points from user's wallet (update `users.points`)
4. Create `wallet_log` entry with negative point_amount
5. Process payment transfer

### When Rejecting a Withdrawal Request:
1. Update `withdraw_request` status to `reject`
2. Set `processed_by` to current admin user ID
3. Add `admin_notes` with rejection reason
4. No points are deducted

### When Recording Commissions:
1. Create `wallet_log` entry with appropriate `log_type`
2. Set `related_order_id` to link to the order
3. Add points to user's wallet (update `users.points`)
4. Optionally set `balance_after` to current wallet balance

