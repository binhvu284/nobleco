import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { IconCrown, IconShield, IconTrash2, IconSettings, IconSearch, IconFilter, IconPlus, IconMoreHorizontal } from '../components/icons';

interface AdminUser {
    id: number;
    name: string;
    email: string;
    role: 'administrator' | 'coworker';
    permissions: string[];
    lastActive: string;
    status: 'active' | 'inactive';
    avatar?: string;
}

export default function AdminAdminUsers() {
    const [adminUsers, setAdminUsers] = useState<AdminUser[]>([
        {
            id: 1,
            name: 'Super Lord',
            email: 'superlord@nobleco.com',
            role: 'administrator',
            permissions: ['all'],
            lastActive: '2024-02-20',
            status: 'active'
        },
        {
            id: 5,
            name: 'Sarah Admin',
            email: 'sarah.admin@nobleco.com',
            role: 'administrator',
            permissions: ['all'],
            lastActive: '2024-02-19',
            status: 'active'
        },
        {
            id: 6,
            name: 'Michael Director',
            email: 'michael.director@nobleco.com',
            role: 'administrator',
            permissions: ['all'],
            lastActive: '2024-02-18',
            status: 'active'
        },
        {
            id: 2,
            name: 'Alice Johnson',
            email: 'alice@nobleco.com',
            role: 'coworker',
            permissions: ['products', 'category', 'withdraw_request'],
            lastActive: '2024-02-19',
            status: 'active'
        },
        {
            id: 3,
            name: 'Bob Brown',
            email: 'bob@nobleco.com',
            role: 'coworker',
            permissions: ['products', 'category'],
            lastActive: '2024-02-18',
            status: 'active'
        },
        {
            id: 4,
            name: 'Charlie Wilson',
            email: 'charlie@nobleco.com',
            role: 'coworker',
            permissions: ['withdraw_request'],
            lastActive: '2024-02-15',
            status: 'inactive'
        }
    ]);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
    const [userToEdit, setUserToEdit] = useState<AdminUser | null>(null);
    const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

    const administrators = adminUsers.filter(user => user.role === 'administrator');
    const coworkers = adminUsers.filter(user => user.role === 'coworker');

    const filteredCoworkers = coworkers.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                {/* Header */}
                <div className="admin-users-header">
                    <div className="admin-users-header-info">
                        <h1>Admin Users Management</h1>
                        <p>Manage administrator and co-worker access permissions</p>
                    </div>
                    <button className="btn-add-user" title="Add New Admin User">
                        <IconPlus />
                        Add User
                    </button>
                </div>

                {/* Search and Filter Bar */}
                <div className="admin-users-toolbar">
                    <div className="search-box">
                        <IconSearch />
                        <input
                            type="text"
                            placeholder="Search co-workers by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="filter-controls">
                        <button className="filter-btn">
                            <IconFilter />
                            Filter
                        </button>
                    </div>
                </div>

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
                        {administrators.map((admin) => (
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
                        ))}
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
                        <div className="table-wrap">
                            <table className="coworker-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Last Active</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCoworkers.map((user) => (
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
                                            <td>{formatDate(user.lastActive)}</td>
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
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Empty State */}
                    {filteredCoworkers.length === 0 && (
                        <div className="empty-state">
                            <div className="empty-icon">👥</div>
                            <h3>No co-workers found</h3>
                            <p>Try adjusting your search criteria or add a new co-worker.</p>
                        </div>
                    )}
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
                                            <input type="checkbox" defaultChecked={userToEdit.permissions.includes('products')} />
                                            <span>Products Management</span>
                                        </label>
                                        <label className="permission-option">
                                            <input type="checkbox" defaultChecked={userToEdit.permissions.includes('category')} />
                                            <span>Category Management</span>
                                        </label>
                                        <label className="permission-option">
                                            <input type="checkbox" defaultChecked={userToEdit.permissions.includes('withdraw_request')} />
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