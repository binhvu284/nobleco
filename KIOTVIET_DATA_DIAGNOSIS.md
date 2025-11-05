# KiotViet Data Integration Diagnosis

## Problem Statement
Product fields (Serial Number, Supplier ID, Center Stone Size, Shape, Dimensions, Stone Count, Carat Weight, Gold Purity, Product Weight, Type, Inventory Value) are showing `null` values in the database even though the client confirms these fields exist in KiotViet with actual data.

## Investigation Summary

### 1. Database Schema ✅
**Status**: CORRECT
- All required fields are properly defined in the database schema
- Fields are nullable (allowing `null` values)
- Data types match expected values (TEXT, NUMERIC, INTEGER)

**Files Checked**:
- `db/schema.sql` - All fields present
- `db/migrations/add_kiotviet_integration.sql` - Migration script correct

### 2. Field Extraction Logic 🔍
**Status**: ENHANCED (needs testing)

**Current Implementation** (`api/integrations/sync.js`):
- Uses `getFieldValue()` helper function
- Checks multiple naming conventions:
  - camelCase: `serialNumber`, `supplierId`
  - snake_case: `serial_number`, `supplier_id`
  - PascalCase: `SerialNumber`, `SupplierId`
  - Vietnamese transliterations: `maSo`, `nhaCungCapId`
  - Vietnamese full text: `mã số`, `nhà cung cấp`
- Checks nested structures:
  - Root level
  - `properties` object
  - `extendedProperties` object
  - `customAttributes` array
  - `attributes` array
  - `category` nested object
  - `supplier` nested object

**Recent Enhancements**:
1. ✅ Added comprehensive logging for first product to see full API response structure
2. ✅ Enhanced `getFieldValue()` to check `properties` and `extendedProperties` objects
3. ✅ Improved attribute array matching (checks `name`, `code`, `key`, `label` properties)
4. ✅ Added debug logging to show exactly where fields are found (or not found)
5. ✅ Added Vietnamese field name variations

### 3. API Response Structure ❓
**Status**: NEEDS VERIFICATION

**Potential Issues**:
1. **KiotViet API Structure**: The API might return custom fields in a structure we haven't accounted for:
   - Custom fields might be in a different nested object
   - Field names might be completely different from expected
   - Fields might be in an array with different structure

2. **Missing API Parameters**: The products endpoint might require specific query parameters to return custom fields:
   - `?includeAttributes=true`
   - `?includeCustomFields=true`
   - `?includeProperties=true`

### 4. Category Integration ❓
**Status**: NEEDS VERIFICATION

**Current Implementation**:
- Categories are extracted from product objects
- `findOrCreateCategory()` function handles category creation/lookup
- Categories are linked to products via `product_categories` table

**Potential Issues**:
1. Category data might need to be synced separately from a `/categories` endpoint
2. Category names/IDs might be in a different structure in the API response
3. Category linking might fail silently

## Action Plan

### Step 1: Enhanced Logging (DONE ✅)
- ✅ Added full JSON logging for first product
- ✅ Added logging for nested structures (`properties`, `extendedProperties`, `customAttributes`, `attributes`)
- ✅ Added debug logging in `getFieldValue()` for first product

### Step 2: Test Sync and Analyze Logs (NEXT ⏭️)
**What to do**:
1. Run a sync operation
2. Check server logs for:
   - `[KiotViet Sync] First product FULL JSON:` - This will show the complete API response structure
   - `[Field Extraction]` logs - These will show exactly where fields are found or why they're not found
   - `[KiotViet Sync] Found 'properties' object:` - Check if properties exist
   - `[KiotViet Sync] Found 'customAttributes' array:` - Check if custom attributes exist

**What to look for**:
- Actual field names used by KiotViet API
- Structure of custom fields (nested object vs array)
- Whether fields exist but have different names

### Step 3: Fix Field Mapping (IF NEEDED)
Based on logs, update field names in `getFieldValue()` calls to match actual KiotViet API field names.

### Step 4: Check API Documentation
- Verify if KiotViet API requires specific query parameters to return custom fields
- Check if there's a separate endpoint for product details that includes more fields

### Step 5: Category Sync Investigation
- Check if categories need to be synced from a separate `/categories` endpoint
- Verify category data structure in product API response

## Expected Outcomes

### If Fields Exist in API but Not Extracted:
- **Fix**: Update field name mappings in `getFieldValue()` calls
- **Evidence**: Logs will show field exists but name doesn't match

### If Fields Don't Exist in API Response:
- **Fix**: May need to:
  1. Add query parameters to API request (`?includeCustomFields=true`)
  2. Use a different API endpoint (e.g., `/products/{id}` for detailed product)
  3. Contact KiotViet support about custom field structure

### If Database Issue:
- **Fix**: Verify migration was run correctly in Supabase
- **Evidence**: Database columns might be missing or have wrong types

## Next Steps for User

1. **Run a sync operation** and share the server logs, specifically:
   - The `[KiotViet Sync] First product FULL JSON:` output
   - Any `[Field Extraction]` logs showing field extraction attempts
   - Any errors or warnings

2. **Check KiotViet API Documentation** for:
   - Custom field structure
   - Required query parameters
   - Alternative endpoints for detailed product data

3. **Share Excel File Mapping** (if available):
   - Column names from Excel file
   - How they map to KiotViet API fields
   - This will help create accurate field mappings

## Files Modified

1. `api/integrations/sync.js`:
   - Enhanced `fetchKiotVietProducts()` with comprehensive logging
   - Enhanced `getFieldValue()` to check `properties` and `extendedProperties`
   - Added debug parameter to `getFieldValue()` for detailed logging
   - Improved attribute array matching logic
   - Added Vietnamese field name variations

## Key Questions to Answer

1. ✅ Are database columns correct? → YES
2. ❓ Are fields in the API response? → NEEDS LOG VERIFICATION
3. ❓ Are field names matching? → NEEDS LOG VERIFICATION
4. ❓ Do we need API query parameters? → NEEDS API DOC CHECK
5. ❓ Is category sync working? → NEEDS VERIFICATION

