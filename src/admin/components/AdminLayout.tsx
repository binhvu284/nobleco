import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { ReactNode } from 'react';

export default function AdminLayout({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div className="admin-root">
            <AdminSidebar />
            <div className="admin-main">
                <AdminHeader title={title} />
                <main className="admin-content">
                    {children}
                </main>
            </div>
        </div>
    );
}
