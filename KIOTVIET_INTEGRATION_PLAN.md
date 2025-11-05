# KiotViet API Integration Plan

## Overview
This document outlines the plan to integrate KiotViet API for product data synchronization. The integration will allow products to be synced from KiotViet while maintaining local image management capabilities.

## Integration Architecture

### Phase 1: Database Schema Updates

#### 1.1 Update Products Table
Add new fields to the `products` table to store KiotViet product data:

```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS kiotviet_id TEXT UNIQUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS serial_number TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_id TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS center_stone_size_mm NUMERIC(10, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS shape TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS dimensions TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stone_count INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS carat_weight_ct NUMERIC(10, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS gold_purity TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_weight_g NUMERIC(10, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS inventory_value NUMERIC(20, 0);
ALTER TABLE products ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed', 'syncing'));
```

#### 1.2 Create Third-Party Integrations Table
Store configuration for multiple third-party integrations:

```sql
CREATE TABLE IF NOT EXISTS third_party_integrations (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL UNIQUE, -- e.g., 'kiotviet', 'another_app'
  display_name TEXT NOT NULL,
  api_url TEXT NOT NULL,
  token_url TEXT,
  client_id TEXT,
  client_secret TEXT,
  retailer TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  sync_enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_interval_minutes INTEGER DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_integrations_default ON third_party_integrations(is_default) WHERE is_default = true;
```

#### 1.3 Create Sync Logs Table
Track synchronization history:

```sql
CREATE TABLE IF NOT EXISTS sync_logs (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  integration_id BIGINT REFERENCES third_party_integrations(id),
  sync_type TEXT NOT NULL CHECK (sync_type IN ('full', 'incremental', 'manual')),
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'partial')),
  products_synced INTEGER DEFAULT 0,
  products_created INTEGER DEFAULT 0,
  products_updated INTEGER DEFAULT 0,
  products_failed INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Phase 2: KiotViet API Client Implementation

#### 2.1 Create API Client Utility
**File: `src/utils/kiotvietApi.ts`**

Features:
- OAuth2 token management (get/refresh access tokens)
- API request wrapper with error handling
- Rate limiting handling
- Token expiration management

Key Functions:
```typescript
- getAccessToken() - Get/refresh access token
- fetchProducts(page, pageSize) - Fetch products from KiotViet
- fetchProductById(kiotvietId) - Fetch single product
- fetchCategories() - Fetch categories
- syncProduct(kiotvietProduct) - Transform and sync single product
```

#### 2.2 Backend API Routes
**File: `api/integrations/kiotviet.js`**

Endpoints:
- `GET /api/integrations/kiotviet/test` - Test connection
- `POST /api/integrations/kiotviet/sync` - Manual sync trigger
- `GET /api/integrations/kiotviet/status` - Get sync status
- `GET /api/integrations/kiotviet/logs` - Get sync logs

### Phase 3: Product Sync Service

#### 3.1 Sync Service Implementation
**File: `api/services/productSync.js`**

Core Functions:
- `syncFromKiotViet()` - Main sync function
- `transformKiotVietProduct()` - Map KiotViet fields to our schema
- `upsertProduct()` - Insert or update product
- `handleSyncErrors()` - Error handling and logging

Sync Logic:
1. Fetch access token
2. Fetch products from KiotViet (paginated)
3. Transform each product to our schema
4. Generate product name: `{category_name} {product_id}`
5. Upsert to database (match by `kiotviet_id`)
6. Preserve local images (only update if product exists)
7. Update sync status and log

#### 3.2 Field Mapping
Map KiotViet API fields to our database:

| KiotViet Field | Our Database Field | Notes |
|----------------|-------------------|-------|
| `id` | `kiotviet_id` | External ID |
| `code` | `serial_number` | Product code |
| `categoryId` | `category_id` | Map to our categories |
| `categoryName` | Used for product name | Part of name generation |
| `supplierId` | `supplier_id` | |
| Custom fields → | `center_stone_size_mm`, `shape`, etc. | Map from custom attributes |
| `basePrice` | `price` | Retail price |
| `inventory` | `stock` | Current stock |
| `description` | `long_description` | |
| `name` | Part of name generation | Combine with category |

### Phase 4: UI Updates - Admin Side

#### 4.1 Integration Management Page
**File: `src/admin/pages/AdminIntegrations.tsx`**

Features:
- List all integrations
- Add new integration (name, API keys, etc.)
- Set default integration
- Enable/disable sync
- Manual sync trigger
- View sync logs
- Test connection

#### 4.2 Update Admin Products Page
**File: `src/admin/pages/AdminProducts.tsx`**

Changes:
- Hide "Add Product" button (or move to settings)
- Add "Sync Products" button (triggers sync from default integration)
- Show sync status indicator
- Display last sync time
- Add filter for sync status

#### 4.3 Update Product Detail Modal
**File: `src/admin/components/ProductDetailModal.tsx`**

Add display for all new fields:
- Serial Number
- Category (with KiotViet category name)
- Product ID (KiotViet ID)
- Supplier ID
- Center Stone Size (mm)
- Shape
- Dimensions
- Stone Count
- Carat Weight (ct)
- Gold Purity
- Product Weight (g)
- Retail Price
- Stock
- Inventory Value
- Description

Layout: Two-column grid for better organization

#### 4.4 Hide/Disable Product Edit Functions
**File: `src/admin/components/AddProductModal.tsx`**

- Keep component but hide from UI
- Or convert to "Add Integration" modal
- Image editing remains functional in ProductDetailModal

### Phase 5: UI Updates - User Side

#### 5.1 Update User Product Page
**File: `src/user/pages/UserProduct.tsx`**

Display all fields (except stock and inventory value):
- Serial Number
- Category
- Product ID
- Supplier ID
- Center Stone Size (mm)
- Shape
- Dimensions
- Stone Count
- Carat Weight (ct)
- Gold Purity
- Product Weight (g)
- Retail Price
- Description

Layout: Enhanced product detail modal with organized sections

### Phase 6: Environment Variables

Add to `.env`:
```env
KIOT_CLIENT_ID=733933ea-8926-4454-906f-bb2c5a1b200c
KIOT_CLIENT_SECRET=C21301C23C61A43D15C879F919C2B7DF2784C827
KIOT_API_URL=https://public.kiotapi.com
KIOT_GET_API_TOKEN=https://id.kiotviet.vn/connect/token
KIOT_RETAILER=nobleco
```

### Phase 7: Data Migration & Initialization

#### 7.1 Initial Data Setup
- Create default KiotViet integration record in database
- Set as default integration
- Run initial full sync

#### 7.2 Product Name Migration
- Update existing products: `name = category_name + ' ' + id`
- For synced products: `name = category_name + ' ' + kiotviet_id`

### Phase 8: Automated Sync (Optional - Future)

#### 8.1 Background Sync Job
- Schedule periodic syncs (every hour, configurable)
- Use cron job or background worker
- Handle failures gracefully
- Send notifications on sync failures

## Implementation Steps Order

1. **Database Schema Updates** (Phase 1)
   - Run migration scripts
   - Update schema files

2. **Backend API Client** (Phase 2)
   - Implement KiotViet API client
   - Test authentication and basic requests

3. **Sync Service** (Phase 3)
   - Implement sync logic
   - Test with sample data

4. **Repository Updates** (Phase 3.5)
   - Update `api/_repo/products.js` to handle new fields
   - Update normalize function

5. **Admin UI - Integration Management** (Phase 4.1)
   - Create integrations page
   - Test connection functionality

6. **Admin UI - Products Page** (Phase 4.2)
   - Add sync button
   - Hide add button
   - Update product display

7. **Admin UI - Product Detail** (Phase 4.3)
   - Add all new fields display
   - Update layout

8. **User UI Updates** (Phase 5)
   - Update product detail modal
   - Display all relevant fields

9. **Testing & Refinement**
   - Test full sync flow
   - Test image preservation
   - Test error handling
   - Performance optimization

## Key Considerations

### Data Preservation
- **Images**: Always preserve local images during sync
- **Custom Fields**: Handle missing fields gracefully
- **Name Generation**: Always generate name as `{category} {id}`

### Error Handling
- Network failures
- API rate limits
- Invalid data formats
- Missing required fields

### Performance
- Paginated API requests
- Batch database operations
- Incremental sync option
- Caching strategy

### Security
- Secure storage of API credentials
- Token encryption
- API key rotation support

## API Endpoints Summary

### KiotViet API Endpoints (External)
- `POST /connect/token` - Get access token
- `GET /products` - List products
- `GET /products/{id}` - Get product details
- `GET /categories` - List categories

### Our API Endpoints (Internal)
- `GET /api/integrations` - List integrations
- `POST /api/integrations` - Create integration
- `PUT /api/integrations/:id` - Update integration
- `POST /api/integrations/:id/sync` - Trigger sync
- `GET /api/integrations/:id/logs` - Get sync logs
- `GET /api/integrations/:id/test` - Test connection

## Testing Checklist

- [ ] Database schema updates applied
- [ ] KiotViet API authentication works
- [ ] Can fetch products from KiotViet
- [ ] Product transformation works correctly
- [ ] Product name generation: `{category} {id}`
- [ ] Images preserved during sync
- [ ] Sync logs created correctly
- [ ] Error handling works
- [ ] Admin UI displays all fields
- [ ] User UI displays correct fields
- [ ] Integration management works
- [ ] Manual sync trigger works
- [ ] Default integration setting works

