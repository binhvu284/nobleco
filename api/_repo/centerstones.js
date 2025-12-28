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
 * Generate a unique SKU for center stones
 * Format: CST-{sequential number padded to 8 digits}
 */
async function generateSKU() {
  const supabase = getSupabase();
  
  // Get the count of existing centerstones to generate a unique sequential number
  const { count } = await supabase
    .from('centerstones')
    .select('id', { count: 'exact', head: true });
  
  let centerstoneNumber = (count || 0) + 1;
  let sku = `CST-${centerstoneNumber.toString().padStart(8, '0')}`;
  
  // Check if SKU already exists and increment if needed
  let attempts = 0;
  while (attempts < 100) {
    const { data: existing } = await supabase
      .from('centerstones')
      .select('id')
      .eq('sku', sku)
      .maybeSingle();
    
    if (!existing) {
      return sku;
    }
    
    // If SKU exists, try next number
    centerstoneNumber++;
    sku = `CST-${centerstoneNumber.toString().padStart(8, '0')}`;
    attempts++;
  }
  
  // Fallback: add timestamp if we couldn't find a unique sequential number
  const timestamp = Date.now().toString().slice(-6);
  return `CST-${centerstoneNumber.toString().padStart(8, '0')}-${timestamp}`;
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
      .from('centerstones')
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
 * Normalize centerstone data from database
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
 * List all centerstones with their categories
 * @param {boolean} includeImages - Whether to include images (default: false for performance)
 */
export async function listCenterstones(includeImages = false) {
  const supabase = getSupabase();
  
  // Get all centerstones
  const { data: centerstones, error: centerstonesError } = await supabase
    .from('centerstones')
    .select('*')
    .order('created_at', { ascending: false });

  if (centerstonesError) {
    // If table doesn't exist, return empty array
    if (centerstonesError.code === '42P01') {
      console.warn('Centerstones table does not exist. Please run create_centerstones_tables.sql');
      return [];
    }
    throw new Error(`Error fetching centerstones: ${centerstonesError.message}`);
  }

  if (!centerstones) {
    return [];
  }

  // Get all centerstone-category relationships
  const { data: centerstoneCategories, error: ccError } = await supabase
    .from('centerstone_category_relations')
    .select(`
      centerstone_id,
      category_id,
      is_primary,
      centerstone_categories (
        id,
        name,
        slug,
        color
      )
    `)
    .order('is_primary', { ascending: false });

  if (ccError) {
    // If table doesn't exist, just return centerstones without categories
    if (ccError.code === '42P01') {
      console.warn('Centerstone_category_relations table does not exist. Returning centerstones without categories.');
      return centerstones.map(p => normalize({ ...p, categories: [], category_names: [], images: [] }));
    }
    throw new Error(`Error fetching centerstone categories: ${ccError.message}`);
  }

  // Get centerstone images if requested
  let centerstoneImagesMap = {};
  if (includeImages) {
    try {
      const { getCenterstoneImages } = await import('./centerstoneImages.js');
      const centerstoneIds = centerstones.map(p => p.id);
      const imagesPromises = centerstoneIds.map(async (id) => {
        try {
          const images = await getCenterstoneImages(id);
          return { centerstoneId: id, images };
        } catch (error) {
          return { centerstoneId: id, images: [] };
        }
      });
      const imagesResults = await Promise.all(imagesPromises);
      centerstoneImagesMap = imagesResults.reduce((acc, { centerstoneId, images }) => {
        acc[centerstoneId] = images;
        return acc;
      }, {});
    } catch (error) {
      console.warn('Could not fetch centerstone images:', error.message);
    }
  }

  // Map categories to centerstones
  const centerstonesWithCategories = centerstones.map(centerstone => {
    const centerstoneCats = centerstoneCategories
      .filter(cc => cc.centerstone_id === centerstone.id)
      .map(cc => ({
        id: cc.centerstone_categories.id,
        name: cc.centerstone_categories.name,
        slug: cc.centerstone_categories.slug,
        color: cc.centerstone_categories.color,
        is_primary: cc.is_primary
      }));

    return normalize({
      ...centerstone,
      categories: centerstoneCats,
      category_names: centerstoneCats.map(c => c.name),
      images: centerstoneImagesMap[centerstone.id] || []
    });
  });

  return centerstonesWithCategories;
}

/**
 * Get a single centerstone by ID with categories and images
 */
export async function getCenterstoneById(centerstoneId, includeImages = false) {
  const supabase = getSupabase();

  const { data: centerstone, error: centerstoneError } = await supabase
    .from('centerstones')
    .select('*')
    .eq('id', centerstoneId)
    .single();

  if (centerstoneError) {
    throw new Error(`Error fetching centerstone: ${centerstoneError.message}`);
  }

  // Get centerstone categories
  const { data: centerstoneCategories, error: ccError } = await supabase
    .from('centerstone_category_relations')
    .select(`
      category_id,
      is_primary,
      centerstone_categories (
        id,
        name,
        slug,
        color
      )
    `)
    .eq('centerstone_id', centerstoneId)
    .order('is_primary', { ascending: false });

  if (ccError) {
    throw new Error(`Error fetching centerstone categories: ${ccError.message}`);
  }

  const categories = centerstoneCategories.map(cc => ({
    id: cc.centerstone_categories.id,
    name: cc.centerstone_categories.name,
    slug: cc.centerstone_categories.slug,
    color: cc.centerstone_categories.color,
    is_primary: cc.is_primary
  }));

  // Get centerstone images if requested
  let images = [];
  if (includeImages) {
    try {
      const { getCenterstoneImages } = await import('./centerstoneImages.js');
      images = await getCenterstoneImages(centerstoneId);
    } catch (error) {
      // If images table doesn't exist or error, just continue without images
      console.warn('Could not fetch centerstone images:', error.message);
    }
  }

  return normalize({
    ...centerstone,
    categories,
    category_names: categories.map(c => c.name),
    images
  });
}

/**
 * Create a new centerstone
 */
export async function createCenterstone(centerstoneData, userId) {
  const supabase = getSupabase();

  // Generate slug if not provided
  const slug = centerstoneData.slug || await generateUniqueSlug(generateSlug(centerstoneData.name));
  
  // Generate SKU if not provided
  const sku = centerstoneData.sku || await generateSKU();
  
  // Ensure short_description is not empty (required field)
  const shortDescription = centerstoneData.short_description && centerstoneData.short_description.trim() 
    ? centerstoneData.short_description.trim() 
    : 'No description available';

  const { data: centerstone, error } = await supabase
    .from('centerstones')
    .insert([{
      name: centerstoneData.name.trim(),
      slug: slug,
      sku: centerstoneData.sku || sku,
      short_description: shortDescription,
      long_description: centerstoneData.long_description && centerstoneData.long_description.trim() 
        ? centerstoneData.long_description.trim() 
        : null,
      price: centerstoneData.price,
      stock: centerstoneData.stock || 0,
      status: centerstoneData.status || 'active',
      is_featured: centerstoneData.is_featured || false,
      // Specification fields
      serial_number: centerstoneData.serial_number || null,
      supplier_id: centerstoneData.supplier_id || null,
      jewelry_specifications: centerstoneData.jewelry_specifications && centerstoneData.jewelry_specifications.trim() 
        ? centerstoneData.jewelry_specifications.trim() 
        : null,
      inventory_value: centerstoneData.inventory_value || null,
      created_by: userId,
      updated_by: userId
    }])
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating centerstone: ${error.message}`);
  }

  return normalize(centerstone);
}

/**
 * Update an existing centerstone
 */
export async function updateCenterstone(centerstoneId, centerstoneData, userId) {
  const supabase = getSupabase();

  // Build update object with only provided fields
  const updateData = {
    name: centerstoneData.name.trim(),
    short_description: centerstoneData.short_description && centerstoneData.short_description.trim() 
      ? centerstoneData.short_description.trim() 
      : 'No description available',
    long_description: centerstoneData.long_description && centerstoneData.long_description.trim() 
      ? centerstoneData.long_description.trim() 
      : null,
    price: centerstoneData.price,
    stock: centerstoneData.stock !== undefined ? centerstoneData.stock : 0,
    updated_by: userId
  };

  // Only update slug if provided (usually we don't change slug on edit)
  if (centerstoneData.slug) {
    updateData.slug = centerstoneData.slug;
  } else if (centerstoneData.name) {
    // Generate new slug if name changed
    const baseSlug = generateSlug(centerstoneData.name);
    updateData.slug = await generateUniqueSlug(baseSlug);
  }

  // Only update SKU if provided
  if (centerstoneData.sku !== undefined) {
    updateData.sku = centerstoneData.sku || null;
  }

  // Only update status if provided
  if (centerstoneData.status !== undefined) {
    updateData.status = centerstoneData.status;
  }

  // Only update is_featured if provided
  if (centerstoneData.is_featured !== undefined) {
    updateData.is_featured = centerstoneData.is_featured;
  }

  // Specification fields
  if (centerstoneData.serial_number !== undefined) {
    updateData.serial_number = centerstoneData.serial_number || null;
  }
  if (centerstoneData.supplier_id !== undefined) {
    updateData.supplier_id = centerstoneData.supplier_id || null;
  }
  if (centerstoneData.jewelry_specifications !== undefined) {
    updateData.jewelry_specifications = centerstoneData.jewelry_specifications && centerstoneData.jewelry_specifications.trim() 
      ? centerstoneData.jewelry_specifications.trim() 
      : null;
  }
  if (centerstoneData.inventory_value !== undefined) {
    updateData.inventory_value = centerstoneData.inventory_value || null;
  }

  const { data: centerstone, error } = await supabase
    .from('centerstones')
    .update(updateData)
    .eq('id', centerstoneId)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating centerstone: ${error.message}`);
  }

  return normalize(centerstone);
}

/**
 * Delete a centerstone
 */
export async function deleteCenterstone(centerstoneId) {
  const supabase = getSupabase();

  // First, delete all centerstone images (database records and storage files)
  const { deleteAllCenterstoneImages } = await import('./centerstoneImages.js');
  
  try {
    const imageResult = await deleteAllCenterstoneImages(centerstoneId);
    
    // Delete image files from storage
    if (imageResult.storage_paths && imageResult.storage_paths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('centerstone-images')
        .remove(imageResult.storage_paths);
      
      if (storageError) {
        console.warn('Warning: Failed to delete some image files from storage:', storageError);
        // Continue with centerstone deletion even if storage deletion fails
      }
    }
  } catch (imageError) {
    console.warn('Warning: Failed to delete centerstone images:', imageError);
    // Continue with centerstone deletion even if image deletion fails
  }

  // Delete centerstone
  const { error } = await supabase
    .from('centerstones')
    .delete()
    .eq('id', centerstoneId);

  if (error) {
    throw new Error(`Error deleting centerstone: ${error.message}`);
  }

  return { success: true };
}

/**
 * Update centerstone categories
 */
export async function updateCenterstoneCategories(centerstoneId, categoryIds, primaryCategoryId = null) {
  const supabase = getSupabase();

  // First, delete existing categories
  await supabase
    .from('centerstone_category_relations')
    .delete()
    .eq('centerstone_id', centerstoneId);

  // Then insert new categories
  if (categoryIds && categoryIds.length > 0) {
    const insertData = categoryIds.map((categoryId, index) => ({
      centerstone_id: centerstoneId,
      category_id: categoryId,
      is_primary: categoryId === primaryCategoryId,
      sort_order: index
    }));

    const { error } = await supabase
      .from('centerstone_category_relations')
      .insert(insertData);

    if (error) {
      throw new Error(`Error updating centerstone categories: ${error.message}`);
    }
  }

  return { success: true };
}

/**
 * Update centerstone stock
 */
export async function updateCenterstoneStock(centerstoneId, stock) {
  const supabase = getSupabase();

  const { data: centerstone, error } = await supabase
    .from('centerstones')
    .update({ stock })
    .eq('id', centerstoneId)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating stock: ${error.message}`);
  }

  return normalize(centerstone);
}

/**
 * Update centerstone status
 */
export async function updateCenterstoneStatus(centerstoneId, status) {
  const supabase = getSupabase();

  const { data: centerstone, error } = await supabase
    .from('centerstones')
    .update({ status })
    .eq('id', centerstoneId)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating status: ${error.message}`);
  }

  return normalize(centerstone);
}

