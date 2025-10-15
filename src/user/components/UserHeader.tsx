import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../auth';
import { IconUser, IconSettings } from '../../admin/components/icons';

export default function UserHeader({ title }: { title: string }) {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
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
                        <a href="#" onClick={(e) => e.preventDefault()}>
                            <IconUser /> Profile
                        </a>
                        <a href="#" onClick={(e) => e.preventDefault()}>
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
                            Logout
                        </a>
                    </div>
                )}
            </div>
        </header>
    );
}
