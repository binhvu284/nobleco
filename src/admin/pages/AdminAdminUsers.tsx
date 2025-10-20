import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { IconCrown, IconShield, IconTrash2, IconSettings, IconMoreHorizontal, IconPlay, IconPause } from '../components/icons';

interface AdminUser {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'user' | 'coworker';
    points?: number;
    level?: string;
    status: 'active' | 'inactive';
    created_at: string;
    avatar?: string;
    permissions?: string[];
}

export default function AdminAdminUsers() {
    const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
    const [coworkers, setCoworkers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [coworkersLoading, setCoworkersLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [coworkersError, setCoworkersError] = useState<string | null>(null);

    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
    const [userToEdit, setUserToEdit] = useState<AdminUser | null>(null);
    const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

    const fetchAdminUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch('/api/users?type=admin');
            if (!res.ok) throw new Error(`Request failed: ${res.status}`);
            const data = await res.json();
            setAdminUsers(Array.isArray(data) ? data : []);
        } catch (e: any) {
            setError(e?.message || 'Failed to load admin users');
        } finally {
            setLoading(false);
        }
    };

    const fetchCoworkers = async () => {
        try {
            setCoworkersLoading(true);
            setCoworkersError(null);
            const res = await fetch('/api/users?type=coworkers');
            if (!res.ok) throw new Error(`Request failed: ${res.status}`);
            const data = await res.json();
            setCoworkers(Array.isArray(data) ? data : []);
        } catch (e: any) {
            setCoworkersError(e?.message || 'Failed to load coworkers');
        } finally {
            setCoworkersLoading(false);
        }
    };

    useEffect(() => {
        fetchAdminUsers();
        fetchCoworkers();
    }, []);

    const administrators = adminUsers.filter(user => user.role === 'admin');

    const handleDeleteClick = (user: AdminUser) => {
        setUserToDelete(user);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = () => {
        if (userToDelete) {
            setAdminUsers(adminUsers.filter(user => user.id !== userToDelete.id));
            setShowDeleteModal(false);
            setUserToDelete(null);
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
        setUserToDelete(null);
    };

    const handlePermissionClick = (user: AdminUser) => {
        setUserToEdit(user);
        setShowPermissionModal(true);
    };

    const handlePermissionClose = () => {
        setShowPermissionModal(false);
        setUserToEdit(null);
    };

    const handleStatusToggle = async (userId: number, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        
        try {
            const response = await fetch('/api/users', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: userId,
                    status: newStatus
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to update status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                // Update the coworkers list with the new status
                setCoworkers(prevCoworkers => 
                    prevCoworkers.map(coworker => 
                        coworker.id === userId 
                            ? { ...coworker, status: newStatus as 'active' | 'inactive' }
                            : coworker
                    )
                );
            } else {
                throw new Error(result.error || 'Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            // You could add a toast notification here
            alert(`Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const handleDropdownToggle = (userId: number) => {
        setActiveDropdown(activeDropdown === userId ? null : userId);
    };

    const handleDropdownClose = () => {
        setActiveDropdown(null);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };


    const getPermissionLabel = (permission: string) => {
        const labels: { [key: string]: string } = {
            'all': 'Full Access',
            'products': 'Products',
            'category': 'Category',
            'withdraw_request': 'Withdraw Request'
        };
        return labels[permission] || permission;
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (activeDropdown !== null) {
                const target = event.target as HTMLElement;
                if (!target.closest('.action-dropdown')) {
                    setActiveDropdown(null);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeDropdown]);

    return (
        <AdminLayout title="Admin Users">
            <div className="admin-users-page">

                {/* Administrator Section */}
                <div className="administrator-section">
                    <div className="section-header">
                        <div className="section-title">
                            <IconCrown />
                            <h2>Administrator</h2>
                            <span className="role-badge admin">Highest Authority</span>
                        </div>
                    </div>
                    <div className="section-description">
                        <p>Administrators have complete control over the entire system. They can access all features, manage all users, and perform any administrative action without restrictions.</p>
                    </div>
                    
                    <div className="administrator-list">
                        {loading ? (
                            // Loading skeleton
                            Array.from({ length: 2 }).map((_, i) => (
                                <div key={`loading-${i}`} className="administrator-item row-loading">
                                    <div className="admin-avatar">
                                        <div className="skeleton skeleton-circle"></div>
                                    </div>
                                    <div className="admin-details">
                                        <div className="skeleton skeleton-text" style={{ width: '120px', height: '20px' }}></div>
                                        <div className="skeleton skeleton-text" style={{ width: '180px', height: '16px', marginTop: '8px' }}></div>
                                    </div>
                                    <div className="admin-badge">
                                        <div className="skeleton skeleton-badge"></div>
                                    </div>
                                </div>
                            ))
                        ) : error ? (
                            <div className="error-state">
                                <div className="error-icon">⚠️</div>
                                <h3>Error loading administrators</h3>
                                <p>{error}</p>
                                <button className="btn-primary" onClick={fetchAdminUsers}>
                                    Try Again
                                </button>
                            </div>
                        ) : administrators.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">👑</div>
                                <h3>No administrators found</h3>
                                <p>There are currently no administrators in the system.</p>
                            </div>
                        ) : (
                            administrators.map((admin) => (
                                <div key={admin.id} className="administrator-item">
                                    <div className="admin-avatar">
                                        {admin.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                    </div>
                                    <div className="admin-details">
                                        <h3 className="admin-name">{admin.name}</h3>
                                        <p className="admin-email">{admin.email}</p>
                                    </div>
                                    <div className="admin-badge">
                                        <IconCrown />
                                        <span>Administrator</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Co-worker Section */}
                <div className="coworker-section">
                    <div className="section-header">
                        <div className="section-title">
                            <IconShield />
                            <h2>Co-workers</h2>
                            <span className="role-badge coworker">Limited Access</span>
                        </div>
                        <div className="section-stats">
                            {coworkers.length} co-worker{coworkers.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                    <div className="section-description">
                        <p>Co-workers have restricted access to specific features. You can manage their permissions, control what they can access, and remove their admin privileges when needed.</p>
                    </div>

                    <div className="coworker-table-container">
                        {/* Desktop Table */}
                        <div className="table-wrap">
                            <table className="coworker-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {coworkersLoading ? (
                                        // Loading skeleton rows
                                        Array.from({ length: 3 }).map((_, i) => (
                                            <tr key={`loading-${i}`} className="row-loading">
                                                <td>
                                                    <div className="user-info">
                                                        <div className="skeleton skeleton-circle"></div>
                                                        <div className="skeleton skeleton-text" style={{ width: '100px' }}></div>
                                                    </div>
                                                </td>
                                                <td><div className="skeleton skeleton-text" style={{ width: '150px' }}></div></td>
                                                <td><div className="skeleton skeleton-badge"></div></td>
                                                <td><div className="skeleton skeleton-text" style={{ width: '30px' }}></div></td>
                                            </tr>
                                        ))
                                    ) : coworkersError ? (
                                        <tr>
                                            <td colSpan={4} className="error-state">
                                                <div className="error-icon">⚠️</div>
                                                <h3>Error loading coworkers</h3>
                                                <p>{coworkersError}</p>
                                                <button className="btn-primary" onClick={fetchCoworkers}>
                                                    Try Again
                                                </button>
                                            </td>
                                        </tr>
                                    ) : coworkers.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="empty-state">
                                                <div className="empty-icon">👥</div>
                                                <h3>No co-workers found</h3>
                                                <p>There are currently no co-workers in the system.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        coworkers.map((user) => (
                                            <tr key={user.id}>
                                                <td>
                                                    <div className="user-info">
                                                        <div className="user-avatar">
                                                            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                        </div>
                                                        <span>{user.name}</span>
                                                    </div>
                                                </td>
                                                <td>{user.email}</td>
                                                <td>
                                                    <span className={`status-badge ${user.status}`}>
                                                        {user.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="action-dropdown">
                                                        <button 
                                                            className="btn-more"
                                                            onClick={() => handleDropdownToggle(user.id)}
                                                            title="More Actions"
                                                        >
                                                            <IconMoreHorizontal />
                                                        </button>
                                                        {activeDropdown === user.id && (
                                                            <div className="dropdown-menu dropdown-menu-up">
                                                                <button 
                                                                    className="dropdown-item"
                                                                    onClick={() => {
                                                                        handlePermissionClick(user);
                                                                        handleDropdownClose();
                                                                    }}
                                                                >
                                                                    <IconSettings />
                                                                    Permissions
                                                                </button>
                                                                <button 
                                                                    className="dropdown-item"
                                                                    onClick={() => {
                                                                        handleStatusToggle(user.id, user.status);
                                                                        handleDropdownClose();
                                                                    }}
                                                                >
                                                                    {user.status === 'active' ? <IconPause /> : <IconPlay />}
                                                                    {user.status === 'active' ? 'Deactivate' : 'Activate'}
                                                                </button>
                                                                <button 
                                                                    className="dropdown-item delete"
                                                                    onClick={() => {
                                                                        handleDeleteClick(user);
                                                                        handleDropdownClose();
                                                                    }}
                                                                >
                                                                    <IconTrash2 />
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="coworker-mobile-cards">
                            {coworkersLoading ? (
                                // Loading skeleton cards
                                Array.from({ length: 3 }).map((_, i) => (
                                    <div key={`loading-${i}`} className="coworker-mobile-card">
                                        <div className="coworker-card-header">
                                            <div className="skeleton skeleton-circle" style={{ width: '40px', height: '40px' }}></div>
                                            <div className="coworker-card-info">
                                                <div className="skeleton skeleton-text" style={{ width: '120px', height: '16px' }}></div>
                                                <div className="skeleton skeleton-text" style={{ width: '180px', height: '14px', marginTop: '4px' }}></div>
                                            </div>
                                        </div>
                                        <div className="coworker-card-footer">
                                            <div className="skeleton skeleton-badge" style={{ width: '60px', height: '24px' }}></div>
                                            <div className="skeleton skeleton-text" style={{ width: '30px', height: '30px' }}></div>
                                        </div>
                                    </div>
                                ))
                            ) : coworkersError ? (
                                <div className="error-state">
                                    <div className="error-icon">⚠️</div>
                                    <h3>Error loading coworkers</h3>
                                    <p>{coworkersError}</p>
                                    <button className="btn-primary" onClick={fetchCoworkers}>
                                        Try Again
                                    </button>
                                </div>
                            ) : coworkers.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">👥</div>
                                    <h3>No co-workers found</h3>
                                    <p>There are currently no co-workers in the system.</p>
                                </div>
                            ) : (
                                coworkers.map((user) => (
                                    <div key={user.id} className="coworker-mobile-card">
                                        {/* Three-dot button positioned at top right */}
                                        <div className="coworker-card-actions">
                                            <div className="action-dropdown">
                                                <button 
                                                    className="btn-more"
                                                    onClick={() => handleDropdownToggle(user.id)}
                                                    title="More Actions"
                                                >
                                                    <IconMoreHorizontal />
                                                </button>
                                                {activeDropdown === user.id && (
                                                    <div className="dropdown-menu">
                                                        <button 
                                                            className="dropdown-item"
                                                            onClick={() => {
                                                                handlePermissionClick(user);
                                                                handleDropdownClose();
                                                            }}
                                                        >
                                                            <IconSettings />
                                                            Permissions
                                                        </button>
                                                        <button 
                                                            className="dropdown-item"
                                                            onClick={() => {
                                                                handleStatusToggle(user.id, user.status);
                                                                handleDropdownClose();
                                                            }}
                                                        >
                                                            {user.status === 'active' ? <IconPause /> : <IconPlay />}
                                                            {user.status === 'active' ? 'Deactivate' : 'Activate'}
                                                        </button>
                                                        <button 
                                                            className="dropdown-item delete"
                                                            onClick={() => {
                                                                handleDeleteClick(user);
                                                                handleDropdownClose();
                                                            }}
                                                        >
                                                            <IconTrash2 />
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="coworker-card-header">
                                            <div className="coworker-card-avatar">
                                                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                            </div>
                                            <div className="coworker-card-info">
                                                <h3 className="coworker-card-name">{user.name}</h3>
                                                <p className="coworker-card-email">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="coworker-card-footer">
                                            <div className="coworker-card-status">
                                                <span className="coworker-card-status-label">Status:</span>
                                                <span className={`status-badge ${user.status}`}>
                                                    {user.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteModal && userToDelete && (
                    <div className="modal-overlay" onClick={handleDeleteCancel}>
                        <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Delete Co-worker</h2>
                                <button 
                                    className="modal-close"
                                    onClick={handleDeleteCancel}
                                >
                                    ×
                                </button>
                            </div>
                            <div className="modal-body">
                                <p>Are you sure you want to delete <strong>{userToDelete.name}</strong>?</p>
                                <p className="warning-text">This action cannot be undone and will revoke all admin access.</p>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    className="btn-secondary"
                                    onClick={handleDeleteCancel}
                                >
                                    Cancel
                                </button>
                                <button 
                                    className="btn-danger"
                                    onClick={handleDeleteConfirm}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Permission Settings Modal */}
                {showPermissionModal && userToEdit && (
                    <div className="modal-overlay" onClick={handlePermissionClose}>
                        <div className="modal-content permission-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Permission Settings</h2>
                                <button 
                                    className="modal-close"
                                    onClick={handlePermissionClose}
                                >
                                    ×
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="permission-settings">
                                    <h3>Edit permissions for {userToEdit.name}</h3>
                                    <div className="permission-options">
                                        <label className="permission-option">
                                            <input type="checkbox" defaultChecked={userToEdit.permissions?.includes('products') || false} />
                                            <span>Products Management</span>
                                        </label>
                                        <label className="permission-option">
                                            <input type="checkbox" defaultChecked={userToEdit.permissions?.includes('category') || false} />
                                            <span>Category Management</span>
                                        </label>
                                        <label className="permission-option">
                                            <input type="checkbox" defaultChecked={userToEdit.permissions?.includes('withdraw_request') || false} />
                                            <span>Withdraw Request Management</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    className="btn-secondary"
                                    onClick={handlePermissionClose}
                                >
                                    Cancel
                                </button>
                                <button 
                                    className="btn-primary"
                                    onClick={handlePermissionClose}
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}