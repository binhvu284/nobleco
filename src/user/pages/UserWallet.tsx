import { useState } from 'react';
import UserLayout from '../components/UserLayout';

type Transaction = {
    id: number;
    type: 'commission' | 'withdrawal' | 'bonus';
    amount: number;
    description: string;
    date: string;
    status?: 'completed' | 'pending' | 'rejected';
};

export default function UserWallet() {
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [bankName, setBankName] = useState('');
    const [bankNumber, setBankNumber] = useState('');
    const [showInfoModal, setShowInfoModal] = useState<'points' | 'commission' | null>(null);

    // Sample data - will be replaced with real data later
    const currentBalance = 1250.00;
    const userLevel = 'Unit Manager';
    const selfCommissionRate = 5;
    const level1CommissionRate = 2;
    const level2CommissionRate = 1;

    const transactions: Transaction[] = [
        {
            id: 1,
            type: 'commission',
            amount: 50.00,
            description: 'Commission from order #12345 (Direct)',
            date: '2025-10-18 14:30',
            status: 'completed'
        },
        {
            id: 2,
            type: 'commission',
            amount: 20.00,
            description: 'Commission from order #12344 (Level 1)',
            date: '2025-10-18 12:15',
            status: 'completed'
        },
        {
            id: 3,
            type: 'withdrawal',
            amount: -500.00,
            description: 'Withdrawal to bank account',
            date: '2025-10-17 09:00',
            status: 'completed'
        },
        {
            id: 4,
            type: 'commission',
            amount: 10.00,
            description: 'Commission from order #12343 (Level 2)',
            date: '2025-10-16 16:45',
            status: 'completed'
        },
        {
            id: 5,
            type: 'bonus',
            amount: 100.00,
            description: 'Monthly performance bonus',
            date: '2025-10-15 10:00',
            status: 'completed'
        },
        {
            id: 6,
            type: 'withdrawal',
            amount: -300.00,
            description: 'Withdrawal to bank account',
            date: '2025-10-14 11:30',
            status: 'pending'
        }
    ];

    const handleWithdrawSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Handle withdrawal request
        console.log('Withdrawal request:', { withdrawAmount, bankName, bankNumber });
        setShowWithdrawModal(false);
        // Reset form
        setWithdrawAmount('');
        setBankName('');
        setBankNumber('');
    };

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'commission':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v6l4 2"/>
                    </svg>
                );
            case 'withdrawal':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <polyline points="19 12 12 19 5 12"/>
                    </svg>
                );
            case 'bonus':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                );
            default:
                return null;
        }
    };

    return (
        <UserLayout title="Wallet">
            <div className="wallet-page">
                {/* Balance Card */}
                <div className="balance-card">
                    <div className="balance-header">
                        <div className="balance-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                                <line x1="1" y1="10" x2="23" y2="10"/>
                            </svg>
                        </div>
                        <div className="balance-info">
                            <p className="balance-label">Available Balance</p>
                            <h1 className="balance-amount">${currentBalance.toFixed(2)}</h1>
                            <p className="balance-description">
                                Points you can withdraw to real money
                                <button 
                                    className="info-btn"
                                    onClick={() => setShowInfoModal('points')}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"/>
                                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                                    </svg>
                                </button>
                            </p>
                        </div>
                    </div>
                    <button className="btn-withdraw" onClick={() => setShowWithdrawModal(true)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Withdraw Funds
                    </button>
                </div>

                {/* Commission Rates Card */}
                <div className="commission-card">
                    <div className="commission-header">
                        <h2>
                            Commission Rates
                            <button 
                                className="info-btn"
                                onClick={() => setShowInfoModal('commission')}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                                </svg>
                            </button>
                        </h2>
                        <span className="user-level-badge">{userLevel}</span>
                    </div>
                    <div className="commission-rates">
                        <div className="rate-item">
                            <div className="rate-label">
                                <div className="rate-icon self">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                        <circle cx="12" cy="7" r="4"/>
                                    </svg>
                                </div>
                                <span>Your Orders</span>
                            </div>
                            <div className="rate-value">{selfCommissionRate}%</div>
                        </div>
                        <div className="rate-item">
                            <div className="rate-label">
                                <div className="rate-icon level1">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                        <circle cx="9" cy="7" r="4"/>
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                                    </svg>
                                </div>
                                <span>Level 1 (Direct Referrals)</span>
                            </div>
                            <div className="rate-value">{level1CommissionRate}%</div>
                        </div>
                        <div className="rate-item">
                            <div className="rate-label">
                                <div className="rate-icon level2">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                        <circle cx="9" cy="7" r="4"/>
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                                    </svg>
                                </div>
                                <span>Level 2 (Indirect Referrals)</span>
                            </div>
                            <div className="rate-value">{level2CommissionRate}%</div>
                        </div>
                    </div>
                </div>

                {/* Transaction History */}
                <div className="transaction-history">
                    <h2>Transaction History</h2>
                    <div className="transaction-list">
                        {transactions.map((transaction) => (
                            <div key={transaction.id} className="transaction-item">
                                <div className={`transaction-icon ${transaction.type}`}>
                                    {getTransactionIcon(transaction.type)}
                                </div>
                                <div className="transaction-details">
                                    <p className="transaction-description">{transaction.description}</p>
                                    <p className="transaction-date">{transaction.date}</p>
                                </div>
                                <div className="transaction-right">
                                    <p className={`transaction-amount ${transaction.amount > 0 ? 'positive' : 'negative'}`}>
                                        {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                                    </p>
                                    {transaction.status && (
                                        <span className={`transaction-status status-${transaction.status}`}>
                                            {transaction.status}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Withdraw Modal */}
                {showWithdrawModal && (
                    <div className="modal-overlay" onClick={() => setShowWithdrawModal(false)}>
                        <div className="modal-card wallet-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Withdraw Funds</h2>
                                <button className="modal-close" onClick={() => setShowWithdrawModal(false)}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18"/>
                                        <line x1="6" y1="6" x2="18" y2="18"/>
                                    </svg>
                                </button>
                            </div>
                            <form onSubmit={handleWithdrawSubmit} className="withdraw-form">
                                <div className="withdraw-info">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"/>
                                        <path d="M12 16v-4"/>
                                        <path d="M12 8h.01"/>
                                    </svg>
                                    <p>Enter the amount you want to withdraw and your bank account details. Admin will review and approve your request.</p>
                                </div>

                                <div className="form-group">
                                    <label>Withdrawal Amount (USD)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="1"
                                        max={currentBalance}
                                        value={withdrawAmount}
                                        onChange={(e) => setWithdrawAmount(e.target.value)}
                                        placeholder="Enter amount"
                                        required
                                    />
                                    <span className="input-hint">Available: ${currentBalance.toFixed(2)}</span>
                                </div>

                                <div className="form-group">
                                    <label>Bank Name</label>
                                    <input
                                        type="text"
                                        value={bankName}
                                        onChange={(e) => setBankName(e.target.value)}
                                        placeholder="e.g., Chase Bank"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Bank Account Number</label>
                                    <input
                                        type="text"
                                        value={bankNumber}
                                        onChange={(e) => setBankNumber(e.target.value)}
                                        placeholder="Enter your account number"
                                        required
                                    />
                                </div>

                                <div className="modal-actions">
                                    <button type="button" className="btn-secondary" onClick={() => setShowWithdrawModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary">
                                        Submit Request
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Info Modals */}
                {showInfoModal && (
                    <div className="modal-overlay" onClick={() => setShowInfoModal(null)}>
                        <div className="modal-card info-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{showInfoModal === 'points' ? 'About Points' : 'Commission Rates Explained'}</h2>
                                <button className="modal-close" onClick={() => setShowInfoModal(null)}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18"/>
                                        <line x1="6" y1="6" x2="18" y2="18"/>
                                    </svg>
                                </button>
                            </div>
                            <div className="info-content">
                                {showInfoModal === 'points' ? (
                                    <>
                                        <h3>What are Points?</h3>
                                        <p>Points represent real money that you've earned through commissions. Each point equals $1 USD.</p>
                                        
                                        <h3>How to Earn Points?</h3>
                                        <ul>
                                            <li>Make purchases and earn commission on your own orders</li>
                                            <li>Earn commission from orders made by your direct referrals (Level 1)</li>
                                            <li>Earn commission from orders made by your indirect referrals (Level 2)</li>
                                            <li>Receive performance bonuses and incentives</li>
                                        </ul>

                                        <h3>How to Withdraw?</h3>
                                        <p>Click the "Withdraw Funds" button, enter the amount and your bank details. Admin will review your request and process the withdrawal to your bank account within 3-5 business days.</p>
                                    </>
                                ) : (
                                    <>
                                        <h3>Commission Structure</h3>
                                        <p>Your commission rate depends on your account level. Higher levels earn better rates.</p>
                                        
                                        <h3>Commission Types:</h3>
                                        <ul>
                                            <li><strong>Your Orders:</strong> Commission you earn from your own purchases</li>
                                            <li><strong>Level 1 (Direct):</strong> Commission from people you directly referred</li>
                                            <li><strong>Level 2 (Indirect):</strong> Commission from people referred by your Level 1 members</li>
                                        </ul>

                                        <h3>Example:</h3>
                                        <p>If someone you referred (Level 1) makes a $100 purchase, and your Level 1 rate is 2%, you earn $2 in points.</p>
                                        
                                        <h3>Level Up:</h3>
                                        <p>Build your network and increase your sales to level up and unlock higher commission rates!</p>
                                    </>
                                )}
                            </div>
                            <div className="modal-actions">
                                <button className="btn-primary" onClick={() => setShowInfoModal(null)}>
                                    Got it!
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </UserLayout>
    );
}
