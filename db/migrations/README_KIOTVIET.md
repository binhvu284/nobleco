# KiotViet Integration Database Migration

This document describes the database schema updates for KiotViet API integration.

## Migration File

**File:** `db/migrations/add_kiotviet_integration.sql`

## What This Migration Does

### 1. Updates Products Table
Adds the following fields to store KiotViet product data:
- `kiotviet_id` - Unique identifier from KiotViet API
- `serial_number` - Product serial number
- `supplier_id` - Supplier identifier
- `center_stone_size_mm` - Center stone size in millimeters
- `shape` - Product shape (e.g., Round, Princess, Oval)
- `dimensions` - Product dimensions
- `stone_count` - Number of stones
- `carat_weight_ct` - Total carat weight
- `gold_purity` - Gold purity (e.g., 18K, 24K)
- `product_weight_g` - Product weight in grams
- `inventory_value` - Total inventory value
- `last_synced_at` - Timestamp of last sync
- `sync_status` - Sync status (pending, synced, failed, syncing)

### 2. Updates Categories Table
Adds the following fields for category synchronization:
- `kiotviet_id` - Unique identifier from KiotViet API
- `last_synced_at` - Timestamp of last sync
- `sync_status` - Sync status (pending, synced, failed, syncing)

### 3. Creates Third-Party Integrations Table
Stores API credentials and configuration for multiple integrations:
- Integration identification (name, display_name)
- API configuration (api_url, token_url, client_id, client_secret, retailer)
- Token management (access_token, refresh_token, token_expires_at)
- Integration settings (is_active, is_default, sync_enabled)
- Sync tracking (last_sync_at, sync_interval_minutes)

### 4. Creates Sync Logs Table
Tracks synchronization history and errors:
- Integration reference
- Sync metadata (type, status)
- Sync statistics (products/categories synced, created, updated, failed)
- Error tracking (error_message, error_details)

## How to Run

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `add_kiotviet_integration.sql`
4. Click "Run" to execute the migration

## Verification

After running the migration, verify:

1. **Products table** has new columns:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('kiotviet_id', 'serial_number', 'supplier_id', 'center_stone_size_mm', 'shape', 'dimensions', 'stone_count', 'carat_weight_ct', 'gold_purity', 'product_weight_g', 'inventory_value', 'last_synced_at', 'sync_status');
```

2. **Categories table** has new columns:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'categories' 
AND column_name IN ('kiotviet_id', 'last_synced_at', 'sync_status');
```

3. **Third-party integrations table** exists:
```sql
SELECT * FROM third_party_integrations WHERE name = 'kiotviet';
```

4. **Sync logs table** exists:
```sql
SELECT COUNT(*) FROM sync_logs;
```

## Notes

- The migration uses `IF NOT EXISTS` and `ADD COLUMN IF NOT EXISTS` to be idempotent (safe to run multiple times)
- Initial KiotViet integration configuration is inserted automatically
- All new columns are nullable to avoid breaking existing data
- Indexes are created for performance optimization

