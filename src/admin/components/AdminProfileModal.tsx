import { useState, useEffect, useRef } from 'react';
import { getCurrentUser, type User } from '../../auth';
import { uploadUserAvatar, deleteUserAvatar, type UserAvatar } from '../../utils/avatarUpload';
import { getAvatarInitial, getAvatarColor, getAvatarViewportStyles } from '../../utils/avatarUtils';

export default function AdminProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [showQrModal, setShowQrModal] = useState(false);
    const [avatar, setAvatar] = useState<UserAvatar | null>(null);
    const [showAvatarCrop, setShowAvatarCrop] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string>('');
    const [imageScale, setImageScale] = useState(1); // Zoom scale for the image
    const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 }); // Image position for dragging
    const [frameSize, setFrameSize] = useState(300); // Fixed frame size (will be set based on image)
    const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
    const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const avatarImageRef = useRef<HTMLImageElement>(null);
    const cropContainerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [showAvatarExpanded, setShowAvatarExpanded] = useState(false);
    const [isHoveringAvatar, setIsHoveringAvatar] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: ''
    });

    useEffect(() => {
        if (open) {
            loadFreshUserData();
        } else {
            // Reset state when modal closes
            setUser(null);
            setIsLoading(false);
            setIsEditing(false);
            setError('');
        }
    }, [open]);

    const loadFreshUserData = async () => {
        setIsLoading(true);
        setError('');
        try {
            const currentUser = getCurrentUser();
            if (!currentUser?.id) {
                setIsLoading(false);
                return;
            }

            // Fetch fresh data from database
            const response = await fetch(`/api/users/${currentUser.id}`);
            if (response.ok) {
                const data = await response.json();
                const freshUser = data.user;
                
                // Update localStorage with fresh data
                localStorage.setItem('nobleco_user_data', JSON.stringify(freshUser));
                
                // Update local state
                setUser(freshUser);
                setFormData({
                    name: freshUser.name || '',
                    phone: freshUser.phone || '',
                    address: freshUser.address || ''
                });
                
                // Load avatar
                await loadUserAvatar(Number(freshUser.id));
                
                // Update avatar state if user data includes avatar URL
                if (freshUser.avatar) {
                    setAvatar({ url: freshUser.avatar } as UserAvatar);
                }
                
                // Trigger storage event for header update
                window.dispatchEvent(new Event('storage'));
            } else {
                // Fallback to localStorage if API fails
                console.log('Using cached user data from localStorage');
                setUser(currentUser);
                setFormData({
                    name: currentUser.name || '',
                    phone: currentUser.phone || '',
                    address: currentUser.address || ''
                });
            }
        } catch (err) {
            console.error('Error loading user data:', err);
            // Fallback to localStorage
            const currentUser = getCurrentUser();
            if (currentUser) {
                setUser(currentUser);
                setFormData({
                    name: currentUser.name || '',
                    phone: currentUser.phone || '',
                    address: currentUser.address || ''
                });
            }
        } finally {
            setIsLoading(false);
            setIsEditing(false);
            setError('');
        }
    };

    const handleSave = async () => {
        if (!user?.id) return;
        
        setIsSaving(true);
        setError('');
        
        try {
            const response = await fetch('/api/users/profile', {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('nobleco_auth_token') || ''}`
                },
                body: JSON.stringify({
                    id: user.id,
                    name: formData.name,
                    address: formData.address,
                    // Phone is not editable, so don't send it
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMessage = data.error || data.message || 'Failed to update profile';
                setError(errorMessage);
                console.error('Profile update failed:', { status: response.status, data });
                return;
            }

            // Check if response has user data
            if (!data.user) {
                setError('Invalid response from server');
                console.error('Invalid response:', data);
                return;
            }

            // Update localStorage with new user data (use data from server as source of truth)
            localStorage.setItem('nobleco_user_data', JSON.stringify(data.user));
            
            // Update local state with fresh data from server
            setUser(data.user);
            
            // Update form data with the latest values from server
            setFormData({
                name: data.user.name || '',
                phone: data.user.phone || '',
                address: data.user.address || ''
            });
            
            setIsEditing(false);
            
            // Trigger a storage event to notify other components (like header)
            window.dispatchEvent(new Event('storage'));
            
            // Show success feedback
            console.log('Profile updated successfully');
        } catch (err) {
            setError('Failed to connect to server. Please try again.');
            console.error('Profile update error:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const loadUserAvatar = async (userId: number) => {
        try {
            const response = await fetch(`/api/user-avatars?userId=${userId}`);
            if (response.ok) {
                const avatarData = await response.json();
                if (avatarData) {
                    setAvatar(avatarData);
                } else {
                    setAvatar(null);
                }
            }
        } catch (error) {
            console.error('Error loading avatar:', error);
            setAvatar(null);
        }
    };

    const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                setError('Image file is too large. Maximum size is 10MB.');
                return;
            }
            
            setAvatarFile(file);
            setError('');
            const reader = new FileReader();
            reader.onload = (e) => {
                setAvatarPreview(e.target?.result as string);
                setShowAvatarCrop(true);
                // Reset image transform when new image is loaded
                setImageScale(1);
                setImagePosition({ x: 0, y: 0 });
            };
            reader.onerror = () => {
                setError('Failed to read image file. Please try again.');
            };
            reader.readAsDataURL(file);
        } else {
            setError('Please select a valid image file.');
        }
    };


    // Handler for Change button - opens file picker
    const handleChangeAvatar = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                handleAvatarFileSelect({ target: { files: [file] } } as any);
            }
        };
        input.click();
    };

    // Handler for Remove button - deletes avatar
    const handleRemoveAvatar = async () => {
        if (!user?.id) return;
        
        if (!confirm('Are you sure you want to remove your avatar? It will revert to the default letter avatar.')) {
            return;
        }

        setIsUploadingAvatar(true);
        setError('');

        try {
            await deleteUserAvatar(Number(user.id));
            setAvatar(null);
            await loadFreshUserData();
            
            const currentUser = getCurrentUser();
            if (currentUser) {
                const updatedUser = { ...currentUser, avatar: undefined };
                localStorage.setItem('nobleco_user_data', JSON.stringify(updatedUser));
            }
            
            window.dispatchEvent(new CustomEvent('avatarUpdated', {
                detail: { avatarUrl: null }
            }));
            window.dispatchEvent(new Event('storage'));
        } catch (error: any) {
            setError(error.message || 'Failed to remove avatar. Please try again.');
            console.error('Avatar removal error:', error);
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const handleCropConfirm = async () => {
        if (!avatarFile || !user?.id || !avatarImageRef.current || !imageDimensions || !cropContainerRef.current) {
            setError('Missing required data. Please try again.');
            return;
        }

        setIsUploadingAvatar(true);
        setError(''); // Clear any previous errors
        
        try {
            // Get container dimensions
            const containerRect = cropContainerRef.current.getBoundingClientRect();
            const imgRect = avatarImageRef.current.getBoundingClientRect();
            
            const displaySize = {
                width: imgRect.width,
                height: imgRect.height
            };

            if (displaySize.width === 0 || displaySize.height === 0) {
                throw new Error('Image dimensions are invalid. Please try again.');
            }

            // Frame is centered in container
            const frameCenterX = containerRect.width / 2;
            const frameCenterY = containerRect.height / 2;
            
            // Calculate scaled image dimensions
            const scaledImageWidth = imageDimensions.width * imageScale;
            const scaledImageHeight = imageDimensions.height * imageScale;
            
            // Image position is relative to container center
            // Calculate where image top-left is
            const imageLeft = (containerRect.width - scaledImageWidth) / 2 + imagePosition.x;
            const imageTop = (containerRect.height - scaledImageHeight) / 2 + imagePosition.y;
            
            // Frame center relative to image top-left
            const frameCenterRelativeToImage = {
                x: frameCenterX - imageLeft,
                y: frameCenterY - imageTop
            };
            
            // Convert to original image coordinates (divide by scale)
            const viewportX = frameCenterRelativeToImage.x / imageScale;
            const viewportY = frameCenterRelativeToImage.y / imageScale;
            
            // Calculate as ratios (0-1) relative to original image dimensions
            const viewportData = {
                x: viewportX / imageDimensions.width,
                y: viewportY / imageDimensions.height,
                width: frameSize,
                height: frameSize, // Circular frame
                displaySize
            };
            
            const uploadedAvatar = await uploadUserAvatar(Number(user.id), avatarFile, {
                viewportData: {
                    x: viewportData.x,
                    y: viewportData.y,
                    width: viewportData.width,
                    height: viewportData.height,
                    displaySize
                }
            });
            
            if (!uploadedAvatar || !uploadedAvatar.url) {
                throw new Error('Upload succeeded but avatar data is missing.');
            }
            
            setAvatar(uploadedAvatar);
            setShowAvatarCrop(false);
            setAvatarFile(null);
            setAvatarPreview('');
            setImageScale(1);
            setImagePosition({ x: 0, y: 0 });
            setImageDimensions(null);
            
            await loadFreshUserData();
            
            const currentUser = getCurrentUser();
            if (currentUser && uploadedAvatar.url) {
                const updatedUser = { ...currentUser, avatar: uploadedAvatar.url };
                localStorage.setItem('nobleco_user_data', JSON.stringify(updatedUser));
            }
            
            window.dispatchEvent(new CustomEvent('avatarUpdated', {
                detail: { avatarUrl: uploadedAvatar.url }
            }));
            window.dispatchEvent(new Event('storage'));
        } catch (error: any) {
            const errorMessage = error.message || 'Failed to upload avatar. Please try again.';
            setError(errorMessage);
            console.error('Avatar upload error:', error);
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const handleCropCancel = () => {
        setShowAvatarCrop(false);
        setAvatarFile(null);
        setAvatarPreview('');
        setImageScale(1);
        setImagePosition({ x: 0, y: 0 });
        setImageDimensions(null);
    };

    // Handle image dragging (move image behind fixed frame)
    const handleImageMouseDown = (e: React.MouseEvent) => {
        if (!cropContainerRef.current || !avatarImageRef.current) return;
        
        setIsDragging(true);
        
        const containerRect = cropContainerRef.current.getBoundingClientRect();
        
        // Calculate offset from mouse to current image position
        setDragStart({
            x: e.clientX - containerRect.left - imagePosition.x,
            y: e.clientY - containerRect.top - imagePosition.y
        });
        
        e.preventDefault();
        e.stopPropagation();
    };

    const handleImageMouseUp = () => {
        setIsDragging(false);
    };


    // Add document-level mouse event listeners for smooth dragging
    useEffect(() => {
        if (!isDragging) return;
        
        const handleMove = (e: MouseEvent) => {
            if (!cropContainerRef.current || !imageDimensions) return;
            
            const containerRect = cropContainerRef.current.getBoundingClientRect();
            
            // Calculate new image position
            const mouseX = e.clientX - containerRect.left;
            const mouseY = e.clientY - containerRect.top;
            
            let newX = mouseX - dragStart.x;
            let newY = mouseY - dragStart.y;
            
            // Constrain image position so it doesn't go too far
            // Calculate scaled image dimensions
            const scaledWidth = imageDimensions.width * imageScale;
            const scaledHeight = imageDimensions.height * imageScale;
            
            // Allow some movement but keep image visible within reasonable bounds
            const maxX = (containerRect.width - scaledWidth) / 2 + containerRect.width * 0.5;
            const maxY = (containerRect.height - scaledHeight) / 2 + containerRect.height * 0.5;
            const minX = (containerRect.width - scaledWidth) / 2 - containerRect.width * 0.5;
            const minY = (containerRect.height - scaledHeight) / 2 - containerRect.height * 0.5;
            
            newX = Math.max(minX, Math.min(maxX, newX));
            newY = Math.max(minY, Math.min(maxY, newY));
            
            setImagePosition({ x: newX, y: newY });
        };
        
        const handleUp = () => {
            setIsDragging(false);
        };
        
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleUp);
        
        return () => {
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleUp);
        };
    }, [isDragging, dragStart, imageScale, imageDimensions]);

    // Handler for zoom slider (zoom in/out image)
    const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newScale = parseFloat(e.target.value);
        setImageScale(newScale);
    };

    const handleCancel = () => {
        if (user) {
            setFormData({
                name: user.name || '',
                phone: user.phone || '',
                address: user.address || ''
            });
        }
        setError('');
        setIsEditing(false);
    };

    if (!open) return null;

    return (
        <>
            <div className="modal-overlay" onClick={onClose} />
            <div className="profile-modal-card" role="dialog" aria-modal="true">
                <div className="modal-header">
                    <span>Admin Profile</span>
                    <button className="modal-close" aria-label="Close" onClick={onClose}>✕</button>
                </div>
                
                {isLoading ? (
                    <div className="profile-loading">
                        <div className="loading-spinner">
                            <div className="spinner-ring"></div>
                            <div className="spinner-ring"></div>
                            <div className="spinner-ring"></div>
                        </div>
                        <p>Loading profile...</p>
                    </div>
                ) : user ? (
                    <div className="profile-content">
                    {/* Avatar Section */}
                    <div className="profile-avatar-section">
                        <div 
                            className="profile-avatar-wrapper" 
                            style={{ 
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px'
                            }}
                            onMouseEnter={() => !isEditing && avatar?.url && setIsHoveringAvatar(true)}
                            onMouseLeave={() => setIsHoveringAvatar(false)}
                        >
                            {avatar?.url ? (
                                <img 
                                    className="profile-avatar-large" 
                                    src={avatar.url} 
                                    alt={user.name || user.email}
                                    style={isEditing ? {
                                        ...getAvatarViewportStyles(avatar, 180),
                                        minWidth: '180px',
                                        minHeight: '180px'
                                    } : getAvatarViewportStyles(avatar, 120)}
                                    onError={() => setAvatar(null)}
                                />
                            ) : (
                                <div 
                                    className="profile-avatar-large"
                                    style={{
                                        width: isEditing ? '180px' : '120px',
                                        height: isEditing ? '180px' : '120px',
                                        borderRadius: '50%',
                                        backgroundColor: getAvatarColor(user.name || user.email),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: isEditing ? '72px' : '48px',
                                        fontWeight: 600,
                                        textTransform: 'uppercase',
                                        flexShrink: 0
                                    }}
                                >
                                    {getAvatarInitial(user.name || 'Admin')}
                                </div>
                            )}
                            {isEditing && (
                                <div style={{
                                    display: 'flex',
                                    gap: '8px',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    justifyContent: 'center'
                                }}>
                                    <button
                                        onClick={handleChangeAvatar}
                                        disabled={isUploadingAvatar}
                                        style={{
                                            background: '#10b981',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '36px',
                                            height: '36px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                            transition: 'all 0.2s ease',
                                            flexShrink: 0
                                        }}
                                        title="Upload avatar"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="17 8 12 3 7 8" />
                                            <line x1="12" y1="3" x2="12" y2="15" />
                                        </svg>
                                    </button>
                                    {avatar?.url && (
                                        <button
                                            onClick={handleRemoveAvatar}
                                            disabled={isUploadingAvatar}
                                            style={{
                                                background: '#ef4444',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '36px',
                                                height: '36px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                                transition: 'all 0.2s ease',
                                                flexShrink: 0
                                            }}
                                            title="Remove avatar"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="3 6 5 6 21 6" />
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            )}
                            {!isEditing && avatar?.url && isHoveringAvatar && (
                                <button
                                    className="avatar-view-btn"
                                    onClick={() => setShowAvatarExpanded(true)}
                                    style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        background: 'rgba(0, 0, 0, 0.7)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '8px 16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        cursor: 'pointer',
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        transition: 'all 0.2s ease',
                                        zIndex: 10
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.9)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)';
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                    View
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Profile Information */}
                    <div className="profile-info-grid">
                        {/* Non-Editable Section */}
                        <div className="profile-section">
                            <h3 className="profile-section-title">Account Information</h3>
                            <div className="profile-fields">
                                <div className="profile-field">
                                    <label>Email</label>
                                    <div className="profile-field-value email-display">{user.email}</div>
                                </div>
                                <div className="profile-field">
                                    <label>Phone Number</label>
                                    <div className="profile-field-value email-display">{user.phone || 'Not set'}</div>
                                </div>
                                <div className="profile-field">
                                    <label>Role</label>
                                    <div className="profile-field-value role-display">Administrator</div>
                                </div>
                            </div>
                        </div>

                        {/* Editable Section */}
                        <div className="profile-section">
                            <div className="profile-section-header">
                                <h3 className="profile-section-title">Personal Information</h3>
                                {!isEditing && (
                                    <button className="edit-btn" onClick={() => setIsEditing(true)}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                        Edit
                                    </button>
                                )}
                            </div>
                            <div className="profile-fields">
                                <div className="profile-field">
                                    <label>Name</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Enter your name"
                                        />
                                    ) : (
                                        <div className="profile-field-value">{formData.name || 'Not set'}</div>
                                    )}
                                </div>
                                <div className="profile-field profile-field-full">
                                    <label>Address</label>
                                    {isEditing ? (
                                        <textarea
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            placeholder="Enter your address"
                                            rows={2}
                                        />
                                    ) : (
                                        <div className="profile-field-value">{formData.address || 'Not set'}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && !showAvatarCrop && (
                        <div className="error" style={{ marginTop: '16px', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}

                    {/* Action Buttons */}
                    {isEditing && (
                        <div className="profile-actions">
                            <button className="btn-secondary" onClick={handleCancel} disabled={isSaving}>
                                Cancel
                            </button>
                            <button className="btn-primary" onClick={handleSave} disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    )}
                    </div>
                ) : (
                    <div className="profile-error">
                        <p>Failed to load profile data. Please try again.</p>
                        <button className="btn-primary" onClick={loadFreshUserData}>
                            Retry
                        </button>
                    </div>
                )}
            </div>

            {/* Avatar Expanded Modal */}
            {showAvatarExpanded && avatar?.url && (
                <div className="modal-overlay personal-id-expanded-overlay" onClick={() => setShowAvatarExpanded(false)}>
                    <div className="personal-id-expanded-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="personal-id-expanded-header">
                            <h3>Avatar</h3>
                            <button className="modal-close" onClick={() => setShowAvatarExpanded(false)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <div className="personal-id-expanded-content">
                            <img 
                                src={avatar.url} 
                                alt="User avatar"
                                className="personal-id-expanded-image"
                                style={{ maxWidth: '90vw', maxHeight: '90vh', width: 'auto', height: 'auto', objectFit: 'contain' }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Avatar Crop Modal */}
            {showAvatarCrop && avatarPreview && (
                <div className="modal-overlay" onClick={handleCropCancel} style={{ zIndex: 10000, background: 'rgba(16, 24, 40, 0.38)', backdropFilter: 'blur(2px)' }}>
                    <div 
                        className="profile-modal-card" 
                        onClick={(e) => e.stopPropagation()}
                        style={{ 
                            maxWidth: '700px', 
                            width: '90%',
                            maxHeight: '90vh',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            position: 'relative'
                        }}
                    >
                        <div className="modal-header" style={{ flexShrink: 0 }}>
                            <span>Crop Avatar</span>
                            <button className="modal-close" onClick={handleCropCancel}>✕</button>
                        </div>
                        <div style={{ 
                            padding: '20px',
                            overflowY: 'auto',
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            minHeight: 0
                        }}>
                            <div style={{ marginBottom: '16px', textAlign: 'center', flexShrink: 0 }}>
                                <label htmlFor="zoom-slider" style={{ 
                                    display: 'block', 
                                    marginBottom: '12px', 
                                    fontSize: '0.875rem', 
                                    color: '#6b7280',
                                    fontWeight: 500
                                }}>
                                    Zoom: {Math.round(imageScale * 100)}%
                                </label>
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <input
                                        id="zoom-slider"
                                        type="range"
                                        min="0.5"
                                        max="3"
                                        step="0.1"
                                        value={imageScale}
                                        onChange={handleZoomChange}
                                        className="crop-size-slider"
                                        style={{ 
                                            width: '80%',
                                            maxWidth: '400px',
                                            cursor: 'pointer',
                                            height: '8px',
                                            margin: 0,
                                            verticalAlign: 'middle'
                                        }}
                                    />
                                </div>
                            </div>
                            {error && (
                                <div style={{ 
                                    marginBottom: '16px', 
                                    padding: '12px', 
                                    background: '#fee2e2', 
                                    border: '1px solid #fca5a5',
                                    borderRadius: '8px',
                                    color: '#dc2626',
                                    fontSize: '0.875rem'
                                }}>
                                    {error}
                                </div>
                            )}
                            <div 
                                ref={cropContainerRef}
                                style={{
                                    position: 'relative',
                                    width: '100%',
                                    maxWidth: '100%',
                                    margin: '0 auto',
                                    border: '2px solid #e5e7eb',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    cursor: isDragging ? 'grabbing' : 'grab',
                                    backgroundColor: '#f9fafb',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    flex: 1,
                                    minHeight: 0,
                                    maxHeight: 'calc(90vh - 250px)',
                                    padding: '20px'
                                }}
                            >
                                <div style={{ 
                                    position: 'relative', 
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    width: '100%',
                                    height: '100%',
                                    overflow: 'hidden'
                                }}>
                                    <img
                                        ref={avatarImageRef}
                                        src={avatarPreview}
                                        alt="Preview"
                                        style={{
                                            width: imageDimensions ? `${imageDimensions.width * imageScale}px` : 'auto',
                                            height: imageDimensions ? `${imageDimensions.height * imageScale}px` : 'auto',
                                            objectFit: 'contain',
                                            display: 'block',
                                            transform: `translate(${imagePosition.x}px, ${imagePosition.y}px)`,
                                            cursor: isDragging ? 'grabbing' : 'grab',
                                            userSelect: 'none',
                                            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                                        }}
                                        draggable={false}
                                        onMouseDown={handleImageMouseDown}
                                        onLoad={(e) => {
                                            // Initialize when image loads
                                            const img = e.currentTarget;
                                            setTimeout(() => {
                                                const naturalWidth = img.naturalWidth;
                                                const naturalHeight = img.naturalHeight;
                                                
                                                if (naturalWidth > 0 && naturalHeight > 0) {
                                                    // Set frame size to fit largest dimension (with some padding)
                                                    const containerRect = cropContainerRef.current?.getBoundingClientRect();
                                                    if (containerRect) {
                                                        const containerAspectRatio = containerRect.width / containerRect.height;
                                                        const imageAspectRatio = naturalWidth / naturalHeight;
                                                        
                                                        let displayedWidth, displayedHeight;
                                                        if (imageAspectRatio > containerAspectRatio) {
                                                            displayedWidth = containerRect.width * 0.9;
                                                            displayedHeight = displayedWidth / imageAspectRatio;
                                                        } else {
                                                            displayedHeight = containerRect.height * 0.9;
                                                            displayedWidth = displayedHeight * imageAspectRatio;
                                                        }
                                                        
                                                        setImageDimensions({ width: displayedWidth, height: displayedHeight });
                                                        setFrameSize(Math.min(displayedWidth, displayedHeight) * 0.8);
                                                    }
                                                }
                                            }, 100);
                                        }}
                                    />
                                    {/* Fixed circular frame overlay */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            width: `${frameSize}px`,
                                            height: `${frameSize}px`,
                                            border: '3px solid #3b82f6',
                                            borderRadius: '50%',
                                            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                                            pointerEvents: 'none',
                                            zIndex: 10
                                        }}
                                    />
                                </div>
                            </div>
                            <div style={{ 
                                marginTop: '24px', 
                                display: 'flex', 
                                gap: '12px', 
                                justifyContent: 'flex-end',
                                flexShrink: 0,
                                paddingTop: '16px',
                                borderTop: '1px solid #e5e7eb'
                            }}>
                                <button 
                                    className="btn-secondary" 
                                    onClick={handleCropCancel}
                                    disabled={isUploadingAvatar}
                                >
                                    Cancel
                                </button>
                                <button 
                                    className="btn-primary" 
                                    onClick={handleCropConfirm}
                                    disabled={isUploadingAvatar || !imageDimensions}
                                    style={{
                                        opacity: (isUploadingAvatar || !imageDimensions) ? 0.6 : 1,
                                        cursor: (isUploadingAvatar || !imageDimensions) ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {isUploadingAvatar ? (
                                        <>
                                            <span style={{ 
                                                display: 'inline-block', 
                                                marginRight: '8px',
                                                animation: 'spin 1s linear infinite'
                                            }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                                </svg>
                                            </span>
                                            Uploading...
                                        </>
                                    ) : (
                                        'Upload Avatar'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
