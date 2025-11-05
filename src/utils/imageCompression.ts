/**
 * Compress and resize image before upload
 * Returns a Promise that resolves to a compressed File
 */
export async function compressImage(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    maxSizeMB?: number;
  } = {}
): Promise<File> {
  const {
    maxWidth = 4000,  // Higher default for quality preservation
    maxHeight = 4000, // Higher default for quality preservation
    quality = 0.95,   // Higher quality default
    maxSizeMB = undefined // No size limit by default
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }

        // Create canvas and compress
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            // Only compress further if maxSizeMB is specified
            if (maxSizeMB !== undefined) {
              const sizeMB = blob.size / (1024 * 1024);
              if (sizeMB > maxSizeMB) {
                // Recursively compress with lower quality only if size limit specified
                canvas.toBlob(
                  (finalBlob) => {
                    if (!finalBlob) {
                      reject(new Error('Failed to compress image'));
                      return;
                    }
                    const compressedFile = new File(
                      [finalBlob],
                      file.name,
                      { type: file.type || 'image/jpeg' }
                    );
                    resolve(compressedFile);
                  },
                  file.type || 'image/jpeg',
                  Math.max(0.1, quality - 0.2)
                );
                return;
              }
            }
            // Return compressed file at requested quality (no size limit)
            const compressedFile = new File(
              [blob],
              file.name,
              { type: file.type || 'image/jpeg' }
            );
            resolve(compressedFile);
          },
          file.type || 'image/jpeg',
          quality
        );
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

/**
 * Get image dimensions
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height
        });
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

