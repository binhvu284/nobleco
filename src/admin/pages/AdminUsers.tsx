import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../components/AdminLayout';

type User = {
    id: string | number;
    email: string;
    name?: string;
    role?: string;
    points?: number;
    level?: string;
    status?: string;
    created_at?: string;
};

type Level = 'guest' | 'member' | 'unit manager' | 'brand manager';
type Status = 'active' | 'inactive';
type Row = {
    id: string | number;
    name: string;
    email: string;
    level: Level;
    points: number;
    status: Status;
    createdAt: string;
};

export default function AdminUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [menuOpenId, setMenuOpenId] = useState<string | number | null>(null);
    
    // Search and filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [filterLevel, setFilterLevel] = useState<Level | 'all'>('all');
    const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all');
    const [filterDate, setFilterDate] = useState<string>('');
    const [viewMode, setViewMode] = useState<'table' | 'list'>('table');

    // Mobile states
    const [filterPopupOpen, setFilterPopupOpen] = useState(false);

    // Modal states
    const [deleteModal, setDeleteModal] = useState<{ show: boolean; userId: string | number | null; userEmail: string }>({ 
        show: false, 
        userId: null, 
        userEmail: '' 
    });
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/users');
            if (!res.ok) throw new Error(`Request failed: ${res.status}`);
            const data = await res.json();
            setUsers(Array.isArray(data) ? data : []);
        } catch (e: any) {
            setError(e?.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;
        (async () => {
            await fetchUsers();
        })();
        return () => { cancelled = true; };
    }, []);

    const openDeleteModal = (userId: string | number, userEmail: string) => {
        setDeleteModal({ show: true, userId, userEmail });
        setMenuOpenId(null);
    };

    const closeDeleteModal = () => {
        setDeleteModal({ show: false, userId: null, userEmail: '' });
    };

    const updateUserStatus = async (userId: string | number, newStatus: Status) => {
        setIsUpdatingStatus(true);
        setMenuOpenId(null);
        try {
            const res = await fetch('/api/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: userId, status: newStatus }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to update user status');
            }

            setSuccessMessage(`User status updated to ${newStatus} successfully`);
            setTimeout(() => setSuccessMessage(null), 3000);
            await fetchUsers();
        } catch (e: any) {
            setErrorMessage(`Error updating status: ${e.message}`);
            setTimeout(() => setErrorMessage(null), 4000);
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteModal.userId) return;

        setIsDeleting(true);
        try {
            const res = await fetch('/api/users', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: deleteModal.userId }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to delete user');
            }

            // Close modal and show success message
            closeDeleteModal();
            setSuccessMessage(`User ${deleteModal.userEmail} has been deleted successfully`);
            
            // Auto-hide success message after 3 seconds
            setTimeout(() => setSuccessMessage(null), 3000);

            // Refresh the user list
            await fetchUsers();
        } catch (e: any) {
            closeDeleteModal();
            setErrorMessage(`Error deleting user: ${e.message}`);
            setTimeout(() => setErrorMessage(null), 4000);
        } finally {
            setIsDeleting(false);
        }
    };

    // Filter and search logic
    const filteredRows = useMemo(() => {
        // Build display rows from API data
        const rows: Row[] = users.map((u) => ({
            id: u.id,
            name: u.name || (u.email ? u.email.split('@')[0] : ''),
            email: u.email,
            level: (u.level as Level) || 'guest',
            points: u.points ?? 0,
            status: (u.status as Status) || 'active',
            createdAt: u.created_at ? new Date(u.created_at).toLocaleString() : '',
        }));

        return rows.filter((row) => {
            // Search filter (id, name, or email)
            const matchesSearch = searchQuery === '' ||
                String(row.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
                row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                row.email.toLowerCase().includes(searchQuery.toLowerCase());

            // Level filter
            const matchesLevel = filterLevel === 'all' || row.level === filterLevel;

            // Status filter
            const matchesStatus = filterStatus === 'all' || row.status === filterStatus;

            // Date filter
            const matchesDate = filterDate === '' || row.createdAt.startsWith(filterDate);

            return matchesSearch && matchesLevel && matchesStatus && matchesDate;
        });
    }, [users, searchQuery, filterLevel, filterStatus, filterDate]);

    return (
        <AdminLayout title="User Management">
            <div className="admin-users">
                {/* Search and Filter Controls */}
                <div className="filters-bar">
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <button className="mobile-filter-btn" onClick={() => setFilterPopupOpen(true)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                        </svg>
                    </button>
                    <div className="filter-controls">
                        <select
                            value={filterLevel}
                            onChange={(e) => setFilterLevel(e.target.value as Level | 'all')}
                            className="filter-select"
                        >
                            <option value="all">All Levels</option>
                            <option value="guest">Guest</option>
                            <option value="member">Member</option>
                            <option value="unit manager">Unit Manager</option>
                            <option value="brand manager">Brand Manager</option>
                        </select>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as Status | 'all')}
                            className="filter-select"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="filter-date"
                            placeholder="Filter by date"
                        />
                        {(searchQuery || filterLevel !== 'all' || filterStatus !== 'all' || filterDate) && (
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setFilterLevel('all');
                                    setFilterStatus('all');
                                    setFilterDate('');
                                }}
                                className="clear-filters-btn"
                            >
                                Clear Filters
                            </button>
                        )}
                        <div className="view-toggle">
                            <button
                                onClick={() => setViewMode('table')}
                                className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                                aria-label="Table view"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                                    <line x1="3" y1="9" x2="21" y2="9"/>
                                    <line x1="3" y1="15" x2="21" y2="15"/>
                                    <line x1="9" y1="9" x2="9" y2="21"/>
                                </svg>
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                                aria-label="List view"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="8" y1="6" x2="21" y2="6"/>
                                    <line x1="8" y1="12" x2="21" y2="12"/>
                                    <line x1="8" y1="18" x2="21" y2="18"/>
                                    <line x1="3" y1="6" x2="3.01" y2="6"/>
                                    <line x1="3" y1="12" x2="3.01" y2="12"/>
                                    <line x1="3" y1="18" x2="3.01" y2="18"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {viewMode === 'table' ? (
                    <div className="table-wrap">
                        <table className="table">
                        <thead>
                            <tr>
                                <th style={{ width: 120 }}>ID</th>
                                <th style={{ width: 180 }}>Name</th>
                                <th style={{ width: 220 }}>Email</th>
                                <th style={{ width: 150 }}>Level</th>
                                <th style={{ width: 90 }}>Points</th>
                                <th style={{ width: 110 }}>Status</th>
                                <th style={{ width: 160 }}>Created at</th>
                                <th style={{ width: 60 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                // Show skeleton loading rows
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={`skeleton-${i}`} className="row-loading">
                                        <td><div className="skeleton skeleton-text" style={{ width: '60px' }}></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '120px' }}></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '180px' }}></div></td>
                                        <td><div className="skeleton skeleton-badge"></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '50px' }}></div></td>
                                        <td><div className="skeleton skeleton-badge"></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '100px' }}></div></td>
                                        <td></td>
                                    </tr>
                                ))
                            ) : filteredRows.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="muted">No users found</td>
                                </tr>
                            ) : (
                                filteredRows.map((r) => (
                                    <tr key={String(r.id)}>
                                        <td><code>{r.id}</code></td>
                                        <td>{r.name}</td>
                                        <td>{r.email}</td>
                                        <td>
                                            <span className={`badge ${`badge-level-${r.level.replace(/\s+/g, '-')}`}`}>{
                                                r.level === 'unit manager' ? 'Unit Manager' : r.level === 'brand manager' ? 'Brand Manager' : r.level === 'member' ? 'Member' : 'Guest'
                                            }</span>
                                        </td>
                                        <td>{r.points}</td>
                                        <td>
                                            <span className={`badge ${r.status === 'active' ? 'badge-success' : 'badge-muted'}`}>{r.status}</span>
                                        </td>
                                        <td>{r.createdAt}</td>
                                        <td className="row-actions">
                                            <button
                                                className="more-btn"
                                                aria-label="More actions"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setMenuOpenId((prev) => prev === r.id ? null : r.id);
                                                }}
                                            >
                                                ⋯
                                            </button>
                                            {menuOpenId === r.id && (
                                                <div className="menu">
                                                    <button 
                                                        className="menu-item" 
                                                        onClick={() => updateUserStatus(r.id, r.status === 'active' ? 'inactive' : 'active')}
                                                        disabled={isUpdatingStatus}
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            {r.status === 'active' ? (
                                                                <path d="M18 6L6 18M6 6l12 12" />
                                                            ) : (
                                                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" />
                                                            )}
                                                        </svg>
                                                        {r.status === 'active' ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                    <button className="menu-item danger" onClick={() => openDeleteModal(r.id, r.email)}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
                                                        </svg>
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                ) : (
                    <div className="list-view">
                        {loading ? (
                            filteredRows.map((r) => (
                                <div key={`loading-${r.id}`} className="list-item row-loading">
                                    <div className="list-item-header">
                                        <div className="list-item-title">
                                            <strong>{r.name}</strong>
                                            <code className="list-item-id">{r.id}</code>
                                        </div>
                                        <span className={`badge ${r.status === 'active' ? 'badge-success' : 'badge-muted'}`}>{r.status}</span>
                                    </div>
                                    <div className="list-item-body">
                                        <div className="list-item-field">
                                            <span className="field-label">Email:</span>
                                            <span className="field-value">{r.email}</span>
                                        </div>
                                        <div className="list-item-field">
                                            <span className="field-label">Level:</span>
                                            <span className={`badge ${`badge-level-${r.level.replace(/\s+/g, '-')}`}`}>{
                                                r.level === 'unit manager' ? 'Unit Manager' : r.level === 'brand manager' ? 'Brand Manager' : r.level === 'member' ? 'Member' : 'Guest'
                                            }</span>
                                        </div>
                                        <div className="list-item-field">
                                            <span className="field-label">Points:</span>
                                            <span className="field-value">{r.points}</span>
                                        </div>
                                        <div className="list-item-field">
                                            <span className="field-label">Created at:</span>
                                            <span className="field-value">{r.createdAt}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : filteredRows.length === 0 ? (
                            <div className="empty-state">No users found</div>
                        ) : (
                            filteredRows.map((r) => (
                                <div key={String(r.id)} className="list-item">
                                    <div className="list-item-header">
                                        <div className="list-item-title">
                                            <strong>{r.name}</strong>
                                            <code className="list-item-id">{r.id}</code>
                                        </div>
                                        <div className="list-item-actions">
                                            <span className={`badge ${r.status === 'active' ? 'badge-success' : 'badge-muted'}`}>{r.status}</span>
                                            <div className="row-actions">
                                                <button
                                                    className="more-btn"
                                                    aria-label="More actions"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setMenuOpenId((prev) => prev === r.id ? null : r.id);
                                                    }}
                                                >
                                                    ⋯
                                                </button>
                                                {menuOpenId === r.id && (
                                                    <div className="menu">
                                                        <button 
                                                            className="menu-item" 
                                                            onClick={() => updateUserStatus(r.id, r.status === 'active' ? 'inactive' : 'active')}
                                                            disabled={isUpdatingStatus}
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                {r.status === 'active' ? (
                                                                    <path d="M18 6L6 18M6 6l12 12" />
                                                                ) : (
                                                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" />
                                                                )}
                                                            </svg>
                                                            {r.status === 'active' ? 'Deactivate' : 'Activate'}
                                                        </button>
                                                        <button className="menu-item danger" onClick={() => openDeleteModal(r.id, r.email)}>
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
                                                            </svg>
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="list-item-body">
                                        <div className="list-item-field">
                                            <span className="field-label">Email:</span>
                                            <span className="field-value">{r.email}</span>
                                        </div>
                                        <div className="list-item-field">
                                            <span className="field-label">Level:</span>
                                            <span className={`badge ${`badge-level-${r.level.replace(/\s+/g, '-')}`}`}>{
                                                r.level === 'unit manager' ? 'Unit Manager' : r.level === 'brand manager' ? 'Brand Manager' : r.level === 'member' ? 'Member' : 'Guest'
                                            }</span>
                                        </div>
                                        <div className="list-item-field">
                                            <span className="field-label">Points:</span>
                                            <span className="field-value">{r.points}</span>
                                        </div>
                                        <div className="list-item-field">
                                            <span className="field-label">Created at:</span>
                                            <span className="field-value">{r.createdAt}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteModal.show && (
                <div className="modal-overlay" onClick={closeDeleteModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Confirm Delete</h3>
                            <button className="modal-close" onClick={closeDeleteModal}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="modal-icon-warning">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                    <line x1="12" y1="9" x2="12" y2="13" />
                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                            </div>
                            <p className="modal-message">
                                Are you sure you want to delete <strong>{deleteModal.userEmail}</strong>?
                            </p>
                            <p className="modal-submessage">This action cannot be undone.</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={closeDeleteModal} disabled={isDeleting}>
                                Cancel
                            </button>
                            <button className="btn-danger" onClick={confirmDelete} disabled={isDeleting}>
                                {isDeleting ? 'Deleting...' : 'Delete User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Notification */}
            {successMessage && (
                <div className="notification notification-success">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <span>{successMessage}</span>
                    <button className="notification-close" onClick={() => setSuccessMessage(null)}>×</button>
                </div>
            )}

            {/* Error Notification */}
            {errorMessage && (
                <div className="notification notification-error">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{errorMessage}</span>
                    <button className="notification-close" onClick={() => setErrorMessage(null)}>×</button>
                </div>
            )}

            {/* Mobile Filter Popup */}
            {filterPopupOpen && (
                <>
                    <div className="filter-popup-overlay active" onClick={() => setFilterPopupOpen(false)} />
                    <div className={`filter-popup ${filterPopupOpen ? 'active' : ''}`}>
                        <div className="filter-popup-header">
                            <h3 className="filter-popup-title">Filters</h3>
                            <button className="filter-popup-close" onClick={() => setFilterPopupOpen(false)}>×</button>
                        </div>
                        <div className="filter-popup-body">
                            <div className="filter-popup-group">
                                <label className="filter-popup-label">Level</label>
                                <select
                                    value={filterLevel}
                                    onChange={(e) => setFilterLevel(e.target.value as Level | 'all')}
                                    className="filter-select"
                                >
                                    <option value="all">All Levels</option>
                                    <option value="guest">Guest</option>
                                    <option value="member">Member</option>
                                    <option value="unit manager">Unit Manager</option>
                                    <option value="brand manager">Brand Manager</option>
                                </select>
                            </div>
                            <div className="filter-popup-group">
                                <label className="filter-popup-label">Status</label>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value as Status | 'all')}
                                    className="filter-select"
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            <div className="filter-popup-group">
                                <label className="filter-popup-label">Created Date</label>
                                <input
                                    type="date"
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                    className="filter-date"
                                />
                            </div>
                        </div>
                        <div className="filter-popup-footer">
                            <button 
                                className="btn-secondary"
                                onClick={() => {
                                    setFilterLevel('all');
                                    setFilterStatus('all');
                                    setFilterDate('');
                                }}
                            >
                                Clear All
                            </button>
                            <button 
                                className="btn-primary"
                                onClick={() => setFilterPopupOpen(false)}
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </>
            )}
        </AdminLayout>
    );
}
