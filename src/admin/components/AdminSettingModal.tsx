import { useState } from 'react';
import { IconX, IconSettings, IconUser, IconBell, IconShield } from './icons';

type SettingSection = 'general' | 'account' | 'notification' | 'security';

export default function AdminSettingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [activeSection, setActiveSection] = useState<SettingSection>('general');
    const [settings, setSettings] = useState({
        // General
        language: 'en',
        theme: 'light',
        timezone: 'UTC',
        // Account
        email: '',
        phone: '',
        // Notification
        emailNotifications: true,
        pushNotifications: false,
        // Security
        twoFactorEnabled: false,
        twoFactorMethod: 'email' as 'email' | 'phone' | 'app'
    });

    if (!open) return null;

    const renderContent = () => {
        switch (activeSection) {
            case 'general':
                return (
                    <div className="settings-content-section">
                        <h2>General Settings</h2>
                        <div className="settings-form">
                            <div className="settings-field">
                                <label>Language</label>
                                <select 
                                    value={settings.language}
                                    onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                                >
                                    <option value="en">English</option>
                                    <option value="vi">Vietnamese</option>
                                </select>
                            </div>
                            <div className="settings-field">
                                <label>Theme</label>
                                <select 
                                    value={settings.theme}
                                    onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                                >
                                    <option value="light">Light</option>
                                    <option value="dark">Dark</option>
                                    <option value="auto">Auto</option>
                                </select>
                            </div>
                            <div className="settings-field">
                                <label>Timezone</label>
                                <select 
                                    value={settings.timezone}
                                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                                >
                                    <option value="UTC">UTC</option>
                                    <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh</option>
                                    <option value="America/New_York">America/New_York</option>
                                </select>
                            </div>
                        </div>
                    </div>
                );
            case 'account':
                return (
                    <div className="settings-content-section">
                        <h2>Account Settings</h2>
                        <div className="settings-form">
                            <div className="settings-field">
                                <label>Change Email</label>
                                <input 
                                    type="email"
                                    value={settings.email}
                                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                                    placeholder="Enter new email"
                                />
                                <button className="btn-primary" style={{ marginTop: '8px' }}>Update Email</button>
                            </div>
                            <div className="settings-field">
                                <label>Change Phone</label>
                                <input 
                                    type="tel"
                                    value={settings.phone}
                                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                                    placeholder="Enter new phone number"
                                />
                                <button className="btn-primary" style={{ marginTop: '8px' }}>Update Phone</button>
                            </div>
                            <div className="settings-field">
                                <label>Change Password</label>
                                <input 
                                    type="password"
                                    placeholder="Enter current password"
                                    style={{ marginBottom: '8px' }}
                                />
                                <input 
                                    type="password"
                                    placeholder="Enter new password"
                                    style={{ marginBottom: '8px' }}
                                />
                                <input 
                                    type="password"
                                    placeholder="Confirm new password"
                                />
                                <button className="btn-primary" style={{ marginTop: '8px' }}>Update Password</button>
                            </div>
                        </div>
                    </div>
                );
            case 'notification':
                return (
                    <div className="settings-content-section">
                        <h2>Notification Settings</h2>
                        <div className="settings-form">
                            <div className="settings-field">
                                <label className="settings-checkbox-label">
                                    <input 
                                        type="checkbox"
                                        checked={settings.emailNotifications}
                                        onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                                    />
                                    <span>Email Notifications</span>
                                </label>
                            </div>
                            <div className="settings-field">
                                <label className="settings-checkbox-label">
                                    <input 
                                        type="checkbox"
                                        checked={settings.pushNotifications}
                                        onChange={(e) => setSettings({ ...settings, pushNotifications: e.target.checked })}
                                    />
                                    <span>Push Notifications</span>
                                </label>
                            </div>
                        </div>
                    </div>
                );
            case 'security':
                return (
                    <div className="settings-content-section">
                        <h2>Security Settings</h2>
                        <div className="settings-form">
                            <div className="settings-field">
                                <label className="settings-checkbox-label">
                                    <input 
                                        type="checkbox"
                                        checked={settings.twoFactorEnabled}
                                        onChange={(e) => setSettings({ ...settings, twoFactorEnabled: e.target.checked })}
                                    />
                                    <span>Enable 2-Step Authentication</span>
                                </label>
                                {settings.twoFactorEnabled && (
                                    <div style={{ marginTop: '16px', paddingLeft: '24px' }}>
                                        <label>Authentication Method:</label>
                                        <div style={{ marginTop: '8px' }}>
                                            <label className="settings-radio-label">
                                                <input 
                                                    type="radio"
                                                    name="twoFactorMethod"
                                                    value="email"
                                                    checked={settings.twoFactorMethod === 'email'}
                                                    onChange={(e) => setSettings({ ...settings, twoFactorMethod: e.target.value as 'email' | 'phone' | 'app' })}
                                                />
                                                <span>Email</span>
                                            </label>
                                            <label className="settings-radio-label">
                                                <input 
                                                    type="radio"
                                                    name="twoFactorMethod"
                                                    value="phone"
                                                    checked={settings.twoFactorMethod === 'phone'}
                                                    onChange={(e) => setSettings({ ...settings, twoFactorMethod: e.target.value as 'email' | 'phone' | 'app' })}
                                                />
                                                <span>Phone</span>
                                            </label>
                                            <label className="settings-radio-label">
                                                <input 
                                                    type="radio"
                                                    name="twoFactorMethod"
                                                    value="app"
                                                    checked={settings.twoFactorMethod === 'app'}
                                                    onChange={(e) => setSettings({ ...settings, twoFactorMethod: e.target.value as 'email' | 'phone' | 'app' })}
                                                />
                                                <span>Authentication App</span>
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <div className="settings-modal-overlay" onClick={onClose} />
            <div className="settings-modal" role="dialog" aria-modal="true">
                <div className="settings-header">
                    <h2>Settings</h2>
                    <button className="modal-close" aria-label="Close" onClick={onClose}>
                        <IconX />
                    </button>
                </div>
                <div className="settings-body">
                    <div className="settings-sidebar">
                        <button 
                            className={`settings-sidebar-item ${activeSection === 'general' ? 'active' : ''}`}
                            onClick={() => setActiveSection('general')}
                        >
                            <IconSettings />
                            General
                        </button>
                        <button 
                            className={`settings-sidebar-item ${activeSection === 'account' ? 'active' : ''}`}
                            onClick={() => setActiveSection('account')}
                        >
                            <IconUser />
                            Account
                        </button>
                        <button 
                            className={`settings-sidebar-item ${activeSection === 'notification' ? 'active' : ''}`}
                            onClick={() => setActiveSection('notification')}
                        >
                            <IconBell />
                            Notification
                        </button>
                        <button 
                            className={`settings-sidebar-item ${activeSection === 'security' ? 'active' : ''}`}
                            onClick={() => setActiveSection('security')}
                        >
                            <IconShield />
                            Security
                        </button>
                    </div>
                    <div className="settings-content">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </>
    );
}
