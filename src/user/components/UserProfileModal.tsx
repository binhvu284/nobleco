import { useState, useEffect, useRef } from 'react';
import { getCurrentUser, type User } from '../../auth';
import QRCode from 'qrcode';
import { uploadUserAvatar, type UserAvatar } from '../../utils/avatarUpload';
import { getAvatarInitial, getAvatarColor } from '../../utils/avatarUtils';

export default function UserProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: ''
    });
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [showQrModal, setShowQrModal] = useState(false);
    const qrCanvasRef = useRef<HTMLCanvasElement>(null);
    const [avatar, setAvatar] = useState<UserAvatar | null>(null);
    const [showAvatarCrop, setShowAvatarCrop] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string>('');
    const [cropData, setCropData] = useState({ x: 0, y: 0, width: 200, height: 200 });
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const avatarImageRef = useRef<HTMLImageElement>(null);
    const cropContainerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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
                    phone: freshUser.phone || '',
                    address: freshUser.address || ''
                });
                
                // Load avatar
                await loadUserAvatar(freshUser.id);
                
                // Update avatar state if user data includes avatar URL
                if (freshUser.avatar) {
                    setAvatar({ url: freshUser.avatar } as UserAvatar);
                }
                
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
                    phone: currentUser.phone || '',
                    address: currentUser.address || ''
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
                    phone: currentUser.phone || '',
                    address: currentUser.address || ''
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
                    phone: formData.phone,
                    address: formData.address,
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

    const handleCropConfirm = async () => {
        if (!avatarFile || !user?.id || !avatarImageRef.current) {
            setError('Missing required data. Please try again.');
            return;
        }

        setIsUploadingAvatar(true);
        setError(''); // Clear any previous errors
        
        try {
            // Get display dimensions for proper scaling
            const imgRect = avatarImageRef.current.getBoundingClientRect();
            const displaySize = {
                width: imgRect.width,
                height: imgRect.height
            };

            if (displaySize.width === 0 || displaySize.height === 0) {
                throw new Error('Image dimensions are invalid. Please try again.');
            }

            const uploadedAvatar = await uploadUserAvatar(user.id, avatarFile, {
                cropData: {
                    ...cropData,
                    displaySize // Pass display size for proper scaling
                } as any
            });
            
            if (!uploadedAvatar || !uploadedAvatar.url) {
                throw new Error('Upload succeeded but avatar data is missing.');
            }
            
            setAvatar(uploadedAvatar);
            setShowAvatarCrop(false);
            setAvatarFile(null);
            setAvatarPreview('');
            setCropData({ x: 0, y: 0, width: 200, height: 200 });
            
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
        setCropData({ x: 0, y: 0, width: 200, height: 200 });
    };

    const handleCropMouseDown = (e: React.MouseEvent) => {
        if (!cropContainerRef.current) return;
        setIsDragging(true);
        const rect = cropContainerRef.current.getBoundingClientRect();
        setDragStart({
            x: e.clientX - rect.left - cropData.x,
            y: e.clientY - rect.top - cropData.y
        });
    };

    const handleCropMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !cropContainerRef.current || !avatarImageRef.current) return;
        const rect = cropContainerRef.current.getBoundingClientRect();
        const imgRect = avatarImageRef.current.getBoundingClientRect();
        
        const imgDisplayWidth = imgRect.width;
        const imgDisplayHeight = imgRect.height;
        
        // Calculate new position
        let newX = e.clientX - rect.left - dragStart.x;
        let newY = e.clientY - rect.top - dragStart.y;
        
        // Constrain to image bounds
        newX = Math.max(0, Math.min(newX, imgDisplayWidth - cropData.width));
        newY = Math.max(0, Math.min(newY, imgDisplayHeight - cropData.height));
        
        setCropData(prev => ({ ...prev, x: newX, y: newY }));
    };

    const handleCropMouseUp = () => {
        setIsDragging(false);
    };

    const handleCropResize = (direction: string, delta: number) => {
        setCropData(prev => {
            let newCrop = { ...prev };
            const minSize = 100;
            const maxSize = 400;
            
            if (direction.includes('w')) {
                newCrop.width = Math.max(minSize, Math.min(maxSize, prev.width + delta));
            }
            if (direction.includes('h')) {
                newCrop.height = Math.max(minSize, Math.min(maxSize, prev.height + delta));
            }
            if (direction.includes('x')) {
                newCrop.x = Math.max(0, prev.x - delta);
            }
            if (direction.includes('y')) {
                newCrop.y = Math.max(0, prev.y - delta);
            }
            
            return newCrop;
        });
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
                        <div className="profile-avatar-wrapper" style={{ position: 'relative' }}>
                            {avatar?.url ? (
                                <img 
                                    className="profile-avatar-large" 
                                    src={avatar.url} 
                                    alt={user.name || 'avatar'}
                                    onError={(e) => {
                                        // Fallback to default if image fails to load
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const parent = target.parentElement;
                                        if (parent && user.name) {
                                            const fallback = document.createElement('div');
                                            fallback.className = 'profile-avatar-large';
                                            fallback.style.cssText = `
                                                width: 120px;
                                                height: 120px;
                                                border-radius: 50%;
                                                background-color: ${getAvatarColor(user.name)};
                                                display: flex;
                                                align-items: center;
                                                justify-content: center;
                                                color: white;
                                                font-size: 48px;
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
                                        width: '120px',
                                        height: '120px',
                                        borderRadius: '50%',
                                        backgroundColor: getAvatarColor(user.name || 'User'),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: '48px',
                                        fontWeight: 600,
                                        textTransform: 'uppercase'
                                    }}
                                >
                                    {getAvatarInitial(user.name || 'User')}
                                </div>
                            )}
                            {isEditing && (
                                <label 
                                    className="avatar-upload-btn"
                                    style={{
                                        position: 'absolute',
                                        bottom: '8px',
                                        right: '8px',
                                        background: '#3b82f6',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '36px',
                                        height: '36px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                                    }}
                                >
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarFileSelect}
                                        style={{ display: 'none' }}
                                        disabled={isUploadingAvatar}
                                    />
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                </label>
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
                                <div className="profile-field">
                                    <label>Phone Number</label>
                                    {isEditing ? (
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="Enter your phone number"
                                        />
                                    ) : (
                                        <div className="profile-field-value">{formData.phone || 'Not set'}</div>
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
                <div className="modal-overlay" onClick={handleCropCancel} style={{ zIndex: 10000 }}>
                    <div 
                        className="profile-modal-card" 
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: '600px', width: '90%' }}
                    >
                        <div className="modal-header">
                            <span>Crop Avatar</span>
                            <button className="modal-close" onClick={handleCropCancel}>✕</button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <p style={{ marginBottom: '16px', fontSize: '0.875rem', color: '#6b7280', textAlign: 'center' }}>
                                Drag the crop area to reposition, or use the corner handles to resize
                            </p>
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
                                    maxWidth: '500px',
                                    margin: '0 auto',
                                    border: '2px solid #e5e7eb',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    cursor: isDragging ? 'grabbing' : 'grab',
                                    backgroundColor: '#f9fafb'
                                }}
                                onMouseDown={handleCropMouseDown}
                                onMouseMove={handleCropMouseMove}
                                onMouseUp={handleCropMouseUp}
                                onMouseLeave={handleCropMouseUp}
                            >
                                <img
                                    ref={avatarImageRef}
                                    src={avatarPreview}
                                    alt="Preview"
                                    style={{
                                        width: '100%',
                                        height: 'auto',
                                        display: 'block'
                                    }}
                                    draggable={false}
                                    onLoad={(e) => {
                                        // Initialize crop area when image loads
                                        const img = e.currentTarget;
                                        // Use naturalWidth/naturalHeight for actual dimensions, but calculate based on displayed size
                                        const displayedWidth = img.clientWidth || img.offsetWidth;
                                        const displayedHeight = img.clientHeight || img.offsetHeight;
                                        
                                        if (displayedWidth > 0 && displayedHeight > 0) {
                                            // Initialize to center square (80% of smaller dimension)
                                            const size = Math.max(200, Math.min(displayedWidth, displayedHeight) * 0.8);
                                            const x = Math.max(0, (displayedWidth - size) / 2);
                                            const y = Math.max(0, (displayedHeight - size) / 2);
                                            
                                            setCropData({ 
                                                x: Math.max(0, Math.min(x, displayedWidth - size)), 
                                                y: Math.max(0, Math.min(y, displayedHeight - size)), 
                                                width: Math.min(size, displayedWidth), 
                                                height: Math.min(size, displayedHeight)
                                            });
                                        }
                                    }}
                                />
                                <div
                                    style={{
                                        position: 'absolute',
                                        border: '3px solid #3b82f6',
                                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                                        left: `${cropData.x}px`,
                                        top: `${cropData.y}px`,
                                        width: `${cropData.width}px`,
                                        height: `${cropData.height}px`,
                                        cursor: 'move',
                                        boxSizing: 'border-box'
                                    }}
                                >
                                    {/* Resize handles */}
                                    {['nw', 'ne', 'sw', 'se'].map((corner) => (
                                        <div
                                            key={corner}
                                            style={{
                                                position: 'absolute',
                                                width: '12px',
                                                height: '12px',
                                                background: '#3b82f6',
                                                border: '2px solid white',
                                                borderRadius: '50%',
                                                ...(corner === 'nw' && { top: '-6px', left: '-6px', cursor: 'nw-resize' }),
                                                ...(corner === 'ne' && { top: '-6px', right: '-6px', cursor: 'ne-resize' }),
                                                ...(corner === 'sw' && { bottom: '-6px', left: '-6px', cursor: 'sw-resize' }),
                                                ...(corner === 'se' && { bottom: '-6px', right: '-6px', cursor: 'se-resize' })
                                            }}
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                const startX = e.clientX;
                                                const startY = e.clientY;
                                                const startWidth = cropData.width;
                                                const startHeight = cropData.height;
                                                const startXPos = cropData.x;
                                                const startYPos = cropData.y;

                                                const handleMove = (moveE: MouseEvent) => {
                                                    if (!avatarImageRef.current) return;
                                                    const imgRect = avatarImageRef.current.getBoundingClientRect();
                                                    const imgDisplayWidth = imgRect.width;
                                                    const imgDisplayHeight = imgRect.height;
                                                    
                                                    const deltaX = moveE.clientX - startX;
                                                    const deltaY = moveE.clientY - startY;
                                                    
                                                    const minSize = Math.min(100, Math.min(imgDisplayWidth, imgDisplayHeight) * 0.2);
                                                    const maxSize = Math.min(imgDisplayWidth, imgDisplayHeight);
                                                    
                                                    if (corner === 'se') {
                                                        setCropData(prev => ({
                                                            ...prev,
                                                            width: Math.max(minSize, Math.min(maxSize, startWidth + deltaX)),
                                                            height: Math.max(minSize, Math.min(maxSize, startHeight + deltaY))
                                                        }));
                                                    } else if (corner === 'sw') {
                                                        setCropData(prev => ({
                                                            ...prev,
                                                            x: Math.max(0, Math.min(startXPos - deltaX, imgDisplayWidth - (startWidth + deltaX))),
                                                            width: Math.max(minSize, Math.min(maxSize, startWidth + deltaX)),
                                                            height: Math.max(minSize, Math.min(maxSize, startHeight + deltaY))
                                                        }));
                                                    } else if (corner === 'ne') {
                                                        setCropData(prev => ({
                                                            ...prev,
                                                            y: Math.max(0, Math.min(startYPos - deltaY, imgDisplayHeight - (startHeight + deltaY))),
                                                            width: Math.max(minSize, Math.min(maxSize, startWidth + deltaX)),
                                                            height: Math.max(minSize, Math.min(maxSize, startHeight + deltaY))
                                                        }));
                                                    } else if (corner === 'nw') {
                                                        setCropData(prev => ({
                                                            ...prev,
                                                            x: Math.max(0, Math.min(startXPos - deltaX, imgDisplayWidth - (startWidth + deltaX))),
                                                            y: Math.max(0, Math.min(startYPos - deltaY, imgDisplayHeight - (startHeight + deltaY))),
                                                            width: Math.max(minSize, Math.min(maxSize, startWidth + deltaX)),
                                                            height: Math.max(minSize, Math.min(maxSize, startHeight + deltaY))
                                                        }));
                                                    }
                                                };

                                                const handleUp = () => {
                                                    document.removeEventListener('mousemove', handleMove);
                                                    document.removeEventListener('mouseup', handleUp);
                                                };

                                                document.addEventListener('mousemove', handleMove);
                                                document.addEventListener('mouseup', handleUp);
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
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
                                    disabled={isUploadingAvatar || !cropData.width || !cropData.height}
                                    style={{
                                        opacity: (isUploadingAvatar || !cropData.width || !cropData.height) ? 0.6 : 1,
                                        cursor: (isUploadingAvatar || !cropData.width || !cropData.height) ? 'not-allowed' : 'pointer'
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
