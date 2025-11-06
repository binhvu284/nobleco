import { getSupabase } from '../_db.js';

/**
 * Normalize user avatar data from database
 */
function normalize(img) {
  if (!img) return null;
  return {
    id: img.id,
    user_id: img.user_id,
    storage_path: img.storage_path,
    url: img.url,
    file_size: img.file_size || null,
    width: img.width || null,
    height: img.height || null,
    mime_type: img.mime_type || null,
    created_at: img.created_at,
    updated_at: img.updated_at
  };
}

/**
 * Get avatar for a user
 */
export async function getUserAvatar(userId) {
  const supabase = getSupabase();

  const { data: avatar, error } = await supabase
    .from('user_avatars')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    // If no avatar exists, return null (not an error)
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Error fetching user avatar: ${error.message}`);
  }

  return normalize(avatar);
}

/**
 * Create or update user avatar
 * Since we have a unique constraint on user_id, we'll use upsert
 * @param {number} userId - User ID
 * @param {Object} avatarData - Avatar data object
 * @param {string} avatarData.storage_path - Path in Supabase Storage
 * @param {string} avatarData.url - Full CDN URL
 * @param {number} [avatarData.file_size] - File size in bytes
 * @param {number} [avatarData.width] - Image width in pixels
 * @param {number} [avatarData.height] - Image height in pixels
 * @param {string} [avatarData.mime_type] - MIME type
 */
export async function upsertUserAvatar(userId, avatarData) {
  const supabase = getSupabase();

  // First, get existing avatar to delete old file from storage
  const existingAvatar = await getUserAvatar(userId);

  const insertData = {
    user_id: userId,
    storage_path: avatarData.storage_path,
    url: avatarData.url,
    file_size: avatarData.file_size || null,
    width: avatarData.width || null,
    height: avatarData.height || null,
    mime_type: avatarData.mime_type || null
  };

  // Use upsert to insert or update
  const { data: avatar, error } = await supabase
    .from('user_avatars')
    .upsert(insertData, {
      onConflict: 'user_id',
      ignoreDuplicates: false
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Error upserting user avatar: ${error.message}`);
  }

  return {
    avatar: normalize(avatar),
    oldStoragePath: existingAvatar?.storage_path || null // Return old path for cleanup
  };
}

/**
 * Delete user avatar
 * Note: This only deletes the database record. The actual file in Storage should be deleted separately.
 */
export async function deleteUserAvatar(userId) {
  const supabase = getSupabase();

  // Get avatar data before deletion (for cleanup)
  const { data: avatar } = await supabase
    .from('user_avatars')
    .select('storage_path')
    .eq('user_id', userId)
    .single();

  const { error } = await supabase
    .from('user_avatars')
    .delete()
    .eq('user_id', userId);

  if (error) {
    // If avatar doesn't exist, that's fine
    if (error.code === 'PGRST116') {
      return {
        success: true,
        storage_path: null
      };
    }
    throw new Error(`Error deleting user avatar: ${error.message}`);
  }

  return {
    success: true,
    storage_path: avatar?.storage_path || null // Return for file cleanup
  };
}

