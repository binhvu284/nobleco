import XLSX from 'xlsx';
import formidable from 'formidable';
import { createProduct, updateProductCategories } from '../_repo/products.js';
import { listCategories } from '../_repo/categories.js';
import { getSupabase } from '../_db.js';

// Helper to parse multipart/form-data file upload (for Vercel/serverless)
async function parseFormData(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      keepExtensions: false,
      allowEmptyFiles: false,
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }

      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      if (!file) {
        reject(new Error('No file provided'));
        return;
      }

      try {
        // Read file buffer from filepath
        const fs = await import('fs/promises');
        const fileBuffer = await fs.readFile(file.filepath);
        resolve(fileBuffer);
      } catch (readError) {
        reject(new Error(`Failed to read file: ${readError.message}`));
      }
    });
  });
}

// Helper to get current user from request
async function getCurrentUser(req) {
  try {
    const authHeader = req.headers.authorization || req.headers['x-auth-token'];
    if (!authHeader) return null;
    
    // Token format: "ok.{userId}" or just the token
    const token = authHeader.replace('Bearer ', '').trim();
    if (token.startsWith('ok.')) {
      const userId = parseInt(token.split('.')[1], 10);
      
      // Fetch user details from database
      try {
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from('users')
          .select('id, email, name, role')
          .eq('id', userId)
          .single();
        
        if (error || !data) {
          return { id: userId, role: 'user' }; // Default fallback
        }
        
        return { id: data.id, email: data.email, name: data.name, role: data.role || 'user' };
      } catch (error) {
        console.error('Error fetching user:', error);
        return { id: userId, role: 'user' }; // Default fallback on error
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Helper to resolve category names to IDs
async function resolveCategories(categoryNames) {
  if (!categoryNames || !categoryNames.trim()) {
    return [];
  }

  const categories = await listCategories();
  const categoryIds = [];
  
  // Split by comma or semicolon
  const names = categoryNames.split(/[,;]/).map(n => n.trim()).filter(Boolean);
  
  for (const name of names) {
    // Find category by exact name match (case-sensitive as per requirements)
    const category = categories.find(c => c.name === name);
    if (category) {
      categoryIds.push(category.id);
    }
  }
  
  return categoryIds;
}

// Parse Excel file and extract products
function parseExcelFile(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Convert to JSON with headers
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
    header: 1, 
    defval: null,
    raw: false 
  });
  
  if (jsonData.length < 2) {
    throw new Error('Excel file must contain at least a header row and one data row');
  }
  
  // Get headers (first row)
  const headers = jsonData[0].map((h) => h ? String(h).trim() : '');
  
  // Map column indices
  const columnMap = {
    productCode: headers.findIndex(h => h && h.toLowerCase().includes('product code')),
    supplierCode: headers.findIndex(h => h && h.toLowerCase().includes('supplier code')),
    productName: headers.findIndex(h => h && h.toLowerCase().includes('product name')),
    description: headers.findIndex(h => h && h.toLowerCase().includes('description')),
    price: headers.findIndex(h => h && h.toLowerCase().includes('price')),
    stock: headers.findIndex(h => h && h.toLowerCase().includes('stock')),
    caratWeight: headers.findIndex(h => h && h.toLowerCase().includes('carat weight')),
    goldPurity: headers.findIndex(h => h && h.toLowerCase().includes('gold purity')),
    productWeight: headers.findIndex(h => h && h.toLowerCase().includes('product weight')),
    shape: headers.findIndex(h => h && h.toLowerCase().includes('shape')),
    dimensions: headers.findIndex(h => h && h.toLowerCase().includes('dimensions')),
    stoneCount: headers.findIndex(h => h && h.toLowerCase().includes('stone count')),
    centerStoneSize: headers.findIndex(h => h && h.toLowerCase().includes('center stone size')),
    ringSize: headers.findIndex(h => h && h.toLowerCase().includes('ring size') || h && h.toLowerCase().includes('ni tay')),
    inventoryValue: headers.findIndex(h => h && h.toLowerCase().includes('inventory value')),
    categoryNames: headers.findIndex(h => h && h.toLowerCase().includes('category')),
    notes: headers.findIndex(h => h && h.toLowerCase().includes('note'))
  };
  
  // Validate required columns
  if (columnMap.productCode === -1 || columnMap.productName === -1 || columnMap.price === -1) {
    throw new Error('Missing required columns: Product Code, Product Name, and Price are required');
  }
  
  // Parse data rows (skip header)
  const products = [];
  const errors = [];
  
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    
    // Skip completely empty rows
    if (!row || !row.some(cell => cell !== null && cell !== undefined && cell !== '')) {
      continue;
    }
    
    try {
      const productCode = row[columnMap.productCode] ? String(row[columnMap.productCode]).trim() : null;
      const productName = row[columnMap.productName] ? String(row[columnMap.productName]).trim() : null;
      const price = row[columnMap.price] ? parseFloat(String(row[columnMap.price]).replace(/[^\d.-]/g, '')) : null;
      
      // Validate required fields
      if (!productCode || !productName || price === null || isNaN(price) || price < 0) {
        errors.push({
          row: i + 1,
          productCode: productCode || 'N/A',
          error: 'Missing or invalid required fields (Product Code, Product Name, or Price)'
        });
        continue;
      }
      
      // Parse optional fields
      const product = {
        serial_number: productCode,
        supplier_id: row[columnMap.supplierCode] ? String(row[columnMap.supplierCode]).trim() : null,
        name: productName,
        short_description: row[columnMap.description] ? String(row[columnMap.description]).trim() : 'No description available',
        long_description: row[columnMap.notes] ? String(row[columnMap.notes]).trim() : null,
        price: price,
        stock: row[columnMap.stock] ? parseInt(String(row[columnMap.stock])) || 0 : 0,
        carat_weight_ct: row[columnMap.caratWeight] ? parseFloat(String(row[columnMap.caratWeight])) || null : null,
        gold_purity: row[columnMap.goldPurity] ? String(row[columnMap.goldPurity]).trim() : null,
        product_weight_g: row[columnMap.productWeight] ? parseFloat(String(row[columnMap.productWeight])) || null : null,
        shape: row[columnMap.shape] ? String(row[columnMap.shape]).trim() : null,
        dimensions: row[columnMap.dimensions] ? String(row[columnMap.dimensions]).trim() : null,
        stone_count: row[columnMap.stoneCount] ? parseInt(String(row[columnMap.stoneCount])) || null : null,
        center_stone_size_mm: row[columnMap.centerStoneSize] ? parseFloat(String(row[columnMap.centerStoneSize])) || null : null,
        ni_tay: row[columnMap.ringSize] ? parseFloat(String(row[columnMap.ringSize])) || null : null,
        inventory_value: row[columnMap.inventoryValue] ? parseFloat(String(row[columnMap.inventoryValue]).replace(/[^\d.-]/g, '')) || null : null,
        category_names: row[columnMap.categoryNames] ? String(row[columnMap.categoryNames]).trim() : null,
        status: 'active'
      };
      
      products.push(product);
    } catch (error) {
      errors.push({
        row: i + 1,
        productCode: row[columnMap.productCode] || 'N/A',
        error: error.message || 'Failed to parse row'
      });
    }
  }
  
  return { products, errors };
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Get current user
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Handle file upload (multipart/form-data)
    // In dev: file buffer is attached by multer middleware
    // In Vercel: parse multipart/form-data manually
    let fileBuffer = req.body?.fileBuffer;
    
    // If fileBuffer is not available (Vercel/serverless), parse FormData
    if (!fileBuffer || !Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
      // Check Content-Type
      const contentType = req.headers['content-type'] || '';
      if (!contentType.includes('multipart/form-data')) {
        return res.status(400).json({ 
          error: 'Invalid content type. Expected multipart/form-data.' 
        });
      }
      
      try {
        fileBuffer = await parseFormData(req);
      } catch (parseError) {
        console.error('Error parsing form data:', parseError);
        return res.status(400).json({ 
          error: parseError.message || 'Failed to parse uploaded file. Please ensure you are uploading a valid Excel file.' 
        });
      }
    }
    
    if (!fileBuffer || !Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
      return res.status(400).json({ error: 'No file provided. Please upload an Excel file.' });
    }

    // Parse Excel file
    const { products, errors: parseErrors } = parseExcelFile(fileBuffer);

    if (products.length === 0) {
      return res.status(400).json({ 
        error: 'No valid products found in the file',
        errors: parseErrors
      });
    }

    // Process products
    const created = [];
    const failed = [];
    const userId = typeof currentUser.id === 'string' ? parseInt(currentUser.id, 10) : currentUser.id;

    for (const productData of products) {
      try {
        // Resolve categories
        const categoryIds = productData.category_names 
          ? await resolveCategories(productData.category_names)
          : [];

        // Remove category_names from productData before creating
        const { category_names, ...productPayload } = productData;

        // Create product
        const product = await createProduct(productPayload, userId);

        // Assign categories if any
        if (categoryIds.length > 0) {
          await updateProductCategories(product.id, categoryIds, categoryIds[0]);
        }

        created.push({
          id: product.id,
          name: product.name,
          serial_number: product.serial_number
        });
      } catch (error) {
        console.error(`Error creating product ${productData.serial_number}:`, error);
        failed.push({
          productCode: productData.serial_number,
          error: error.message || 'Failed to create product'
        });
      }
    }

    return res.status(200).json({
      success: true,
      processed: products.length,
      created: created.length,
      failed: failed.length,
      errors: [...parseErrors, ...failed]
    });
  } catch (error) {
    console.error('Excel upload error:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to process Excel file' 
    });
  }
}

