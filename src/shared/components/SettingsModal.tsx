import { useState, useEffect } from 'react';
import { IconX, IconSettings, IconUser, IconMaximize, IconMinimize, IconEye, IconEyeOff } from '../../admin/components/icons';
import { getCurrentUser } from '../../auth';
import { useTranslation } from '../contexts/TranslationContext';
import { useTheme } from '../contexts/ThemeContext';
import PasswordVerificationModal from './PasswordVerificationModal';
import SettingsOTPVerification from './SettingsOTPVerification';

type SettingSection = 'general' | 'account';

// Flag icons as SVG components
function FlagIcon({ country }: { country: 'en' | 'vi' }) {
    if (country === 'en') {
        // UK/US flag (simplified)
        return (
            <svg width="20" height="15" viewBox="0 0 20 15" style={{ flexShrink: 0 }}>
                <rect width="20" height="15" fill="#012169" />
                <path d="M0 0 L20 15 M20 0 L0 15" stroke="white" strokeWidth="2" />
                <path d="M0 7.5 L20 7.5 M10 0 L10 15" stroke="white" strokeWidth="1.5" />
                <path d="M0 0 L20 15 M20 0 L0 15" stroke="#C8102E" strokeWidth="1" />
                <path d="M0 7.5 L20 7.5 M10 0 L10 15" stroke="#C8102E" strokeWidth="0.8" />
            </svg>
        );
    } else {
        // Vietnam flag
        return (
            <svg width="20" height="15" viewBox="0 0 20 15" style={{ flexShrink: 0 }}>
                <rect width="20" height="15" fill="#DA020E" />
                <polygon points="10,4 11.5,7.5 10,11 8.5,7.5" fill="#FFFF00" />
            </svg>
        );
    }
}

export default function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { language, setLanguage, t } = useTranslation();
    const { theme, setTheme } = useTheme();
    const [activeSection, setActiveSection] = useState<SettingSection>('general');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [userData, setUserData] = useState<{ email?: string; phone?: string } | null>(null);
    
    // Settings state - sync with translation and theme contexts
    const [settings, setSettings] = useState({
        language: language,
        theme: theme,
    });
    
    // Sync language and theme states when contexts change
    useEffect(() => {
        setSettings(prev => ({ ...prev, language }));
    }, [language]);
    
    useEffect(() => {
        setSettings(prev => ({ ...prev, theme }));
    }, [theme]);

    // Account change states
    const [emailEditing, setEmailEditing] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [phoneEditing, setPhoneEditing] = useState(false);
    const [newPhone, setNewPhone] = useState('');
    const [passwordEditing, setPasswordEditing] = useState(false);
    const [passwordData, setPasswordData] = useState({
        current: '',
        new: '',
        confirm: ''
    });
    const [showPasswordVisibility, setShowPasswordVisibility] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Password verification modal states
    const [showPasswordVerification, setShowPasswordVerification] = useState(false);
    const [passwordVerificationPurpose, setPasswordVerificationPurpose] = useState<'email' | 'phone' | null>(null);
    
    // OTP verification modal states
    const [showOTPVerification, setShowOTPVerification] = useState(false);
    const [otpData, setOtpData] = useState<{
        email?: string;
        phone?: string;
        otpMethod: 'phone' | 'email';
        purpose: 'email_change' | 'phone_change';
    } | null>(null);

    // Load user data when modal opens
    useEffect(() => {
        if (open) {
            loadUserData();
        } else {
            // Reset states when modal closes
            setEmailEditing(false);
            setPhoneEditing(false);
            setPasswordEditing(false);
            setNewEmail('');
            setNewPhone('');
            setPasswordData({ current: '', new: '', confirm: '' });
            setShowPasswordVisibility({ current: false, new: false, confirm: false });
            setShowPasswordVerification(false);
            setShowOTPVerification(false);
            setPasswordVerificationPurpose(null);
            setOtpData(null);
            setError('');
            setSuccess('');
            setIsFullscreen(false);
        }
    }, [open]);

    const loadUserData = async () => {
        setIsLoading(true);
        try {
            const currentUser = getCurrentUser();
            if (currentUser?.id) {
                const response = await fetch(`/api/users?id=${currentUser.id}`);
                if (response.ok) {
                    const data = await response.json();
                    setUserData({
                        email: data.user?.email || '',
                        phone: data.user?.phone || ''
                    });
                }
            } else {
                // Fallback to localStorage
                const user = getCurrentUser();
                setUserData({
                    email: user?.email || '',
                    phone: user?.phone || ''
                });
            }
        } catch (err) {
            console.error('Error loading user data:', err);
            const user = getCurrentUser();
            setUserData({
                email: user?.email || '',
                phone: user?.phone || ''
            });
        } finally {
            setIsLoading(false);
        }
    };

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    const handleLanguageChange = (lang: string) => {
        setSettings({ ...settings, language: lang });
        setLanguage(lang as 'en' | 'vi');
    };

    const handleThemeChange = (newTheme: string) => {
        setTheme(newTheme as 'light' | 'dark' | 'auto');
        setSettings({ ...settings, theme: newTheme });
    };

    // Handle password verification for email/phone changes
    const handlePasswordVerify = async (password: string) => {
        const authToken = localStorage.getItem('nobleco_auth_token');
        const response = await fetch('/api/users/verify-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ password })
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || t('settings.invalidPassword'));
        }
        
        // Password verified - proceed with email/phone change flow
        if (passwordVerificationPurpose === 'email') {
            // Validate new email
            if (!newEmail || !newEmail.includes('@')) {
                setError(t('settings.invalidEmail'));
                setShowPasswordVerification(false);
                return;
            }
            // Send OTP to new email
            setSaving(true);
            try {
                const otpResponse = await fetch('/api/otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'send',
                        email: newEmail,
                        purpose: 'email_change'
                    })
                });
                
                if (!otpResponse.ok) {
                    const otpData = await otpResponse.json();
                    throw new Error(otpData.error || t('settings.failedUpdateEmail'));
                }
                
                // Show OTP verification modal
                setShowPasswordVerification(false);
                setOtpData({
                    email: newEmail,
                    otpMethod: 'email',
                    purpose: 'email_change'
                });
                setShowOTPVerification(true);
            } catch (err: any) {
                setError(err.message || t('settings.failedUpdateEmail'));
                setShowPasswordVerification(false);
            } finally {
                setSaving(false);
            }
        } else if (passwordVerificationPurpose === 'phone') {
            // Validate new phone
            if (!newPhone) {
                setError(t('settings.enterPhone'));
                setShowPasswordVerification(false);
                return;
            }
            // Send OTP to current email (not phone)
            setSaving(true);
            try {
                const currentEmail = userData?.email;
                if (!currentEmail) {
                    throw new Error('Current email not found');
                }
                
                const otpResponse = await fetch('/api/otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'send',
                        email: currentEmail,
                        purpose: 'phone_change'
                    })
                });
                
                if (!otpResponse.ok) {
                    const otpData = await otpResponse.json();
                    throw new Error(otpData.error || t('settings.failedUpdatePhone'));
                }
                
                // Show OTP verification modal
                setShowPasswordVerification(false);
                setOtpData({
                    email: currentEmail,
                    phone: newPhone,
                    otpMethod: 'email',
                    purpose: 'phone_change'
                });
                setShowOTPVerification(true);
            } catch (err: any) {
                setError(err.message || t('settings.failedUpdatePhone'));
                setShowPasswordVerification(false);
            } finally {
                setSaving(false);
            }
        }
    };
    
    // Handle OTP verification success
    const handleOTPSuccess = async () => {
        setShowOTPVerification(false);
        setSaving(true);
        setError('');
        setSuccess('');
        
        try {
            const currentUser = getCurrentUser();
            if (!currentUser?.id) {
                setError('User not found');
                return;
            }
            
            const authToken = localStorage.getItem('nobleco_auth_token');
            
            if (otpData?.purpose === 'email_change') {
                // Update email
                const response = await fetch(`/api/users`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({ id: currentUser.id, email: newEmail })
                });
                const data = await response.json();
                if (response.ok) {
                    setSuccess(t('settings.emailUpdated'));
                    setEmailEditing(false);
                    setNewEmail('');
                    await loadUserData();
                } else {
                    setError(data.error || t('settings.failedUpdateEmail'));
                }
            } else if (otpData?.purpose === 'phone_change') {
                // Update phone
                const response = await fetch(`/api/users`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({ id: currentUser.id, phone: newPhone })
                });
                const data = await response.json();
                if (response.ok) {
                    setSuccess(t('settings.phoneUpdated'));
                    setPhoneEditing(false);
                    setNewPhone('');
                    await loadUserData();
                } else {
                    setError(data.error || t('settings.failedUpdatePhone'));
                }
            }
        } catch (err) {
            setError(otpData?.purpose === 'email_change' 
                ? t('settings.failedUpdateEmail') 
                : t('settings.failedUpdatePhone'));
        } finally {
            setSaving(false);
            setOtpData(null);
        }
    };
    
    const handleStartEmailChange = () => {
        setEmailEditing(true);
        setNewEmail(userData?.email || '');
        setError('');
        setSuccess('');
    };
    
    const handleStartPhoneChange = () => {
        setPhoneEditing(true);
        setNewPhone(userData?.phone || '');
        setError('');
        setSuccess('');
    };
    
    const handleEmailInputSubmit = () => {
        if (!newEmail || !newEmail.includes('@')) {
            setError(t('settings.invalidEmail'));
            return;
        }
        // Show password verification modal
        setPasswordVerificationPurpose('email');
        setShowPasswordVerification(true);
    };
    
    const handlePhoneInputSubmit = () => {
        if (!newPhone) {
            setError(t('settings.enterPhone'));
            return;
        }
        // Show password verification modal
        setPasswordVerificationPurpose('phone');
        setShowPasswordVerification(true);
    };


    const handleChangePassword = async () => {
        if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
            setError(t('settings.fillPasswordFields'));
            return;
        }
        if (passwordData.new !== passwordData.confirm) {
            setError(t('settings.passwordsNotMatch'));
            return;
        }
        if (passwordData.new.length < 6) {
            setError(t('settings.passwordMinLength'));
            return;
        }
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            const currentUser = getCurrentUser();
            if (!currentUser?.id) {
                setError('User not found');
                return;
            }
            const authToken = localStorage.getItem('nobleco_auth_token');
            const response = await fetch(`/api/users/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    userId: currentUser.id,
                    currentPassword: passwordData.current,
                    newPassword: passwordData.new
                })
            });
            const data = await response.json();
            if (response.ok) {
                setSuccess(t('settings.passwordUpdated'));
                setPasswordEditing(false);
                setPasswordData({ current: '', new: '', confirm: '' });
                setShowPasswordVisibility({ current: false, new: false, confirm: false });
            } else {
                setError(data.error || t('settings.failedUpdatePassword'));
            }
        } catch (err) {
            setError(t('settings.failedUpdatePassword'));
        } finally {
            setSaving(false);
        }
    };
    
    const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
        setShowPasswordVisibility(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    if (!open) return null;

    const renderContent = () => {
        switch (activeSection) {
            case 'general':
                return (
                    <div className="settings-content-section">
                        <h2>{t('settings.generalSettings')}</h2>
                        <div className="settings-form">
                            <div className="settings-field">
                                <label>{t('settings.language')}</label>
                                <div className="settings-language-select">
                                    <select 
                                        value={settings.language}
                                        onChange={(e) => handleLanguageChange(e.target.value)}
                                        className="settings-language-dropdown"
                                    >
                                        <option value="en">English</option>
                                        <option value="vi">Tiếng Việt</option>
                                    </select>
                                    <div className="settings-language-flag">
                                        <FlagIcon country={settings.language as 'en' | 'vi'} />
                                    </div>
                                </div>
                            </div>
                            <div className="settings-field">
                                <label>{t('settings.theme')}</label>
                                <select 
                                    value={settings.theme}
                                    onChange={(e) => handleThemeChange(e.target.value)}
                                >
                                    <option value="light">{t('settings.light')}</option>
                                    <option value="dark">{t('settings.dark')}</option>
                                    <option value="auto">{t('settings.auto')}</option>
                                </select>
                            </div>
                        </div>
                    </div>
                );
            case 'account':
                return (
                    <div className="settings-content-section">
                        <h2>{t('settings.accountSettings')}</h2>
                        {error && (
                            <div className="settings-message settings-error">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="settings-message settings-success">
                                {success}
                            </div>
                        )}
                        <div className="settings-form">
                            <div className="settings-field">
                                <label>{t('settings.email')}</label>
                                {!emailEditing ? (
                                    <div className="settings-display-field">
                                        <span className="settings-display-value">
                                            {isLoading ? t('common.loading') : (userData?.email || t('settings.notSet'))}
                                        </span>
                                        <button 
                                            className="btn-secondary"
                                            onClick={handleStartEmailChange}
                                        >
                                            {t('settings.changeEmail')}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="settings-edit-field">
                                        <input 
                                            type="email"
                                            value={newEmail}
                                            onChange={(e) => {
                                                setNewEmail(e.target.value);
                                                setError('');
                                            }}
                                            placeholder={t('settings.enterNewEmail')}
                                            disabled={saving || showPasswordVerification || showOTPVerification}
                                        />
                                        <div className="settings-edit-actions">
                                            <button 
                                                className="btn-primary"
                                                onClick={handleEmailInputSubmit}
                                                disabled={saving || showPasswordVerification || showOTPVerification}
                                            >
                                                {saving ? t('common.loading') : t('common.next')}
                                            </button>
                                            <button 
                                                className="btn-secondary"
                                                onClick={() => {
                                                    setEmailEditing(false);
                                                    setNewEmail('');
                                                    setError('');
                                                    setSuccess('');
                                                    setShowPasswordVerification(false);
                                                    setShowOTPVerification(false);
                                                }}
                                                disabled={saving || showPasswordVerification || showOTPVerification}
                                            >
                                                {t('common.cancel')}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="settings-field">
                                <label>{t('settings.phone')}</label>
                                {!phoneEditing ? (
                                    <div className="settings-display-field">
                                        <span className="settings-display-value">
                                            {isLoading ? t('common.loading') : (userData?.phone || t('settings.notSet'))}
                                        </span>
                                        <button 
                                            className="btn-secondary"
                                            onClick={handleStartPhoneChange}
                                        >
                                            {t('settings.changePhone')}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="settings-edit-field">
                                        <input 
                                            type="tel"
                                            value={newPhone}
                                            onChange={(e) => {
                                                setNewPhone(e.target.value);
                                                setError('');
                                            }}
                                            placeholder={t('settings.enterNewPhone')}
                                            disabled={saving || showPasswordVerification || showOTPVerification}
                                        />
                                        <div className="settings-edit-actions">
                                            <button 
                                                className="btn-primary"
                                                onClick={handlePhoneInputSubmit}
                                                disabled={saving || showPasswordVerification || showOTPVerification}
                                            >
                                                {saving ? t('common.loading') : t('common.next')}
                                            </button>
                                            <button 
                                                className="btn-secondary"
                                                onClick={() => {
                                                    setPhoneEditing(false);
                                                    setNewPhone('');
                                                    setError('');
                                                    setSuccess('');
                                                    setShowPasswordVerification(false);
                                                    setShowOTPVerification(false);
                                                }}
                                                disabled={saving || showPasswordVerification || showOTPVerification}
                                            >
                                                {t('common.cancel')}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="settings-field">
                                <label>{t('settings.password')}</label>
                                {!passwordEditing ? (
                                    <div className="settings-display-field">
                                        <span className="settings-display-value">••••••••</span>
                                        <button 
                                            className="btn-secondary"
                                            onClick={() => {
                                                setPasswordEditing(true);
                                                setPasswordData({ current: '', new: '', confirm: '' });
                                                setError('');
                                                setSuccess('');
                                            }}
                                        >
                                            {t('settings.changePassword')}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="settings-edit-field">
                                        <div style={{ position: 'relative', marginBottom: '12px' }}>
                                            <input 
                                                type={showPasswordVisibility.current ? 'text' : 'password'}
                                                value={passwordData.current}
                                                onChange={(e) => {
                                                    setPasswordData({ ...passwordData, current: e.target.value });
                                                    setError('');
                                                }}
                                                placeholder={t('settings.enterCurrentPassword')}
                                                disabled={saving}
                                                style={{ paddingRight: '45px', width: '100%' }}
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle"
                                                onClick={() => togglePasswordVisibility('current')}
                                                style={{ position: 'absolute', right: '8px', bottom: '8px' }}
                                            >
                                                {showPasswordVisibility.current ? <IconEyeOff /> : <IconEye />}
                                            </button>
                                        </div>
                                        <div style={{ position: 'relative', marginBottom: '12px' }}>
                                            <input 
                                                type={showPasswordVisibility.new ? 'text' : 'password'}
                                                value={passwordData.new}
                                                onChange={(e) => {
                                                    setPasswordData({ ...passwordData, new: e.target.value });
                                                    setError('');
                                                }}
                                                placeholder={t('settings.enterNewPassword')}
                                                disabled={saving}
                                                style={{ paddingRight: '45px', width: '100%' }}
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle"
                                                onClick={() => togglePasswordVisibility('new')}
                                                style={{ position: 'absolute', right: '8px', bottom: '8px' }}
                                            >
                                                {showPasswordVisibility.new ? <IconEyeOff /> : <IconEye />}
                                            </button>
                                        </div>
                                        <div style={{ position: 'relative', marginBottom: '12px' }}>
                                            <input 
                                                type={showPasswordVisibility.confirm ? 'text' : 'password'}
                                                value={passwordData.confirm}
                                                onChange={(e) => {
                                                    setPasswordData({ ...passwordData, confirm: e.target.value });
                                                    setError('');
                                                }}
                                                placeholder={t('settings.confirmNewPassword')}
                                                disabled={saving}
                                                style={{ paddingRight: '45px', width: '100%' }}
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle"
                                                onClick={() => togglePasswordVisibility('confirm')}
                                                style={{ position: 'absolute', right: '8px', bottom: '8px' }}
                                            >
                                                {showPasswordVisibility.confirm ? <IconEyeOff /> : <IconEye />}
                                            </button>
                                        </div>
                                        <div className="settings-edit-actions">
                                            <button 
                                                className="btn-primary"
                                                onClick={handleChangePassword}
                                                disabled={saving}
                                            >
                                                {saving ? t('common.loading') : t('common.save')}
                                            </button>
                                            <button 
                                                className="btn-secondary"
                                                onClick={() => {
                                                    setPasswordEditing(false);
                                                    setPasswordData({ current: '', new: '', confirm: '' });
                                                    setShowPasswordVisibility({ current: false, new: false, confirm: false });
                                                    setError('');
                                                    setSuccess('');
                                                }}
                                                disabled={saving}
                                            >
                                                {t('common.cancel')}
                                            </button>
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
            <PasswordVerificationModal
                open={showPasswordVerification}
                onClose={() => {
                    setShowPasswordVerification(false);
                    setPasswordVerificationPurpose(null);
                }}
                onVerify={handlePasswordVerify}
                title={t('settings.verifyPassword')}
                description={passwordVerificationPurpose === 'email' 
                    ? t('settings.verifyPasswordToChangeEmail')
                    : passwordVerificationPurpose === 'phone'
                    ? t('settings.verifyPasswordToChangePhone')
                    : undefined}
            />
            {showOTPVerification && otpData && (
                <SettingsOTPVerification
                    email={otpData.email}
                    phone={otpData.phone}
                    otpMethod={otpData.otpMethod}
                    purpose={otpData.purpose}
                    onSuccess={handleOTPSuccess}
                    onCancel={() => {
                        setShowOTPVerification(false);
                        setOtpData(null);
                        setEmailEditing(false);
                        setPhoneEditing(false);
                        setNewEmail('');
                        setNewPhone('');
                    }}
                />
            )}
            <div className="settings-modal-overlay" onClick={onClose} />
            <div className={`settings-modal ${isFullscreen ? 'fullscreen' : ''}`} role="dialog" aria-modal="true">
                <div className="settings-header">
                    <h2>{t('settings.title')}</h2>
                    <div className="settings-header-actions">
                        <button 
                            className="settings-expand-btn" 
                            aria-label={isFullscreen ? t('common.close') : t('common.add')} 
                            onClick={toggleFullscreen}
                            title={isFullscreen ? t('common.close') : t('common.add')}
                        >
                            {isFullscreen ? <IconMinimize /> : <IconMaximize />}
                        </button>
                        <button className="modal-close" aria-label={t('common.close')} onClick={onClose}>
                            <IconX />
                        </button>
                    </div>
                </div>
                <div className="settings-body">
                    <div className="settings-sidebar">
                        <button 
                            className={`settings-sidebar-item ${activeSection === 'general' ? 'active' : ''}`}
                            onClick={() => setActiveSection('general')}
                        >
                            <IconSettings />
                            <span>{t('settings.general')}</span>
                        </button>
                        <button 
                            className={`settings-sidebar-item ${activeSection === 'account' ? 'active' : ''}`}
                            onClick={() => setActiveSection('account')}
                        >
                            <IconUser />
                            <span>{t('settings.account')}</span>
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

