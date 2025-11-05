import { getSupabase } from '../_db.js';

/**
 * Sync products from KiotViet API
 * This endpoint updates existing products in the database with data from KiotViet
 */
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
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { integrationId } = req.body;
    
    if (!integrationId) {
      return res.status(400).json({ error: 'integrationId is required' });
    }

    const supabase = getSupabase();

    // Get integration configuration
    const { data: integration, error: integrationError } = await supabase
      .from('third_party_integrations')
      .select('*')
      .eq('id', integrationId)
      .single();

    if (integrationError || !integration) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    if (!integration.is_active) {
      return res.status(400).json({ error: 'Integration is not active' });
    }

    // Create sync log entry
    const { data: syncLog, error: logError } = await supabase
      .from('sync_logs')
      .insert({
        integration_id: integrationId,
        sync_type: 'manual',
        status: 'running',
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (logError) {
      console.error('Error creating sync log:', logError);
    }

    const syncLogId = syncLog?.id;

    try {
      // TODO: Replace with actual KiotViet API call
      // For now, simulate fetching and updating products
      
      // Step 1: Test connection and get access token
      const accessToken = await getKiotVietAccessToken(integration);
      
      // Step 2: Fetch products from KiotViet
      const kiotvietProducts = await fetchKiotVietProducts(accessToken, integration);
      
      // Step 3: Update products in database
      const syncResults = await updateProductsFromKiotViet(supabase, kiotvietProducts);
      
      // Step 4: Update sync log with results
      if (syncLogId) {
        await supabase
          .from('sync_logs')
          .update({
            status: 'completed',
            products_synced: syncResults.total,
            products_created: syncResults.created || 0,
            products_updated: syncResults.updated,
            products_deleted: syncResults.deleted || 0,
            products_failed: syncResults.failed,
            completed_at: new Date().toISOString()
          })
          .eq('id', syncLogId);
      }

      // Update integration last_sync_at
      await supabase
        .from('third_party_integrations')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', integrationId);

      return res.status(200).json({
        success: true,
        message: 'Sync completed successfully',
        results: {
          total: syncResults.total,
          created: syncResults.created || 0,
          updated: syncResults.updated,
          deleted: syncResults.deleted || 0,
          failed: syncResults.failed,
          skipped: syncResults.skipped || 0
        }
      });

    } catch (error) {
      // Update sync log with error
      if (syncLogId) {
        await supabase
          .from('sync_logs')
          .update({
            status: 'failed',
            error_message: error.message,
            completed_at: new Date().toISOString()
          })
          .eq('id', syncLogId);
      }

      console.error('Sync error:', error);
      return res.status(500).json({
        error: 'Sync failed',
        message: error.message
      });
    }

  } catch (error) {
    console.error('Error in sync handler:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

/**
 * Get access token from KiotViet
 */
async function getKiotVietAccessToken(integration) {
  // TODO: Implement actual OAuth2 token retrieval
  // For now, return existing token or get new one
  
  // Check if token is still valid
  if (integration.access_token && integration.token_expires_at) {
    const expiresAt = new Date(integration.token_expires_at);
    const now = new Date();
    if (expiresAt > now) {
      return integration.access_token;
    }
  }

  // Get new token
  try {
    const response = await fetch(integration.token_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: integration.client_id,
        client_secret: integration.client_secret,
        scopes: 'PublicApi.Access'
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to get access token: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Update token in database
    const supabase = getSupabase();
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + (data.expires_in || 3600));
    
    await supabase
      .from('third_party_integrations')
      .update({
        access_token: data.access_token,
        token_expires_at: expiresAt.toISOString()
      })
      .eq('id', integration.id);

    return data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw new Error('Failed to authenticate with KiotViet API');
  }
}

/**
 * Fetch products from KiotViet API
 */
async function fetchKiotVietProducts(accessToken, integration) {
  try {
    // KiotViet API endpoint for products
    const apiUrl = `${integration.api_url}/products`;
    
    console.log(`[KiotViet Sync] Fetching products from: ${apiUrl}`);
    console.log(`[KiotViet Sync] Using retailer: ${integration.retailer}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Retailer': integration.retailer,
        'Content-Type': 'application/json'
      }
    });

    console.log(`[KiotViet Sync] Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[KiotViet Sync] API error response:`, errorText);
      throw new Error(`KiotViet API error (${response.status}): ${errorText || response.statusText}`);
    }

    const data = await response.json();
    console.log(`[KiotViet Sync] Response structure:`, Object.keys(data));
    console.log(`[KiotViet Sync] Response sample:`, JSON.stringify(data).substring(0, 500));
    
    // KiotViet API typically returns: { data: [...], totalItems: number }
    // or sometimes: { items: [...], total: number }
    const products = data.data || data.items || data.products || (Array.isArray(data) ? data : []);
    
    console.log(`[KiotViet Sync] Found ${products.length} products from KiotViet`);
    
    if (products.length === 0) {
      console.warn(`[KiotViet Sync] No products returned. Full response:`, JSON.stringify(data));
    }
    
    return products;
    
  } catch (error) {
    console.error('[KiotViet Sync] Error fetching KiotViet products:', error);
    // Throw error instead of returning empty array so we know something went wrong
    throw new Error(`Failed to fetch products from KiotViet: ${error.message}`);
  }
}

/**
 * Generate a URL-friendly slug from a string
 */
function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate a unique slug, appending a number if the slug already exists
 */
async function generateUniqueSlug(supabase, baseSlug) {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    
    if (!existing) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

/**
 * Generate a unique SKU
 */
async function generateSKU(supabase) {
  // Get the count of existing products to generate a unique sequential number
  const { count } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true });
  
  let productNumber = (count || 0) + 1;
  let sku = `PRD-${productNumber.toString().padStart(8, '0')}`;
  
  // Check if SKU already exists and increment if needed
  let attempts = 0;
  while (attempts < 100) {
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('sku', sku)
      .maybeSingle();
    
    if (!existing) {
      return sku;
    }
    
    // If SKU exists, try next number
    productNumber++;
    sku = `PRD-${productNumber.toString().padStart(8, '0')}`;
    attempts++;
  }
  
  // Fallback: add timestamp if we couldn't find a unique sequential number
  const timestamp = Date.now().toString().slice(-6);
  return `PRD-${productNumber.toString().padStart(8, '0')}-${timestamp}`;
}

/**
 * Find or create category from KiotViet data
 */
async function findOrCreateCategory(supabase, kvCategoryId, kvCategoryName) {
  if (!kvCategoryId && !kvCategoryName) {
    return null;
  }

  // Try to find by kiotviet_id first
  if (kvCategoryId) {
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('kiotviet_id', kvCategoryId)
      .maybeSingle();
    
    if (existing) {
      return existing.id;
    }
  }

  // Try to find by name
  if (kvCategoryName) {
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('name', kvCategoryName.trim())
      .maybeSingle();
    
    if (existing) {
      // Update with kiotviet_id if we found it by name
      if (kvCategoryId) {
        await supabase
          .from('categories')
          .update({ kiotviet_id: kvCategoryId })
          .eq('id', existing.id);
      }
      return existing.id;
    }
  }

  // Create new category if not found
  if (kvCategoryName) {
    const categorySlug = generateSlug(kvCategoryName);
    let uniqueSlug = categorySlug;
    let counter = 1;
    
    // Ensure unique slug
    while (true) {
      const { data: existing } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', uniqueSlug)
        .maybeSingle();
      
      if (!existing) {
        break;
      }
      uniqueSlug = `${categorySlug}-${counter}`;
      counter++;
    }

    const { data: newCategory, error } = await supabase
      .from('categories')
      .insert({
        name: kvCategoryName.trim(),
        slug: uniqueSlug,
        kiotviet_id: kvCategoryId || null,
        status: 'active',
        sync_status: 'synced',
        last_synced_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      console.error(`[KiotViet Sync] Error creating category:`, error);
      return null;
    }

    return newCategory.id;
  }

  return null;
}

/**
 * Sync products from KiotViet data
 * Creates new products if they don't exist, updates existing ones while preserving status
 */
async function updateProductsFromKiotViet(supabase, kiotvietProducts) {
  let total = 0;
  let created = 0;
  let updated = 0;
  let failed = 0;
  let skipped = 0;
  let deleted = 0;

  console.log(`[KiotViet Sync] Processing ${kiotvietProducts.length} products from KiotViet`);

  // First, get all existing products to see which ones we can match
  const { data: existingProducts, error: fetchError } = await supabase
    .from('products')
    .select('id, kiotviet_id, name, sku, status');

  if (fetchError) {
    console.error('[KiotViet Sync] Error fetching existing products:', fetchError);
    throw new Error(`Failed to fetch existing products: ${fetchError.message}`);
  }

  console.log(`[KiotViet Sync] Found ${existingProducts?.length || 0} existing products in database`);
  console.log(`[KiotViet Sync] Products with kiotviet_id:`, existingProducts?.filter(p => p.kiotviet_id).length || 0);

  // Collect all KiotViet product IDs and SKUs from the sync data
  const kiotvietIds = new Set();
  const kiotvietSkus = new Set();
  const matchedProductIds = new Set(); // Track which products were matched/created
  
  // Pre-process KiotViet products to collect IDs and SKUs
  for (const kvProduct of kiotvietProducts) {
    const kvProductId = String(kvProduct.id || kvProduct.productId || kvProduct.ProductId || '');
    const kvProductSku = kvProduct.code || kvProduct.sku || kvProduct.Code || kvProduct.SKU || '';
    
    if (kvProductId) {
      kiotvietIds.add(kvProductId);
    }
    if (kvProductSku) {
      kiotvietSkus.add(kvProductSku.toLowerCase());
    }
  }

  for (const kvProduct of kiotvietProducts) {
    total++;
    
    try {
      // Get KiotViet product ID (try multiple possible field names)
      const kvProductId = String(kvProduct.id || kvProduct.productId || kvProduct.ProductId || '');
      
      if (!kvProductId) {
        console.warn(`[KiotViet Sync] Product ${total} has no ID, skipping:`, kvProduct);
        skipped++;
        continue;
      }

      // Get product data from KiotViet
      const kvProductName = kvProduct.name || kvProduct.productName || kvProduct.Name || kvProduct.ProductName || '';
      const kvProductSku = kvProduct.code || kvProduct.sku || kvProduct.Code || kvProduct.SKU || '';
      const kvCategoryId = kvProduct.categoryId || kvProduct.category_id || kvProduct.CategoryId || null;
      const kvCategoryName = kvProduct.categoryName || kvProduct.category_name || kvProduct.CategoryName || null;

      // Build product name: "first category name + product id" if category exists, otherwise use product name
      let productName = kvProductName;
      if (kvCategoryName && kvProductId) {
        productName = `${kvCategoryName} ${kvProductId}`;
      } else if (!productName) {
        console.warn(`[KiotViet Sync] Product ${kvProductId} has no name, skipping`);
        skipped++;
        continue;
      }

      // Find existing product by kiotviet_id first
      let existingProduct = existingProducts?.find(p => p.kiotviet_id === kvProductId);
      
      // If not found by kiotviet_id, try matching by SKU
      if (!existingProduct && kvProductSku) {
        existingProduct = existingProducts?.find(p => p.sku && p.sku.toLowerCase() === kvProductSku.toLowerCase());
        if (existingProduct) {
          console.log(`[KiotViet Sync] Matched product ${existingProduct.id} by SKU: ${kvProductSku}`);
        }
      }

      // Map KiotViet product fields to our database schema
      const productData = {
        kiotviet_id: kvProductId,
        name: productName.trim(),
        sku: kvProductSku || null,
        price: kvProduct.basePrice || kvProduct.retailPrice || kvProduct.BasePrice || kvProduct.RetailPrice || kvProduct.price || 0,
        stock: kvProduct.inventory ?? kvProduct.onHand ?? kvProduct.Inventory ?? kvProduct.OnHand ?? kvProduct.quantity ?? null,
        serial_number: kvProduct.serialNumber || kvProduct.serial_number || kvProduct.SerialNumber || null,
        supplier_id: kvProduct.supplierId || kvProduct.supplier_id || kvProduct.SupplierId || null,
        center_stone_size_mm: kvProduct.centerStoneSize || kvProduct.center_stone_size_mm || kvProduct.CenterStoneSize || null,
        shape: kvProduct.shape || kvProduct.Shape || null,
        dimensions: kvProduct.dimensions || kvProduct.Dimensions || null,
        stone_count: kvProduct.stoneCount || kvProduct.stone_count || kvProduct.StoneCount || null,
        carat_weight_ct: kvProduct.caratWeight || kvProduct.carat_weight_ct || kvProduct.CaratWeight || null,
        gold_purity: kvProduct.goldPurity || kvProduct.gold_purity || kvProduct.GoldPurity || null,
        product_weight_g: kvProduct.weight || kvProduct.product_weight_g || kvProduct.Weight || null,
        inventory_value: kvProduct.inventoryValue || kvProduct.inventory_value || kvProduct.InventoryValue || null,
        short_description: kvProduct.description || kvProduct.short_description || kvProduct.Description || 'No description available',
        long_description: kvProduct.fullDescription || kvProduct.long_description || kvProduct.FullDescription || null,
        last_synced_at: new Date().toISOString(),
        sync_status: 'synced',
        updated_at: new Date().toISOString()
      };

      if (existingProduct) {
        // Track that this product was matched
        matchedProductIds.add(existingProduct.id);
        
        // UPDATE existing product - preserve status
        const updateData = { ...productData };
        // Don't overwrite status - keep existing status
        delete updateData.status;
        
        // Remove null/undefined/empty values (except for fields that can be null)
        Object.keys(updateData).forEach(key => {
          if (updateData[key] === undefined || updateData[key] === '') {
            if (key !== 'sku' && key !== 'long_description' && key !== 'serial_number' && 
                key !== 'supplier_id' && key !== 'shape' && key !== 'dimensions' && 
                key !== 'gold_purity') {
              delete updateData[key];
            } else if (updateData[key] === '') {
              updateData[key] = null;
            }
          }
        });

        console.log(`[KiotViet Sync] Updating product ${existingProduct.id} (kiotviet_id: ${kvProductId})`);

        const { error: updateError } = await supabase
          .from('products')
          .update(updateData)
          .eq('id', existingProduct.id);

        if (updateError) {
          console.error(`[KiotViet Sync] Error updating product ${existingProduct.id}:`, updateError);
          failed++;
        } else {
          updated++;
          console.log(`[KiotViet Sync] Successfully updated product ${existingProduct.id}`);
          
          // Update category association
          if (kvCategoryId || kvCategoryName) {
            const categoryId = await findOrCreateCategory(supabase, kvCategoryId, kvCategoryName);
            if (categoryId) {
              // Remove existing category associations
              await supabase
                .from('product_categories')
                .delete()
                .eq('product_id', existingProduct.id);
              
              // Add new category association
              await supabase
                .from('product_categories')
                .insert({
                  product_id: existingProduct.id,
                  category_id: categoryId,
                  is_primary: true
                });
            }
          }
        }
      } else {
        // CREATE new product - set status to 'active' by default
        const createData = {
          ...productData,
          status: 'active', // New products are active by default
          slug: await generateUniqueSlug(supabase, generateSlug(productName)),
          sku: kvProductSku || await generateSKU(supabase)
        };

        // Ensure short_description is not empty
        if (!createData.short_description || createData.short_description.trim() === '') {
          createData.short_description = 'No description available';
        }

        // Remove null values for fields that can't be null
        Object.keys(createData).forEach(key => {
          if (createData[key] === null && key !== 'sku' && key !== 'long_description' && 
              key !== 'serial_number' && key !== 'supplier_id' && key !== 'shape' && 
              key !== 'dimensions' && key !== 'gold_purity') {
            delete createData[key];
          }
        });

        console.log(`[KiotViet Sync] Creating new product: ${productName} (kiotviet_id: ${kvProductId})`);

        const { data: newProduct, error: createError } = await supabase
          .from('products')
          .insert([createData])
          .select('id')
          .single();

        if (createError) {
          console.error(`[KiotViet Sync] Error creating product:`, createError);
          failed++;
        } else {
          created++;
          // Track that this product was created
          matchedProductIds.add(newProduct.id);
          console.log(`[KiotViet Sync] Successfully created product ${newProduct.id}`);

          // Add category association
          if (kvCategoryId || kvCategoryName) {
            const categoryId = await findOrCreateCategory(supabase, kvCategoryId, kvCategoryName);
            if (categoryId) {
              await supabase
                .from('product_categories')
                .insert({
                  product_id: newProduct.id,
                  category_id: categoryId,
                  is_primary: true
                });
            }
          }
        }
      }

    } catch (error) {
      console.error(`[KiotViet Sync] Error processing product:`, error);
      console.error(`[KiotViet Sync] Product data:`, JSON.stringify(kvProduct).substring(0, 200));
      failed++;
    }
  }

  // Delete products that are not in KiotViet anymore
  // Only delete products that have a kiotviet_id (were synced from KiotViet)
  console.log(`[KiotViet Sync] Checking for products to delete...`);
  
  const productsToDelete = existingProducts?.filter(product => {
    // Only delete products that:
    // 1. Have a kiotviet_id (were synced from KiotViet)
    // 2. Are not in the matched/created list
    // 3. Their kiotviet_id is not in the current KiotViet product list
    // 4. Their SKU is not in the current KiotViet product list (as fallback)
    
    if (!product.kiotviet_id) {
      // Don't delete products without kiotviet_id (manually created)
      return false;
    }
    
    // If product was matched/created, don't delete it
    if (matchedProductIds.has(product.id)) {
      return false;
    }
    
    // Check if kiotviet_id exists in current sync data
    if (kiotvietIds.has(product.kiotviet_id)) {
      return false;
    }
    
    // Check if SKU exists in current sync data (as fallback)
    if (product.sku && kiotvietSkus.has(product.sku.toLowerCase())) {
      return false;
    }
    
    // Product should be deleted
    return true;
  }) || [];

  console.log(`[KiotViet Sync] Found ${productsToDelete.length} products to delete`);

  // Delete products that are no longer in KiotViet
  for (const productToDelete of productsToDelete) {
    try {
      console.log(`[KiotViet Sync] Deleting product ${productToDelete.id} (kiotviet_id: ${productToDelete.kiotviet_id}, name: ${productToDelete.name})`);
      
      // Delete product (cascade will handle product_categories and product_images)
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', productToDelete.id);

      if (deleteError) {
        console.error(`[KiotViet Sync] Error deleting product ${productToDelete.id}:`, deleteError);
        failed++;
      } else {
        deleted++;
        console.log(`[KiotViet Sync] Successfully deleted product ${productToDelete.id}`);
      }
    } catch (error) {
      console.error(`[KiotViet Sync] Error deleting product ${productToDelete.id}:`, error);
      failed++;
    }
  }

  console.log(`[KiotViet Sync] Summary: Total=${total}, Created=${created}, Updated=${updated}, Deleted=${deleted}, Failed=${failed}, Skipped=${skipped}`);

  return { total, created, updated, deleted, failed, skipped };
}

