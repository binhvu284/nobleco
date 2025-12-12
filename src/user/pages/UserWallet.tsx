import { useState, useEffect, useRef } from 'react';
import UserLayout from '../components/UserLayout';
import { getCurrentUser } from '../../auth';

// Vietnamese Banks List with common banks
const VIETNAMESE_BANKS = [
    { name: 'Vietcombank', code: 'VCB', logo: '🏦' },
    { name: 'Techcombank', code: 'TCB', logo: '🏛️' },
    { name: 'BIDV', code: 'BID', logo: '🏦' },
    { name: 'Vietinbank', code: 'CTG', logo: '🏛️' },
    { name: 'Agribank', code: 'VBA', logo: '🏦' },
    { name: 'ACB', code: 'ACB', logo: '🏛️' },
    { name: 'VPBank', code: 'VPB', logo: '🏦' },
    { name: 'TPBank', code: 'TPB', logo: '🏛️' },
    { name: 'MBBank', code: 'MBB', logo: '🏦' },
    { name: 'VietABank', code: 'VAB', logo: '🏛️' },
    { name: 'HDBank', code: 'HDB', logo: '🏦' },
    { name: 'SHB', code: 'SHB', logo: '🏛️' },
    { name: 'Eximbank', code: 'EIB', logo: '🏦' },
    { name: 'MSB', code: 'MSB', logo: '🏛️' },
    { name: 'VIB', code: 'VIB', logo: '🏦' },
    { name: 'SeABank', code: 'SSB', logo: '🏛️' },
    { name: 'PGBank', code: 'PGB', logo: '🏦' },
    { name: 'NamABank', code: 'NAB', logo: '🏛️' },
    { name: 'OCB', code: 'OCB', logo: '🏦' },
    { name: 'BacABank', code: 'BAB', logo: '🏛️' },
    { name: 'SCB', code: 'SCB', logo: '🏦' },
    { name: 'DongABank', code: 'DAB', logo: '🏛️' },
    { name: 'KienLongBank', code: 'KLB', logo: '🏦' },
    { name: 'PVcomBank', code: 'PVC', logo: '🏛️' },
    { name: 'PublicBank', code: 'PBV', logo: '🏦' },
    { name: 'ABBank', code: 'ABB', logo: '🏛️' },
    { name: 'NCB', code: 'NCB', logo: '🏦' },
    { name: 'OceanBank', code: 'OCE', logo: '🏛️' },
    { name: 'GPBank', code: 'GPB', logo: '🏦' },
    { name: 'Other', code: 'OTH', logo: '🏦' }
];

type Transaction = {
    id: number;
    type: 'commission' | 'withdrawal' | 'bonus';
    amount: number;
    description: string;
    date: string;
    status?: 'completed' | 'pending' | 'rejected';
};

type BankInfo = {
    id: number;
    user_id: number;
    bank_name: string;
    bank_owner_name: string;
    bank_number: string;
    created_at: string;
    updated_at: string;
};

type WithdrawRequest = {
    id: number;
    user_id: number;
    amount: number;
    point: number;
    exchange_rate?: number;
    request_date: string;
    completed_date?: string;
    status: 'pending' | 'approve' | 'reject';
    bank_name: string;
    bank_owner_name: string;
    bank_number: string;
    processed_by?: number;
    admin_notes?: string;
    created_at: string;
    updated_at: string;
};

type WalletData = {
    user: {
        id: number;
        name: string;
        email: string;
        balance: number;
        level: string;
        commission: number;
        joinedDate: string;
    };
    commissionRates: {
        self: number;
        level1: number;
        level2: number;
    };
    transactions: Transaction[];
    bankInfo: BankInfo | null;
    pendingRequests: WithdrawRequest[];
};

export default function UserWallet() {
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawMoneyAmount, setWithdrawMoneyAmount] = useState('');
    const [isMoneyInputMode, setIsMoneyInputMode] = useState(false); // false = points input, true = money input
    const [bankName, setBankName] = useState('');
    const [bankNumber, setBankNumber] = useState('');
    const [showInfoModal, setShowInfoModal] = useState<'points' | 'commission' | null>(null);
    
    // Conversion rate: 1 point = 1 VND
    const CONVERSION_RATE = 1;
    const [walletData, setWalletData] = useState<WalletData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [balanceVisible, setBalanceVisible] = useState(false);
    const [showBankEditModal, setShowBankEditModal] = useState(false);
    const [editingBankInfo, setEditingBankInfo] = useState({
        bank_name: '',
        bank_owner_name: '',
        bank_number: ''
    });
    const [savingBankInfo, setSavingBankInfo] = useState(false);
    const [deletingBankInfo, setDeletingBankInfo] = useState(false);
    const [showBankDropdown, setShowBankDropdown] = useState(false);
    const [bankSearchQuery, setBankSearchQuery] = useState('');
    const [isOtherBank, setIsOtherBank] = useState(false);
    const [showBankInfo, setShowBankInfo] = useState(false); // Default hidden
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [showPendingRequestsPopup, setShowPendingRequestsPopup] = useState(false);
    const [requestToDelete, setRequestToDelete] = useState<number | null>(null);
    const [deletingRequest, setDeletingRequest] = useState(false);
    const [withdrawError, setWithdrawError] = useState<string | null>(null);
    const bankDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadWalletData();
    }, []);

    // Close bank dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (bankDropdownRef.current && !bankDropdownRef.current.contains(event.target as Node)) {
                setShowBankDropdown(false);
                setBankSearchQuery('');
            }
        };

        if (showBankDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showBankDropdown]);

    const loadWalletData = async () => {
        try {
            setLoading(true);
            const currentUser = getCurrentUser();
            
            if (!currentUser?.id) {
                setError('User not found');
                return;
            }

            const token = localStorage.getItem('nobleco_auth_token');
            const response = await fetch(`/api/users?endpoint=wallet&userId=${currentUser.id}`, {
                headers: {
                    'Cache-Control': 'max-age=60', // Cache for 1 minute
                    'Authorization': token ? `Bearer ${token}` : '',
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch wallet data');
            }

            const data = await response.json();
            setWalletData(data);
        } catch (err) {
            console.error('Error loading wallet data:', err);
            setError('Failed to load wallet data');
        } finally {
            setLoading(false);
        }
    };

    // Use real data if available, otherwise fallback to defaults
    const currentBalance = walletData?.user.balance || 0;
    const userLevel = walletData?.user.level || 'Guest';
    const selfCommissionRate = walletData?.commissionRates.self || 0;
    const level1CommissionRate = walletData?.commissionRates.level1 || 0;
    const level2CommissionRate = walletData?.commissionRates.level2 || 0;
    const transactions = walletData?.transactions || [];
    const bankInfo = walletData?.bankInfo || null;
    const pendingRequests = walletData?.pendingRequests || [];

    const getLevelDisplay = (level: string) => {
        if (level === 'unit manager') return 'Unit Manager';
        if (level === 'brand manager') return 'Brand Manager';
        if (level === 'member') return 'Member';
        if (level === 'guest') return 'Guest';
        return level.charAt(0).toUpperCase() + level.slice(1);
    };

    const handleBankInfoEdit = () => {
        if (bankInfo) {
            setEditingBankInfo({
                bank_name: bankInfo.bank_name,
                bank_owner_name: bankInfo.bank_owner_name,
                bank_number: bankInfo.bank_number
            });
            // Check if bank is in the list or is "Other"
            const bankInList = VIETNAMESE_BANKS.find(b => b.name === bankInfo.bank_name);
            setIsOtherBank(!bankInList || bankInfo.bank_name === 'Other');
        } else {
            setEditingBankInfo({
                bank_name: '',
                bank_owner_name: '',
                bank_number: ''
            });
            setIsOtherBank(false);
        }
        setShowBankEditModal(true);
    };

    const handleBankInfoDelete = () => {
        setShowDeleteConfirm(true);
    };

    const confirmBankInfoDelete = async () => {
        setShowDeleteConfirm(false);
        setDeletingBankInfo(true);
        try {
            const token = localStorage.getItem('nobleco_auth_token');
            
            const response = await fetch('/api/bank-info', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete bank info');
            }

            loadWalletData(); // Reload wallet data
            setNotification({ type: 'success', message: 'Bank account information deleted successfully' });
            setTimeout(() => setNotification(null), 3000);
        } catch (err: any) {
            console.error('Error deleting bank info:', err);
            setNotification({ type: 'error', message: err.message || 'Failed to delete bank info' });
            setTimeout(() => setNotification(null), 3000);
        } finally {
            setDeletingBankInfo(false);
        }
    };

    const filteredBanks = VIETNAMESE_BANKS.filter(bank =>
        bank.name.toLowerCase().includes(bankSearchQuery.toLowerCase()) ||
        bank.code.toLowerCase().includes(bankSearchQuery.toLowerCase())
    );

    const handleBankSelect = (bankName: string) => {
        if (bankName === 'Other') {
            setIsOtherBank(true);
            setEditingBankInfo({ ...editingBankInfo, bank_name: '' });
        } else {
            setIsOtherBank(false);
            setEditingBankInfo({ ...editingBankInfo, bank_name: bankName });
        }
        setShowBankDropdown(false);
        setBankSearchQuery('');
    };

    const handleBankInfoSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!editingBankInfo.bank_name || !editingBankInfo.bank_owner_name || !editingBankInfo.bank_number) {
            alert('Please fill in all fields');
            return;
        }

        const token = localStorage.getItem('nobleco_auth_token');
        
        if (!token) {
            alert('Please login again');
            return;
        }

        setSavingBankInfo(true);
        try {
            
            const response = await fetch('/api/bank-info', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(editingBankInfo)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save bank info');
            }

            setShowBankEditModal(false);
            setIsOtherBank(false);
            setBankSearchQuery('');
            loadWalletData(); // Reload wallet data to get updated bank info
            setNotification({ 
                type: 'success', 
                message: bankInfo ? 'Bank account information updated successfully' : 'Bank account information added successfully' 
            });
            setTimeout(() => setNotification(null), 3000);
        } catch (err: any) {
            console.error('Error saving bank info:', err);
            setNotification({ type: 'error', message: err.message || 'Failed to save bank info' });
            setTimeout(() => setNotification(null), 3000);
        } finally {
            setSavingBankInfo(false);
        }
    };

    const handlePointsChange = (value: string) => {
        setWithdrawAmount(value);
        setWithdrawError(null); // Clear error when user types
        if (value && !isNaN(Number(value))) {
            const points = Number(value);
            const money = points * CONVERSION_RATE;
            setWithdrawMoneyAmount(money.toString());
        } else {
            setWithdrawMoneyAmount('');
        }
    };

    const handleMoneyChange = (value: string) => {
        setWithdrawMoneyAmount(value);
        setWithdrawError(null); // Clear error when user types
        if (value && !isNaN(Number(value))) {
            const money = Number(value);
            const points = Math.floor(money / CONVERSION_RATE);
            setWithdrawAmount(points.toString());
        } else {
            setWithdrawAmount('');
        }
    };

    const handleSwapInputMode = () => {
        setIsMoneyInputMode(!isMoneyInputMode);
        setWithdrawError(null); // Clear error when swapping
        // Clear both fields when swapping
        setWithdrawAmount('');
        setWithdrawMoneyAmount('');
    };

    const handleWithdrawSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
        if (e) {
            e.preventDefault();
        }
        
        // Clear previous errors
        setWithdrawError(null);
        
        if (!bankInfo) {
            setWithdrawError('Please add your bank account information first');
            setShowWithdrawModal(false);
            setShowBankEditModal(true);
            return;
        }

        const pointAmount = parseInt(withdrawAmount);
        const vndAmount = parseFloat(withdrawMoneyAmount);

        if (!withdrawAmount || pointAmount <= 0) {
            setWithdrawError('Please enter a valid withdrawal amount');
            return;
        }

        if (pointAmount > currentBalance) {
            setWithdrawError(`Invalid withdrawal amount. You only have ${currentBalance.toLocaleString()} points available.`);
            return;
        }

        if (isNaN(vndAmount) || vndAmount <= 0) {
            setWithdrawError('Invalid money amount');
            return;
        }

        try {
            const token = localStorage.getItem('nobleco_auth_token');
            
            const response = await fetch('/api/withdraw-requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                },
                body: JSON.stringify({
                    amount: vndAmount,
                    point: pointAmount,
                    bank_name: bankInfo.bank_name,
                    bank_owner_name: bankInfo.bank_owner_name,
                    bank_number: bankInfo.bank_number
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to submit withdrawal request');
            }

            setShowWithdrawModal(false);
            setWithdrawAmount('');
            setWithdrawMoneyAmount('');
            setIsMoneyInputMode(false);
            setWithdrawError(null);
            loadWalletData(); // Reload wallet data to show new pending request
            setNotification({ type: 'success', message: 'Withdrawal request submitted successfully' });
            setTimeout(() => setNotification(null), 3000);
        } catch (err: any) {
            console.error('Error submitting withdrawal request:', err);
            setWithdrawError(err.message || 'Failed to submit withdrawal request');
            setNotification({ type: 'error', message: err.message || 'Failed to submit withdrawal request' });
            setTimeout(() => setNotification(null), 3000);
        }
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

    if (loading) {
        return (
            <UserLayout title="Wallet">
                <div className="wallet-page loading">
                    <div className="loading-overlay">
                        <div className="loading-spinner">
                            <div className="spinner-ring"></div>
                            <div className="spinner-ring"></div>
                            <div className="spinner-ring"></div>
                        </div>
                        <p className="loading-text">Loading wallet data...</p>
                    </div>
                </div>
            </UserLayout>
        );
    }

    if (error) {
        return (
            <UserLayout title="Wallet">
                <div className="wallet-page">
                    <div style={{ textAlign: 'center', padding: '40px', color: '#b42318' }}>
                        {error}
                    </div>
                </div>
            </UserLayout>
        );
    }

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
                            <div className="balance-amount-row">
                                <div className="balance-amount-section">
                                    <div className="balance-amount-with-toggle">
                                        <h1 className="balance-amount">
                                            {balanceVisible ? (
                                                <>
                                                    {currentBalance.toLocaleString()}
                                                    <span className="points-label">
                                                        <span className="points-text">point</span>
                                                        <svg className="points-star-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                                                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                                        </svg>
                                                    </span>
                                                </>
                                            ) : '••••••'}
                                        </h1>
                                        <button 
                                            className="balance-toggle-btn"
                                            onClick={() => setBalanceVisible(!balanceVisible)}
                                            title={balanceVisible ? "Hide balance" : "Show balance"}
                                        >
                                            {balanceVisible ? (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                                    <line x1="1" y1="1" x2="23" y2="23"/>
                                                </svg>
                                            ) : (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                                    <circle cx="12" cy="12" r="3"/>
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                    {balanceVisible && (
                                        <div className="balance-vnd-conversion">
                                            <span className="vnd-label">≈</span>
                                            <span className="vnd-amount">{currentBalance.toLocaleString('vi-VN')} VND</span>
                                        </div>
                                    )}
                                </div>
                            </div>
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

                {/* Bank Account Info Card */}
                <div className="bank-info-card">
                    <div className="bank-info-header">
                        <div className="bank-info-title-with-icon">
                            <svg 
                                width="24" 
                                height="24" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2"
                                className="bank-info-title-icon"
                            >
                                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                                <line x1="1" y1="10" x2="23" y2="10"/>
                            </svg>
                            <h2>
                                Bank Account Info
                                <button 
                                    className="bank-info-toggle-btn"
                                    onClick={() => setShowBankInfo(!showBankInfo)}
                                    title={showBankInfo ? "Hide bank info" : "Show bank info"}
                                >
                                    {showBankInfo ? (
                                        <svg 
                                            width="20" 
                                            height="20" 
                                            viewBox="0 0 24 24" 
                                            fill="none" 
                                            stroke="currentColor" 
                                            strokeWidth="2"
                                        >
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                            <line x1="1" y1="1" x2="23" y2="23"/>
                                        </svg>
                                    ) : (
                                        <svg 
                                            width="20" 
                                            height="20" 
                                            viewBox="0 0 24 24" 
                                            fill="none" 
                                            stroke="currentColor" 
                                            strokeWidth="2"
                                        >
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                            <circle cx="12" cy="12" r="3"/>
                                        </svg>
                                    )}
                                </button>
                            </h2>
                        </div>
                        {bankInfo && (
                            <div className="bank-info-actions">
                                <button className="btn-edit-bank" onClick={handleBankInfoEdit}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                    </svg>
                                    Edit
                                </button>
                                <button 
                                    className="btn-delete-bank" 
                                    onClick={handleBankInfoDelete}
                                    disabled={deletingBankInfo}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="3 6 5 6 21 6"/>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                    </svg>
                                    {deletingBankInfo ? 'Deleting...' : 'Remove'}
                                </button>
                            </div>
                        )}
                    </div>
                    <p className="bank-info-description">
                        This is your bank account information for withdrawing points from your wallet. Admin will transfer funds to this account when your withdrawal request is approved.
                    </p>
                    {bankInfo ? (
                        <div className="bank-info-content">
                            <div className="bank-info-item-compact">
                                <span className="bank-info-label-compact">Bank Name</span>
                                <span className="bank-info-value-compact">
                                    {showBankInfo ? bankInfo.bank_name : '*****'}
                                </span>
                            </div>
                            <div className="bank-info-item-compact">
                                <span className="bank-info-label-compact">Account Owner</span>
                                <span className="bank-info-value-compact">
                                    {showBankInfo ? bankInfo.bank_owner_name : '*****'}
                                </span>
                            </div>
                            <div className="bank-info-item-compact">
                                <span className="bank-info-label-compact">Account Number</span>
                                <span className="bank-info-value-compact">
                                    {showBankInfo ? bankInfo.bank_number : '*****'}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="bank-info-empty">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                                <line x1="1" y1="10" x2="23" y2="10"/>
                            </svg>
                            <p>No bank account information added yet</p>
                            <button className="btn-add-bank" onClick={handleBankInfoEdit}>
                                Add Bank Account
                            </button>
                        </div>
                    )}
                </div>

                {/* Pending Requests Button */}
                {pendingRequests.length > 0 && (
                    <>
                        <button 
                            className="btn-pending-requests"
                            onClick={() => setShowPendingRequestsPopup(true)}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M12 6v6l4 2"/>
                            </svg>
                            <span>Pending Withdraw Requests ({pendingRequests.length})</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="9 18 15 12 9 6"/>
                            </svg>
                        </button>

                        {/* Pending Requests Popup */}
                        {showPendingRequestsPopup && (
                            <>
                                <div className="modal-overlay" onClick={() => setShowPendingRequestsPopup(false)} />
                                <div className="pending-requests-popup">
                                    <div className="pending-requests-popup-header">
                                        <h3>Pending Withdraw Requests</h3>
                                        <button className="modal-close" onClick={() => setShowPendingRequestsPopup(false)}>×</button>
                                    </div>
                                    <div className="pending-requests-popup-content">
                                        {pendingRequests.map((request) => (
                                            <div key={request.id} className="pending-request-popup-item">
                                                <div className="pending-request-popup-points">
                                                    {request.point.toLocaleString()} pts
                                                </div>
                                                <div className="pending-request-popup-amount">
                                                    {request.amount.toLocaleString('vi-VN')} ₫
                                                </div>
                                                <div className="pending-request-popup-date">
                                                    {new Date(request.request_date).toLocaleDateString('en-US', { 
                                                        month: 'short', 
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                                <div className="pending-request-popup-status">
                                                    <span className="status-badge status-pending">Pending</span>
                                                </div>
                                                <button
                                                    className="pending-request-popup-delete"
                                                    onClick={() => {
                                                        setRequestToDelete(request.id);
                                                        setShowDeleteConfirm(true);
                                                    }}
                                                    disabled={deletingRequest}
                                                    title="Delete request"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polyline points="3 6 5 6 21 6"/>
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* Delete Withdraw Request Confirmation Modal */}
                {showDeleteConfirm && requestToDelete && (
                    <div className="modal-overlay" onClick={() => {
                        setShowDeleteConfirm(false);
                        setRequestToDelete(null);
                    }}>
                        <div className="modal-card confirm-delete-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <div className="delete-modal-icon">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                        <line x1="12" y1="9" x2="12" y2="13"/>
                                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                                    </svg>
                                </div>
                                <button className="modal-close" onClick={() => {
                                    setShowDeleteConfirm(false);
                                    setRequestToDelete(null);
                                }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18"/>
                                        <line x1="6" y1="6" x2="18" y2="18"/>
                                    </svg>
                                </button>
                            </div>
                            <div className="delete-modal-content">
                                <h3>Delete Withdraw Request</h3>
                                <p>Are you sure you want to delete this withdrawal request? This action cannot be undone.</p>
                            </div>
                            <div className="modal-actions">
                                <button 
                                    type="button" 
                                    className="btn-secondary" 
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setRequestToDelete(null);
                                    }}
                                    disabled={deletingRequest}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    className="btn-danger" 
                                    onClick={async () => {
                                        if (!requestToDelete) return;
                                        setDeletingRequest(true);
                                        try {
                                            const token = localStorage.getItem('nobleco_auth_token');
                                            const response = await fetch(`/api/withdraw-requests?id=${requestToDelete}`, {
                                                method: 'DELETE',
                                                headers: {
                                                    'Authorization': token ? `Bearer ${token}` : '',
                                                },
                                            });

                                            if (!response.ok) {
                                                const errorData = await response.json();
                                                throw new Error(errorData.error || 'Failed to delete request');
                                            }

                                            setShowDeleteConfirm(false);
                                            setRequestToDelete(null);
                                            setShowPendingRequestsPopup(false);
                                            loadWalletData();
                                            setNotification({ type: 'success', message: 'Withdrawal request deleted successfully' });
                                            setTimeout(() => setNotification(null), 3000);
                                        } catch (err: any) {
                                            console.error('Error deleting request:', err);
                                            setNotification({ type: 'error', message: err.message || 'Failed to delete request' });
                                            setTimeout(() => setNotification(null), 3000);
                                        } finally {
                                            setDeletingRequest(false);
                                        }
                                    }}
                                    disabled={deletingRequest}
                                >
                                    {deletingRequest ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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
                        <span className="user-level-badge">{getLevelDisplay(userLevel)}</span>
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
                    <h2>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                            <polyline points="10 9 9 9 8 9"/>
                        </svg>
                        Transaction History
                    </h2>
                    <div className="transaction-list">
                        {transactions.length === 0 ? (
                            <div className="empty-state">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                    <polyline points="14 2 14 8 20 8"/>
                                    <line x1="16" y1="13" x2="8" y2="13"/>
                                    <line x1="16" y1="17" x2="8" y2="17"/>
                                </svg>
                                <p>No transactions yet</p>
                            </div>
                        ) : (
                            transactions.map((transaction) => (
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
                                            {transaction.amount > 0 ? '+' : ''}{Math.abs(transaction.amount).toLocaleString()}
                                            <span className="points-label-small">
                                                <span className="points-text-small">point</span>
                                                <svg className="points-star-icon-small" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                                </svg>
                                            </span>
                                        </p>
                                        {transaction.status && (
                                            <span className={`transaction-status status-${transaction.status}`}>
                                                {transaction.status}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Withdraw Modal */}
                {showWithdrawModal && (
                    <div className="modal-overlay" onClick={() => {
                        setShowWithdrawModal(false);
                        setWithdrawError(null);
                    }}>
                        <div className="modal-card wallet-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Withdraw Funds</h2>
                                <button className="modal-close" onClick={() => {
                                    setShowWithdrawModal(false);
                                    setWithdrawError(null);
                                }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18"/>
                                        <line x1="6" y1="6" x2="18" y2="18"/>
                                    </svg>
                                </button>
                            </div>
                            <div className="wallet-modal-content">
                                <form onSubmit={handleWithdrawSubmit} className="withdraw-form">
                                <div className="withdraw-info">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"/>
                                        <path d="M12 16v-4"/>
                                        <path d="M12 8h.01"/>
                                    </svg>
                                    <div className="withdraw-info-content">
                                        <p>Enter the amount you want to withdraw and your bank account details. Admin will review and approve your request.</p>
                                        <div className="conversion-rate-info">
                                            <span className="conversion-rate-label">Conversion Rate:</span>
                                            <span className="conversion-rate-value">1 Point = {CONVERSION_RATE} VND</span>
                                        </div>
                                    </div>
                                </div>

                                {withdrawError && (
                                    <div className="withdraw-error-alert">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10"/>
                                            <line x1="12" y1="8" x2="12" y2="12"/>
                                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                                        </svg>
                                        <span>{withdrawError}</span>
                                        <button 
                                            type="button"
                                            className="alert-close-btn"
                                            onClick={() => setWithdrawError(null)}
                                            aria-label="Close alert"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="18" y1="6" x2="6" y2="18"/>
                                                <line x1="6" y1="6" x2="18" y2="18"/>
                                            </svg>
                                        </button>
                                    </div>
                                )}

                                {!isMoneyInputMode ? (
                                    <>
                                        <div className="form-group">
                                            <label>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="field-title-icon">
                                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                                </svg>
                                                Withdrawal Amount (Points)
                                            </label>
                                            <div className="amount-input-wrapper">
                                                <input
                                                    type="number"
                                                    step="1"
                                                    min="1"
                                                    max={currentBalance}
                                                    value={withdrawAmount}
                                                    onChange={(e) => handlePointsChange(e.target.value)}
                                                    placeholder="Enter amount"
                                                    required
                                                />
                                            </div>
                                            <span className="input-hint">Available: {currentBalance.toLocaleString()} points ({currentBalance.toLocaleString('vi-VN')} VND)</span>
                                        </div>

                                        <div className="swap-button-wrapper">
                                            <button
                                                type="button"
                                                className="swap-input-btn"
                                                onClick={handleSwapInputMode}
                                                title="Switch to Money input"
                                            >
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M12 3v18"/>
                                                    <path d="M8 7l4-4 4 4"/>
                                                    <path d="M8 17l4 4 4-4"/>
                                                </svg>
                                            </button>
                                        </div>

                                        <div className="form-group">
                                            <label>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="field-title-icon">
                                                    <circle cx="12" cy="12" r="10"/>
                                                    <path d="M12 6v12M15 9H9.5a2.5 2.5 0 0 0 0 5H14.5a2.5 2.5 0 0 1 0 5H9"/>
                                                </svg>
                                                Withdrawal Amount (Money - VND)
                                            </label>
                                            <div className="amount-input-wrapper">
                                                <input
                                                    type="number"
                                                    step="1"
                                                    min="1"
                                                    max={currentBalance * CONVERSION_RATE}
                                                    value={withdrawMoneyAmount}
                                                    onChange={(e) => handleMoneyChange(e.target.value)}
                                                    placeholder=""
                                                    disabled
                                                    className="disabled-input"
                                                />
                                                <span className="auto-calculated-badge">Auto</span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="form-group">
                                            <label>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="field-title-icon">
                                                    <circle cx="12" cy="12" r="10"/>
                                                    <path d="M12 6v12M15 9H9.5a2.5 2.5 0 0 0 0 5H14.5a2.5 2.5 0 0 1 0 5H9"/>
                                                </svg>
                                                Withdrawal Amount (Money - VND)
                                            </label>
                                            <div className="amount-input-wrapper">
                                                <input
                                                    type="number"
                                                    step="1"
                                                    min="1"
                                                    max={currentBalance * CONVERSION_RATE}
                                                    value={withdrawMoneyAmount}
                                                    onChange={(e) => handleMoneyChange(e.target.value)}
                                                    placeholder="Enter amount"
                                                    required
                                                />
                                            </div>
                                            <span className="input-hint">Available: {currentBalance.toLocaleString()} points ({currentBalance.toLocaleString('vi-VN')} VND)</span>
                                        </div>

                                        <div className="swap-button-wrapper">
                                            <button
                                                type="button"
                                                className="swap-input-btn"
                                                onClick={handleSwapInputMode}
                                                title="Switch to Points input"
                                            >
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M12 3v18"/>
                                                    <path d="M8 7l4-4 4 4"/>
                                                    <path d="M8 17l4 4 4-4"/>
                                                </svg>
                                            </button>
                                        </div>

                                        <div className="form-group">
                                            <label>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="field-title-icon">
                                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                                </svg>
                                                Withdrawal Amount (Points)
                                            </label>
                                            <div className="amount-input-wrapper">
                                                <input
                                                    type="number"
                                                    step="1"
                                                    min="1"
                                                    max={currentBalance}
                                                    value={withdrawAmount}
                                                    onChange={(e) => handlePointsChange(e.target.value)}
                                                    placeholder=""
                                                    disabled
                                                    className="disabled-input"
                                                />
                                                <span className="auto-calculated-badge">Auto</span>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {!bankInfo && (
                                    <div className="withdraw-warning">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                            <line x1="12" y1="9" x2="12" y2="13"/>
                                            <line x1="12" y1="17" x2="12.01" y2="17"/>
                                        </svg>
                                        <p>Please add your bank account information in the Bank Account Info section first.</p>
                                    </div>
                                )}
                                </form>
                            </div>
                            <div className="modal-actions-fixed">
                                <button 
                                    type="button" 
                                    className="btn-secondary" 
                                    onClick={() => {
                                        setShowWithdrawModal(false);
                                        setWithdrawError(null);
                                    }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    className="btn-primary"
                                    onClick={handleWithdrawSubmit}
                                    disabled={!bankInfo}
                                >
                                    Submit Request
                                </button>
                            </div>
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
                                        <p>Points represent real money that you've earned through commissions. Each point equals 1 VND (Vietnamese Dong).</p>
                                        
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
                                        <p>If someone you referred (Level 1) makes a 100,000 VND purchase, and your Level 1 rate is 2%, you earn 2,000 points.</p>
                                        
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

                {/* Bank Info Edit Modal */}
                {showBankEditModal && (
                    <div className="modal-overlay" onClick={() => setShowBankEditModal(false)}>
                        <div className="modal-card wallet-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{bankInfo ? 'Edit Bank Account Info' : 'Add Bank Account Info'}</h2>
                                <button className="modal-close" onClick={() => setShowBankEditModal(false)}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18"/>
                                        <line x1="6" y1="6" x2="18" y2="18"/>
                                    </svg>
                                </button>
                            </div>
                            <form onSubmit={handleBankInfoSave} className="withdraw-form">
                                <div className="form-group">
                                    <label>Bank Name</label>
                                    <div className="bank-dropdown-wrapper" ref={bankDropdownRef}>
                                        {!isOtherBank ? (
                                            <>
                                                <button
                                                    type="button"
                                                    className="bank-select-btn"
                                                    onClick={() => setShowBankDropdown(!showBankDropdown)}
                                                >
                                                    {editingBankInfo.bank_name ? (
                                                        <span className="bank-selected">
                                                            <span className="bank-logo">
                                                                {VIETNAMESE_BANKS.find(b => b.name === editingBankInfo.bank_name)?.logo || '🏦'}
                                                            </span>
                                                            {editingBankInfo.bank_name}
                                                        </span>
                                                    ) : (
                                                        <span className="bank-placeholder">Select a bank</span>
                                                    )}
                                                    <svg 
                                                        width="20" 
                                                        height="20" 
                                                        viewBox="0 0 24 24" 
                                                        fill="none" 
                                                        stroke="currentColor" 
                                                        strokeWidth="2"
                                                        className={showBankDropdown ? 'rotate' : ''}
                                                    >
                                                        <polyline points="6 9 12 15 18 9"/>
                                                    </svg>
                                                </button>
                                                {showBankDropdown && (
                                                    <div className="bank-dropdown-menu">
                                                        <div className="bank-dropdown-search">
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <circle cx="11" cy="11" r="8"/>
                                                                <path d="M21 21l-4.35-4.35"/>
                                                            </svg>
                                                            <input
                                                                type="text"
                                                                placeholder="Search banks..."
                                                                value={bankSearchQuery}
                                                                onChange={(e) => setBankSearchQuery(e.target.value)}
                                                                autoFocus
                                                            />
                                                        </div>
                                                        <div className="bank-dropdown-options">
                                                            {filteredBanks.map((bank) => (
                                                                <div
                                                                    key={bank.code}
                                                                    className="bank-option"
                                                                    onClick={() => handleBankSelect(bank.name)}
                                                                >
                                                                    <span className="bank-option-logo">{bank.logo}</span>
                                                                    <span className="bank-option-name">{bank.name}</span>
                                                                    {bank.code !== 'OTH' && (
                                                                        <span className="bank-option-code">{bank.code}</span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                            {filteredBanks.length === 0 && (
                                                                <div className="bank-option-empty">No banks found</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="bank-other-input">
                                                <input
                                                    type="text"
                                                    value={editingBankInfo.bank_name}
                                                    onChange={(e) => setEditingBankInfo({ ...editingBankInfo, bank_name: e.target.value })}
                                                    placeholder="Enter bank name"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    className="btn-back-to-list"
                                                    onClick={() => {
                                                        setIsOtherBank(false);
                                                        setEditingBankInfo({ ...editingBankInfo, bank_name: '' });
                                                    }}
                                                >
                                                    Back to list
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Account Owner Name</label>
                                    <input
                                        type="text"
                                        value={editingBankInfo.bank_owner_name}
                                        onChange={(e) => setEditingBankInfo({ ...editingBankInfo, bank_owner_name: e.target.value })}
                                        placeholder="Enter account owner name"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Account Number</label>
                                    <input
                                        type="text"
                                        value={editingBankInfo.bank_number}
                                        onChange={(e) => setEditingBankInfo({ ...editingBankInfo, bank_number: e.target.value })}
                                        placeholder="Enter your account number"
                                        required
                                    />
                                </div>

                                <div className="modal-actions">
                                    <button 
                                        type="button" 
                                        className="btn-secondary" 
                                        onClick={() => setShowBankEditModal(false)}
                                        disabled={savingBankInfo}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn-primary"
                                        disabled={savingBankInfo}
                                    >
                                        {savingBankInfo ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Bank Info Confirmation Modal */}
                {showDeleteConfirm && !requestToDelete && (
                    <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
                        <div className="modal-card confirm-delete-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <div className="delete-modal-icon">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                        <line x1="12" y1="9" x2="12" y2="13"/>
                                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                                    </svg>
                                </div>
                                <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18"/>
                                        <line x1="6" y1="6" x2="18" y2="18"/>
                                    </svg>
                                </button>
                            </div>
                            <div className="delete-modal-content">
                                <h3>Delete Bank Account Info</h3>
                                <p>Are you sure you want to delete your bank account information? This action cannot be undone. You will need to add it again before making withdrawal requests.</p>
                            </div>
                            <div className="modal-actions">
                                <button 
                                    type="button" 
                                    className="btn-secondary" 
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={deletingBankInfo}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    className="btn-danger" 
                                    onClick={confirmBankInfoDelete}
                                    disabled={deletingBankInfo}
                                >
                                    {deletingBankInfo ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Notification Toast */}
                {notification && (
                    <div className={`notification-toast ${notification.type}`}>
                        <div className="notification-content">
                            <span className="notification-icon">
                                {notification.type === 'success' ? '✓' : '✕'}
                            </span>
                            <span className="notification-message">{notification.message}</span>
                        </div>
                        <button 
                            className="notification-close"
                            onClick={() => setNotification(null)}
                        >
                            ✕
                        </button>
                    </div>
                )}
            </div>
        </UserLayout>
    );
}
