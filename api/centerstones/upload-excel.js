import XLSX from 'xlsx';
import formidable from 'formidable';
import { createCenterstone, updateCenterstoneCategories } from '../_repo/centerstones.js';
import { listCenterstoneCategories } from '../_repo/centerstoneCategories.js';
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

  const categories = await listCenterstoneCategories();
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

// Helper to check for duplicate SKUs within the Excel file
function checkDuplicateSKUsInFile(centerstones) {
  const skuCounts = {};
  const duplicates = [];
  
  centerstones.forEach((centerstone, index) => {
    const sku = centerstone.sku;
    if (sku) {
      if (!skuCounts[sku]) {
        skuCounts[sku] = [];
      }
      // Excel row number = index + 2 (index 0 = Excel row 2, since row 1 is header)
      skuCounts[sku].push(index + 2);
    }
  });
  
  // Find SKUs that appear more than once
  Object.keys(skuCounts).forEach(sku => {
    if (skuCounts[sku].length > 1) {
      duplicates.push({
        sku: sku,
        rows: skuCounts[sku]
      });
    }
  });
  
  return duplicates;
}

// Helper to check for duplicate SKUs against existing database centerstones
async function checkDuplicateSKUsInDatabase(skus) {
  if (!skus || skus.length === 0) {
    return [];
  }
  
  const supabase = getSupabase();
  const { data: existingCenterstones, error } = await supabase
    .from('centerstones')
    .select('sku')
    .in('sku', skus.filter(Boolean)); // Filter out null/empty SKUs
  
  if (error) {
    console.error('Error checking duplicate SKUs:', error);
    // Don't throw, just return empty array - we'll catch duplicates during insert
    return [];
  }
  
  const existingSKUs = existingCenterstones.map(c => c.sku).filter(Boolean);
  return skus.filter(sku => sku && existingSKUs.includes(sku));
}

// Parse Excel file and extract centerstones
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
  
  // Map column indices (in order: Product Code, Shape and Polished, Origin, Item Serial, Country of Origin, Certification Number, Size (mm), Color, Clarity, Weight (CT), PCS, Cut Grade, Treatment, Price, Stock, Product Name, Categories)
  const columnMap = {
    productCode: headers.findIndex(h => h && h.toLowerCase().includes('product code')),
    shapeAndPolished: headers.findIndex(h => h && h.toLowerCase().includes('shape and polished')),
    origin: headers.findIndex(h => h && h.toLowerCase().includes('origin') && !h.toLowerCase().includes('country')),
    itemSerial: headers.findIndex(h => h && h.toLowerCase().includes('item serial')),
    countryOfOrigin: headers.findIndex(h => h && h.toLowerCase().includes('country of origin')),
    certificationNumber: headers.findIndex(h => h && h.toLowerCase().includes('certification number')),
    sizeMm: headers.findIndex(h => h && h.toLowerCase().includes('size') && h.toLowerCase().includes('mm')),
    color: headers.findIndex(h => h && h.toLowerCase().includes('color')),
    clarity: headers.findIndex(h => h && h.toLowerCase().includes('clarity')),
    weightCt: headers.findIndex(h => h && h.toLowerCase().includes('weight') && h.toLowerCase().includes('ct')),
    pcs: headers.findIndex(h => h && h.toLowerCase().includes('pcs')),
    cutGrade: headers.findIndex(h => h && h.toLowerCase().includes('cut grade')),
    treatment: headers.findIndex(h => h && h.toLowerCase().includes('treatment')),
    price: headers.findIndex(h => h && h.toLowerCase().includes('price')),
    stock: headers.findIndex(h => h && h.toLowerCase().includes('stock')),
    productName: headers.findIndex(h => h && h.toLowerCase().includes('product name')),
    categoryNames: headers.findIndex(h => h && h.toLowerCase().includes('categor')),
    // Legacy fields for backward compatibility
    supplierCode: headers.findIndex(h => h && h.toLowerCase().includes('supplier code')),
    centerstoneSpecifications: headers.findIndex(h => h && h.toLowerCase().includes('centerstone specification')),
    jewelrySpecifications: headers.findIndex(h => h && h.toLowerCase().includes('jewelry specification')),
    description: headers.findIndex(h => h && h.toLowerCase().includes('description'))
  };
  
  // Validate required columns - Product Code is required, Product Name is optional (will use Product Code if empty)
  if (columnMap.productCode === -1) {
    throw new Error('Missing required column: Product Code is required');
  }
  
  // Parse data rows (skip header)
  const centerstones = [];
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
      
      // Validate required fields - Product Code is required
      if (!productCode) {
        errors.push({
          row: i + 1,
          productCode: 'N/A',
          error: 'Missing required field: Product Code is required'
        });
        continue;
      }
      
      // Parse new centerstone fields
      const shapeAndPolished = columnMap.shapeAndPolished !== -1 && row[columnMap.shapeAndPolished] 
        ? String(row[columnMap.shapeAndPolished]).trim() 
        : null;
      const origin = columnMap.origin !== -1 && row[columnMap.origin] 
        ? String(row[columnMap.origin]).trim() 
        : null;
      const itemSerial = columnMap.itemSerial !== -1 && row[columnMap.itemSerial] 
        ? String(row[columnMap.itemSerial]).trim() 
        : null;
      const countryOfOrigin = columnMap.countryOfOrigin !== -1 && row[columnMap.countryOfOrigin] 
        ? String(row[columnMap.countryOfOrigin]).trim() 
        : null;
      const certificationNumber = columnMap.certificationNumber !== -1 && row[columnMap.certificationNumber] 
        ? String(row[columnMap.certificationNumber]).trim() 
        : null;
      const sizeMm = columnMap.sizeMm !== -1 && row[columnMap.sizeMm] 
        ? parseFloat(String(row[columnMap.sizeMm]).replace(/[^\d.-]/g, '')) 
        : null;
      const color = columnMap.color !== -1 && row[columnMap.color] 
        ? String(row[columnMap.color]).trim() 
        : null;
      const clarity = columnMap.clarity !== -1 && row[columnMap.clarity] 
        ? String(row[columnMap.clarity]).trim() 
        : null;
      const weightCt = columnMap.weightCt !== -1 && row[columnMap.weightCt] 
        ? parseFloat(String(row[columnMap.weightCt]).replace(/[^\d.-]/g, '')) 
        : null;
      const pcs = columnMap.pcs !== -1 && row[columnMap.pcs] 
        ? parseInt(String(row[columnMap.pcs])) 
        : null;
      const cutGrade = columnMap.cutGrade !== -1 && row[columnMap.cutGrade] 
        ? String(row[columnMap.cutGrade]).trim() 
        : null;
      const treatment = columnMap.treatment !== -1 && row[columnMap.treatment] 
        ? String(row[columnMap.treatment]).trim() 
        : null;
      
      // Parse Description (for backward compatibility)
      const description = columnMap.description !== -1 && row[columnMap.description] 
        ? String(row[columnMap.description]).trim() 
        : 'No description available';
      
      // Parse Price (required)
      const price = columnMap.price !== -1 && row[columnMap.price] 
        ? parseFloat(String(row[columnMap.price]).replace(/[^\d.-]/g, '')) 
        : null;
      
      // Parse Stock (defaults to 0 if null)
      const stock = columnMap.stock !== -1 && row[columnMap.stock] !== null && row[columnMap.stock] !== undefined && row[columnMap.stock] !== '' 
        ? parseInt(String(row[columnMap.stock])) || 0 
        : 0;
      
      // Validate price (required)
      if (price === null || isNaN(price) || price < 0) {
        errors.push({
          row: i + 1,
          productCode: productCode || 'N/A',
          error: 'Price is required and must be a valid positive number'
        });
        continue;
      }
      
      const centerstone = {
        sku: productCode,
        name: productName || null, // Will be set to productCode in createCenterstone if null
        short_description: description,
        long_description: null,
        price: price,
        stock: stock,
        category_names: columnMap.categoryNames !== -1 && row[columnMap.categoryNames] 
          ? String(row[columnMap.categoryNames]).trim() 
          : null,
        status: 'active',
        // New centerstone fields
        shape_and_polished: shapeAndPolished,
        origin: origin,
        item_serial: itemSerial,
        country_of_origin: countryOfOrigin,
        certification_number: certificationNumber,
        size_mm: sizeMm,
        color: color,
        clarity: clarity,
        weight_ct: weightCt,
        pcs: pcs,
        cut_grade: cutGrade,
        treatment: treatment,
        // Legacy fields for backward compatibility
        supplier_id: columnMap.supplierCode !== -1 && row[columnMap.supplierCode] 
          ? String(row[columnMap.supplierCode]).trim() 
          : null,
        jewelry_specifications: columnMap.centerstoneSpecifications !== -1 && row[columnMap.centerstoneSpecifications] 
          ? String(row[columnMap.centerstoneSpecifications]).trim() 
          : (columnMap.jewelrySpecifications !== -1 && row[columnMap.jewelrySpecifications] 
            ? String(row[columnMap.jewelrySpecifications]).trim() 
            : null)
      };
      
      centerstones.push(centerstone);
    } catch (error) {
      errors.push({
        row: i + 1,
        productCode: row[columnMap.productCode] || 'N/A',
        error: error.message || 'Failed to parse row'
      });
    }
  }
  
  return { centerstones, errors };
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
    const { centerstones, errors: parseErrors } = parseExcelFile(fileBuffer);

    if (centerstones.length === 0) {
      return res.status(400).json({ 
        error: 'No valid centerstones found in the file',
        errors: parseErrors
      });
    }

    // Check for duplicate SKUs within the Excel file
    const duplicateSKUsInFile = checkDuplicateSKUsInFile(centerstones);
    if (duplicateSKUsInFile.length > 0) {
      const duplicateCount = duplicateSKUsInFile.length;
      const duplicateDetails = duplicateSKUsInFile.map(dup => 
        `SKU "${dup.sku}" appears in rows: ${dup.rows.join(', ')}`
      ).join('; ');
      
      return res.status(400).json({
        error: `Found ${duplicateCount} duplicate SKU${duplicateCount > 1 ? 's' : ''} within the Excel file. SKU must be unique.`,
        duplicateCount: duplicateCount,
        duplicateDetails: duplicateDetails,
        duplicates: duplicateSKUsInFile,
        errors: parseErrors
      });
    }

    // Check for duplicate SKUs against existing database centerstones
    const skus = centerstones.map(c => c.sku).filter(Boolean);
    const duplicateSKUsInDB = await checkDuplicateSKUsInDatabase(skus);
    
    if (duplicateSKUsInDB.length > 0) {
      const duplicateCount = duplicateSKUsInDB.length;
      const duplicateSKUList = duplicateSKUsInDB.join(', ');
      
      return res.status(400).json({
        error: `Found ${duplicateCount} duplicate SKU${duplicateCount > 1 ? 's' : ''} that already exist${duplicateCount > 1 ? '' : 's'} in the database. SKU must be unique.`,
        duplicateCount: duplicateCount,
        duplicateSKUs: duplicateSKUsInDB,
        duplicateSKUList: duplicateSKUList,
        errors: parseErrors
      });
    }

    // Process centerstones
    const created = [];
    const failed = [];
    const userId = typeof currentUser.id === 'string' ? parseInt(currentUser.id, 10) : currentUser.id;

    for (const centerstoneData of centerstones) {
      try {
        // Resolve categories
        const categoryIds = centerstoneData.category_names 
          ? await resolveCategories(centerstoneData.category_names)
          : [];

        // Remove category_names from centerstoneData before creating
        const { category_names, ...centerstonePayload } = centerstoneData;

        // Create centerstone
        const centerstone = await createCenterstone(centerstonePayload, userId);

        // Assign categories if any
        if (categoryIds.length > 0) {
          await updateCenterstoneCategories(centerstone.id, categoryIds, categoryIds[0]);
        }

        created.push({
          id: centerstone.id,
          name: centerstone.name,
          sku: centerstone.sku
        });
      } catch (error) {
        console.error(`Error creating centerstone ${centerstoneData.sku}:`, error);
        failed.push({
          productCode: centerstoneData.sku,
          error: error.message || 'Failed to create centerstone'
        });
      }
    }

    return res.status(200).json({
      success: true,
      processed: centerstones.length,
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

