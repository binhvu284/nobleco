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
                onMobileClose={() => setMobileOpen(false)}
            />
            {mobileOpen && <div className="admin-overlay" onClick={() => setMobileOpen(false)} />}
            <div className="admin-main">
                <UserHeader 
                    title={title} 
                    mobileMenuOpen={mobileOpen}
                    onMobileMenuToggle={(e) => {
                        e.stopPropagation();
                        const isOpening = !mobileOpen;
                        setMobileOpen(isOpening);
                        // When opening on mobile, always expand the sidebar
                        if (isOpening && window.innerWidth <= 768) {
                            setCollapsed(false);
                        }
                    }}
                />
                <main className="admin-content">{children}</main>
            </div>
        </div>
    );
}
