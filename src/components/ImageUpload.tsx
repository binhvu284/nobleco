import { useState, useRef } from 'react';
import { uploadProductImage, UploadedImage, reorderProductImages, updateProductImage, deleteProductImage } from '../utils/imageUpload';

interface ImageUploadProps {
  productId: number;
  maxImages?: number;
  existingImages?: UploadedImage[];
  onUploadSuccess?: (image: UploadedImage) => void;
  onUploadError?: (error: Error) => void;
  onRemove?: (imageId: number) => void;
  onImagesChange?: (images: UploadedImage[]) => void;
  disabled?: boolean;
}

export default function ImageUpload({
  productId,
  maxImages = 4,
  existingImages = [],
  onUploadSuccess,
  onUploadError,
  onRemove,
  onImagesChange,
  disabled = false
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [editingImage, setEditingImage] = useState<UploadedImage | null>(null);
  const [editAltText, setEditAltText] = useState('');
  const [savingFeatured, setSavingFeatured] = useState<number | null>(null);
  const [reordering, setReordering] = useState(false);
  const [isDragOverUpload, setIsDragOverUpload] = useState(false);
  const [replaceDragOver, setReplaceDragOver] = useState(false);
  const [deleteConfirmImage, setDeleteConfirmImage] = useState<UploadedImage | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  const currentImageCount = existingImages.length;
  // With pro plan storage, no practical limit on image count
  const canUploadMore = maxImages === undefined || currentImageCount < maxImages;

  // Sort images by sort_order
  const sortedImages = [...existingImages].sort((a, b) => a.sort_order - b.sort_order);

  const processFiles = async (files: File[]) => {
    if (files.length === 0) return;

    // Filter only image files
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      onUploadError?.(new Error('Please select image files only'));
      return;
    }

    // If maxImages is set, limit uploads; otherwise allow unlimited
    let filesToUpload = imageFiles;
    if (maxImages !== undefined) {
      const remainingSlots = maxImages - currentImageCount;
      filesToUpload = imageFiles.slice(0, remainingSlots);

      if (imageFiles.length > remainingSlots) {
        onUploadError?.(new Error(`Maximum ${maxImages} images allowed. You can add ${remainingSlots} more.`));
        return;
      }
    }

    // Upload each file
    for (const file of filesToUpload) {
      const fileId = `${Date.now()}-${Math.random()}`;
      setUploading(true);
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

      try {
        setUploadError(null);
        const isFirstImage = currentImageCount === 0;
        const image = await uploadProductImage(productId, file, {
          compress: true,
          isFeatured: isFirstImage,
          sortOrder: currentImageCount + filesToUpload.indexOf(file)
        });

        setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
        onUploadSuccess?.(image);
        if (onImagesChange) {
          const updatedImages = [...existingImages, image];
          onImagesChange(updatedImages);
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to upload image');
        const errorMessage = err.message;
        setUploadError(errorMessage);
        onUploadError?.(err);
        
        console.error('Image upload failed:', {
          error: errorMessage,
          productId,
          fileName: file.name
        });
      } finally {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });
        setUploading(false);
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverUpload(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverUpload(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverUpload(false);

    const files = Array.from(e.dataTransfer.files || []);
    await processFiles(files);
  };

  const handleRemoveClick = (imageId: number) => {
    const image = existingImages.find(img => img.id === imageId);
    if (image) {
      setDeleteConfirmImage(image);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmImage) return;

    setDeleting(true);
    try {
      await deleteProductImage(deleteConfirmImage.id, deleteConfirmImage.storage_path);
      if (onRemove) {
        onRemove(deleteConfirmImage.id);
      }
      if (onImagesChange) {
        const updatedImages = existingImages.filter(img => img.id !== deleteConfirmImage.id);
        onImagesChange(updatedImages);
      }
      setDeleteConfirmImage(null);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to remove image');
      onUploadError?.(err);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmImage(null);
  };

  const handleSetFeatured = async (imageId: number) => {
    setSavingFeatured(imageId);
    try {
      const updatedImage = await updateProductImage(imageId, { is_featured: true });
      if (onImagesChange) {
        const updatedImages = existingImages.map(img => 
          img.id === imageId 
            ? updatedImage 
            : { ...img, is_featured: false }
        );
        onImagesChange(updatedImages);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to set featured image');
      onUploadError?.(err);
    } finally {
      setSavingFeatured(null);
    }
  };

  const handleImageDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleImageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleImageDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleImageDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    setReordering(true);
    try {
      const newImages = [...sortedImages];
      const [draggedImage] = newImages.splice(draggedIndex, 1);
      newImages.splice(dropIndex, 0, draggedImage);

      const imageIds = newImages.map(img => img.id);
      await reorderProductImages(productId, imageIds);

      if (onImagesChange) {
        const reorderedImages = newImages.map((img, idx) => ({
          ...img,
          sort_order: idx
        }));
        onImagesChange(reorderedImages);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to reorder images');
      onUploadError?.(err);
    } finally {
      setDraggedIndex(null);
      setReordering(false);
    }
  };

  const handleEditClick = (image: UploadedImage) => {
    setEditingImage(image);
    setEditAltText(image.alt_text || '');
  };

  const handleSaveEdit = async () => {
    if (!editingImage) return;

    try {
      const updatedImage = await updateProductImage(editingImage.id, {
        alt_text: editAltText.trim() || undefined
      });
      if (onImagesChange) {
        const updatedImages = existingImages.map(img =>
          img.id === editingImage.id ? updatedImage : img
        );
        onImagesChange(updatedImages);
      }
      setEditingImage(null);
      setEditAltText('');
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to update image');
      onUploadError?.(err);
    }
  };

  const handleReplaceImage = async (imageId: number, file: File) => {
    const image = existingImages.find(img => img.id === imageId);
    if (!image) return;

    try {
      setUploading(true);
      setUploadError(null);

      // Upload new image
      const newImage = await uploadProductImage(productId, file, {
        compress: true,
        isFeatured: image.is_featured,
        sortOrder: image.sort_order,
        altText: image.alt_text || undefined
      });

      // Delete old image
      await deleteProductImage(imageId, image.storage_path);

      if (onImagesChange) {
        const updatedImages = existingImages.map(img =>
          img.id === imageId ? newImage : img
        );
        onImagesChange(updatedImages);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to replace image');
      setUploadError(err.message);
      onUploadError?.(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="image-upload-component">
      <div className="image-upload-header">
        <label htmlFor="image-upload-input">
          Product Images
          <span className="image-count">
            ({currentImageCount}/{maxImages})
          </span>
        </label>
      </div>

      <div className="image-upload-section">
        {canUploadMore && !disabled && (
          <div
            className={`image-upload-dropzone ${isDragOverUpload ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <label htmlFor="image-upload-input" className="image-upload-button">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>{isDragOverUpload ? 'Drop images here' : '+ Upload Image'}</span>
              <input
                id="image-upload-input"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                disabled={uploading || disabled}
                style={{ display: 'none' }}
              />
            </label>
            <div className="upload-info">
              <p className="upload-hint">
                Drag and drop images here, or click to browse
              </p>
              <p className="upload-limits">
                Supported formats: JPG, PNG, WebP, GIF
              </p>
            </div>
          </div>
        )}

        {uploading && (
          <div className="upload-progress">
            <div className="upload-spinner"></div>
            <span>Uploading...</span>
          </div>
        )}

        {uploadError && (
          <div className="upload-error-message">
            <strong>Upload Error:</strong> {uploadError}
            <br />
            <small>
              Product ID: {productId} | Check API server logs for details
            </small>
          </div>
        )}

        {sortedImages.length > 0 && (
          <>
            <div className="image-preview-grid">
              {sortedImages.map((image, index) => (
                <div
                  key={image.id}
                  className={`image-preview-item ${draggedIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
                  draggable={!disabled && !reordering}
                  onDragStart={() => handleImageDragStart(index)}
                  onDragOver={(e) => handleImageDragOver(e, index)}
                  onDragLeave={handleImageDragLeave}
                  onDrop={(e) => handleImageDrop(e, index)}
                >
                  {image.is_featured && (
                    <span className="featured-badge">Featured</span>
                  )}
                  <img
                    src={image.url}
                    alt={image.alt_text || `Product image ${index + 1}`}
                    loading="lazy"
                  />
                  {!disabled && (
                    <div className="image-actions">
                      {!image.is_featured && (
                        <button
                          type="button"
                          className="image-action-btn featured-btn"
                          onClick={() => handleSetFeatured(image.id)}
                          disabled={savingFeatured === image.id}
                          title="Set as featured"
                        >
                          {savingFeatured === image.id ? (
                            <div className="mini-spinner"></div>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                          )}
                        </button>
                      )}
                      <button
                        type="button"
                        className="image-action-btn edit-btn"
                        onClick={() => handleEditClick(image)}
                        title="Edit image"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    <button
                      type="button"
                      className="image-action-btn remove-btn"
                      onClick={() => handleRemoveClick(image.id)}
                      title="Remove image"
                    >
                      ×
                    </button>
                    </div>
                  )}
                  {draggedIndex === index && (
                    <div className="drag-overlay">Moving...</div>
                  )}
                </div>
              ))}
            </div>
            {sortedImages.length > 1 && (
              <p className="drag-reorder-hint">
                💡 Drag images to reorder them
              </p>
            )}
          </>
        )}

        {!canUploadMore && maxImages !== undefined && (
          <div className="image-limit-reached">
            Maximum {maxImages} images reached
          </div>
        )}
      </div>

      {/* Edit Image Modal */}
      {editingImage && (
        <div className="image-edit-modal-overlay" onClick={() => setEditingImage(null)}>
          <div className="image-edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="image-edit-header">
              <h3>Edit Image</h3>
              <button
                type="button"
                className="image-edit-close"
                onClick={() => setEditingImage(null)}
              >
                ×
              </button>
            </div>
            <div className="image-edit-content">
              <div className="image-edit-preview">
                <img src={editingImage.url} alt={editingImage.alt_text || 'Product image'} />
              </div>
              <div className="image-edit-form">
                <div className="form-group">
                  <label>Alt Text (for accessibility)</label>
                  <input
                    type="text"
                    value={editAltText}
                    onChange={(e) => setEditAltText(e.target.value)}
                    placeholder="Describe this image..."
                    maxLength={200}
                  />
                </div>
                <div className="form-group">
                  <label>Replace Image</label>
                  <div
                    className={`replace-image-dropzone ${replaceDragOver ? 'drag-over' : ''}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setReplaceDragOver(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setReplaceDragOver(false);
                    }}
                    onDrop={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setReplaceDragOver(false);
                      const file = e.dataTransfer.files[0];
                      if (file && file.type.startsWith('image/') && editingImage) {
                        await handleReplaceImage(editingImage.id, file);
                        setEditingImage(null);
                      } else if (file && !file.type.startsWith('image/')) {
                        onUploadError?.(new Error('Please select an image file'));
                      }
                    }}
                  >
                    <label htmlFor="replace-image-input" className="replace-image-label">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <span>{replaceDragOver ? 'Drop image here' : 'Click to select or drag image here'}</span>
                      <input
                        id="replace-image-input"
                        ref={replaceFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && editingImage) {
                            handleReplaceImage(editingImage.id, file);
                            setEditingImage(null);
                          }
                        }}
                        style={{ display: 'none' }}
                      />
                    </label>
                    <small className="replace-image-info">
                      <strong>Supported formats:</strong> JPG, PNG, WebP, GIF
                    </small>
                  </div>
                </div>
              </div>
            </div>
            <div className="image-edit-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setEditingImage(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSaveEdit}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmImage && (
        <div className="delete-confirm-overlay" onClick={handleDeleteCancel}>
          <div className="delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-confirm-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3 className="delete-confirm-title">Delete Image?</h3>
            <p className="delete-confirm-message">
              Are you sure you want to delete this image? This action cannot be undone.
            </p>
            {deleteConfirmImage.is_featured && (
              <div className="delete-confirm-warning">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span>This is the featured image. Another image will be set as featured automatically.</span>
              </div>
            )}
            <div className="delete-confirm-actions">
              <button
                type="button"
                className="delete-confirm-btn delete-cancel-btn"
                onClick={handleDeleteCancel}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="delete-confirm-btn delete-confirm-btn-primary"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <div className="delete-spinner"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
