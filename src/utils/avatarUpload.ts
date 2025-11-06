import { getSupabaseClient } from './supabase';
import { compressImage, getImageDimensions } from './imageCompression';

export interface UserAvatar {
  id: number;
  user_id: number;
  url: string;
  storage_path: string;
  file_size?: number;
  width?: number;
  height?: number;
  mime_type?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Upload user avatar to Supabase Storage and create/update database record
 * If user already has an avatar, it will be replaced
 */
export async function uploadUserAvatar(
  userId: number,
  file: File,
  options: {
    compress?: boolean;
    cropData?: {
      x: number;
      y: number;
      width: number;
      height: number;
      displaySize?: {
        width: number;
        height: number;
      };
    };
  } = {}
): Promise<UserAvatar> {
  const {
    compress = true,
    cropData
  } = options;

  const supabase = await getSupabaseClient();

  // Verify bucket exists and is accessible (for debugging)
  try {
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
      console.warn('Could not list buckets (this is okay, continuing):', bucketError);
    } else {
      const userAvatarsBucket = buckets?.find(b => b.name === 'user-avatars');
      if (!userAvatarsBucket) {
        console.warn('Bucket "user-avatars" not found in bucket list. Make sure it exists and is public.');
      } else {
        console.log('Bucket "user-avatars" found:', { 
          name: userAvatarsBucket.name, 
          public: userAvatarsBucket.public,
          id: userAvatarsBucket.id 
        });
      }
    }
  } catch (error) {
    console.warn('Bucket check failed (continuing anyway):', error);
  }

  // Process image: crop if needed, then compress
  let fileToUpload = file;
  
  // Apply cropping if provided
  // Note: cropData coordinates are relative to displayed image, we'll handle scaling in cropImage
  if (cropData) {
    try {
      // Use displaySize if provided, otherwise get actual dimensions
      const displaySize = cropData.displaySize || await getImageDimensions(file);
      fileToUpload = await cropImage(file, cropData, displaySize);
    } catch (error) {
      console.warn('Image cropping failed, using original:', error);
      // Continue with original file if cropping fails
    }
  }

  // Compress image if requested
  if (compress) {
    try {
      fileToUpload = await compressImage(fileToUpload, {
        maxWidth: 800,  // Avatar size - smaller than product images
        maxHeight: 800,
        quality: 0.9,
        maxSizeMB: 2 // Max 2MB for avatars
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

  // Get existing avatar to delete old file
  let oldStoragePath: string | null = null;
  try {
    const existingAvatarResponse = await fetch(`/api/user-avatars?userId=${userId}`);
    if (existingAvatarResponse.ok) {
      const existingAvatar = await existingAvatarResponse.json();
      if (existingAvatar?.storage_path) {
        oldStoragePath = existingAvatar.storage_path;
      }
    }
  } catch (error) {
    console.warn('Failed to fetch existing avatar:', error);
  }

  // Generate unique filename
  const fileExt = fileToUpload.name.split('.').pop() || 'jpg';
  const fileName = `avatar-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const storagePath = `${userId}/${fileName}`;

  // Upload to Supabase Storage
  // Note: Using upsert: true to handle duplicate files gracefully
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('user-avatars')
    .upload(storagePath, fileToUpload, {
      cacheControl: '3600',
      upsert: true  // Allow overwriting if file exists
    });

  if (uploadError) {
    console.error('Avatar upload error (full error object):', {
      error: uploadError,
      message: uploadError.message,
      statusCode: uploadError.statusCode,
      error_description: uploadError.error_description,
      name: uploadError.name,
      storagePath,
      bucket: 'user-avatars'
    });
    
    // Extract error message from various possible formats
    const errorMessage = uploadError.message || uploadError.error_description || uploadError.error || String(uploadError);
    const errorString = errorMessage.toLowerCase();
    
    // Provide more specific error messages based on error content
    if (errorString.includes('bucket not found') || errorString.includes('does not exist')) {
      throw new Error('Storage bucket "user-avatars" not found. Please create it in Supabase Storage.');
    } else if (
      errorString.includes('row-level security') || 
      errorString.includes('rls') ||
      errorString.includes('permission denied') ||
      errorString.includes('unauthorized') ||
      uploadError.statusCode === 403 ||
      uploadError.statusCode === 401
    ) {
      // Log the actual error for debugging
      console.error('Storage permissions error details:', {
        message: errorMessage,
        statusCode: uploadError.statusCode,
        error: uploadError
      });
      throw new Error(`Storage permissions error: ${errorMessage}\n\nPlease check:\n1. Bucket "user-avatars" exists and is public\n2. Storage policies allow INSERT operations\n3. Policies are correctly configured in Supabase Dashboard`);
    } else if (errorString.includes('duplicate') || errorString.includes('already exists')) {
      // If file exists, try with upsert
      const { error: upsertError } = await supabase.storage
        .from('user-avatars')
        .update(storagePath, fileToUpload, {
          cacheControl: '3600'
        });
      
      if (upsertError) {
        throw new Error(`Failed to upload avatar: ${upsertError.message || uploadError.message}`);
      }
    } else {
      // Show the actual error message for debugging
      throw new Error(`Failed to upload avatar to storage: ${errorMessage}\n\nError details: ${JSON.stringify(uploadError, null, 2)}`);
    }
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('user-avatars')
    .getPublicUrl(storagePath);

  if (!urlData?.publicUrl) {
    throw new Error('Failed to get avatar URL');
  }

  // Create/update database record
  const response = await fetch(`/api/user-avatars?userId=${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      storage_path: storagePath,
      url: urlData.publicUrl,
      file_size: fileToUpload.size,
      width: width || null,
      height: height || null,
      mime_type: fileToUpload.type || null
    })
  });

  if (!response.ok) {
    // Try to delete uploaded file if database record creation fails
    await supabase.storage
      .from('user-avatars')
      .remove([storagePath])
      .catch(() => {
        // Ignore cleanup errors
      });

    const errorData = await response.json().catch(() => ({ error: 'Failed to create avatar record' }));
    const errorMessage = errorData.error || 'Failed to create avatar record';
    const errorDetails = errorData.details ? `\nDetails: ${errorData.details}` : '';
    
    console.error('Avatar upload error:', {
      status: response.status,
      error: errorData,
      userId,
      storagePath,
      url: urlData.publicUrl
    });
    
    throw new Error(`${errorMessage}${errorDetails}`);
  }

  const result = await response.json();
  
  // Check if result has the expected structure
  if (!result || (!result.avatar && !result.url)) {
    // Try to delete uploaded file if database record creation failed
    await supabase.storage
      .from('user-avatars')
      .remove([storagePath])
      .catch(() => {
        // Ignore cleanup errors
      });
    
    throw new Error('Invalid response from server. Avatar may not have been saved.');
  }
  
  // Handle both response formats: { avatar, oldStoragePath } or direct avatar object
  const avatarData = result.avatar || result;
  
  if (!avatarData.url) {
    throw new Error('Avatar uploaded but URL is missing.');
  }
  
  // Delete old avatar file from storage if it exists
  const oldPath = result.oldStoragePath || oldStoragePath;
  if (oldPath) {
    await supabase.storage
      .from('user-avatars')
      .remove([oldPath])
      .catch((error) => {
        console.warn('Failed to delete old avatar file:', error);
        // Don't throw - old file cleanup is not critical
      });
  }

  return avatarData;
}

/**
 * Delete user avatar (both Storage file and database record)
 */
export async function deleteUserAvatar(userId: number): Promise<void> {
  const supabase = await getSupabaseClient();

  // Get avatar data before deletion
  const response = await fetch(`/api/user-avatars?userId=${userId}`);
  if (!response.ok) {
    // If avatar doesn't exist, that's fine
    return;
  }

  const avatar = await response.json();
  if (!avatar?.storage_path) {
    return;
  }

  // Delete from database
  const deleteResponse = await fetch(`/api/user-avatars?userId=${userId}`, {
    method: 'DELETE'
  });

  if (!deleteResponse.ok) {
    const errorData = await deleteResponse.json().catch(() => ({ error: 'Failed to delete avatar' }));
    throw new Error(errorData.error || 'Failed to delete avatar record');
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('user-avatars')
    .remove([avatar.storage_path]);

  if (storageError) {
    console.warn('Failed to delete avatar file from storage:', storageError);
    // Don't throw - file cleanup is not critical if DB record is deleted
  }
}

/**
 * Crop image using canvas
 * cropData coordinates are relative to the displayed image size, need to scale to actual image size
 */
function cropImage(file: File, cropData: { x: number; y: number; width: number; height: number }, displaySize?: { width: number; height: number }): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Calculate scale factor if display size is provided
        let scaleX = 1;
        let scaleY = 1;
        if (displaySize) {
          scaleX = img.width / displaySize.width;
          scaleY = img.height / displaySize.height;
        }

        // Scale crop coordinates to actual image size
        const actualX = cropData.x * scaleX;
        const actualY = cropData.y * scaleY;
        const actualWidth = cropData.width * scaleX;
        const actualHeight = cropData.height * scaleY;

        // Ensure crop is within image bounds
        const cropX = Math.max(0, Math.min(actualX, img.width - actualWidth));
        const cropY = Math.max(0, Math.min(actualY, img.height - actualHeight));
        const cropWidth = Math.min(actualWidth, img.width - cropX);
        const cropHeight = Math.min(actualHeight, img.height - cropY);

        // Set canvas size to crop dimensions
        canvas.width = cropWidth;
        canvas.height = cropHeight;

        // Draw cropped image
        ctx.drawImage(
          img,
          cropX,
          cropY,
          cropWidth,
          cropHeight,
          0,
          0,
          cropWidth,
          cropHeight
        );

        // Convert to blob
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob from canvas'));
            return;
          }

          // Create new File from blob
          const croppedFile = new File([blob], file.name, {
            type: file.type || 'image/jpeg',
            lastModified: Date.now()
          });

          resolve(croppedFile);
        }, file.type || 'image/jpeg', 0.95);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

