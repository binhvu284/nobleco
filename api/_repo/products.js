import { getSupabase } from '../_db.js';

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
    category_names: p.category_names ?? []
  };
}

/**
 * List all products with their categories
 */
export async function listProducts() {
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
      return products.map(p => normalize({ ...p, categories: [], category_names: [] }));
    }
    throw new Error(`Error fetching product categories: ${pcError.message}`);
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
      category_names: productCats.map(c => c.name)
    });
  });

  return productsWithCategories;
}

/**
 * Get a single product by ID with categories
 */
export async function getProductById(productId) {
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

  return normalize({
    ...product,
    categories,
    category_names: categories.map(c => c.name)
  });
}

/**
 * Create a new product
 */
export async function createProduct(productData, userId) {
  const supabase = getSupabase();

  const { data: product, error } = await supabase
    .from('products')
    .insert([{
      name: productData.name,
      slug: productData.slug,
      sku: productData.sku || null,
      short_description: productData.short_description,
      long_description: productData.long_description || null,
      price: productData.price,
      cost_price: productData.cost_price || null,
      stock: productData.stock || 0,
      status: productData.status || 'draft',
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

  const { data: product, error } = await supabase
    .from('products')
    .update({
      name: productData.name,
      slug: productData.slug,
      sku: productData.sku || null,
      short_description: productData.short_description,
      long_description: productData.long_description || null,
      price: productData.price,
      cost_price: productData.cost_price || null,
      stock: productData.stock,
      status: productData.status,
      is_featured: productData.is_featured,
      updated_by: userId
    })
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

