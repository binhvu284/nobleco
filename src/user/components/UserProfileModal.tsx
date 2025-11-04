import { useState, useEffect, useRef } from 'react';
import { getCurrentUser, type User } from '../../auth';
import QRCode from 'qrcode';

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
                        <div className="profile-avatar-wrapper">
                            <img 
                                className="profile-avatar-large" 
                                src="https://i.pravatar.cc/150?img=8" 
                                alt="avatar" 
                            />
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
                                        Share your unique refer code to invite others to become your inferior.
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
                    {error && (
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
        </>
    );
}
