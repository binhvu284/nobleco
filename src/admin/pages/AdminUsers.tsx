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

    // Sample rows for initial UI preview
    const sampleRows: Row[] = useMemo(() => ([
        { id: 'usr_001', name: 'Alice Nguyen', email: 'alice@example.com', level: 'member', points: 1200, status: 'active', createdAt: '2025-10-10 09:24' },
        { id: 'usr_002', name: 'Binh Vu', email: 'binh@example.com', level: 'unit', points: 340, status: 'disable', createdAt: '2025-10-11 14:03' },
        { id: 'usr_003', name: 'Chris Lee', email: 'chris@example.com', level: 'guest', points: 0, status: 'active', createdAt: '2025-10-12 08:41' },
        { id: 'usr_004', name: 'Dana Tran', email: 'dana@example.com', level: 'brand', points: 785, status: 'active', createdAt: '2025-10-13 16:20' },
    ]), []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch('/api/users');
                if (!res.ok) throw new Error(`Request failed: ${res.status}`);
                const data = await res.json();
                if (!cancelled) setUsers(Array.isArray(data) ? data : []);
            } catch (e: any) {
                if (!cancelled) setError(e?.message || 'Failed to load users');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // Filter and search logic
    const filteredRows = useMemo(() => {
        // Build display rows: use API data when available, otherwise sample rows
        const rows: Row[] = !loading && users.length > 0
            ? users.map((u) => ({
                id: u.id,
                name: u.username || (u.email ? u.email.split('@')[0] : ''),
                email: u.email,
                level: ((u as any).level as Level) || 'guest',
                points: Number((u as any).points ?? 0),
                status: 'active',
                createdAt: u.created_at ? new Date(u.created_at).toLocaleString() : '',
            }))
            : sampleRows;

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
    }, [users, loading, sampleRows, searchQuery, filterLevel, filterStatus, filterDate]);

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
                    </div>
                </div>

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
                                                    <button className="menu-item" onClick={() => { alert(`${r.status === 'active' ? 'Disable' : 'Activate'} ${r.email}`); setMenuOpenId(null); }}>
                                                        {r.status === 'active' ? 'Disable' : 'Activate'}
                                                    </button>
                                                    <button className="menu-item danger" onClick={() => { if (confirm(`Delete ${r.email}?`)) alert('Deleted (demo)'); setMenuOpenId(null); }}>
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
            </div>
        </AdminLayout>
    );
}
