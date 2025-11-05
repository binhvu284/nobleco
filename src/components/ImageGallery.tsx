import { useState, useEffect } from 'react';
import { UploadedImage } from '../utils/imageUpload';

interface ImageGalleryProps {
  images: UploadedImage[];
  featuredImageId?: number;
  onImageClick?: (image: UploadedImage, index: number) => void;
  showThumbnails?: boolean;
  className?: string;
}

export default function ImageGallery({
  images,
  featuredImageId,
  onImageClick,
  showThumbnails = true,
  className = ''
}: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className={`image-gallery-empty ${className}`}>
        <div className="empty-placeholder">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <p>No images available</p>
        </div>
      </div>
    );
  }

  // Find featured image or use first image
  const featuredImage = images.find(img => 
    featuredImageId ? img.id === featuredImageId : img.is_featured
  ) || images[0];

  const initialIndex = images.findIndex(img => img.id === featuredImage.id);
  const [currentIndex, setCurrentIndex] = useState(initialIndex >= 0 ? initialIndex : 0);

  const currentImage = images[currentIndex] || images[0];

  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index);
    setIsZoomed(false);
    setRotation(0);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setIsZoomed(false);
    setRotation(0);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setIsZoomed(false);
    setRotation(0);
  };

  const handleMainImageClick = () => {
    if (onImageClick) {
      onImageClick(currentImage, currentIndex);
    } else {
      // If no custom handler, open fullscreen
      openFullscreen();
    }
  };

  const openFullscreen = () => {
    setIsFullscreen(true);
    setIsZoomed(false);
    setRotation(0);
    document.body.style.overflow = 'hidden';
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
    setIsZoomed(false);
    setRotation(0);
    document.body.style.overflow = '';
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isZoomed) {
      // Zoom in at center of viewport
      const wrapper = document.querySelector('.fullscreen-image-wrapper');
      if (wrapper) {
        const rect = wrapper.getBoundingClientRect();
        const x = rect.width / 2;
        const y = rect.height / 2;
        setZoomPosition({ x, y });
        setIsZoomed(true);
      }
    }
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsZoomed(false);
  };

  const handleRotate = (direction: 'left' | 'right') => {
    setRotation(prev => prev + (direction === 'right' ? 90 : -90));
  };


  const handleZoomToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isZoomed) {
      // Zoom in at click position
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setZoomPosition({ x, y });
      setIsZoomed(true);
    } else {
      setIsZoomed(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isZoomed) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setZoomPosition({ x, y });
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isFullscreen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeFullscreen();
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
        setIsZoomed(false);
        setRotation(0);
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
        setIsZoomed(false);
        setRotation(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, images.length]);

  // Handle click outside to close fullscreen
  useEffect(() => {
    if (!isFullscreen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('fullscreen-overlay')) {
        closeFullscreen();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isFullscreen]);

  return (
    <>
      <div className={`image-gallery ${className}`}>
        {/* Main Image */}
        <div className="gallery-main">
          <div className="main-image-container" onClick={handleMainImageClick}>
            <img
              src={currentImage.url}
              alt={currentImage.alt_text || `Product image ${currentIndex + 1}`}
              className="main-image"
              loading="lazy"
            />
            {images.length > 1 && (
              <>
                <button
                  className="gallery-nav gallery-nav-prev"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevious();
                  }}
                  aria-label="Previous image"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button
                  className="gallery-nav gallery-nav-next"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  aria-label="Next image"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </>
            )}
            {currentImage.is_featured && (
              <span className="featured-badge-main">Featured</span>
            )}
            <button
              className="gallery-fullscreen-btn"
              onClick={(e) => {
                e.stopPropagation();
                openFullscreen();
              }}
              title="View fullscreen"
              aria-label="View fullscreen"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            </button>
          </div>
          {images.length > 1 && (
            <div className="image-counter">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {showThumbnails && images.length > 1 && (
          <div className="gallery-thumbnails">
            {images.map((image, index) => (
              <button
                key={image.id}
                className={`thumbnail-item ${index === currentIndex ? 'active' : ''}`}
                onClick={() => handleThumbnailClick(index)}
                aria-label={`View image ${index + 1}`}
              >
                <img
                  src={image.url}
                  alt={image.alt_text || `Thumbnail ${index + 1}`}
                  loading="lazy"
                />
                {image.is_featured && (
                  <span className="thumbnail-featured-badge">★</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fullscreen-overlay" onClick={closeFullscreen}>
          <div className="fullscreen-container" onClick={(e) => e.stopPropagation()}>
            <button
              className="fullscreen-close"
              onClick={closeFullscreen}
              aria-label="Close fullscreen"
              title="Close (ESC)"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              <span className="close-key-hint">ESC</span>
            </button>
            
            {images.length > 1 && (
              <>
                <button
                  className="fullscreen-nav fullscreen-nav-prev"
                  onClick={handlePrevious}
                  aria-label="Previous image"
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button
                  className="fullscreen-nav fullscreen-nav-next"
                  onClick={handleNext}
                  aria-label="Next image"
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </>
            )}

            <div
              className={`fullscreen-image-wrapper ${isZoomed ? 'zoomed' : ''}`}
              onMouseMove={handleMouseMove}
              onClick={handleZoomToggle}
            >
              <img
                src={currentImage.url}
                alt={currentImage.alt_text || `Product image ${currentIndex + 1}`}
                className="fullscreen-image"
                style={{
                  transform: `scale(${isZoomed ? 2.5 : 1}) rotate(${rotation}deg)`,
                  transformOrigin: isZoomed ? `${zoomPosition.x}px ${zoomPosition.y}px` : 'center center',
                  objectFit: 'contain'
                }}
              />
            </div>

            <div className="fullscreen-controls">
              <div className="zoom-controls">
                <button
                  className="fullscreen-control-btn zoom-in-btn"
                  onClick={handleZoomIn}
                  disabled={isZoomed}
                  title="Zoom in (Click image to zoom at position)"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="11" y1="8" x2="11" y2="14" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                  <span>Zoom In</span>
                </button>
                <button
                  className="fullscreen-control-btn zoom-out-btn"
                  onClick={handleZoomOut}
                  disabled={!isZoomed}
                  title="Zoom out"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                  <span>Zoom Out</span>
                </button>
              </div>
              <div className="rotation-controls">
                <button
                  className="fullscreen-control-btn rotate-btn"
                  onClick={() => handleRotate('left')}
                  title="Rotate left (90°)"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                  </svg>
                  <span>Rotate L</span>
                </button>
                <button
                  className="fullscreen-control-btn rotate-btn"
                  onClick={() => handleRotate('right')}
                  title="Rotate right (90°)"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2.5 2v6h6M21.5 22v-6h-6M22 11.5a10 10 0 0 1-18.8-4.3M2 12.5a10 10 0 0 1 18.8 4.2" />
                  </svg>
                  <span>Rotate R</span>
                </button>
              </div>
              {images.length > 1 && (
                <div className="fullscreen-counter">
                  {currentIndex + 1} / {images.length}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
