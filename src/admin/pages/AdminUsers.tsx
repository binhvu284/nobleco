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

    return (
        <AdminLayout title="User Management">
            <div className="admin-users">
                {error && (
                    <div className="alert alert-error" role="alert">
                        {error}
                    </div>
                )}
                <div className="table-wrap">
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ width: '220px' }}>ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th style={{ width: 160 }}>Account level</th>
                                <th style={{ width: 100 }}>Points</th>
                                <th style={{ width: 140 }}>Status</th>
                                <th style={{ width: 180 }}>Created at</th>
                                <th style={{ width: 64 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
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

                                if (loading) {
                                    // Show sample rows while loading
                                    return rows.map((r) => (
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
                                    ));
                                }

                                if (error && users.length === 0) {
                                    // On error, still show sample rows so UI remains visible
                                    return sampleRows.map((r) => (
                                        <tr key={`error-${r.id}`}>
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
                                    ));
                                }

                                if (!loading && users.length === 0) {
                                    return (
                                        <tr>
                                            <td colSpan={8} className="muted">No users found</td>
                                        </tr>
                                    );
                                }

                                return rows.map((r) => (
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
                                ));
                            })()}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
