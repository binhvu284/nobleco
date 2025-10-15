import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../auth';
import { IconUser, IconSettings, IconLogout } from '../../admin/components/icons';
import { useState as useModalState } from 'react';
import UserProfileModal from './UserProfileModal';
import UserSettingModal from './UserSettingModal';

export default function UserHeader({ title }: { title: string }) {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const [profileOpen, setProfileOpen] = useModalState(false);
    const [settingOpen, setSettingOpen] = useModalState(false);
    return (
        <header className="admin-header">
            <div className="admin-page-title">{title}</div>
            <div className="admin-actions">
                <button className="admin-user" onClick={() => setOpen((v) => !v)}>
                    <img className="avatar" src="https://i.pravatar.cc/100?img=8" alt="avatar" />
                    <span>User</span>
                </button>
                {open && (
                    <div className="dropdown" onMouseLeave={() => setOpen(false)}>
                        <a href="#profile" onClick={(e) => { e.preventDefault(); setOpen(false); setProfileOpen(true); }}>
                            <IconUser /> Profile
                        </a>
                        <a href="#setting" onClick={(e) => { e.preventDefault(); setOpen(false); setSettingOpen(true); }}>
                            <IconSettings /> Settings
                        </a>
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                logout();
                                setOpen(false);
                                navigate('/login', { replace: true });
                            }}
                        >
                            <IconLogout /> Logout
                        </a>
                    </div>
                )}
                <UserProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
                <UserSettingModal open={settingOpen} onClose={() => setSettingOpen(false)} />
            </div>
        </header>
    );
}
