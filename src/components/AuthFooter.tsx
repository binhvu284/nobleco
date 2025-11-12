import { Link } from 'react-router-dom';

export default function AuthFooter() {
    return (
        <footer className="auth-footer-container">
            <div className="auth-footer-content">
                {/* Company Information */}
                <div className="auth-footer-section">
                    <h4 className="auth-footer-title">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }}>
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        Company Information
                    </h4>
                    <div className="auth-footer-info">
                        <p>
                            <strong>Tax Code:</strong> <span className="auth-footer-value">0123456789</span>
                        </p>
                        <p>
                            <strong>Business Registration:</strong> <span className="auth-footer-value">01-123456789</span>
                        </p>
                        <p>
                            <strong>Address:</strong> <span className="auth-footer-value">123 Business Street, City, Country</span>
                        </p>
                    </div>
                </div>

                {/* Policies & Legal */}
                <div className="auth-footer-section">
                    <h4 className="auth-footer-title">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }}>
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <polyline points="10 9 9 9 8 9" />
                        </svg>
                        Policies & Legal
                    </h4>
                    <nav className="auth-footer-links">
                        <Link to="/privacy-policy" className="auth-footer-link">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            Privacy Policy
                        </Link>
                        <Link to="/terms-of-service" className="auth-footer-link">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                            </svg>
                            Terms of Service
                        </Link>
                        <Link to="/cookie-policy" className="auth-footer-link">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                            </svg>
                            Cookie Policy
                        </Link>
                        <Link to="/refund-policy" className="auth-footer-link">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                            Refund Policy
                        </Link>
                    </nav>
                </div>

                {/* Certificates & Compliance */}
                <div className="auth-footer-section">
                    <h4 className="auth-footer-title">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }}>
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            <path d="M9 12l2 2 4-4" />
                        </svg>
                        Certificates & Compliance
                    </h4>
                    <div className="auth-footer-certificates">
                        <div className="auth-footer-cert-placeholder">
                            <div className="auth-footer-cert-icon">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                    <path d="M9 12l2 2 4-4" />
                                </svg>
                            </div>
                            <div className="auth-footer-cert-info">
                                <p className="auth-footer-cert-title">Verified Business</p>
                                <p className="auth-footer-cert-desc">Authorized by regulatory authority</p>
                            </div>
                        </div>
                        {/* Placeholder for future authority organization code */}
                        <div className="auth-footer-cert-code" id="authority-cert-code">
                            <span>Authority verification code will appear here</span>
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div className="auth-footer-bottom">
                    <p className="auth-footer-copyright">
                        © {new Date().getFullYear()} Nobleco. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}

