import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { IconDashboard, IconUsers, IconSettings, IconUser, IconLogout } from './icons';
import { useState as useModalState } from 'react';
import { logout } from '../../auth';
import AdminProfileModal from './AdminProfileModal';
import AdminSettingModal from './AdminSettingModal';

export default function AdminHeader({ title }: { title: string }) {
    const [open, setOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useModalState(false);
    const [settingOpen, setSettingOpen] = useModalState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const location = useLocation();
    const navigate = useNavigate();
    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (!menuRef.current) return;
            if (!menuRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('click', onDocClick);
        return () => document.removeEventListener('click', onDocClick);
    }, []);

    const user = { name: 'Admin User', avatar: '/images/logo.png' };

    const iconForRoute = () => {
        if (location.pathname.startsWith('/admin-users')) return <IconUsers style={{ marginRight: 8 }} />;
        if (location.pathname.startsWith('/admin-dashboard')) return <IconDashboard style={{ marginRight: 8 }} />;
        return <IconSettings style={{ marginRight: 8 }} />;
    };

    return (
        <header className="admin-header">
            <div className="admin-page-title">
                {iconForRoute()}
                <span>{title}</span>
            </div>
            <div className="admin-actions" ref={menuRef}>
                <button className="admin-user" onClick={() => setOpen((v) => !v)}>
                    <img src={user.avatar} alt="avatar" className="avatar" />
                    <span className="name">{user.name}</span>
                </button>
                {open && (
                    <div className="dropdown">
                        <a href="#profile" onClick={(e) => { e.preventDefault(); setOpen(false); setProfileOpen(true); }}>
                            <IconUser style={{ marginRight: 8 }} /> Profile
                        </a>
                        <a href="#settings" onClick={(e) => { e.preventDefault(); setOpen(false); setSettingOpen(true); }}>
                            <IconSettings style={{ marginRight: 8 }} /> Settings
                        </a>
                        <a href="/" onClick={(e) => { e.preventDefault(); setOpen(false); logout(); navigate('/'); }}>
                            <IconLogout style={{ marginRight: 8 }} /> Logout
                        </a>
                    </div>
                )}
                <AdminProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
                <AdminSettingModal open={settingOpen} onClose={() => setSettingOpen(false)} />
            </div>
        </header>
    );
}
