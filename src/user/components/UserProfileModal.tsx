import { useState, useEffect, useRef } from 'react';
import { getCurrentUser, type User } from '../../auth';
import QRCode from 'qrcode';
import { uploadUserAvatar, deleteUserAvatar, type UserAvatar } from '../../utils/avatarUpload';
import { getAvatarInitial, getAvatarColor, getAvatarViewportStyles } from '../../utils/avatarUtils';

export default function UserProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        location: ''
    });
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [showQrModal, setShowQrModal] = useState(false);
    const qrCanvasRef = useRef<HTMLCanvasElement>(null);
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
    
    // Personal ID state
    const [personalID, setPersonalID] = useState<{
        front_image_url?: string;
        back_image_url?: string;
        front_image_path?: string;
        back_image_path?: string;
        verified?: boolean;
    } | null>(null);
    const [showPersonalIDExpanded, setShowPersonalIDExpanded] = useState<{ type: 'front' | 'back' } | null>(null);
    const [isUploadingPersonalID, setIsUploadingPersonalID] = useState(false);
    const frontImageInputRef = useRef<HTMLInputElement>(null);
    const backImageInputRef = useRef<HTMLInputElement>(null);
    const [showAvatarExpanded, setShowAvatarExpanded] = useState(false);
    const [isHoveringAvatar, setIsHoveringAvatar] = useState(false);
    const [showLocationDropdown, setShowLocationDropdown] = useState(false);
    const locationDropdownRef = useRef<HTMLDivElement>(null);

    // Close location dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (locationDropdownRef.current && !locationDropdownRef.current.contains(e.target as Node)) {
                setShowLocationDropdown(false);
            }
        };

        if (showLocationDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [showLocationDropdown]);

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
            const response = await fetch(`/api/users?id=${currentUser.id}`);
            if (response.ok) {
                const data = await response.json();
                const freshUser = data.user;
                
                // Update localStorage with fresh data
                localStorage.setItem('nobleco_user_data', JSON.stringify(freshUser));
                
                // Update local state
                setUser(freshUser);
                setFormData({
                    name: freshUser.name || '',
                    address: freshUser.address || '',
                    location: freshUser.location || ''
                });
                
                // Load avatar
                await loadUserAvatar(Number(freshUser.id));
                
                // Update avatar state if user data includes avatar URL
                if (freshUser.avatar) {
                    setAvatar({ url: freshUser.avatar } as UserAvatar);
                }
                
                // Load personal ID
                await loadPersonalID(Number(freshUser.id));
                
                // Generate QR code
                if (freshUser.refer_code) {
                    generateQRCode(freshUser.refer_code);
                }
                
                // Trigger storage event for header update
                window.dispatchEvent(new Event('storage'));
            } else {
                // Fallback to localStorage if API fails
                console.log('Using cached user data from localStorage');
                setUser(currentUser);
                setFormData({
                    name: currentUser.name || '',
                    address: currentUser.address || '',
                    location: currentUser.location || ''
                });
                if (currentUser.refer_code) {
                    generateQRCode(currentUser.refer_code);
                }
            }
        } catch (err) {
            console.error('Error loading user data:', err);
            // Fallback to localStorage
            const currentUser = getCurrentUser();
            if (currentUser) {
                setUser(currentUser);
                setFormData({
                    name: currentUser.name || '',
                    address: currentUser.address || '',
                    location: currentUser.location || ''
                });
                if (currentUser.refer_code) {
                    generateQRCode(currentUser.refer_code);
                }
            }
        } finally {
            setIsLoading(false);
            setIsEditing(false);
            setError('');
        }
    };

    const generateQRCode = async (referCode: string) => {
        try {
            // Create signup URL with pre-filled refer code
            const signupUrl = `${window.location.origin}/signup?ref=${referCode}`;
            const qrDataUrl = await QRCode.toDataURL(signupUrl, {
                width: 200,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
            setQrCodeUrl(qrDataUrl);
        } catch (err) {
            console.error('Error generating QR code:', err);
        }
    };

    const downloadQRCode = () => {
        if (!qrCodeUrl || !user?.refer_code) return;
        
        const link = document.createElement('a');
        link.download = `referral-qr-${user.refer_code}.png`;
        link.href = qrCodeUrl;
        link.click();
    };

    const expandQRCode = () => {
        setShowQrModal(true);
    };

    const closeQrModal = () => {
        setShowQrModal(false);
    };

    const handleSave = async () => {
        if (!user?.id) return;
        
        setIsSaving(true);
        setError('');
        
        try {
            const response = await fetch('/api/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: user.id,
                    name: formData.name,
                    address: formData.address,
                    location: formData.location,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to update profile');
                setIsSaving(false);
                return;
            }

            // Update localStorage with new user data (use data from server as source of truth)
            localStorage.setItem('nobleco_user_data', JSON.stringify(data.user));
            
            // Update local state with fresh data from server
            setUser(data.user);
            
            // Update form data with the latest values from server
            setFormData({
                name: data.user.name || '',
                address: data.user.address || '',
                location: data.user.location || ''
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

    const handleCancel = () => {
        if (user) {
            setFormData({
                name: user.name || '',
                address: user.address || '',
                location: user.location || ''
            });
        }
        setError('');
        setIsEditing(false);
    };

    const getLevelBadgeClass = (level?: string) => {
        if (!level) return 'level-badge level-guest';
        return `level-badge level-${level.replace(/\s+/g, '-')}`;
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
            setError(''); // Clear any previous errors
            const reader = new FileReader();
            reader.onload = (e) => {
                setAvatarPreview(e.target?.result as string);
                setShowAvatarCrop(true);
                // Crop data will be initialized when image loads in the modal
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
            
            // Reload user data
            await loadFreshUserData();
            
            // Update localStorage
            const currentUser = getCurrentUser();
            if (currentUser) {
                const updatedUser = { ...currentUser, avatar: undefined };
                localStorage.setItem('nobleco_user_data', JSON.stringify(updatedUser));
            }
            
            // Dispatch events
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
            
            // Reload user data to get updated avatar URL
            await loadFreshUserData();
            
            // Update localStorage with avatar URL
            const currentUser = getCurrentUser();
            if (currentUser && uploadedAvatar.url) {
                const updatedUser = { ...currentUser, avatar: uploadedAvatar.url };
                localStorage.setItem('nobleco_user_data', JSON.stringify(updatedUser));
            }
            
            // Dispatch custom event to notify header of avatar update
            window.dispatchEvent(new CustomEvent('avatarUpdated', {
                detail: { avatarUrl: uploadedAvatar.url }
            }));
            
            // Also trigger storage event for other components
            window.dispatchEvent(new Event('storage'));
            
            // Show success message briefly
            const successMsg = 'Avatar uploaded successfully!';
            setError(''); // Clear error if any
            // You could add a success notification here if you have one
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
        if (!isDragging || !cropContainerRef.current || !imageDimensions) return;
        
        const handleMove = (e: MouseEvent) => {
            if (!cropContainerRef.current) return;
            
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

    // Personal ID functions
    const loadPersonalID = async (userId: number) => {
        try {
            const token = localStorage.getItem('nobleco_auth_token');
            const response = await fetch(`/api/user-personal-ids?userId=${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                if (data && (data.front_image_url || data.back_image_url)) {
                    setPersonalID(data);
                } else {
                    setPersonalID(null);
                }
            }
        } catch (error) {
            console.error('Error loading personal ID:', error);
            setPersonalID(null);
        }
    };

    const handlePersonalIDUpload = async (type: 'front' | 'back', file: File) => {
        if (!user?.id) return;
        
        setIsUploadingPersonalID(true);
        setError('');

        try {
            // Validate file
            if (!file.type.startsWith('image/')) {
                throw new Error('Please select a valid image file');
            }
            if (file.size > 10 * 1024 * 1024) {
                throw new Error('Image file is too large. Maximum size is 10MB.');
            }

            // Convert file to base64 without compression to preserve original quality
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve, reject) => {
                reader.onload = () => {
                    const result = reader.result as string;
                    // Remove data:image/...;base64, prefix
                    const base64 = result.split(',')[1];
                    resolve(base64);
                };
                reader.onerror = reject;
            });
            reader.readAsDataURL(file);

            const base64Data = await base64Promise;
            const timestamp = Date.now();
            const fileExt = file.name.split('.').pop() || 'jpg';
            const fileName = `${type}_${timestamp}.${fileExt}`;
            const storagePath = `${user.id}/${fileName}`;

            // Upload to storage via API
            const token = localStorage.getItem('nobleco_auth_token');
            const uploadResponse = await fetch(`/api/user-personal-ids?userId=${Number(user.id)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    [type === 'front' ? 'frontImage' : 'backImage']: base64Data,
                    fileName: fileName,
                    storagePath: storagePath,
                    mimeType: file.type,
                }),
            });

            // Read response once
            const responseText = await uploadResponse.text();
            
            if (!uploadResponse.ok) {
                let errorMessage = 'Failed to upload image';
                try {
                    const errorData = JSON.parse(responseText);
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    // If response is not JSON, use the text directly
                    errorMessage = `Server error: ${uploadResponse.status} - ${responseText.substring(0, 100)}`;
                }
                throw new Error(errorMessage);
            }

            // Parse successful response
            const result = JSON.parse(responseText);

            // Reload personal ID data
            await loadPersonalID(Number(user.id));
        } catch (error: any) {
            setError(error.message || 'Failed to upload personal ID image');
            console.error('Personal ID upload error:', error);
        } finally {
            setIsUploadingPersonalID(false);
        }
    };

    const handlePersonalIDDelete = async (type: 'front' | 'back') => {
        if (!user?.id || !personalID) return;
        
        if (!confirm(`Are you sure you want to delete the ${type === 'front' ? 'front' : 'back'} side image?`)) {
            return;
        }

        setIsUploadingPersonalID(true);
        setError('');

        try {
            const token = localStorage.getItem('nobleco_auth_token');
            const response = await fetch(`/api/user-personal-ids?userId=${Number(user.id)}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete image');
            }

            // Update local state
            setPersonalID(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    [type === 'front' ? 'front_image_url' : 'back_image_url']: undefined,
                    [type === 'front' ? 'front_image_path' : 'back_image_path']: undefined,
                };
            });
        } catch (error: any) {
            setError(error.message || 'Failed to delete personal ID image');
            console.error('Personal ID delete error:', error);
        } finally {
            setIsUploadingPersonalID(false);
        }
    };

    const handlePersonalIDFileSelect = (type: 'front' | 'back', e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handlePersonalIDUpload(type, file);
        }
        // Reset input
        e.target.value = '';
    };

    return (
        <>
            {open && !showQrModal && (
                <>
                    <div className="modal-overlay" onClick={onClose} />
                    <div className="profile-modal-card" role="dialog" aria-modal="true">
                        <div className="modal-header">
                            <span>Your Profile</span>
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
                                    alt={user.name || 'avatar'}
                                    style={isEditing ? {
                                        ...getAvatarViewportStyles(avatar, 180),
                                        minWidth: '180px',
                                        minHeight: '180px'
                                    } : getAvatarViewportStyles(avatar, 120)}
                                    onError={(e) => {
                                        // Fallback to default if image fails to load
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const parent = target.parentElement;
                                        if (parent && user.name) {
                                            const fallback = document.createElement('div');
                                            fallback.className = 'profile-avatar-large';
                                            fallback.style.cssText = `
                                                width: ${isEditing ? '180px' : '120px'};
                                                height: ${isEditing ? '180px' : '120px'};
                                                border-radius: 50%;
                                                background-color: ${getAvatarColor(user.name)};
                                                display: flex;
                                                align-items: center;
                                                justify-content: center;
                                                color: white;
                                                font-size: ${isEditing ? '72px' : '48px'};
                                                font-weight: 600;
                                                text-transform: uppercase;
                                            `;
                                            fallback.textContent = getAvatarInitial(user.name);
                                            parent.appendChild(fallback);
                                        }
                                    }}
                                />
                            ) : (
                                <div 
                                    className="profile-avatar-large"
                                    style={{
                                        width: isEditing ? '180px' : '120px',
                                        height: isEditing ? '180px' : '120px',
                                        borderRadius: '50%',
                                        backgroundColor: getAvatarColor(user.name || 'User'),
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
                                    {getAvatarInitial(user.name || 'User')}
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
                        <div className="profile-level-info">
                            <span className={getLevelBadgeClass(user.level)}>
                                {user.level === 'unit manager' ? 'Unit Manager' : 
                                 user.level === 'brand manager' ? 'Brand Manager' : 
                                 user.level ? user.level.charAt(0).toUpperCase() + user.level.slice(1) : 'Guest'}
                            </span>
                            <div className="profile-points">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                                {user.points || 0} Points
                            </div>
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
                                    <div className="profile-field-value">{user.phone || 'Not set'}</div>
                                </div>
                                <div className="profile-field refer-code-field">
                                    <label>Refer Code</label>
                                    <p className="field-description">
                                        Share your unique refer code to invite others to become your junior advisor.
                                    </p>
                                    <div className="refer-code-container">
                                        <div className={user.refer_code ? "refer-code-value" : "profile-field-value non-editable"}>
                                            <span>{user.refer_code || 'N/A'}</span>
                                            {user.refer_code && (
                                                <button 
                                                    className="copy-btn" 
                                                    title="Copy refer code"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(user.refer_code || '');
                                                    }}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                        {qrCodeUrl && (
                                            <div className="qr-code-section">
                                                
                                                <div className="qr-code-preview">
                                                    <img src={qrCodeUrl} alt="QR Code" />
                                                    <div className="qr-actions">
                                                        <button 
                                                            className="qr-action-btn" 
                                                            title="Expand QR Code"
                                                            onClick={expandQRCode}
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <polyline points="15 3 21 3 21 9" />
                                                                <polyline points="9 21 3 21 3 15" />
                                                                <line x1="21" y1="3" x2="14" y2="10" />
                                                                <line x1="3" y1="21" x2="10" y2="14" />
                                                            </svg>
                                                        </button>
                                                        <button 
                                                            className="qr-action-btn" 
                                                            title="Download QR Code"
                                                            onClick={downloadQRCode}
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                                <polyline points="7 10 12 15 17 10" />
                                                                <line x1="12" y1="15" x2="12" y2="3" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
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
                                <div className="profile-field profile-field-full">
                                    <label>Location</label>
                                    {isEditing ? (
                                        <div className="location-dropdown-wrapper" ref={locationDropdownRef}>
                                            <button
                                                type="button"
                                                className="location-dropdown-toggle"
                                                onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                                            >
                                                <span>{formData.location || 'Select Country'}</span>
                                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M6 9L1 4h10z" />
                                                </svg>
                                            </button>
                                            {showLocationDropdown && (
                                                <div className="location-dropdown-menu">
                                                    <div className="location-dropdown-options">
                                                        <button
                                                            type="button"
                                                            className={`location-dropdown-option ${!formData.location ? 'selected' : ''}`}
                                                            onClick={() => {
                                                                setFormData({ ...formData, location: '' });
                                                                setShowLocationDropdown(false);
                                                            }}
                                                        >
                                                            Select Country
                                                        </button>
                                                        {['Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Australia', 'Austria', 'Bangladesh', 'Belgium', 'Brazil', 'Canada', 'Chile', 'China', 'Colombia', 'Czech Republic', 'Denmark', 'Egypt', 'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Japan', 'Kenya', 'Malaysia', 'Mexico', 'Netherlands', 'New Zealand', 'Nigeria', 'Norway', 'Pakistan', 'Philippines', 'Poland', 'Portugal', 'Romania', 'Russia', 'Saudi Arabia', 'Singapore', 'South Africa', 'South Korea', 'Spain', 'Sweden', 'Switzerland', 'Thailand', 'Turkey', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Vietnam', 'Other'].map((country) => (
                                                            <button
                                                                key={country}
                                                                type="button"
                                                                className={`location-dropdown-option ${formData.location === country ? 'selected' : ''}`}
                                                                onClick={() => {
                                                                    setFormData({ ...formData, location: country });
                                                                    setShowLocationDropdown(false);
                                                                }}
                                                            >
                                                                {country}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="profile-field-value">{formData.location || 'Not set'}</div>
                                    )}
                                </div>
                                
                                {/* Personal ID Field */}
                                <div className="profile-field profile-field-full personal-id-field">
                                    <label>Personal ID</label>
                                    <div className="personal-id-container">
                                        {/* Front Side */}
                                        <div className="personal-id-item">
                                            <div className="personal-id-label">Front Side</div>
                                            {personalID?.front_image_url ? (
                                                <div className="personal-id-image-wrapper">
                                                    <img 
                                                        src={personalID.front_image_url} 
                                                        alt="Front side of personal ID"
                                                        className="personal-id-thumbnail"
                                                    />
                                                    {isEditing && (
                                                        <div className="personal-id-actions">
                                                            <button
                                                                className="personal-id-expand-btn"
                                                                onClick={() => setShowPersonalIDExpanded({ type: 'front' })}
                                                                title="Expand image"
                                                            >
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <polyline points="15 3 21 3 21 9" />
                                                                    <polyline points="9 21 3 21 3 15" />
                                                                    <line x1="21" y1="3" x2="14" y2="10" />
                                                                    <line x1="3" y1="21" x2="10" y2="14" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                className="personal-id-delete-btn"
                                                                onClick={() => handlePersonalIDDelete('front')}
                                                                disabled={isUploadingPersonalID}
                                                                title="Delete image"
                                                            >
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <polyline points="3 6 5 6 21 6" />
                                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    )}
                                                    {!isEditing && (
                                                        <button
                                                            className="personal-id-expand-btn"
                                                            onClick={() => setShowPersonalIDExpanded({ type: 'front' })}
                                                            title="Expand image"
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <polyline points="15 3 21 3 21 9" />
                                                                <polyline points="9 21 3 21 3 15" />
                                                                <line x1="21" y1="3" x2="14" y2="10" />
                                                                <line x1="3" y1="21" x2="10" y2="14" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                isEditing ? (
                                                    <label className="personal-id-upload-area">
                                                        <input
                                                            ref={frontImageInputRef}
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => handlePersonalIDFileSelect('front', e)}
                                                            disabled={isUploadingPersonalID}
                                                            style={{ display: 'none' }}
                                                        />
                                                        <div className="personal-id-upload-placeholder">
                                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                                <polyline points="17 8 12 3 7 8" />
                                                                <line x1="12" y1="3" x2="12" y2="15" />
                                                            </svg>
                                                            <span>Upload Front</span>
                                                        </div>
                                                    </label>
                                                ) : (
                                                    <div className="personal-id-empty">Not uploaded</div>
                                                )
                                            )}
                                        </div>

                                        {/* Back Side */}
                                        <div className="personal-id-item">
                                            <div className="personal-id-label">Back Side</div>
                                            {personalID?.back_image_url ? (
                                                <div className="personal-id-image-wrapper">
                                                    <img 
                                                        src={personalID.back_image_url} 
                                                        alt="Back side of personal ID"
                                                        className="personal-id-thumbnail"
                                                    />
                                                    {isEditing && (
                                                        <div className="personal-id-actions">
                                                            <button
                                                                className="personal-id-expand-btn"
                                                                onClick={() => setShowPersonalIDExpanded({ type: 'back' })}
                                                                title="Expand image"
                                                            >
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <polyline points="15 3 21 3 21 9" />
                                                                    <polyline points="9 21 3 21 3 15" />
                                                                    <line x1="21" y1="3" x2="14" y2="10" />
                                                                    <line x1="3" y1="21" x2="10" y2="14" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                className="personal-id-delete-btn"
                                                                onClick={() => handlePersonalIDDelete('back')}
                                                                disabled={isUploadingPersonalID}
                                                                title="Delete image"
                                                            >
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <polyline points="3 6 5 6 21 6" />
                                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    )}
                                                    {!isEditing && (
                                                        <button
                                                            className="personal-id-expand-btn"
                                                            onClick={() => setShowPersonalIDExpanded({ type: 'back' })}
                                                            title="Expand image"
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <polyline points="15 3 21 3 21 9" />
                                                                <polyline points="9 21 3 21 3 15" />
                                                                <line x1="21" y1="3" x2="14" y2="10" />
                                                                <line x1="3" y1="21" x2="10" y2="14" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                isEditing ? (
                                                    <label className="personal-id-upload-area">
                                                        <input
                                                            ref={backImageInputRef}
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => handlePersonalIDFileSelect('back', e)}
                                                            disabled={isUploadingPersonalID}
                                                            style={{ display: 'none' }}
                                                        />
                                                        <div className="personal-id-upload-placeholder">
                                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                                <polyline points="17 8 12 3 7 8" />
                                                                <line x1="12" y1="3" x2="12" y2="15" />
                                                            </svg>
                                                            <span>Upload Back</span>
                                                        </div>
                                                    </label>
                                                ) : (
                                                    <div className="personal-id-empty">Not uploaded</div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && !showAvatarCrop && (
                        <div style={{ 
                            marginTop: '16px', 
                            padding: '12px', 
                            background: '#fee2e2', 
                            border: '1px solid #fca5a5',
                            borderRadius: '8px',
                            color: '#dc2626',
                            textAlign: 'center',
                            fontSize: '0.875rem'
                        }}>
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
                </>
            )}

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

            {/* Personal ID Expanded Modal */}
            {showPersonalIDExpanded && personalID && (
                <div className="modal-overlay personal-id-expanded-overlay" onClick={() => setShowPersonalIDExpanded(null)}>
                    <div className="personal-id-expanded-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="personal-id-expanded-header">
                            <h3>{showPersonalIDExpanded.type === 'front' ? 'Front Side' : 'Back Side'} - Personal ID</h3>
                            <button className="modal-close" onClick={() => setShowPersonalIDExpanded(null)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <div className="personal-id-expanded-content">
                            <img 
                                src={showPersonalIDExpanded.type === 'front' ? personalID.front_image_url : personalID.back_image_url} 
                                alt={`${showPersonalIDExpanded.type === 'front' ? 'Front' : 'Back'} side of personal ID`}
                                className="personal-id-expanded-image"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* QR Code Expanded Modal */}
            {showQrModal && user && (
                <div className="modal-overlay qr-modal-overlay" onClick={closeQrModal}>
                    <div className="qr-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="qr-modal-header">
                            <h3>Referral QR Code</h3>
                            <button className="close-btn" onClick={closeQrModal}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <div className="qr-modal-content">
                            <div className="qr-code-large">
                                <img src={qrCodeUrl} alt="Referral QR Code" />
                            </div>
                            <p className="qr-modal-description">
                                Share this QR code with others to invite them to sign up with your referral code: <strong>{user?.refer_code}</strong>
                            </p>
                            <button className="btn-primary" onClick={downloadQRCode} style={{ width: '100%', marginTop: '16px' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                Download QR Code
                            </button>
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
