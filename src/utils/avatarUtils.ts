/**
 * Utility functions for avatar display
 */

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
    if (!name || name.trim().length === 0) return colors[0];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
}

