import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { ReactNode, useState } from 'react';

export default function AdminLayout({ title, children }: { title: string; children: ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    return (
        <div className={`admin-root ${collapsed ? 'collapsed' : ''}`}>
            <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
            <div className="admin-main">
                <AdminHeader title={title} />
                <main className="admin-content">
                    {children}
                </main>
            </div>
        </div>
    );
}
