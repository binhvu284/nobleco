import { useState, FormEvent, useEffect } from 'react';
import { IconX, IconEye, IconEyeOff } from '../../admin/components/icons';
import { useTranslation } from '../contexts/TranslationContext';

interface PasswordVerificationModalProps {
    open: boolean;
    onClose: () => void;
    onVerify: (password: string) => Promise<void>;
    title?: string;
    description?: string;
}

export default function PasswordVerificationModal({ 
    open, 
    onClose, 
    onVerify,
    title,
    description 
}: PasswordVerificationModalProps) {
    const { t } = useTranslation();
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    // #region agent log
    useEffect(() => {
        fetch('http://127.0.0.1:7242/ingest/3da31dfe-5721-4e1a-a160-93fd6dd15ec4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PasswordVerificationModal.tsx:26',message:'PasswordVerificationModal render',data:{open,title,description},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        if (open) {
            setTimeout(() => {
                const overlay = document.querySelector('.modal-overlay[style*="zIndex: 1000000"]');
                const content = document.querySelector('.modal-content[style*="zIndex: 1000001"]');
                if (overlay) {
                    const styles = window.getComputedStyle(overlay);
                    fetch('http://127.0.0.1:7242/ingest/3da31dfe-5721-4e1a-a160-93fd6dd15ec4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PasswordVerificationModal.tsx:30',message:'Modal overlay computed styles',data:{display:styles.display,visibility:styles.visibility,opacity:styles.opacity,zIndex:styles.zIndex,position:styles.position,top:styles.top,left:styles.left,width:styles.width,height:styles.height},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                }
                if (content) {
                    const styles = window.getComputedStyle(content);
                    fetch('http://127.0.0.1:7242/ingest/3da31dfe-5721-4e1a-a160-93fd6dd15ec4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PasswordVerificationModal.tsx:35',message:'Modal content computed styles',data:{display:styles.display,visibility:styles.visibility,opacity:styles.opacity,zIndex:styles.zIndex,position:styles.position},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                } else {
                    fetch('http://127.0.0.1:7242/ingest/3da31dfe-5721-4e1a-a160-93fd6dd15ec4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PasswordVerificationModal.tsx:38',message:'Modal content element not found in DOM',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                }
            }, 100);
        }
    }, [open, title, description]);
    // #endregion

    if (!open) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!password) {
            setError(t('settings.enterCurrentPassword'));
            return;
        }

        setIsVerifying(true);
        try {
            await onVerify(password);
            setPassword('');
        } catch (err: any) {
            setError(err.message || t('settings.invalidPassword'));
        } finally {
            setIsVerifying(false);
        }
    };

    const handleClose = () => {
        setPassword('');
        setError('');
        setShowPassword(false);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={handleClose} style={{ zIndex: 1000000 }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', zIndex: 1000001 }}>
                <div className="modal-header">
                    <h2>{title || t('settings.verifyPassword')}</h2>
                    <button className="close-btn" onClick={handleClose} aria-label={t('common.close')}>
                        <IconX />
                    </button>
                </div>
                <div className="modal-body">
                    {description && <p style={{ marginBottom: '20px', color: 'var(--muted)' }}>{description}</p>}
                    <form onSubmit={handleSubmit}>
                        <div style={{ position: 'relative', marginBottom: '20px' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError('');
                                }}
                                placeholder={t('settings.enterCurrentPassword')}
                                disabled={isVerifying}
                                style={{ paddingRight: '45px', width: '100%' }}
                                autoFocus
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ position: 'absolute', right: '8px', bottom: '8px' }}
                            >
                                {showPassword ? <IconEyeOff /> : <IconEye />}
                            </button>
                        </div>
                        {error && (
                            <div className="error" style={{ marginBottom: '16px' }}>
                                {error}
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={handleClose}
                                disabled={isVerifying}
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={isVerifying || !password}
                            >
                                {isVerifying ? t('common.loading') : t('common.verify')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

