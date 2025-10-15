import { ReactNode, useEffect, useRef, useState } from 'react';
import { UserSidebar, UserHeader } from './index';
import { IconMenu } from '../../admin/components/icons';

export default function UserLayout({ title, children }: { title: string; children: ReactNode }) {
    const [collapsed, setCollapsed] = useState<boolean>(() => {
        try {
            if (typeof window !== 'undefined') {
                const stored = window.localStorage.getItem('userSidebarCollapsed');
                return stored === '1';
            }
        } catch { }
        return false;
    });
    const [mobileOpen, setMobileOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!mobileOpen) return;
        const onClick = (e: MouseEvent) => {
            if (!rootRef.current) return;
            const sidebar = rootRef.current.querySelector('.admin-sidebar');
            if (sidebar && !sidebar.contains(e.target as Node)) setMobileOpen(false);
        };
        document.addEventListener('click', onClick);
        return () => document.removeEventListener('click', onClick);
    }, [mobileOpen]);

    return (
        <div ref={rootRef} className={`admin-root ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
            <button className="admin-mobile-toggle" aria-label="Open menu" onClick={() => setMobileOpen(true)}>
                <IconMenu />
            </button>
            <UserSidebar
                collapsed={collapsed}
                onToggle={() =>
                    setCollapsed((v) => {
                        const next = !v;
                        try {
                            if (typeof window !== 'undefined') {
                                window.localStorage.setItem('userSidebarCollapsed', next ? '1' : '0');
                            }
                        } catch { }
                        return next;
                    })
                }
                onNavigate={() => setMobileOpen(false)}
            />
            {mobileOpen && <div className="admin-overlay" />}
            <div className="admin-main">
                <UserHeader title={title} />
                <main className="admin-content">{children}</main>
            </div>
        </div>
    );
}
