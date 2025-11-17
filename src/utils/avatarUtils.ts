/**
 * Utility functions for avatar display
 */

import { UserAvatar } from './avatarUpload';

/**
 * Get the first letter of a name for avatar display
 */
export function getAvatarInitial(name: string): string {
    if (!name || name.trim().length === 0) return '?';
    return name.charAt(0).toUpperCase();
}

/**
 * Get a consistent color for an avatar based on the name
 */
export function getAvatarColor(name: string): string {
    const colors = [
        '#3b82f6', // blue
        '#8b5cf6', // purple
        '#ec4899', // pink
        '#f59e0b', // amber
        '#10b981', // emerald
        '#06b6d4', // cyan
        '#ef4444', // red
        '#6366f1', // indigo
    ];
    if (!name || name.length === 0) return colors[0];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
}

/**
 * Partial avatar type for display purposes
 */
export type AvatarDisplayData = {
    url: string;
    viewport_x?: number | null;
    viewport_y?: number | null;
    viewport_size?: number | null;
    width?: number | null;
    height?: number | null;
};

/**
 * Get CSS styles for displaying an avatar with circular viewport
 * @param avatar - Avatar data with viewport coordinates (can be partial)
 * @param displaySize - Size of the circular display (in pixels)
 * @returns CSS styles object for the image
 */
export function getAvatarViewportStyles(avatar: UserAvatar | AvatarDisplayData | null, displaySize: number): React.CSSProperties {
    if (!avatar || !avatar.url || avatar.viewport_x === null || avatar.viewport_x === undefined || avatar.viewport_y === null || avatar.viewport_y === undefined || avatar.viewport_size === null || avatar.viewport_size === undefined || !avatar.width || !avatar.height) {
        // No viewport data or dimensions, show full image with circular clip
        return {
            width: `${displaySize}px`,
            height: `${displaySize}px`,
            borderRadius: '50%',
            objectFit: 'cover',
            objectPosition: 'center'
        };
    }

    // Calculate the actual viewport size in pixels
    const largerDimension = Math.max(avatar.width, avatar.height);
    const viewportSizePx = largerDimension * (avatar.viewport_size ?? 1);
    
    // Calculate the center position in pixels
    const centerX = (avatar.viewport_x ?? 0.5) * avatar.width;
    const centerY = (avatar.viewport_y ?? 0.5) * avatar.height;
    
    // Calculate object-position percentage (relative to image dimensions)
    const objectPositionX = (centerX / avatar.width) * 100;
    const objectPositionY = (centerY / avatar.height) * 100;
    
    // Calculate scale to zoom into viewport area
    // We want the viewport to fill the circular display
    const scale = Math.max(1, displaySize / viewportSizePx);
    
    return {
        width: `${displaySize}px`,
        height: `${displaySize}px`,
        borderRadius: '50%',
        objectFit: 'cover',
        objectPosition: `${objectPositionX}% ${objectPositionY}%`,
        transform: `scale(${scale})`,
        transformOrigin: `${objectPositionX}% ${objectPositionY}%`
    };
}
