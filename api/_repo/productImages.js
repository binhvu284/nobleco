import { getSupabase } from '../_db.js';

/**
 * Normalize product image data from database
 */
function normalize(img) {
  if (!img) return null;
  return {
    id: img.id,
    product_id: img.product_id,
    storage_path: img.storage_path,
    url: img.url,
    alt_text: img.alt_text || null,
    sort_order: img.sort_order ?? 0,
    is_featured: img.is_featured ?? false,
    file_size: img.file_size || null,
    width: img.width || null,
    height: img.height || null,
    mime_type: img.mime_type || null,
    created_at: img.created_at,
    updated_at: img.updated_at
  };
}

/**
 * Get all images for a product, ordered by sort_order
 */
export async function getProductImages(productId) {
  const supabase = getSupabase();

  const { data: images, error } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true });

  if (error) {
    // If table doesn't exist, return empty array
    if (error.code === '42P01') {
      console.warn('Product_images table does not exist. Please run add_product_images_table.sql');
      return [];
    }
    throw new Error(`Error fetching product images: ${error.message}`);
  }

  return (images || []).map(normalize);
}

/**
 * Get a single product image by ID
 */
export async function getProductImageById(imageId) {
  const supabase = getSupabase();

  const { data: image, error } = await supabase
    .from('product_images')
    .select('*')
    .eq('id', imageId)
    .single();

  if (error) {
    throw new Error(`Error fetching product image: ${error.message}`);
  }

  return normalize(image);
}

/**
 * Upload and create a product image record
 * @param {number} productId - Product ID
 * @param {Object} imageData - Image data object
 * @param {string} imageData.storage_path - Path in Supabase Storage
 * @param {string} imageData.url - Full CDN URL
 * @param {string} [imageData.alt_text] - Alt text for accessibility
 * @param {number} [imageData.sort_order] - Sort order (default: last)
 * @param {boolean} [imageData.is_featured] - Is featured image (default: false)
 * @param {number} [imageData.file_size] - File size in bytes
 * @param {number} [imageData.width] - Image width in pixels
 * @param {number} [imageData.height] - Image height in pixels
 * @param {string} [imageData.mime_type] - MIME type
 */
export async function createProductImage(productId, imageData) {
  const supabase = getSupabase();

  // Get current max sort_order for this product
  const { data: existingImages } = await supabase
    .from('product_images')
    .select('sort_order')
    .eq('product_id', productId)
    .order('sort_order', { ascending: false })
    .limit(1);

  const maxSortOrder = existingImages && existingImages.length > 0 
    ? existingImages[0].sort_order 
    : -1;

  // If this is the first image or is_featured is true, set it as featured
  const isFeatured = imageData.is_featured !== undefined 
    ? imageData.is_featured 
    : (maxSortOrder === -1); // First image is featured by default

  // If setting as featured, unset other featured images
  if (isFeatured) {
    await supabase
      .from('product_images')
      .update({ is_featured: false })
      .eq('product_id', productId)
      .eq('is_featured', true);
  }

  const insertData = {
    product_id: productId,
    storage_path: imageData.storage_path,
    url: imageData.url,
    alt_text: imageData.alt_text || null,
    sort_order: imageData.sort_order !== undefined 
      ? imageData.sort_order 
      : maxSortOrder + 1,
    is_featured: isFeatured,
    file_size: imageData.file_size || null,
    width: imageData.width || null,
    height: imageData.height || null,
    mime_type: imageData.mime_type || null
  };

  const { data: image, error } = await supabase
    .from('product_images')
    .insert([insertData])
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating product image: ${error.message}`);
  }

  return normalize(image);
}

/**
 * Update a product image
 * @param {number} imageId - Image ID
 * @param {Object} updates - Fields to update
 */
export async function updateProductImage(imageId, updates) {
  const supabase = getSupabase();

  // If setting as featured, unset other featured images for the same product
  if (updates.is_featured === true) {
    const { data: currentImage } = await supabase
      .from('product_images')
      .select('product_id')
      .eq('id', imageId)
      .single();

    if (currentImage) {
      await supabase
        .from('product_images')
        .update({ is_featured: false })
        .eq('product_id', currentImage.product_id)
        .eq('is_featured', true)
        .neq('id', imageId);
    }
  }

  const { data: image, error } = await supabase
    .from('product_images')
    .update(updates)
    .eq('id', imageId)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating product image: ${error.message}`);
  }

  return normalize(image);
}

/**
 * Delete a product image
 * Note: This only deletes the database record. The actual file in Storage should be deleted separately.
 */
export async function deleteProductImage(imageId) {
  const supabase = getSupabase();

  // Get image data before deletion (for cleanup)
  const { data: image } = await supabase
    .from('product_images')
    .select('storage_path, product_id, is_featured')
    .eq('id', imageId)
    .single();

  const { error } = await supabase
    .from('product_images')
    .delete()
    .eq('id', imageId);

  if (error) {
    throw new Error(`Error deleting product image: ${error.message}`);
  }

  // If deleted image was featured, set the first remaining image as featured
  if (image && image.is_featured) {
    const { data: remainingImages } = await supabase
      .from('product_images')
      .select('id')
      .eq('product_id', image.product_id)
      .order('sort_order', { ascending: true })
      .limit(1);

    if (remainingImages && remainingImages.length > 0) {
      await supabase
        .from('product_images')
        .update({ is_featured: true })
        .eq('id', remainingImages[0].id);
    }
  }

  return {
    success: true,
    storage_path: image?.storage_path || null // Return for file cleanup
  };
}

/**
 * Reorder product images
 * @param {number} productId - Product ID
 * @param {number[]} imageIds - Array of image IDs in desired order
 */
export async function reorderProductImages(productId, imageIds) {
  const supabase = getSupabase();

  // Update sort_order for each image
  const updates = imageIds.map((imageId, index) => ({
    id: imageId,
    sort_order: index
  }));

  // Use a transaction-like approach (Supabase doesn't support transactions in JS client)
  // Update each image sequentially
  for (const update of updates) {
    const { error } = await supabase
      .from('product_images')
      .update({ sort_order: update.sort_order })
      .eq('id', update.id)
      .eq('product_id', productId);

    if (error) {
      throw new Error(`Error reordering product images: ${error.message}`);
    }
  }

  return { success: true };
}

/**
 * Delete all images for a product
 * Useful when deleting a product (cascade should handle this, but useful for cleanup)
 */
export async function deleteAllProductImages(productId) {
  const supabase = getSupabase();

  // Get all storage paths before deletion
  const { data: images } = await supabase
    .from('product_images')
    .select('storage_path')
    .eq('product_id', productId);

  const { error } = await supabase
    .from('product_images')
    .delete()
    .eq('product_id', productId);

  if (error) {
    throw new Error(`Error deleting product images: ${error.message}`);
  }

  return {
    success: true,
    storage_paths: (images || []).map(img => img.storage_path)
  };
}

