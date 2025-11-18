# Excel Upload Feature - Implementation Plan

## Overview
Implement bulk product import via Excel file upload, supporting both simplified single-row format and hierarchical multi-row format.

## Excel Format Analysis

### Current Format (Hierarchical - Complex)
- **Structure**: One product = Multiple rows
- **Main Row**: Contains product-level data (Code, Supplier, Price, etc.)
- **Component Rows**: Contains stone/component details (Shape, Size, Quantity)
- **Challenge**: Requires row grouping and data aggregation

### Recommended Template Format

#### Option 1: Simplified Single-Row Format (Recommended for Initial Implementation)
Each product = One row with all data

| Column | Field Name | Database Field | Required | Notes |
|--------|------------|----------------|----------|-------|
| A | Product Code | `serial_number` | Yes | Unique identifier |
| B | Supplier Code | `supplier_id` | No | |
| C | Product Name | `name` | Yes | |
| D | Description | `short_description` | Yes | |
| E | Price (VND) | `price` | Yes | Numeric value |
| F | Stock | `stock` | No | Default: 0 |
| G | Carat Weight (Ct) | `carat_weight_ct` | No | Numeric |
| H | Gold Purity | `gold_purity` | No | e.g., "18K" |
| I | Product Weight (g) | `product_weight_g` | No | Numeric |
| J | Shape | `shape` | No | e.g., "Round", "Baguette" |
| K | Dimensions | `dimensions` | No | e.g., "2.9*3.3" or "2.4-2.65" |
| L | Stone Count | `stone_count` | No | Total number of stones |
| M | Center Stone Size (mm) | `center_stone_size_mm` | No | Numeric |
| N | Ring Size (Ni tay) | `ni_tay` | No | Numeric |
| O | Inventory Value | `inventory_value` | No | Numeric |
| P | **Category Names** | `category_ids` | No | **Comma-separated category names** |
| Q | Notes | `long_description` | No | Additional notes |

**Category Column (Column P) Format:**
- **Option A**: Single category name: `"Rings"`
- **Option B**: Multiple categories (comma-separated): `"Rings, Gold Jewelry"`
- **Option C**: Multiple categories (semicolon-separated): `"Rings; Gold Jewelry"`
- **Empty**: No category assigned (can be set via UI default)

#### Option 2: Hierarchical Format (Advanced - Current Excel Structure)
- **Grouping Key**: Product Code (Column C)
- **Main Row**: First row of each product group contains product-level data
- **Component Rows**: Subsequent rows contain component details (Shape, Size, Quantity)
- **Processing**: Aggregate components into `stone_count` and `dimensions` fields

## Category Assignment Strategy

### Problem
Products need to be assigned to categories, but Excel template should remain simple and user-friendly.

### Solution: Multi-Level Category Assignment

#### Level 1: Excel Column (Primary Method)
- **Column P**: Category Names (comma or semicolon separated)
- **Format**: `"Category1, Category2"` or `"Category1; Category2"`
- **Processing**: 
  - Split by comma/semicolon
  - Trim whitespace
  - Find existing categories by name (case-insensitive)
  - Create categories if they don't exist (optional, configurable)

#### Level 2: Upload UI Settings (Fallback/Default)
- **Default Categories**: User can select default categories for all products during upload
- **Category Mapping**: Map Excel category names to existing categories
- **Auto-Create**: Toggle to auto-create categories if they don't exist

#### Level 3: Category Resolution Logic
```javascript
async function resolveCategories(categoryNames, options = {}) {
  const { 
    defaultCategories = [], 
    autoCreate = false,
    caseSensitive = false 
  } = options;
  
  const categoryIds = [];
  
  // Process category names from Excel
  if (categoryNames && categoryNames.trim()) {
    const names = categoryNames.split(/[,;]/).map(n => n.trim()).filter(Boolean);
    
    for (const name of names) {
      // Find category by name (case-insensitive)
      let category = await findCategoryByName(name, caseSensitive);
      
      // Create if not found and auto-create is enabled
      if (!category && autoCreate) {
        category = await createCategory({
          name: name,
          slug: generateSlug(name),
          status: 'active'
        });
      }
      
      if (category) {
        categoryIds.push(category.id);
      }
    }
  }
  
  // Add default categories if no categories found
  if (categoryIds.length === 0 && defaultCategories.length > 0) {
    categoryIds.push(...defaultCategories);
  }
  
  return categoryIds;
}
```

#### Example Scenarios

**Scenario 1: Category in Excel**
- Excel Column P: `"Rings, Gold Jewelry"`
- Result: Product assigned to "Rings" and "Gold Jewelry" categories
- If "Gold Jewelry" doesn't exist and auto-create is ON: Creates new category
- If "Gold Jewelry" doesn't exist and auto-create is OFF: Only assigns "Rings"

**Scenario 2: No Category in Excel**
- Excel Column P: Empty or blank
- Default Categories in UI: `[1, 3]` (category IDs)
- Result: Product assigned to default categories

**Scenario 3: Category Name Mismatch**
- Excel Column P: `"Ring"` (singular)
- Database has: `"Rings"` (plural)
- Options:
  - **Fuzzy Matching**: Find closest match
  - **Exact Match Only**: Skip if not found
  - **Case-Insensitive**: Match "ring" = "Ring" = "RINGS"

### UI Components for Category Management

1. **Upload Modal Settings**:
   - [ ] Default Categories (multi-select dropdown)
   - [ ] Auto-create categories if not found
   - [ ] Category name matching (exact/fuzzy/case-insensitive)

2. **Category Preview**:
   - Show detected categories from Excel
   - Highlight missing categories
   - Show mapping suggestions

3. **Category Mapping Table**:
   - Excel Category Name → Database Category
   - Allow manual mapping
   - Save mappings for future uploads

## Technical Implementation

### 1. Library Selection
**Recommended: `xlsx` (SheetJS)**
- Lightweight (~2MB)
- Fast parsing
- Supports .xlsx, .xls, .csv
- Browser and Node.js compatible

**Alternative: `exceljs`**
- More features (styling, formulas)
- Larger bundle size
- Better for complex Excel operations

### 2. Backend API Endpoint
**Path**: `/api/products/upload-excel`
**Method**: POST
**Content-Type**: multipart/form-data

**Request**:
- `file`: Excel file (.xlsx, .xls, .csv)
- `format`: 'single-row' | 'hierarchical' (optional, auto-detect)
- `defaultCategoryIds`: Array of category IDs (optional)
- `autoCreateCategories`: Boolean (optional, default: false)
- `categoryMapping`: Object mapping Excel names to category IDs (optional)

**Response**:
```json
{
  "success": true,
  "processed": 10,
  "created": 8,
  "skipped": 2,
  "errors": [
    {
      "row": 5,
      "product_code": "01R0924005",
      "error": "Duplicate product code"
    }
  ],
  "products": [...]
}
```

### 3. Processing Flow

#### Step 1: Parse Excel File
```javascript
import XLSX from 'xlsx';

const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
```

#### Step 2: Detect Format
- Check if rows are grouped by Product Code
- If grouped → Hierarchical format
- If not → Single-row format

#### Step 3: Process Data

**For Single-Row Format**:
- Map each row directly to product data
- Extract category names from Column P
- Resolve categories (find/create/map)
- Validate required fields
- Handle data type conversions

**For Hierarchical Format**:
- Group rows by Product Code
- Extract product-level data from first row of each group
- Aggregate component data:
  - Sum quantities → `stone_count`
  - Combine shapes → `shape` (comma-separated or primary shape)
  - Combine sizes → `dimensions` (comma-separated or formatted string)

#### Step 4: Validate & Create Products
- Check for duplicates (by `serial_number` or `supplier_id`)
- Validate data types and ranges
- Create products in batch (transaction for data integrity)
- Return results with success/error details

### 4. Frontend Implementation

**Location**: `src/admin/pages/AdminProducts.tsx`

**Features**:
- Upload button/modal
- File selection (drag & drop or file picker)
- Format selection (single-row or hierarchical)
- Progress indicator
- Results display (success/errors)
- Download template button

**UI Flow**:
1. Click "Upload Excel" button
2. Select file
3. Choose format (or auto-detect)
4. Show preview/validation
5. Confirm upload
6. Display results

### 5. Error Handling

**Validation Errors**:
- Missing required fields
- Invalid data types
- Duplicate product codes
- Invalid numeric ranges

**Processing Errors**:
- File format not supported
- Corrupted file
- Database errors
- Partial failures (some products created, others failed)

### 6. Data Mapping Examples

#### Single-Row Format Mapping
```javascript
{
  "serial_number": row[0], // Product Code
  "supplier_id": row[1], // Supplier Code
  "name": row[2], // Product Name
  "short_description": row[3], // Description
  "price": parseFloat(row[4]), // Price
  "stock": parseInt(row[5]) || 0, // Stock
  "carat_weight_ct": parseFloat(row[6]), // Carat Weight
  "gold_purity": row[7], // Gold Purity
  "product_weight_g": parseFloat(row[8]), // Product Weight
  "shape": row[9], // Shape
  "dimensions": row[10], // Dimensions
  "stone_count": parseInt(row[11]), // Stone Count
  "center_stone_size_mm": parseFloat(row[12]), // Center Stone Size
  "ni_tay": parseFloat(row[13]), // Ring Size
  "inventory_value": parseFloat(row[14]), // Inventory Value
  "category_names": row[15], // Category Names (comma-separated)
  "long_description": row[16] // Notes
}

// After category resolution:
{
  ...productData,
  "category_ids": [1, 3, 5], // Resolved category IDs
  "primary_category_id": 1 // First category is primary
}
```

#### Hierarchical Format Processing
```javascript
// Group rows by Product Code
const grouped = rows.reduce((acc, row, index) => {
  const productCode = row[2]; // Column C
  if (!acc[productCode]) {
    acc[productCode] = {
      mainRow: row, // First row with product data
      components: [] // Subsequent rows with component data
    };
  } else {
    acc[productCode].components.push(row);
  }
  return acc;
}, {});

// Aggregate components
Object.values(grouped).forEach(group => {
  const stoneCount = group.components.reduce((sum, comp) => 
    sum + (parseInt(comp[8]) || 0), 0); // Sum quantities
  
  const shapes = [...new Set(group.components.map(c => c[6]))]; // Unique shapes
  const shape = shapes.join(', '); // Combine shapes
  
  // Create product with aggregated data
});
```

## Database Considerations

### Current Structure
- Products table supports all required fields
- No changes needed to database schema

### Future Enhancements (Optional)
- Create `product_components` table for detailed component tracking
- Add `import_batch_id` to track bulk imports
- Add `imported_at` timestamp

## Implementation Steps

### Phase 1: Basic Single-Row Upload
1. Install `xlsx` library
2. Create backend API endpoint
3. Implement single-row parsing
4. **Implement category resolution logic**
5. **Add category helper functions (findByName, create)**
6. Add frontend upload UI with category settings
7. Test with sample data

### Phase 2: Hierarchical Format Support
1. Implement row grouping logic
2. Add component aggregation
3. Handle size format variations
4. Update frontend to support format selection

### Phase 3: Enhanced Features
1. Template download functionality
2. Data validation preview
3. Batch processing with progress
4. Error reporting and retry mechanism

## File Structure

```
api/
  products/
    upload-excel.js          # Main upload endpoint
    _excelParser.js          # Excel parsing utilities
    _dataValidator.js        # Data validation logic
    _formatDetector.js       # Format detection logic
    _categoryResolver.js     # Category resolution and mapping logic

src/admin/
  pages/
    AdminProducts.tsx        # Add upload button/modal
  components/
    ExcelUploadModal.tsx     # Upload modal component
    UploadResultsModal.tsx   # Results display component

public/
  templates/
    product-upload-template.xlsx  # Downloadable template
```

## Testing Strategy

1. **Unit Tests**: Excel parsing, data validation, format detection
2. **Integration Tests**: API endpoint with sample files
3. **E2E Tests**: Full upload flow from UI to database
4. **Edge Cases**: Empty files, malformed data, large files, duplicates

## Performance Considerations

- **Batch Processing**: Process products in batches of 50-100
- **Transaction Management**: Use database transactions for atomicity
- **Memory Management**: Stream large files instead of loading entirely
- **Progress Updates**: Use WebSocket or polling for real-time progress

## Security Considerations

- **File Size Limit**: Max 10MB
- **File Type Validation**: Only .xlsx, .xls, .csv
- **Virus Scanning**: Consider server-side scanning
- **Input Sanitization**: Validate and sanitize all data
- **Rate Limiting**: Prevent abuse

## User Experience

1. **Template Download**: Provide downloadable Excel template
2. **Format Detection**: Auto-detect format when possible
3. **Preview Mode**: Show parsed data before import
4. **Error Messages**: Clear, actionable error messages with row numbers
5. **Success Feedback**: Show summary of imported products

