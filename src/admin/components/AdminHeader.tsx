import { useState, useRef, useEffect } from 'react';
import { IconSettings, IconUser } from './icons';

export default function AdminHeader({ title }: { title: string }) {
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (!menuRef.current) return;
            if (!menuRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('click', onDocClick);
        return () => document.removeEventListener('click', onDocClick);
    }, []);

    const user = { name: 'Admin User', avatar: '/images/logo.png' };

    return (
        <header className="admin-header">
            <div className="admin-page-title">
                <IconSettings style={{ marginRight: 8 }} />
                <span>{title}</span>
            </div>
            <div className="admin-actions" ref={menuRef}>
                <button className="admin-user" onClick={() => setOpen((v) => !v)}>
                    <img src={user.avatar} alt="avatar" className="avatar" />
                    <span className="name">{user.name}</span>
                </button>
                {open && (
                    <div className="dropdown">
                        <a href="#profile"><IconUser style={{ marginRight: 8 }} /> Profile</a>
                        <a href="#settings"><IconSettings style={{ marginRight: 8 }} /> Settings</a>
                        <a href="/" onClick={(e) => { e.preventDefault(); window.location.href = '/'; }}>Logout</a>
                    </div>
                )}
            </div>
        </header>
    );
}
