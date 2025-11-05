import { getSupabaseClient } from './supabase';
import { compressImage, getImageDimensions } from './imageCompression';

export interface UploadedImage {
  id: number;
  url: string;
  storage_path: string;
  alt_text?: string;
  sort_order: number;
  is_featured: boolean;
  file_size?: number;
  width?: number;
  height?: number;
  mime_type?: string;
}

/**
 * Upload image to Supabase Storage and create database record
 */
export async function uploadProductImage(
  productId: number,
  file: File,
  options: {
    compress?: boolean;
    altText?: string;
    sortOrder?: number;
    isFeatured?: boolean;
  } = {}
): Promise<UploadedImage> {
  const {
    compress = true,
    altText,
    sortOrder,
    isFeatured = false
  } = options;

  const supabase = await getSupabaseClient();

  // Compress image if requested (optimized for quality preservation)
  let fileToUpload = file;
  if (compress) {
    try {
      fileToUpload = await compressImage(file, {
        maxWidth: 4000,  // Increased for higher quality
        maxHeight: 4000, // Increased for higher quality
        quality: 0.95,   // Higher quality (was 0.85)
        maxSizeMB: undefined // No size limit - upload original quality
      });
    } catch (error) {
      console.warn('Image compression failed, uploading original:', error);
      // Continue with original file if compression fails
    }
  }

  // Get image dimensions
  let width: number | undefined;
  let height: number | undefined;
  try {
    const dimensions = await getImageDimensions(fileToUpload);
    width = dimensions.width;
    height = dimensions.height;
  } catch (error) {
    console.warn('Failed to get image dimensions:', error);
  }

  // Generate unique filename
  const fileExt = fileToUpload.name.split('.').pop() || 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const storagePath = `${productId}/original/${fileName}`;

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(storagePath, fileToUpload, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    console.error('Supabase storage upload error:', uploadError);
    throw new Error(`Failed to upload image to storage: ${uploadError.message || uploadError}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(storagePath);

  if (!urlData?.publicUrl) {
    throw new Error('Failed to get image URL');
  }

  // Create database record
  const response = await fetch('/api/product-images', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      product_id: productId,
      storage_path: storagePath,
      url: urlData.publicUrl,
      alt_text: altText || null,
      sort_order: sortOrder !== undefined ? sortOrder : null,
      is_featured: isFeatured,
      file_size: fileToUpload.size,
      width: width || null,
      height: height || null,
      mime_type: fileToUpload.type || null
    })
  });

  if (!response.ok) {
    // Try to delete uploaded file if database record creation fails
    await supabase.storage
      .from('product-images')
      .remove([storagePath])
      .catch(() => {
        // Ignore cleanup errors
      });

    const errorData = await response.json().catch(() => ({ error: 'Failed to create image record' }));
    const errorMessage = errorData.error || 'Failed to create image record';
    const errorDetails = errorData.details ? `\nDetails: ${errorData.details}` : '';
    
    console.error('Image upload error:', {
      status: response.status,
      error: errorData,
      productId,
      storagePath,
      url: urlData.publicUrl
    });
    
    throw new Error(`${errorMessage}${errorDetails}`);
  }

  const imageData = await response.json();
  return imageData;
}

/**
 * Delete product image (both Storage file and database record)
 */
export async function deleteProductImage(imageId: number, storagePath: string): Promise<void> {
  const supabase = await getSupabaseClient();

  // Delete database record first
  const response = await fetch(`/api/product-images?imageId=${imageId}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to delete image record' }));
    throw new Error(error.error || 'Failed to delete image record');
  }

  // Delete file from Storage
  const { error: storageError } = await supabase.storage
    .from('product-images')
    .remove([storagePath]);

  if (storageError) {
    console.warn('Failed to delete image from storage:', storageError);
    // Don't throw - database record is already deleted
  }
}

/**
 * Reorder product images
 */
export async function reorderProductImages(productId: number, imageIds: number[]): Promise<void> {
  const response = await fetch(`/api/product-images?productId=${productId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      imageIds
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to reorder images' }));
    throw new Error(error.error || 'Failed to reorder images');
  }
}

/**
 * Update image metadata
 */
export async function updateProductImage(
  imageId: number,
  updates: {
    alt_text?: string;
    is_featured?: boolean;
  }
): Promise<UploadedImage> {
  const response = await fetch(`/api/product-images?imageId=${imageId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to update image' }));
    throw new Error(error.error || 'Failed to update image');
  }

  return await response.json();
}

