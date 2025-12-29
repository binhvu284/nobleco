import { useState, useEffect, useRef } from 'react';
import { IconX, IconSettings, IconUser, IconMaximize, IconMinimize, IconEye, IconEyeOff } from '../../admin/components/icons';
import { getCurrentUser } from '../../auth';
import { useTranslation } from '../contexts/TranslationContext';
import { useTheme } from '../contexts/ThemeContext';

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
    const [settings, setSettings] = useState<{
        language: 'en' | 'vi';
        theme: 'light' | 'dark' | 'auto';
    }>({
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
    
    // Inline flow states for email/phone change
    const [changeFlowStep, setChangeFlowStep] = useState<'idle' | 'password' | 'newValue' | 'otp' | 'success'>('idle');
    const [changeFlowType, setChangeFlowType] = useState<'email' | 'phone' | null>(null);
    const [passwordVerified, setPasswordVerified] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [otpCode, setOtpCode] = useState(['', '', '', '']);
    const [otpError, setOtpError] = useState('');
    
    // Granular loading states for smooth UX
    const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
    const [isSendingOTP, setIsSendingOTP] = useState(false);
    const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
    const [isResendingOTP, setIsResendingOTP] = useState(false);
    const [isUpdatingValue, setIsUpdatingValue] = useState(false);
    const [otpResendCooldown, setOtpResendCooldown] = useState(0);
    const [otpTargetEmail, setOtpTargetEmail] = useState<string>('');
    const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

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
            setChangeFlowStep('idle');
            setChangeFlowType(null);
            setPasswordVerified(false);
            setCurrentPassword('');
            setShowCurrentPassword(false);
            setOtpCode(['', '', '', '']);
            setOtpError('');
            setIsVerifyingPassword(false);
            setIsSendingOTP(false);
            setIsVerifyingOTP(false);
            setIsResendingOTP(false);
            setIsUpdatingValue(false);
            setOtpResendCooldown(0);
            setOtpTargetEmail('');
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
        const languageValue = lang as 'en' | 'vi';
        setSettings({ ...settings, language: languageValue });
        setLanguage(languageValue);
    };

    const handleThemeChange = (newTheme: string) => {
        const themeValue = newTheme as 'light' | 'dark' | 'auto';
        setTheme(themeValue);
        setSettings({ ...settings, theme: themeValue });
    };

    
    const handleStartEmailChange = () => {
        setChangeFlowStep('password');
        setChangeFlowType('email');
        setEmailEditing(true);
        setNewEmail(userData?.email || '');
        setError('');
        setSuccess('');
        setOtpError('');
        setPasswordVerified(false);
        setCurrentPassword('');
    };
    
    const handleStartPhoneChange = () => {
        // If phone is not set, allow direct addition without authentication
        if (!userData?.phone) {
            setChangeFlowStep('newValue');
            setChangeFlowType('phone');
            setPhoneEditing(true);
            setNewPhone('');
            setError('');
            setSuccess('');
            setOtpError('');
            setPasswordVerified(false);
            setCurrentPassword('');
        } else {
            // Phone exists, require password verification
            setChangeFlowStep('password');
            setChangeFlowType('phone');
            setPhoneEditing(true);
            setNewPhone(userData?.phone || '');
            setError('');
            setSuccess('');
            setOtpError('');
            setPasswordVerified(false);
            setCurrentPassword('');
        }
    };
    
    const handleAddPhone = async () => {
        if (!newPhone || !newPhone.trim()) {
            setError(t('settings.enterPhone'));
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
            
            // Update phone directly without OTP (backend will validate format)
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
                setSuccess(t('settings.phoneAdded') || 'Phone number added successfully');
                await loadUserData();
                // Reset after 2 seconds
                setTimeout(() => {
                    resetChangeFlow();
                }, 2000);
            } else {
                setError(data.error || t('settings.failedAddPhone') || 'Failed to add phone number');
            }
        } catch (err: any) {
            setError(err.message || t('settings.failedAddPhone') || 'Failed to add phone number');
        } finally {
            setSaving(false);
        }
    };
    
    const handleEmailInputSubmit = async () => {
        // Normalize email to lowercase
        const normalizedEmail = newEmail.trim().toLowerCase();
        
        if (!normalizedEmail || !normalizedEmail.includes('@')) {
            setError(t('settings.invalidEmail'));
            return;
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            setError(t('settings.invalidEmail'));
            return;
        }
        
        // Update state with normalized email
        setNewEmail(normalizedEmail);
        
        // In step 2, password should already be verified, so proceed to OTP
        await handleSendOTP('email');
    };
    
    const handlePhoneInputSubmit = async () => {
        if (!newPhone) {
            setError(t('settings.enterPhone'));
            return;
        }
        // In step 2, password should already be verified, so proceed to OTP
        await handleSendOTP('phone');
    };
    
    const handlePasswordVerifyInline = async () => {
        if (!currentPassword) {
            setError(t('settings.enterCurrentPassword'));
            return;
        }
        
        setIsVerifyingPassword(true);
        setError('');
        setOtpError('');
        
        try {
            const authToken = localStorage.getItem('nobleco_auth_token');
            const response = await fetch('/api/users/verify-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ password: currentPassword })
            });
            
            // Check if response is JSON before parsing
            const contentType = response.headers.get('content-type');
            let data;
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                // If not JSON, read as text to see what we got
                const text = await response.text();
                throw new Error(response.status === 401 
                    ? t('settings.invalidPassword') 
                    : response.status === 404 
                        ? 'API endpoint not found' 
                        : `Server error: ${response.status}`);
            }
            
            if (!response.ok) {
                throw new Error(data.error || t('settings.invalidPassword'));
            }
            
            // Password verified - proceed to next step
            setPasswordVerified(true);
            setChangeFlowStep('newValue');
            setCurrentPassword('');
        } catch (err: any) {
            setError(err.message || t('settings.invalidPassword'));
        } finally {
            setIsVerifyingPassword(false);
        }
    };
    
    const handleSendOTP = async (type: 'email' | 'phone') => {
        setIsSendingOTP(true);
        setError('');
        setOtpError('');
        
        try {
            if (type === 'email') {
                // Normalize email to lowercase
                const normalizedEmail = newEmail.trim().toLowerCase();
                
                if (!normalizedEmail || !normalizedEmail.includes('@')) {
                    setError(t('settings.invalidEmail'));
                    setIsSendingOTP(false);
                    return;
                }
                
                // Validate email format
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(normalizedEmail)) {
                    setError(t('settings.invalidEmail'));
                    setIsSendingOTP(false);
                    return;
                }
                
                // Update state with normalized email
                setNewEmail(normalizedEmail);
                
                // Send OTP to new email (normalized)
                const otpResponse = await fetch('/api/otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'send',
                        email: normalizedEmail,
                        purpose: 'email_change'
                    })
                });
                
                if (!otpResponse.ok) {
                    const otpData = await otpResponse.json();
                    throw new Error(otpData.error || t('settings.failedUpdateEmail'));
                }
                
                setOtpTargetEmail(normalizedEmail);
                setChangeFlowStep('otp');
            } else {
                if (!newPhone) {
                    setError(t('settings.enterPhone'));
                    return;
                }
                // Send OTP to current email (not phone)
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
                
                setOtpTargetEmail(currentEmail);
                setChangeFlowStep('otp');
            }
        } catch (err: any) {
            setError(err.message || (type === 'email' ? t('settings.failedUpdateEmail') : t('settings.failedUpdatePhone')));
        } finally {
            setIsSendingOTP(false);
        }
    };
    
    const handleOTPChange = (index: number, value: string) => {
        if (value.length > 1) return;
        
        const newOtp = [...otpCode];
        newOtp[index] = value.replace(/\D/g, '');
        setOtpCode(newOtp);
        setOtpError('');
        
        if (value && index < 3) {
            otpInputRefs.current[index + 1]?.focus();
        }
    };
    
    const handleOTPKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
            otpInputRefs.current[index - 1]?.focus();
        }
    };
    
    const handleOTPPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
        if (pastedData.length === 4) {
            setOtpCode(pastedData.split(''));
            otpInputRefs.current[3]?.focus();
            setOtpError('');
        }
    };
    
    const handleOTPVerify = async () => {
        const otpCodeString = otpCode.join('');
        if (otpCodeString.length !== 4) {
            setOtpError(t('auth.enterCompleteCode'));
            return;
        }
        
        setIsVerifyingOTP(true);
        setOtpError('');
        
        try {
            const verifyBody: any = {
                action: 'verify',
                code: otpCodeString,
                purpose: changeFlowType === 'email' ? 'email_change' : 'phone_change'
            };
            
            verifyBody.email = otpTargetEmail;
            
            const verifyResponse = await fetch('/api/otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(verifyBody),
            });
            
            const verifyData = await verifyResponse.json();
            
            if (!verifyResponse.ok) {
                setOtpError(verifyData.error || t('auth.invalidCode'));
                setIsVerifyingOTP(false);
                return;
            }
            
            // OTP verified successfully - update the value
            await handleOTPSuccess();
        } catch (err) {
            setOtpError(t('auth.verifyFailed'));
            setIsVerifyingOTP(false);
        }
    };
    
    const handleOTPSuccess = async () => {
        setChangeFlowStep('success');
        setIsUpdatingValue(true);
        setError('');
        setOtpError('');
        
        try {
            const currentUser = getCurrentUser();
            if (!currentUser?.id) {
                setError('User not found');
                return;
            }
            
            const authToken = localStorage.getItem('nobleco_auth_token');
            
            if (changeFlowType === 'email') {
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
                    await loadUserData();
                    // Reset after 2 seconds
                    setTimeout(() => {
                        resetChangeFlow();
                    }, 2000);
                } else {
                    setError(data.error || t('settings.failedUpdateEmail'));
                    setChangeFlowStep('otp');
                }
            } else {
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
                    await loadUserData();
                    // Reset after 2 seconds
                    setTimeout(() => {
                        resetChangeFlow();
                    }, 2000);
                } else {
                    setError(data.error || t('settings.failedUpdatePhone'));
                    setChangeFlowStep('otp');
                }
            }
        } catch (err) {
            setError(changeFlowType === 'email' 
                ? t('settings.failedUpdateEmail') 
                : t('settings.failedUpdatePhone'));
            setChangeFlowStep('otp');
        } finally {
            setIsUpdatingValue(false);
        }
    };
    
    const handleOTPResend = async () => {
        if (otpResendCooldown > 0) return;
        
        setIsResendingOTP(true);
        setOtpError('');
        
        try {
            const resendBody: any = {
                action: 'resend',
                purpose: changeFlowType === 'email' ? 'email_change' : 'phone_change'
            };
            
            resendBody.email = otpTargetEmail;
            
            const response = await fetch('/api/otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(resendBody),
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                setOtpError(data.error || t('auth.resendFailed'));
                setIsResendingOTP(false);
                return;
            }
            
            setOtpCode(['', '', '', '']);
            setOtpResendCooldown(60);
            setIsResendingOTP(false);
            otpInputRefs.current[0]?.focus();
        } catch (err) {
            setOtpError(t('auth.resendFailed'));
            setIsResendingOTP(false);
        }
    };
    
    // OTP resend cooldown timer
    useEffect(() => {
        if (otpResendCooldown > 0) {
            const timer = setTimeout(() => setOtpResendCooldown(otpResendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [otpResendCooldown]);
    
    const resetChangeFlow = () => {
        setChangeFlowStep('idle');
        setChangeFlowType(null);
            setPasswordVerified(false);
            setCurrentPassword('');
            setShowCurrentPassword(false);
            setOtpCode(['', '', '', '']);
            setOtpError('');
            setIsVerifyingPassword(false);
            setIsSendingOTP(false);
            setIsVerifyingOTP(false);
            setIsResendingOTP(false);
            setIsUpdatingValue(false);
            setOtpResendCooldown(0);
            setOtpTargetEmail('');
            setEmailEditing(false);
            setPhoneEditing(false);
            setNewEmail('');
            setNewPhone('');
            setError('');
            setSuccess('');
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
    
    // Format email/phone for display in OTP step
    const formatEmail = (emailAddress: string) => {
        const [localPart, domain] = emailAddress.split('@');
        if (localPart.length <= 2) return emailAddress;
        const start = localPart.slice(0, 2);
        const end = localPart.slice(-1);
        return `${start}***${end}@${domain}`;
    };
    
    const formatPhone = (phoneNumber: string) => {
        if (phoneNumber.length <= 4) return phoneNumber;
        const start = phoneNumber.slice(0, 2);
        const end = phoneNumber.slice(-2);
        return `${start}****${end}`;
    };
    
    // Render inline password verification form
    const renderPasswordVerificationForm = () => {
        return (
            <div className="settings-edit-field">
                <div style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--muted)' }}>
                    Step 1 of 3
                </div>
                <p style={{ marginBottom: '16px', color: 'var(--muted)', fontSize: '14px' }}>
                    {changeFlowType === 'email' 
                        ? t('settings.verifyPasswordToChangeEmail')
                        : t('settings.verifyPasswordToChangePhone')}
                </p>
                <div style={{ position: 'relative', marginBottom: '16px', maxWidth: '100%' }}>
                    <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => {
                            setCurrentPassword(e.target.value);
                            setError('');
                        }}
                        placeholder={t('settings.enterCurrentPassword')}
                        disabled={isVerifyingPassword}
                        style={{ 
                            paddingRight: '45px', 
                            width: '100%',
                            maxWidth: '100%',
                            boxSizing: 'border-box',
                            opacity: isVerifyingPassword ? 0.6 : 1
                        }}
                        autoFocus
                    />
                    <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        disabled={isVerifyingPassword}
                        style={{ 
                            position: 'absolute', 
                            right: '8px', 
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none', 
                            border: 'none', 
                            cursor: isVerifyingPassword ? 'not-allowed' : 'pointer', 
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: isVerifyingPassword ? 0.5 : 1
                        }}
                    >
                        {showCurrentPassword ? <IconEyeOff /> : <IconEye />}
                    </button>
                </div>
                {error && (
                    <div className="error" style={{ marginBottom: '16px' }}>
                        {error}
                    </div>
                )}
                <div className="settings-edit-actions">
                    <button
                        className="btn-primary"
                        onClick={handlePasswordVerifyInline}
                        disabled={isVerifyingPassword || !currentPassword}
                    >
                        {isVerifyingPassword ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div className="settings-loading-spinner-small"></div>
                                {t('common.loading')}
                            </span>
                        ) : t('common.verify')}
                    </button>
                    <button
                        className="btn-secondary"
                        onClick={resetChangeFlow}
                        disabled={isVerifyingPassword}
                    >
                        {t('common.cancel')}
                    </button>
                </div>
            </div>
        );
    };
    
    // Render inline OTP verification form
    const renderOTPVerificationForm = () => {
        return (
            <div className="settings-edit-field">
                <div style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--muted)' }}>
                    Step 3 of 3
                </div>
                <p style={{ marginBottom: '16px', color: 'var(--muted)', fontSize: '14px' }}>
                    {t('auth.codeSentTo')}{' '}
                    <strong style={{ color: 'var(--text)' }}>
                        {formatEmail(otpTargetEmail)}
                    </strong>
                </p>
                <form onSubmit={(e) => { e.preventDefault(); handleOTPVerify(); }}>
                    <div className="otp-container" style={{ marginBottom: '20px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        {otpCode.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => (otpInputRefs.current[index] = el)}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleOTPChange(index, e.target.value)}
                                onKeyDown={(e) => handleOTPKeyDown(index, e)}
                                onPaste={handleOTPPaste}
                                className="otp-input"
                                style={{
                                    width: '48px',
                                    height: '48px',
                                    textAlign: 'center',
                                    fontSize: '20px',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                    padding: '0'
                                }}
                                autoFocus={index === 0}
                                disabled={isVerifyingOTP}
                            />
                        ))}
                    </div>
                    {(otpError || error) && (
                        <div className="error" style={{ marginBottom: '16px' }}>
                            {otpError || error}
                        </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={isVerifyingOTP || isUpdatingValue || otpCode.join('').length !== 4}
                                style={{ 
                                    width: 'auto',
                                    minWidth: '500px',
                                    textAlign: 'center',
                                    justifyContent: 'center',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                {isVerifyingOTP || isUpdatingValue ? (
                                    <>
                                        <div className="settings-loading-spinner-small"></div>
                                        {isUpdatingValue ? (t('common.saving') || 'Saving...') : t('common.loading')}
                                    </>
                                ) : t('auth.verifyOTP')}
                            </button>
                        </div>
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            gap: '8px',
                            fontSize: '14px',
                            color: 'var(--muted)',
                            width: '100%',
                            flexWrap: 'wrap'
                        }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setChangeFlowStep('newValue');
                                        setOtpCode(['', '', '', '']);
                                        setOtpError('');
                                    }}
                                    className="btn-secondary"
                                disabled={isVerifyingOTP || isUpdatingValue}
                                style={{ 
                                    fontSize: '14px',
                                    padding: '6px 12px',
                                    minWidth: 'auto',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {t('common.back')}
                            </button>
                            <button
                                type="button"
                                onClick={resetChangeFlow}
                                className="btn-secondary"
                                disabled={isVerifyingOTP || isUpdatingValue}
                                style={{ 
                                    fontSize: '14px',
                                    padding: '6px 12px',
                                    minWidth: 'auto',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {t('common.cancel')}
                            </button>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>{t('auth.didntReceiveCode')}</span>
                                <button
                                    type="button"
                                    onClick={handleOTPResend}
                                disabled={isResendingOTP || isUpdatingValue || otpResendCooldown > 0}
                                className="btn-secondary"
                                style={{ 
                                    fontSize: '14px',
                                    padding: '6px 12px',
                                    minWidth: 'auto',
                                    whiteSpace: 'nowrap',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                {otpResendCooldown > 0 
                                    ? `${t('auth.resendIn')} ${otpResendCooldown}s` 
                                    : isResendingOTP ? (
                                        <>
                                            <div className="settings-loading-spinner-small"></div>
                                            {t('common.loading')}
                                        </>
                                    ) : t('auth.resendOTP')}
                            </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        );
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
                                {changeFlowStep === 'idle' && changeFlowType !== 'email' ? (
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
                                ) : changeFlowType === 'email' && changeFlowStep === 'password' ? (
                                    renderPasswordVerificationForm()
                                ) : changeFlowType === 'email' && changeFlowStep === 'newValue' ? (
                                    <div className="settings-edit-field">
                                        <div style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--muted)' }}>
                                            Step 2 of 3
                                        </div>
                                        <p style={{ marginBottom: '16px', color: 'var(--muted)', fontSize: '14px' }}>
                                            {t('settings.enterNewEmailDescription') || 'Enter your new email'}
                                        </p>
                                        <input 
                                            type="email"
                                            value={newEmail}
                                            onChange={(e) => {
                                                // Normalize email to lowercase to prevent capitalization issues
                                                const normalizedEmail = e.target.value.toLowerCase();
                                                setNewEmail(normalizedEmail);
                                                setError('');
                                            }}
                                            placeholder={t('settings.enterNewEmail')}
                                            disabled={isSendingOTP}
                                            autoCapitalize="off"
                                            autoCorrect="off"
                                            autoComplete="email"
                                            spellCheck="false"
                                            inputMode="email"
                                            style={{ 
                                                width: '100%', 
                                                maxWidth: '100%', 
                                                boxSizing: 'border-box',
                                                opacity: isSendingOTP ? 0.6 : 1
                                            }}
                                        />
                                        {isSendingOTP && (
                                            <div style={{ 
                                                marginTop: '12px', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '8px',
                                                color: 'var(--primary)',
                                                fontSize: '14px'
                                            }}>
                                                <div className="settings-loading-spinner-small"></div>
                                                <span>{t('settings.sendingOTP') || 'Sending verification code...'}</span>
                                            </div>
                                        )}
                                        <div className="settings-edit-actions">
                                            <button 
                                                className="btn-primary"
                                                onClick={handleEmailInputSubmit}
                                                disabled={isSendingOTP || !newEmail || !newEmail.includes('@')}
                                            >
                                                {isSendingOTP ? (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div className="settings-loading-spinner-small"></div>
                                                        {t('common.loading')}
                                                    </span>
                                                ) : t('common.next')}
                                            </button>
                                            <button 
                                                className="btn-secondary"
                                                onClick={() => {
                                                    setChangeFlowStep('password');
                                                }}
                                                disabled={isSendingOTP}
                                            >
                                                {t('common.back')}
                                            </button>
                                            <button 
                                                className="btn-secondary"
                                                onClick={resetChangeFlow}
                                                disabled={isSendingOTP}
                                            >
                                                {t('common.cancel')}
                                            </button>
                                        </div>
                                    </div>
                                ) : changeFlowType === 'email' && changeFlowStep === 'otp' ? (
                                    renderOTPVerificationForm()
                                ) : changeFlowType === 'email' && changeFlowStep === 'success' ? (
                                    <div className="settings-display-field">
                                        <span className="settings-display-value" style={{ color: 'var(--success)' }}>
                                            {isUpdatingValue ? (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div className="settings-loading-spinner-small"></div>
                                                    {t('common.loading')}
                                                </span>
                                            ) : (userData?.email || t('settings.notSet'))}
                                        </span>
                                        {!isUpdatingValue && (
                                            <span style={{ color: 'var(--success)', fontSize: '14px' }}>
                                                {t('settings.emailUpdated')}
                                            </span>
                                        )}
                                    </div>
                                ) : (
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
                                )}
                            </div>
                            <div className="settings-field">
                                <label>{t('settings.phone')}</label>
                                {changeFlowStep === 'idle' && changeFlowType !== 'phone' ? (
                                    <div className="settings-display-field">
                                        <span className="settings-display-value">
                                            {isLoading ? t('common.loading') : (userData?.phone || t('settings.notSet'))}
                                        </span>
                                        <button 
                                            className="btn-secondary"
                                            onClick={handleStartPhoneChange}
                                        >
                                            {userData?.phone ? t('settings.changePhone') : (t('settings.addPhone') || 'Add Phone')}
                                        </button>
                                    </div>
                                ) : changeFlowType === 'phone' && changeFlowStep === 'password' ? (
                                    renderPasswordVerificationForm()
                                ) : changeFlowType === 'phone' && changeFlowStep === 'newValue' && !userData?.phone ? (
                                    // Add phone flow (no authentication required)
                                    <div className="settings-edit-field">
                                        <div style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--muted)' }}>
                                            {t('settings.addPhone') || 'Add Phone Number'}
                                        </div>
                                        <input 
                                            type="tel"
                                            value={newPhone}
                                            onChange={(e) => {
                                                setNewPhone(e.target.value);
                                                setError('');
                                            }}
                                            placeholder={t('settings.enterNewPhone') || 'Enter phone number'}
                                            disabled={saving}
                                            style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
                                        />
                                        <div className="settings-edit-actions">
                                            <button 
                                                className="btn-primary"
                                                onClick={handleAddPhone}
                                                disabled={saving || !newPhone}
                                            >
                                                {saving ? t('common.loading') : t('common.save')}
                                            </button>
                                            <button 
                                                className="btn-secondary"
                                                onClick={resetChangeFlow}
                                                disabled={saving}
                                            >
                                                {t('common.cancel')}
                                            </button>
                                        </div>
                                    </div>
                                ) : changeFlowType === 'phone' && changeFlowStep === 'newValue' ? (
                                    // Change phone flow (password already verified)
                                    <div className="settings-edit-field">
                                        <div style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--muted)' }}>
                                            Step 2 of 3
                                        </div>
                                        <p style={{ marginBottom: '16px', color: 'var(--muted)', fontSize: '14px' }}>
                                            {t('settings.enterNewPhoneDescription') || 'Enter your new phone number'}
                                        </p>
                                        <input 
                                            type="tel"
                                            value={newPhone}
                                            onChange={(e) => {
                                                setNewPhone(e.target.value);
                                                setError('');
                                            }}
                                            placeholder={t('settings.enterNewPhone')}
                                            disabled={isSendingOTP}
                                            style={{ 
                                                width: '100%', 
                                                maxWidth: '100%', 
                                                boxSizing: 'border-box',
                                                opacity: isSendingOTP ? 0.6 : 1
                                            }}
                                        />
                                        {isSendingOTP && (
                                            <div style={{ 
                                                marginTop: '12px', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '8px',
                                                color: 'var(--primary)',
                                                fontSize: '14px'
                                            }}>
                                                <div className="settings-loading-spinner-small"></div>
                                                <span>{t('settings.sendingOTP') || 'Sending verification code...'}</span>
                                            </div>
                                        )}
                                        <div className="settings-edit-actions">
                                            <button 
                                                className="btn-primary"
                                                onClick={handlePhoneInputSubmit}
                                                disabled={isSendingOTP || !newPhone}
                                            >
                                                {isSendingOTP ? (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div className="settings-loading-spinner-small"></div>
                                                        {t('common.loading')}
                                                    </span>
                                                ) : t('common.next')}
                                            </button>
                                            <button 
                                                className="btn-secondary"
                                                onClick={() => {
                                                    setChangeFlowStep('password');
                                                }}
                                                disabled={isSendingOTP}
                                            >
                                                {t('common.back')}
                                            </button>
                                            <button 
                                                className="btn-secondary"
                                                onClick={resetChangeFlow}
                                                disabled={isSendingOTP}
                                            >
                                                {t('common.cancel')}
                                            </button>
                                        </div>
                                    </div>
                                ) : changeFlowType === 'phone' && changeFlowStep === 'otp' ? (
                                    renderOTPVerificationForm()
                                ) : changeFlowType === 'phone' && changeFlowStep === 'success' ? (
                                    <div className="settings-display-field">
                                        <span className="settings-display-value" style={{ color: 'var(--success)' }}>
                                            {isUpdatingValue ? (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div className="settings-loading-spinner-small"></div>
                                                    {t('common.loading')}
                                                </span>
                                            ) : (userData?.phone || t('settings.notSet'))}
                                        </span>
                                        {!isUpdatingValue && (
                                            <span style={{ color: 'var(--success)', fontSize: '14px' }}>
                                                {t('settings.phoneUpdated')}
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <div className="settings-display-field">
                                        <span className="settings-display-value">
                                            {isLoading ? t('common.loading') : (userData?.phone || t('settings.notSet'))}
                                        </span>
                                        <button 
                                            className="btn-secondary"
                                            onClick={handleStartPhoneChange}
                                        >
                                            {userData?.phone ? t('settings.changePhone') : (t('settings.addPhone') || 'Add Phone')}
                                        </button>
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
                                        <div style={{ position: 'relative', marginBottom: '12px', maxWidth: '100%' }}>
                                            <input 
                                                type={showPasswordVisibility.current ? 'text' : 'password'}
                                                value={passwordData.current}
                                                onChange={(e) => {
                                                    setPasswordData({ ...passwordData, current: e.target.value });
                                                    setError('');
                                                }}
                                                placeholder={t('settings.enterCurrentPassword')}
                                                disabled={saving}
                                                style={{ 
                                                    paddingRight: '45px', 
                                                    width: '100%',
                                                    maxWidth: '100%',
                                                    boxSizing: 'border-box'
                                                }}
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle"
                                                onClick={() => togglePasswordVisibility('current')}
                                                style={{ 
                                                    position: 'absolute', 
                                                    right: '8px', 
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    padding: '4px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                {showPasswordVisibility.current ? <IconEyeOff /> : <IconEye />}
                                            </button>
                                        </div>
                                        <div style={{ position: 'relative', marginBottom: '12px', maxWidth: '100%' }}>
                                            <input 
                                                type={showPasswordVisibility.new ? 'text' : 'password'}
                                                value={passwordData.new}
                                                onChange={(e) => {
                                                    setPasswordData({ ...passwordData, new: e.target.value });
                                                    setError('');
                                                }}
                                                placeholder={t('settings.enterNewPassword')}
                                                disabled={saving}
                                                style={{ 
                                                    paddingRight: '45px', 
                                                    width: '100%',
                                                    maxWidth: '100%',
                                                    boxSizing: 'border-box'
                                                }}
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle"
                                                onClick={() => togglePasswordVisibility('new')}
                                                style={{ 
                                                    position: 'absolute', 
                                                    right: '8px', 
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    padding: '4px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                {showPasswordVisibility.new ? <IconEyeOff /> : <IconEye />}
                                            </button>
                                        </div>
                                        <div style={{ position: 'relative', marginBottom: '12px', maxWidth: '100%' }}>
                                            <input 
                                                type={showPasswordVisibility.confirm ? 'text' : 'password'}
                                                value={passwordData.confirm}
                                                onChange={(e) => {
                                                    setPasswordData({ ...passwordData, confirm: e.target.value });
                                                    setError('');
                                                }}
                                                placeholder={t('settings.confirmNewPassword')}
                                                disabled={saving}
                                                style={{ 
                                                    paddingRight: '45px', 
                                                    width: '100%',
                                                    maxWidth: '100%',
                                                    boxSizing: 'border-box'
                                                }}
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle"
                                                onClick={() => togglePasswordVisibility('confirm')}
                                                style={{ 
                                                    position: 'absolute', 
                                                    right: '8px', 
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    padding: '4px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
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

