import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../components/AdminLayout';

type User = {
    id: string | number;
    email: string;
    username?: string;
    role?: string;
    created_at?: string;
};

type Level = 'guest' | 'member' | 'unit' | 'brand';
type Status = 'active' | 'disable';
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

    const handleDeleteUser = async (userId: string | number, userEmail: string) => {
        if (!confirm(`Are you sure you want to delete ${userEmail}? This action cannot be undone.`)) {
            return;
        }

        try {
            const res = await fetch('/api/users', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: userId }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to delete user');
            }

            // Refresh the user list
            await fetchUsers();
            setMenuOpenId(null);
            alert('User deleted successfully');
        } catch (e: any) {
            alert(`Error deleting user: ${e.message}`);
        }
    };

    // Filter and search logic
    const filteredRows = useMemo(() => {
        // Build display rows from API data
        const rows: Row[] = users.map((u) => ({
            id: u.id,
            name: u.username || (u.email ? u.email.split('@')[0] : ''),
            email: u.email,
            level: ((u as any).level as Level) || 'guest',
            points: Number((u as any).points ?? 0),
            status: 'active',
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
                            placeholder="Search by ID, name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <div className="filter-controls">
                        <select
                            value={filterLevel}
                            onChange={(e) => setFilterLevel(e.target.value as Level | 'all')}
                            className="filter-select"
                        >
                            <option value="all">All Levels</option>
                            <option value="guest">Guest</option>
                            <option value="member">Member</option>
                            <option value="unit">Unit Manager</option>
                            <option value="brand">Brand Manager</option>
                        </select>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as Status | 'all')}
                            className="filter-select"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="disable">Disabled</option>
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
                                <th style={{ width: 150 }}>Account level</th>
                                <th style={{ width: 90 }}>Points</th>
                                <th style={{ width: 110 }}>Status</th>
                                <th style={{ width: 160 }}>Created at</th>
                                <th style={{ width: 60 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                // Show sample rows while loading
                                filteredRows.map((r) => (
                                    <tr key={`loading-${r.id}`} className="row-loading">
                                        <td><code>{r.id}</code></td>
                                        <td>{r.name}</td>
                                        <td>{r.email}</td>
                                        <td><span className={`badge ${`badge-level-${r.level}`}`}>{
                                            r.level === 'unit' ? 'Unit Manager' : r.level === 'brand' ? 'Brand Manager' : r.level === 'member' ? 'Member' : 'Guest'
                                        }</span></td>
                                        <td>{r.points}</td>
                                        <td><span className={`badge ${r.status === 'active' ? 'badge-success' : 'badge-muted'}`}>{r.status}</span></td>
                                        <td>{r.createdAt}</td>
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
                                            <span className={`badge ${`badge-level-${r.level}`}`}>{
                                                r.level === 'unit' ? 'Unit Manager' : r.level === 'brand' ? 'Brand Manager' : r.level === 'member' ? 'Member' : 'Guest'
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
                                                    <button className="menu-item" onClick={() => { alert(`${r.status === 'active' ? 'Disable' : 'Activate'} ${r.email} - Coming soon!`); setMenuOpenId(null); }}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            {r.status === 'active' ? (
                                                                <path d="M18 6L6 18M6 6l12 12" />
                                                            ) : (
                                                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" />
                                                            )}
                                                        </svg>
                                                        {r.status === 'active' ? 'Disable' : 'Activate'}
                                                    </button>
                                                    <button className="menu-item danger" onClick={() => handleDeleteUser(r.id, r.email)}>
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
                                            <span className="field-label">Account level:</span>
                                            <span className={`badge ${`badge-level-${r.level}`}`}>{
                                                r.level === 'unit' ? 'Unit Manager' : r.level === 'brand' ? 'Brand Manager' : r.level === 'member' ? 'Member' : 'Guest'
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
                                                        <button className="menu-item" onClick={() => { alert(`${r.status === 'active' ? 'Disable' : 'Activate'} ${r.email} - Coming soon!`); setMenuOpenId(null); }}>
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                {r.status === 'active' ? (
                                                                    <path d="M18 6L6 18M6 6l12 12" />
                                                                ) : (
                                                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" />
                                                                )}
                                                            </svg>
                                                            {r.status === 'active' ? 'Disable' : 'Activate'}
                                                        </button>
                                                        <button className="menu-item danger" onClick={() => handleDeleteUser(r.id, r.email)}>
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
                                            <span className="field-label">Account level:</span>
                                            <span className={`badge ${`badge-level-${r.level}`}`}>{
                                                r.level === 'unit' ? 'Unit Manager' : r.level === 'brand' ? 'Brand Manager' : r.level === 'member' ? 'Member' : 'Guest'
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
        </AdminLayout>
    );
}
