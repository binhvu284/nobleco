import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { ReactNode, useState } from 'react';

export default function AdminLayout({ title, children }: { title: string; children: ReactNode }) {
    const [collapsed, setCollapsed] = useState<boolean>(() => {
        try {
            if (typeof window !== 'undefined') {
                const stored = window.localStorage.getItem('adminSidebarCollapsed');
                return stored === '1';
            }
        } catch {}
        return false;
    });
    return (
        <div className={`admin-root ${collapsed ? 'collapsed' : ''}`}>
            <AdminSidebar
                collapsed={collapsed}
                onToggle={() =>
                    setCollapsed((v) => {
                        const next = !v;
                        try {
                            if (typeof window !== 'undefined') {
                                window.localStorage.setItem('adminSidebarCollapsed', next ? '1' : '0');
                            }
                        } catch {}
                        return next;
                    })
                }
            />
            <div className="admin-main">
                <AdminHeader title={title} />
                <main className="admin-content">
                    {children}
                </main>
            </div>
        </div>
    );
}
