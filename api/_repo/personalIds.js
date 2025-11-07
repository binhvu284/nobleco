import { getSupabase } from '../_db.js';

/**
 * Repository functions for user personal ID operations
 */

/**
 * Get personal ID for a user
 * Regenerates fresh signed URLs for images to prevent expiry issues
 */
export async function getPersonalID(userId) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('user_personal_ids')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    throw error;
  }

  if (!data) return null;

  // Regenerate fresh signed URLs for images (they expire after 1 hour)
  const bucket = 'user-personal-ids';
  const result = { ...data };

  // Regenerate front image URL if path exists
  if (data.front_image_path) {
    try {
      const { data: urlData } = await supabase.storage
        .from(bucket)
        .createSignedUrl(data.front_image_path, 3600); // 1 hour expiry
      
      if (urlData?.signedUrl) {
        result.front_image_url = urlData.signedUrl;
      }
    } catch (err) {
      console.error('Error generating front image signed URL:', err);
      // Keep existing URL if regeneration fails
    }
  }

  // Regenerate back image URL if path exists
  if (data.back_image_path) {
    try {
      const { data: urlData } = await supabase.storage
        .from(bucket)
        .createSignedUrl(data.back_image_path, 3600); // 1 hour expiry
      
      if (urlData?.signedUrl) {
        result.back_image_url = urlData.signedUrl;
      }
    } catch (err) {
      console.error('Error generating back image signed URL:', err);
      // Keep existing URL if regeneration fails
    }
  }

  return result;
}

/**
 * Create or update personal ID for a user
 */
export async function upsertPersonalID({ userId, frontImagePath, frontImageUrl, backImagePath, backImageUrl, fileSize, mimeType }) {
  const supabase = getSupabase();
  
  const payload = {
    user_id: userId,
    front_image_path: frontImagePath,
    front_image_url: frontImageUrl,
    back_image_path: backImagePath || null,
    back_image_url: backImageUrl || null,
    file_size: fileSize || null,
    mime_type: mimeType || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('user_personal_ids')
    .upsert(payload, {
      onConflict: 'user_id',
      ignoreDuplicates: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete personal ID for a user
 */
export async function deletePersonalID(userId) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('user_personal_ids')
    .delete()
    .eq('user_id', userId);

  if (error) throw error;
  return true;
}

/**
 * Update verification status (admin only)
 */
export async function updatePersonalIDVerification(userId, verified, verifiedBy) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('user_personal_ids')
    .update({
      verified: verified,
      verified_at: verified ? new Date().toISOString() : null,
      verified_by: verified ? verifiedBy : null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete files from storage
 */
export async function deleteStorageFiles(filePaths) {
  const supabase = getSupabase();
  const bucket = 'user-personal-ids';
  
  const filesToDelete = filePaths.filter(Boolean); // Remove null/undefined
  
  if (filesToDelete.length === 0) return;

  const { error } = await supabase.storage
    .from(bucket)
    .remove(filesToDelete);

  if (error) throw error;
  return true;
}

/**
 * Upload file to storage
 */
export async function uploadToStorage(filePath, fileBuffer, options = {}) {
  const supabase = getSupabase();
  const bucket = 'user-personal-ids';
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, fileBuffer, {
      contentType: options.contentType || 'image/jpeg',
      upsert: options.upsert || false,
      ...options,
    });

  if (error) throw error;

  // Get public URL (signed URL for private bucket)
  const { data: urlData } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, 3600); // 1 hour expiry

  return {
    path: data.path,
    url: urlData?.signedUrl || null,
  };
}

