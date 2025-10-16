import { useState } from 'react';
import AdminLayout from '../components/AdminLayout';

type RequestStatus = 'pending' | 'approved' | 'rejected';

type WithdrawRequest = {
    id: number;
    userId: number;
    userName: string;
    userEmail: string;
    userLevel: 'guest' | 'member' | 'unit manager' | 'brand manager';
    points: number;
    amount: number;
    bankName: string;
    accountNumber: string;
    accountName: string;
    status: RequestStatus;
    requestDate: string;
    processedDate?: string;
    note?: string;
};

export default function AdminRequest() {
    // Sample data
    const [requests, setRequests] = useState<WithdrawRequest[]>([
        {
            id: 1,
            userId: 2,
            userName: 'John Doe',
            userEmail: 'john@example.com',
            userLevel: 'member',
            points: 5000,
            amount: 500,
            bankName: 'Bank of America',
            accountNumber: '****1234',
            accountName: 'John Doe',
            status: 'pending',
            requestDate: '2024-01-15T10:30:00',
        },
        {
            id: 2,
            userId: 3,
            userName: 'Jane Smith',
            userEmail: 'jane@example.com',
            userLevel: 'unit manager',
            points: 10000,
            amount: 1000,
            bankName: 'Chase Bank',
            accountNumber: '****5678',
            accountName: 'Jane Smith',
            status: 'pending',
            requestDate: '2024-01-14T14:20:00',
        },
        {
            id: 3,
            userId: 4,
            userName: 'Mike Johnson',
            userEmail: 'mike@example.com',
            userLevel: 'brand manager',
            points: 20000,
            amount: 2000,
            bankName: 'Wells Fargo',
            accountNumber: '****9012',
            accountName: 'Mike Johnson',
            status: 'approved',
            requestDate: '2024-01-10T09:15:00',
            processedDate: '2024-01-11T16:30:00',
        },
        {
            id: 4,
            userId: 5,
            userName: 'Sarah Wilson',
            userEmail: 'sarah@example.com',
            userLevel: 'member',
            points: 3000,
            amount: 300,
            bankName: 'Citibank',
            accountNumber: '****3456',
            accountName: 'Sarah Wilson',
            status: 'rejected',
            requestDate: '2024-01-08T11:45:00',
            processedDate: '2024-01-09T10:20:00',
            note: 'Insufficient verification documents',
        },
    ]);

    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRequest, setSelectedRequest] = useState<WithdrawRequest | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    const getLevelColor = (level: string) => {
        const colors: Record<string, string> = {
            'guest': '#94a3b8',
            'member': '#3b82f6',
            'unit manager': '#8b5cf6',
            'brand manager': '#f59e0b'
        };
        return colors[level] || '#94a3b8';
    };

    const getStatusColor = (status: RequestStatus) => {
        const colors: Record<RequestStatus, string> = {
            'pending': '#f59e0b',
            'approved': '#10b981',
            'rejected': '#ef4444'
        };
        return colors[status];
    };

    const getStatusIcon = (status: RequestStatus) => {
        if (status === 'pending') {
            return (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                </svg>
            );
        }
        if (status === 'approved') {
            return (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
            );
        }
        return (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
        );
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredRequests = requests.filter(request => {
        const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
        const matchesSearch = request.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            request.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const stats = {
        total: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        approved: requests.filter(r => r.status === 'approved').length,
        rejected: requests.filter(r => r.status === 'rejected').length,
        totalAmount: requests.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0),
    };

    const handleApprove = (requestId: number) => {
        // TODO: API call to approve request
        setRequests(prev => prev.map(req =>
            req.id === requestId
                ? { ...req, status: 'approved', processedDate: new Date().toISOString() }
                : req
        ));
        setShowDetailModal(false);
        setSelectedRequest(null);
    };

    const handleReject = (requestId: number, note: string) => {
        // TODO: API call to reject request
        setRequests(prev => prev.map(req =>
            req.id === requestId
                ? { ...req, status: 'rejected', processedDate: new Date().toISOString(), note }
                : req
        ));
        setShowDetailModal(false);
        setSelectedRequest(null);
    };

    const openDetailModal = (request: WithdrawRequest) => {
        setSelectedRequest(request);
        setShowDetailModal(true);
    };

    return (
        <AdminLayout title="Withdraw Request">
            <div className="withdraw-request-page">
                {/* Stats Cards */}
                <div className="request-stats">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                                <line x1="1" y1="10" x2="23" y2="10" />
                            </svg>
                        </div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.total}</div>
                            <div className="stat-label">Total Requests</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 6v6l4 2" />
                            </svg>
                        </div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.pending}</div>
                            <div className="stat-label">Pending</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: '#d1fae5', color: '#059669' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                        </div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.approved}</div>
                            <div className="stat-label">Approved</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                        </div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.rejected}</div>
                            <div className="stat-label">Rejected</div>
                        </div>
                    </div>
                    <div className="stat-card stat-card-highlight">
                        <div className="stat-icon" style={{ background: '#ede9fe', color: '#7c3aed' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="1" x2="12" y2="23" />
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                        </div>
                        <div className="stat-content">
                            <div className="stat-value">${stats.totalAmount.toLocaleString()}</div>
                            <div className="stat-label">Pending Amount</div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="request-filters">
                    <div className="search-box">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <div className="filter-group">
                        <label>Status:</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                </div>

                {/* Requests Table */}
                <div className="request-table-container">
                    <table className="request-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>User</th>
                                <th>Level</th>
                                <th>Points</th>
                                <th>Amount</th>
                                <th>Bank Info</th>
                                <th>Request Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="empty-state">
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
                                            <line x1="9" y1="9" x2="9.01" y2="9" />
                                            <line x1="15" y1="9" x2="15.01" y2="9" />
                                        </svg>
                                        <p>No requests found</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredRequests.map((request) => (
                                    <tr key={request.id} onClick={() => openDetailModal(request)} style={{ cursor: 'pointer' }}>
                                        <td>#{request.id}</td>
                                        <td>
                                            <div className="user-cell">
                                                <div className="user-info">
                                                    <div className="user-name">{request.userName}</div>
                                                    <div className="user-email">{request.userEmail}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span
                                                className="level-badge"
                                                style={{ backgroundColor: getLevelColor(request.userLevel) }}
                                            >
                                                {request.userLevel}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="points-value">{request.points.toLocaleString()} pts</span>
                                        </td>
                                        <td>
                                            <span className="amount-value">${request.amount.toLocaleString()}</span>
                                        </td>
                                        <td>
                                            <div className="bank-info">
                                                <div className="bank-name">{request.bankName}</div>
                                                <div className="account-number">{request.accountNumber}</div>
                                            </div>
                                        </td>
                                        <td>{formatDate(request.requestDate)}</td>
                                        <td>
                                            <span
                                                className="status-badge"
                                                style={{ backgroundColor: getStatusColor(request.status) }}
                                            >
                                                {getStatusIcon(request.status)}
                                                {request.status}
                                            </span>
                                        </td>
                                        <td onClick={(e) => e.stopPropagation()}>
                                            <div className="action-buttons">
                                                {request.status === 'pending' && (
                                                    <>
                                                        <button
                                                            className="action-btn action-btn-approve"
                                                            onClick={() => openDetailModal(request)}
                                                            title="View Details"
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                                <circle cx="12" cy="12" r="3" />
                                                            </svg>
                                                        </button>
                                                    </>
                                                )}
                                                {request.status !== 'pending' && (
                                                    <button
                                                        className="action-btn action-btn-view"
                                                        onClick={() => openDetailModal(request)}
                                                        title="View Details"
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                            <circle cx="12" cy="12" r="3" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Detail Modal */}
                {showDetailModal && selectedRequest && (
                    <>
                        <div className="modal-overlay" onClick={() => setShowDetailModal(false)} />
                        <div className="request-detail-modal">
                            <div className="modal-header">
                                <h3>Withdraw Request Details</h3>
                                <button className="modal-close" onClick={() => setShowDetailModal(false)}>×</button>
                            </div>
                            <div className="modal-body">
                                <div className="detail-section">
                                    <h4>User Information</h4>
                                    <div className="detail-grid">
                                        <div className="detail-item">
                                            <span className="detail-label">Name:</span>
                                            <span className="detail-value">{selectedRequest.userName}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Email:</span>
                                            <span className="detail-value">{selectedRequest.userEmail}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Level:</span>
                                            <span
                                                className="level-badge"
                                                style={{ backgroundColor: getLevelColor(selectedRequest.userLevel) }}
                                            >
                                                {selectedRequest.userLevel}
                                            </span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">User ID:</span>
                                            <span className="detail-value">#{selectedRequest.userId}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="detail-section">
                                    <h4>Request Information</h4>
                                    <div className="detail-grid">
                                        <div className="detail-item">
                                            <span className="detail-label">Points:</span>
                                            <span className="detail-value points-value">{selectedRequest.points.toLocaleString()} pts</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Amount:</span>
                                            <span className="detail-value amount-value">${selectedRequest.amount.toLocaleString()}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Request Date:</span>
                                            <span className="detail-value">{formatDate(selectedRequest.requestDate)}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Status:</span>
                                            <span
                                                className="status-badge"
                                                style={{ backgroundColor: getStatusColor(selectedRequest.status) }}
                                            >
                                                {getStatusIcon(selectedRequest.status)}
                                                {selectedRequest.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="detail-section">
                                    <h4>Bank Information</h4>
                                    <div className="detail-grid">
                                        <div className="detail-item">
                                            <span className="detail-label">Bank Name:</span>
                                            <span className="detail-value">{selectedRequest.bankName}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Account Number:</span>
                                            <span className="detail-value">{selectedRequest.accountNumber}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Account Name:</span>
                                            <span className="detail-value">{selectedRequest.accountName}</span>
                                        </div>
                                    </div>
                                </div>

                                {selectedRequest.processedDate && (
                                    <div className="detail-section">
                                        <h4>Processing Information</h4>
                                        <div className="detail-grid">
                                            <div className="detail-item">
                                                <span className="detail-label">Processed Date:</span>
                                                <span className="detail-value">{formatDate(selectedRequest.processedDate)}</span>
                                            </div>
                                            {selectedRequest.note && (
                                                <div className="detail-item detail-item-full">
                                                    <span className="detail-label">Note:</span>
                                                    <span className="detail-value">{selectedRequest.note}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            {selectedRequest.status === 'pending' && (
                                <div className="modal-footer">
                                    <button
                                        className="btn-danger"
                                        onClick={() => {
                                            const note = prompt('Enter rejection reason (optional):');
                                            handleReject(selectedRequest.id, note || '');
                                        }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="15" y1="9" x2="9" y2="15" />
                                            <line x1="9" y1="9" x2="15" y2="15" />
                                        </svg>
                                        Reject Request
                                    </button>
                                    <button
                                        className="btn-success"
                                        onClick={() => {
                                            if (confirm('Confirm that payment has been completed?')) {
                                                handleApprove(selectedRequest.id);
                                            }
                                        }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                            <polyline points="22 4 12 14.01 9 11.01" />
                                        </svg>
                                        Approve & Confirm Payment
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
    );
}
