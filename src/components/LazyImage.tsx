import { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    placeholder?: string;
    threshold?: number;
    rootMargin?: string;
}

export default function LazyImage({ 
    src, 
    alt, 
    placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3Crect width="1" height="1" fill="%23e5e7eb"/%3E%3C/svg%3E',
    threshold = 0.1,
    rootMargin = '50px',
    ...props 
}: LazyImageProps) {
    const [imageSrc, setImageSrc] = useState<string>(placeholder);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        observer.disconnect();
                    }
                });
            },
            {
                threshold,
                rootMargin,
            }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => {
            observer.disconnect();
        };
    }, [threshold, rootMargin]);

    useEffect(() => {
        if (isInView && src) {
            const img = new Image();
            img.src = src;
            img.onload = () => {
                setImageSrc(src);
                setIsLoaded(true);
            };
            img.onerror = () => {
                // Keep placeholder on error - don't spam console
                setIsLoaded(false);
            };
            
            // Cleanup function to abort image loading if component unmounts
            return () => {
                img.onload = null;
                img.onerror = null;
            };
        }
    }, [isInView, src]);

    return (
        <img
            ref={imgRef}
            src={imageSrc}
            alt={alt}
            {...props}
            style={{
                ...props.style,
                opacity: isLoaded ? 1 : 0.5,
                transition: 'opacity 0.3s ease-in-out',
            }}
        />
    );
}

