import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';

type User = {
    id: string | number;
    email: string;
};

export default function AdminUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
                {loading && <div className="muted">Loading users…</div>}
                {error && <div className="error">{error}</div>}
                {!loading && !error && (
                    <div className="table-wrap">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th style={{ width: '220px' }}>ID</th>
                                    <th>Email</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan={2} className="muted">No users found</td>
                                    </tr>
                                ) : (
                                    users.map((u) => (
                                        <tr key={String(u.id)}>
                                            <td><code>{u.id}</code></td>
                                            <td>{u.email}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
