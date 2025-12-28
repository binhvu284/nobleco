import { getSupabase } from '../_db.js';

/**
 * Normalize centerstone image data from database
 */
function normalize(img) {
  if (!img) return null;
  return {
    id: img.id,
    centerstone_id: img.centerstone_id,
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
 * Get all images for a centerstone, ordered by sort_order
 */
export async function getCenterstoneImages(centerstoneId) {
  const supabase = getSupabase();

  const { data: images, error } = await supabase
    .from('centerstone_images')
    .select('*')
    .eq('centerstone_id', centerstoneId)
    .order('sort_order', { ascending: true });

  if (error) {
    // If table doesn't exist, return empty array
    if (error.code === '42P01') {
      console.warn('Centerstone_images table does not exist. Please run create_centerstones_tables.sql');
      return [];
    }
    throw new Error(`Error fetching centerstone images: ${error.message}`);
  }

  return (images || []).map(normalize);
}

/**
 * Get a single centerstone image by ID
 */
export async function getCenterstoneImageById(imageId) {
  const supabase = getSupabase();

  const { data: image, error } = await supabase
    .from('centerstone_images')
    .select('*')
    .eq('id', imageId)
    .single();

  if (error) {
    throw new Error(`Error fetching centerstone image: ${error.message}`);
  }

  return normalize(image);
}

/**
 * Upload and create a centerstone image record
 * @param {number} centerstoneId - Centerstone ID
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
export async function createCenterstoneImage(centerstoneId, imageData) {
  const supabase = getSupabase();

  // Get current max sort_order for this centerstone
  const { data: existingImages } = await supabase
    .from('centerstone_images')
    .select('sort_order')
    .eq('centerstone_id', centerstoneId)
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
      .from('centerstone_images')
      .update({ is_featured: false })
      .eq('centerstone_id', centerstoneId)
      .eq('is_featured', true);
  }

  const insertData = {
    centerstone_id: centerstoneId,
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
    .from('centerstone_images')
    .insert([insertData])
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating centerstone image: ${error.message}`);
  }

  return normalize(image);
}

/**
 * Update a centerstone image
 * @param {number} imageId - Image ID
 * @param {Object} updates - Fields to update
 */
export async function updateCenterstoneImage(imageId, updates) {
  const supabase = getSupabase();

  // If setting as featured, unset other featured images for the same centerstone
  if (updates.is_featured === true) {
    const { data: currentImage } = await supabase
      .from('centerstone_images')
      .select('centerstone_id')
      .eq('id', imageId)
      .single();

    if (currentImage) {
      await supabase
        .from('centerstone_images')
        .update({ is_featured: false })
        .eq('centerstone_id', currentImage.centerstone_id)
        .eq('is_featured', true)
        .neq('id', imageId);
    }
  }

  const { data: image, error } = await supabase
    .from('centerstone_images')
    .update(updates)
    .eq('id', imageId)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating centerstone image: ${error.message}`);
  }

  return normalize(image);
}

/**
 * Delete a centerstone image
 * Note: This only deletes the database record. The actual file in Storage should be deleted separately.
 */
export async function deleteCenterstoneImage(imageId) {
  const supabase = getSupabase();

  // Get image data before deletion (for cleanup)
  const { data: image } = await supabase
    .from('centerstone_images')
    .select('storage_path, centerstone_id, is_featured')
    .eq('id', imageId)
    .single();

  const { error } = await supabase
    .from('centerstone_images')
    .delete()
    .eq('id', imageId);

  if (error) {
    throw new Error(`Error deleting centerstone image: ${error.message}`);
  }

  // If deleted image was featured, set the first remaining image as featured
  if (image && image.is_featured) {
    const { data: remainingImages } = await supabase
      .from('centerstone_images')
      .select('id')
      .eq('centerstone_id', image.centerstone_id)
      .order('sort_order', { ascending: true })
      .limit(1);

    if (remainingImages && remainingImages.length > 0) {
      await supabase
        .from('centerstone_images')
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
 * Reorder centerstone images
 * @param {number} centerstoneId - Centerstone ID
 * @param {number[]} imageIds - Array of image IDs in desired order
 */
export async function reorderCenterstoneImages(centerstoneId, imageIds) {
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
      .from('centerstone_images')
      .update({ sort_order: update.sort_order })
      .eq('id', update.id)
      .eq('centerstone_id', centerstoneId);

    if (error) {
      throw new Error(`Error reordering centerstone images: ${error.message}`);
    }
  }

  return { success: true };
}

/**
 * Delete all images for a centerstone
 * Useful when deleting a centerstone (cascade should handle this, but useful for cleanup)
 */
export async function deleteAllCenterstoneImages(centerstoneId) {
  const supabase = getSupabase();

  // Get all storage paths before deletion
  const { data: images } = await supabase
    .from('centerstone_images')
    .select('storage_path')
    .eq('centerstone_id', centerstoneId);

  const { error } = await supabase
    .from('centerstone_images')
    .delete()
    .eq('centerstone_id', centerstoneId);

  if (error) {
    throw new Error(`Error deleting centerstone images: ${error.message}`);
  }

  return {
    success: true,
    storage_paths: (images || []).map(img => img.storage_path)
  };
}

