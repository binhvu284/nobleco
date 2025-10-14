import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { ReactNode } from 'react';

export default function AdminLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="admin-root">
      <AdminSidebar />
      <div className="admin-main">
        <AdminHeader />
        <main className="admin-content">
          <h2 style={{ marginTop: 0 }}>{title}</h2>
          {children}
        </main>
      </div>
    </div>
  );
}
