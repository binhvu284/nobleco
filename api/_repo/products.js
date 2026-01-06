import { getSupabase } from '../_db.js';

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
 * Generate a unique SKU
 * Format: PRD-{sequential number padded to 8 digits}
 */
async function generateSKU() {
  const supabase = getSupabase();
  
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
 * Generate a unique slug, appending a number if the slug already exists
 */
async function generateUniqueSlug(baseSlug) {
  const supabase = getSupabase();
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
 * Normalize product data from database
 */
function normalize(p) {
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku ?? null,
    short_description: p.short_description,
    long_description: p.long_description ?? null,
    price: parseFloat(p.price),
    cost_price: p.cost_price ? parseFloat(p.cost_price) : null,
    stock: p.stock,
    status: p.status,
    is_featured: p.is_featured ?? false,
    created_by: p.created_by ?? null,
    updated_by: p.updated_by ?? null,
    created_at: p.created_at,
    updated_at: p.updated_at,
    // Categories will be included when joined
    categories: p.categories ?? [],
    category_names: p.category_names ?? [],
    // Images will be included when joined
    images: p.images ?? [],
    // KiotViet integration fields
    kiotviet_id: p.kiotviet_id ?? null,
    serial_number: p.serial_number ?? null,
    supplier_id: p.supplier_id ?? null,
    jewelry_specifications: p.jewelry_specifications ?? null,
    // New jewelry specification fields
    material_purity: p.material_purity ?? null,
    material_weight_g: p.material_weight_g ? parseFloat(p.material_weight_g) : null,
    total_weight_g: p.total_weight_g ? parseFloat(p.total_weight_g) : null,
    size_text: p.size_text ?? null,
    jewelry_size: p.jewelry_size ?? null,
    style_bst: p.style_bst ?? null,
    sub_style: p.sub_style ?? null,
    main_stone_type: p.main_stone_type ?? null,
    stone_quantity: p.stone_quantity ?? null,
    shape_and_polished: p.shape_and_polished ?? null,
    origin: p.origin ?? null,
    item_serial: p.item_serial ?? null,
    country_of_origin: p.country_of_origin ?? null,
    certification_number: p.certification_number ?? null,
    size_mm: p.size_mm ? parseFloat(p.size_mm) : null,
    color: p.color ?? null,
    clarity: p.clarity ?? null,
    weight_ct: p.weight_ct ? parseFloat(p.weight_ct) : null,
    pcs: p.pcs ?? null,
    cut_grade: p.cut_grade ?? null,
    treatment: p.treatment ?? null,
    sub_stone_type_1: p.sub_stone_type_1 ?? null,
    sub_stone_type_2: p.sub_stone_type_2 ?? null,
    sub_stone_type_3: p.sub_stone_type_3 ?? null,
    // Legacy fields (kept for backward compatibility, but deprecated)
    center_stone_size_mm: p.center_stone_size_mm ? parseFloat(p.center_stone_size_mm) : null,
    ni_tay: p.ni_tay ? parseFloat(p.ni_tay) : null,
    shape: p.shape ?? null,
    dimensions: p.dimensions ?? null,
    stone_count: p.stone_count ?? null,
    carat_weight_ct: p.carat_weight_ct ? parseFloat(p.carat_weight_ct) : null,
    gold_purity: p.gold_purity ?? null,
    product_weight_g: p.product_weight_g ? parseFloat(p.product_weight_g) : null,
    type: p.type ?? null,
    inventory_value: p.inventory_value ? parseFloat(p.inventory_value) : null,
    last_synced_at: p.last_synced_at ?? null,
    sync_status: p.sync_status ?? null
  };
}

/**
 * List all products with their categories
 * @param {boolean} includeImages - Whether to include images (default: false for performance)
 */
export async function listProducts(includeImages = false) {
  const supabase = getSupabase();
  
  // Get all products
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (productsError) {
    // If table doesn't exist, return empty array
    if (productsError.code === '42P01') {
      console.warn('Products table does not exist. Please run update_database.sql');
      return [];
    }
    throw new Error(`Error fetching products: ${productsError.message}`);
  }

  if (!products) {
    return [];
  }

  // Get all product-category relationships
  const { data: productCategories, error: pcError } = await supabase
    .from('product_categories')
    .select(`
      product_id,
      category_id,
      is_primary,
      categories (
        id,
        name,
        slug,
        color
      )
    `)
    .order('is_primary', { ascending: false });

  if (pcError) {
    // If table doesn't exist, just return products without categories
    if (pcError.code === '42P01') {
      console.warn('Product_categories table does not exist. Returning products without categories.');
      return products.map(p => normalize({ ...p, categories: [], category_names: [], images: [] }));
    }
    throw new Error(`Error fetching product categories: ${pcError.message}`);
  }

  // Get product images if requested
  let productImagesMap = {};
  if (includeImages) {
    try {
      const { getProductImages } = await import('./productImages.js');
      const productIds = products.map(p => p.id);
      const imagesPromises = productIds.map(async (id) => {
        try {
          const images = await getProductImages(id);
          return { productId: id, images };
        } catch (error) {
          return { productId: id, images: [] };
        }
      });
      const imagesResults = await Promise.all(imagesPromises);
      productImagesMap = imagesResults.reduce((acc, { productId, images }) => {
        acc[productId] = images;
        return acc;
      }, {});
    } catch (error) {
      console.warn('Could not fetch product images:', error.message);
    }
  }

  // Map categories to products
  const productsWithCategories = products.map(product => {
    const productCats = productCategories
      .filter(pc => pc.product_id === product.id)
      .map(pc => ({
        id: pc.categories.id,
        name: pc.categories.name,
        slug: pc.categories.slug,
        color: pc.categories.color,
        is_primary: pc.is_primary
      }));

    return normalize({
      ...product,
      categories: productCats,
      category_names: productCats.map(c => c.name),
      images: productImagesMap[product.id] || []
    });
  });

  return productsWithCategories;
}

/**
 * Get a single product by ID with categories and images
 */
export async function getProductById(productId, includeImages = false) {
  const supabase = getSupabase();

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (productError) {
    throw new Error(`Error fetching product: ${productError.message}`);
  }

  // Get product categories
  const { data: productCategories, error: pcError } = await supabase
    .from('product_categories')
    .select(`
      category_id,
      is_primary,
      categories (
        id,
        name,
        slug,
        color
      )
    `)
    .eq('product_id', productId)
    .order('is_primary', { ascending: false });

  if (pcError) {
    throw new Error(`Error fetching product categories: ${pcError.message}`);
  }

  const categories = productCategories.map(pc => ({
    id: pc.categories.id,
    name: pc.categories.name,
    slug: pc.categories.slug,
    color: pc.categories.color,
    is_primary: pc.is_primary
  }));

  // Get product images if requested
  let images = [];
  if (includeImages) {
    try {
      const { getProductImages } = await import('./productImages.js');
      images = await getProductImages(productId);
    } catch (error) {
      // If images table doesn't exist or error, just continue without images
      console.warn('Could not fetch product images:', error.message);
    }
  }

  return normalize({
    ...product,
    categories,
    category_names: categories.map(c => c.name),
    images
  });
}

/**
 * Create a new product
 */
export async function createProduct(productData, userId) {
  const supabase = getSupabase();

  // Generate SKU if not provided
  const sku = productData.sku && productData.sku.trim() ? productData.sku.trim() : await generateSKU();
  
  // Name defaults to SKU if not provided
  const name = productData.name && productData.name.trim() ? productData.name.trim() : sku;

  // Generate slug
  const slug = productData.slug || await generateUniqueSlug(generateSlug(name));
  
  // Ensure short_description is not empty (required field)
  const shortDescription = productData.short_description && productData.short_description.trim() 
    ? productData.short_description.trim() 
    : 'No description available';
  
  // Stock defaults to 0 if not provided
  const stock = productData.stock !== null && productData.stock !== undefined ? productData.stock : 0;

  const { data: product, error } = await supabase
    .from('products')
    .insert([{
      name: name,
      slug: slug,
      sku: sku,
      short_description: shortDescription,
      long_description: productData.long_description && productData.long_description.trim() 
        ? productData.long_description.trim() 
        : null,
      price: productData.price,
      stock: stock,
      status: productData.status || 'active',
      is_featured: productData.is_featured || false,
      // Legacy jewelry specification fields
      serial_number: productData.serial_number || null,
      supplier_id: productData.supplier_id || null,
      jewelry_specifications: productData.jewelry_specifications && productData.jewelry_specifications.trim() 
        ? productData.jewelry_specifications.trim() 
        : null,
      inventory_value: productData.inventory_value || null,
      // New jewelry specification fields
      material_purity: productData.material_purity || null,
      material_weight_g: productData.material_weight_g || null,
      total_weight_g: productData.total_weight_g || null,
      size_text: productData.size_text || null,
      jewelry_size: productData.jewelry_size || null,
      style_bst: productData.style_bst || null,
      sub_style: productData.sub_style || null,
      main_stone_type: productData.main_stone_type || null,
      stone_quantity: productData.stone_quantity || null,
      shape_and_polished: productData.shape_and_polished || null,
      origin: productData.origin || null,
      item_serial: productData.item_serial || null,
      country_of_origin: productData.country_of_origin || null,
      certification_number: productData.certification_number || null,
      size_mm: productData.size_mm || null,
      color: productData.color || null,
      clarity: productData.clarity || null,
      weight_ct: productData.weight_ct || null,
      pcs: productData.pcs || null,
      cut_grade: productData.cut_grade || null,
      treatment: productData.treatment || null,
      sub_stone_type_1: productData.sub_stone_type_1 || null,
      sub_stone_type_2: productData.sub_stone_type_2 || null,
      sub_stone_type_3: productData.sub_stone_type_3 || null,
      created_by: userId,
      updated_by: userId
    }])
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating product: ${error.message}`);
  }

  return normalize(product);
}

/**
 * Update an existing product
 */
export async function updateProduct(productId, productData, userId) {
  const supabase = getSupabase();

  // Name defaults to SKU if empty
  const name = productData.name && productData.name.trim() ? productData.name.trim() : null;

  // Build update object with only provided fields
  const updateData = {
    name: name,
    short_description: productData.short_description && productData.short_description.trim() 
      ? productData.short_description.trim() 
      : 'No description available',
    long_description: productData.long_description && productData.long_description.trim() 
      ? productData.long_description.trim() 
      : null,
    price: productData.price,
    stock: productData.stock !== undefined ? productData.stock : 0,
    updated_by: userId
  };

  // Only update slug if provided (usually we don't change slug on edit)
  if (productData.slug) {
    updateData.slug = productData.slug;
  } else if (name) {
    // Generate new slug if name changed
    const baseSlug = generateSlug(name);
    updateData.slug = await generateUniqueSlug(baseSlug);
  }

  // Only update SKU if provided
  if (productData.sku !== undefined) {
    updateData.sku = productData.sku || null;
  }

  // Only update status if provided
  if (productData.status !== undefined) {
    updateData.status = productData.status;
  }

  // Only update is_featured if provided
  if (productData.is_featured !== undefined) {
    updateData.is_featured = productData.is_featured;
  }

  // Legacy jewelry specification fields
  if (productData.serial_number !== undefined) {
    updateData.serial_number = productData.serial_number || null;
  }
  if (productData.supplier_id !== undefined) {
    updateData.supplier_id = productData.supplier_id || null;
  }
  if (productData.jewelry_specifications !== undefined) {
    updateData.jewelry_specifications = productData.jewelry_specifications && productData.jewelry_specifications.trim() 
      ? productData.jewelry_specifications.trim() 
      : null;
  }
  if (productData.inventory_value !== undefined) {
    updateData.inventory_value = productData.inventory_value || null;
  }

  // New jewelry specification fields
  if (productData.material_purity !== undefined) {
    updateData.material_purity = productData.material_purity || null;
  }
  if (productData.material_weight_g !== undefined) {
    updateData.material_weight_g = productData.material_weight_g || null;
  }
  if (productData.total_weight_g !== undefined) {
    updateData.total_weight_g = productData.total_weight_g || null;
  }
  if (productData.size_text !== undefined) {
    updateData.size_text = productData.size_text || null;
  }
  if (productData.jewelry_size !== undefined) {
    updateData.jewelry_size = productData.jewelry_size || null;
  }
  if (productData.style_bst !== undefined) {
    updateData.style_bst = productData.style_bst || null;
  }
  if (productData.sub_style !== undefined) {
    updateData.sub_style = productData.sub_style || null;
  }
  if (productData.main_stone_type !== undefined) {
    updateData.main_stone_type = productData.main_stone_type || null;
  }
  if (productData.stone_quantity !== undefined) {
    updateData.stone_quantity = productData.stone_quantity || null;
  }
  if (productData.shape_and_polished !== undefined) {
    updateData.shape_and_polished = productData.shape_and_polished || null;
  }
  if (productData.origin !== undefined) {
    updateData.origin = productData.origin || null;
  }
  if (productData.item_serial !== undefined) {
    updateData.item_serial = productData.item_serial || null;
  }
  if (productData.country_of_origin !== undefined) {
    updateData.country_of_origin = productData.country_of_origin || null;
  }
  if (productData.certification_number !== undefined) {
    updateData.certification_number = productData.certification_number || null;
  }
  if (productData.size_mm !== undefined) {
    updateData.size_mm = productData.size_mm || null;
  }
  if (productData.color !== undefined) {
    updateData.color = productData.color || null;
  }
  if (productData.clarity !== undefined) {
    updateData.clarity = productData.clarity || null;
  }
  if (productData.weight_ct !== undefined) {
    updateData.weight_ct = productData.weight_ct || null;
  }
  if (productData.pcs !== undefined) {
    updateData.pcs = productData.pcs || null;
  }
  if (productData.cut_grade !== undefined) {
    updateData.cut_grade = productData.cut_grade || null;
  }
  if (productData.treatment !== undefined) {
    updateData.treatment = productData.treatment || null;
  }
  if (productData.sub_stone_type_1 !== undefined) {
    updateData.sub_stone_type_1 = productData.sub_stone_type_1 || null;
  }
  if (productData.sub_stone_type_2 !== undefined) {
    updateData.sub_stone_type_2 = productData.sub_stone_type_2 || null;
  }
  if (productData.sub_stone_type_3 !== undefined) {
    updateData.sub_stone_type_3 = productData.sub_stone_type_3 || null;
  }

  const { data: product, error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', productId)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating product: ${error.message}`);
  }

  return normalize(product);
}

/**
 * Delete a product
 */
export async function deleteProduct(productId) {
  const supabase = getSupabase();

  // Note: We no longer check for order_items references because the foreign key constraint
  // is set to ON DELETE SET NULL, which automatically handles product deletion gracefully.
  // Order items will have their product_id set to NULL, but all order data (name, SKU, price)
  // is preserved in the order_items table, so order history remains intact.

  // First, delete all product images (database records and storage files)
  const { deleteAllProductImages } = await import('./productImages.js');
  
  try {
    const imageResult = await deleteAllProductImages(productId);
    
    // Delete image files from storage
    if (imageResult.storage_paths && imageResult.storage_paths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('product-images')
        .remove(imageResult.storage_paths);
      
      if (storageError) {
        console.warn('Warning: Failed to delete some image files from storage:', storageError);
        // Continue with product deletion even if storage deletion fails
      }
    }
  } catch (imageError) {
    console.warn('Warning: Failed to delete product images:', imageError);
    // Continue with product deletion even if image deletion fails
  }

  // Delete product
  // The foreign key constraint on order_items.product_id is set to ON DELETE SET NULL,
  // so order items referencing this product will have their product_id set to NULL automatically.
  // This preserves order history while allowing product deletion.
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId);

  if (error) {
    throw new Error(`Error deleting product: ${error.message}`);
  }

  return { success: true };
}

/**
 * Update product categories
 */
export async function updateProductCategories(productId, categoryIds, primaryCategoryId = null) {
  const supabase = getSupabase();

  // First, delete existing categories
  await supabase
    .from('product_categories')
    .delete()
    .eq('product_id', productId);

  // Then insert new categories
  if (categoryIds && categoryIds.length > 0) {
    const insertData = categoryIds.map((categoryId, index) => ({
      product_id: productId,
      category_id: categoryId,
      is_primary: categoryId === primaryCategoryId,
      sort_order: index
    }));

    const { error } = await supabase
      .from('product_categories')
      .insert(insertData);

    if (error) {
      throw new Error(`Error updating product categories: ${error.message}`);
    }
  }

  return { success: true };
}

/**
 * Update product stock
 */
export async function updateProductStock(productId, stock) {
  const supabase = getSupabase();

  const { data: product, error } = await supabase
    .from('products')
    .update({ stock })
    .eq('id', productId)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating stock: ${error.message}`);
  }

  return normalize(product);
}

/**
 * Update product status
 */
export async function updateProductStatus(productId, status) {
  const supabase = getSupabase();

  const { data: product, error } = await supabase
    .from('products')
    .update({ status })
    .eq('id', productId)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating status: ${error.message}`);
  }

  return normalize(product);
}

