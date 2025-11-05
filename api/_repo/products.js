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
    center_stone_size_mm: p.center_stone_size_mm ? parseFloat(p.center_stone_size_mm) : null,
    shape: p.shape ?? null,
    dimensions: p.dimensions ?? null,
    stone_count: p.stone_count ?? null,
    carat_weight_ct: p.carat_weight_ct ? parseFloat(p.carat_weight_ct) : null,
    gold_purity: p.gold_purity ?? null,
    product_weight_g: p.product_weight_g ? parseFloat(p.product_weight_g) : null,
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

  // Generate slug if not provided
  const slug = productData.slug || await generateUniqueSlug(generateSlug(productData.name));
  
  // Generate SKU if not provided
  const sku = productData.sku || await generateSKU();
  
  // Ensure short_description is not empty (required field)
  const shortDescription = productData.short_description && productData.short_description.trim() 
    ? productData.short_description.trim() 
    : 'No description available';

  const { data: product, error } = await supabase
    .from('products')
    .insert([{
      name: productData.name.trim(),
      slug: slug,
      sku: sku,
      short_description: shortDescription,
      long_description: productData.long_description && productData.long_description.trim() 
        ? productData.long_description.trim() 
        : null,
      price: productData.price,
      cost_price: productData.cost_price || null,
      stock: productData.stock || 0,
      status: productData.status || 'active',
      is_featured: productData.is_featured || false,
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

  // Build update object with only provided fields
  const updateData = {
    name: productData.name.trim(),
    short_description: productData.short_description && productData.short_description.trim() 
      ? productData.short_description.trim() 
      : 'No description available',
    long_description: productData.long_description && productData.long_description.trim() 
      ? productData.long_description.trim() 
      : null,
    price: productData.price,
    cost_price: productData.cost_price || null,
    stock: productData.stock || 0,
    status: productData.status || 'active',
    updated_by: userId
  };

  // Only update slug if provided (usually we don't change slug on edit)
  if (productData.slug) {
    updateData.slug = productData.slug;
  } else if (productData.name) {
    // Generate new slug if name changed
    const baseSlug = generateSlug(productData.name);
    updateData.slug = await generateUniqueSlug(baseSlug);
  }

  // Only update SKU if provided (usually we don't change SKU on edit)
  if (productData.sku !== undefined) {
    updateData.sku = productData.sku || null;
  }

  // Only update is_featured if provided
  if (productData.is_featured !== undefined) {
    updateData.is_featured = productData.is_featured;
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

