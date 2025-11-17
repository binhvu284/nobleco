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
                    <div className="auth-footer-company-wrapper">
                        <div className="auth-footer-logo">
                            <img src="/images/logo.png" alt="Nobleco Logo" />
                        </div>
                        <div className="auth-footer-info">
                            <p>
                                <strong>Name:</strong> <span className="auth-footer-value">Công Ty Cổ Phần Nobleco</span>
                            </p>
                            <p>
                                <strong>Tax Code:</strong> <span className="auth-footer-value">0317787072</span>
                            </p>
                            <p>
                                <strong>Address:</strong> <span className="auth-footer-value">7A/3 Nguyễn Thị Minh Khai, Phường Bến Nghé, Quận 1, TP Hồ Chí Minh</span>
                            </p>
                            <p>
                                <strong>Location:</strong> <span className="auth-footer-value">Việt Nam</span>
                            </p>
                            <p>
                                <strong>Phone:</strong> <span className="auth-footer-value">0943333197</span>
                            </p>
                        </div>
                    </div>
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
                        <div className="auth-footer-badges">
                            {/* DMCA Badge */}
                            <a 
                                href="https://www.dmca.com/Protection/Status.aspx?ID=fcce42f6-fad8-4215-b2b0-e5a92b912134"
                                title="DMCA.com Protection Status" 
                                className="dmca-badge"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <img 
                                    src="https://images.dmca.com/Badges/dmca_protected_sml_120m.png?ID=fcce42f6-fad8-4215-b2b0-e5a92b912134"
                                    loading="lazy" 
                                    alt="DMCA.com Protection Status" 
                                />
                            </a>

                            {/* Bộ Công Thương Badge */}
                            <a 
                                href="http://online.gov.vn/Website/chi-tiet-135446" 
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <img 
                                    src="/images/bo-cong-thuong.png" 
                                    alt="bo-cong-thuong" 
                                    width="115"
                                />
                            </a>
                        </div>
                        {/* Copyright */}
                        <p className="auth-footer-copyright">
                            © {new Date().getFullYear()} Nobleco. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}

