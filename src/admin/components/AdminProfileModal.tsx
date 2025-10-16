import { useState, useEffect } from 'react';
import { getCurrentUser, type User } from '../../auth';

export default function AdminProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [user, setUser] = useState<User | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: ''
    });

    useEffect(() => {
        if (open) {
            // Always get fresh data from localStorage when modal opens
            const currentUser = getCurrentUser();
            setUser(currentUser);
            if (currentUser) {
                setFormData({
                    name: currentUser.name || '',
                    phone: currentUser.phone || '',
                    address: currentUser.address || ''
                });
            }
            // Reset editing state
            setIsEditing(false);
            setError('');
        }
    }, [open]);

    const handleSave = async () => {
        if (!user?.id) return;
        
        setIsSaving(true);
        setError('');
        
        try {
            const response = await fetch('/api/users/profile', {
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

    if (!open || !user) return null;

    return (
        <>
            <div className="modal-overlay" onClick={onClose} />
            <div className="profile-modal-card" role="dialog" aria-modal="true">
                <div className="modal-header">
                    <span>Admin Profile</span>
                    <button className="modal-close" aria-label="Close" onClick={onClose}>✕</button>
                </div>
                
                <div className="profile-content">
                    {/* Avatar Section */}
                    <div className="profile-avatar-section">
                        <div className="profile-avatar-wrapper">
                            <img 
                                className="profile-avatar-large" 
                                src="/images/logo.png" 
                                alt="avatar" 
                            />
                        </div>
                        <div className="profile-level-info">
                            <span className="level-badge level-admin">
                                Administrator
                            </span>
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
                                    <label>Role</label>
                                    <div className="profile-field-value non-editable">Administrator</div>
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
            </div>
        </>
    );
}
