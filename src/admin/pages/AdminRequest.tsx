import { useState, useEffect, useRef } from 'react';
import AdminLayout from '../components/AdminLayout';
import { IconSearch, IconFilter, IconMoreVertical, IconEye, IconTrash2, IconList, IconGrid } from '../components/icons';
import ConfirmModal from '../components/ConfirmModal';
import { getAvatarColor, getAvatarInitial } from '../../utils/avatarUtils';

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
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const filterDropdownRef = useRef<HTMLDivElement>(null);
    const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [requestToAction, setRequestToAction] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

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

    const handleApprove = (requestId: number) => {
        // TODO: API call to approve request
        setRequests(prev => prev.map(req =>
            req.id === requestId
                ? { ...req, status: 'approved', processedDate: new Date().toISOString() }
                : req
        ));
        setShowDetailModal(false);
        setSelectedRequest(null);
        setShowApproveModal(false);
        setRequestToAction(null);
        setActiveDropdown(null);
    };

    const handleReject = (requestId: number) => {
        // TODO: API call to reject request
        setRequests(prev => prev.map(req =>
            req.id === requestId
                ? { ...req, status: 'rejected', processedDate: new Date().toISOString() }
                : req
        ));
        setShowDetailModal(false);
        setSelectedRequest(null);
        setShowRejectModal(false);
        setRequestToAction(null);
        setActiveDropdown(null);
    };

    const openApproveModal = (requestId: number) => {
        setRequestToAction(requestId);
        setShowApproveModal(true);
        setActiveDropdown(null);
    };

    const openRejectModal = (requestId: number) => {
        setRequestToAction(requestId);
        setShowRejectModal(true);
        setActiveDropdown(null);
    };

    const handleDelete = (requestId: number) => {
        if (confirm('Are you sure you want to delete this withdrawal request?')) {
            // TODO: API call to delete request
            setRequests(prev => prev.filter(req => req.id !== requestId));
            setActiveDropdown(null);
        }
    };

    const toggleDropdown = (requestId: number) => {
        setActiveDropdown(activeDropdown === requestId ? null : requestId);
    };

    const openDetailModal = (request: WithdrawRequest) => {
        setSelectedRequest(request);
        setShowDetailModal(true);
        setActiveDropdown(null);
    };

    // Close filter dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (filterDropdownRef.current && !filterDropdownRef.current.contains(target)) {
                setShowFilterDropdown(false);
            }
            if (!target.closest('.unified-dropdown')) {
                setActiveDropdown(null);
            }
        };

        if (showFilterDropdown || activeDropdown !== null) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [showFilterDropdown, activeDropdown]);

    return (
        <AdminLayout title="Withdraw Request">
            <div className="withdraw-request-page">
                {/* Toolbar */}
                <div className="orders-toolbar">
                    <div className="toolbar-left">
                        {/* Search */}
                        <div className="search-container">
                            <IconSearch />
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Filter */}
                        <div className="filter-dropdown-container" ref={filterDropdownRef}>
                            <button 
                                className="btn-filter"
                                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                                title="Filter by status"
                            >
                                <IconFilter />
                            </button>
                            {showFilterDropdown && (
                                <div className="filter-dropdown-menu">
                                    <button 
                                        className={`filter-option ${statusFilter === 'all' ? 'active' : ''}`}
                                        onClick={() => {
                                            setStatusFilter('all');
                                            setShowFilterDropdown(false);
                                        }}
                                    >
                                        All Status
                                    </button>
                                    <button 
                                        className={`filter-option ${statusFilter === 'pending' ? 'active' : ''}`}
                                        onClick={() => {
                                            setStatusFilter('pending');
                                            setShowFilterDropdown(false);
                                        }}
                                    >
                                        Pending
                                    </button>
                                    <button 
                                        className={`filter-option ${statusFilter === 'approved' ? 'active' : ''}`}
                                        onClick={() => {
                                            setStatusFilter('approved');
                                            setShowFilterDropdown(false);
                                        }}
                                    >
                                        Approved
                                    </button>
                                    <button 
                                        className={`filter-option ${statusFilter === 'rejected' ? 'active' : ''}`}
                                        onClick={() => {
                                            setStatusFilter('rejected');
                                            setShowFilterDropdown(false);
                                        }}
                                    >
                                        Rejected
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="toolbar-right">
                        {/* View Toggle */}
                        <div className="view-toggle desktop-only">
                            <button
                                className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                                onClick={() => setViewMode('table')}
                                title="Table view"
                            >
                                <IconList />
                            </button>
                            <button
                                className={`view-btn ${viewMode === 'card' ? 'active' : ''}`}
                                onClick={() => setViewMode('card')}
                                title="Card view"
                            >
                                <IconGrid />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table View */}
                {viewMode === 'table' ? (
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
                                                <div className="user-info">
                                                    <div 
                                                        className="user-avatar"
                                                        style={{ backgroundColor: getAvatarColor(request.userName) }}
                                                    >
                                                        {getAvatarInitial(request.userName)}
                                                    </div>
                                                    <div className="user-details">
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
                                                <div className={`unified-dropdown ${activeDropdown === request.id ? 'active' : ''}`}>
                                                    <button
                                                        className="unified-more-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleDropdown(request.id);
                                                        }}
                                                        title="More Actions"
                                                    >
                                                        <IconMoreVertical />
                                                    </button>
                                                    {activeDropdown === request.id && (
                                                        <div className="unified-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                                                            <button
                                                                className="unified-dropdown-item"
                                                                onClick={() => openDetailModal(request)}
                                                            >
                                                                <IconEye />
                                                                Detail
                                                            </button>
                                                            {request.status === 'pending' && (
                                                                <>
                                                                    <button
                                                                        className="unified-dropdown-item"
                                                                        onClick={() => openApproveModal(request.id)}
                                                                    >
                                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                                            <polyline points="22 4 12 14.01 9 11.01" />
                                                                        </svg>
                                                                        Approve
                                                                    </button>
                                                                    <button
                                                                        className="unified-dropdown-item"
                                                                        onClick={() => openRejectModal(request.id)}
                                                                    >
                                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                            <circle cx="12" cy="12" r="10" />
                                                                            <line x1="15" y1="9" x2="9" y2="15" />
                                                                            <line x1="9" y1="9" x2="15" y2="15" />
                                                                        </svg>
                                                                        Reject
                                                                    </button>
                                                                </>
                                                            )}
                                                            <button
                                                                className="unified-dropdown-item danger"
                                                                onClick={() => handleDelete(request.id)}
                                                            >
                                                                <IconTrash2 />
                                                                Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    /* Card View */
                    <div className="orders-grid">
                        {filteredRequests.length === 0 ? (
                            <div className="empty-state">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
                                    <line x1="9" y1="9" x2="9.01" y2="9" />
                                    <line x1="15" y1="9" x2="15.01" y2="9" />
                                </svg>
                                <p>No requests found</p>
                            </div>
                        ) : (
                            filteredRequests.map((request) => (
                                <div key={request.id} className="order-card">
                                    <div className="card-header">
                                        <div className="card-title">
                                            <span className="order-code">#{request.id}</span>
                                            <span
                                                className="status-badge"
                                                style={{ backgroundColor: getStatusColor(request.status) }}
                                            >
                                                {getStatusIcon(request.status)}
                                                {request.status}
                                            </span>
                                        </div>
                                        <div className={`unified-dropdown ${activeDropdown === request.id ? 'active' : ''}`}>
                                            <button
                                                className="unified-more-btn"
                                                onClick={() => toggleDropdown(request.id)}
                                            >
                                                <IconMoreVertical />
                                            </button>
                                            {activeDropdown === request.id && (
                                                <div className="unified-dropdown-menu">
                                                    <button
                                                        className="unified-dropdown-item"
                                                        onClick={() => openDetailModal(request)}
                                                    >
                                                        <IconEye />
                                                        Detail
                                                    </button>
                                                    {request.status === 'pending' && (
                                                        <>
                                                            <button
                                                                className="unified-dropdown-item"
                                                                onClick={() => openApproveModal(request.id)}
                                                            >
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                                    <polyline points="22 4 12 14.01 9 11.01" />
                                                                </svg>
                                                                Approve
                                                            </button>
                                                            <button
                                                                className="unified-dropdown-item"
                                                                onClick={() => openRejectModal(request.id)}
                                                            >
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <circle cx="12" cy="12" r="10" />
                                                                    <line x1="15" y1="9" x2="9" y2="15" />
                                                                    <line x1="9" y1="9" x2="15" y2="15" />
                                                                </svg>
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        className="unified-dropdown-item danger"
                                                        onClick={() => handleDelete(request.id)}
                                                    >
                                                        <IconTrash2 />
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="card-body">
                                        <div className="card-row">
                                            <span className="card-label">User:</span>
                                            <div className="card-value-group">
                                                <div className="user-info" style={{ margin: 0 }}>
                                                    <div 
                                                        className="user-avatar"
                                                        style={{ backgroundColor: getAvatarColor(request.userName), width: '32px', height: '32px', fontSize: '14px' }}
                                                    >
                                                        {getAvatarInitial(request.userName)}
                                                    </div>
                                                    <div className="user-details">
                                                        <div className="user-name">{request.userName}</div>
                                                        <div className="user-email">{request.userEmail}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="card-row">
                                            <span className="card-label">Level:</span>
                                            <span
                                                className="level-badge"
                                                style={{ backgroundColor: getLevelColor(request.userLevel) }}
                                            >
                                                {request.userLevel}
                                            </span>
                                        </div>
                                        <div className="card-row">
                                            <span className="card-label">Points:</span>
                                            <span className="card-value points-value">{request.points.toLocaleString()} pts</span>
                                        </div>
                                        <div className="card-row">
                                            <span className="card-label">Amount:</span>
                                            <span className="card-value amount-value">${request.amount.toLocaleString()}</span>
                                        </div>
                                        <div className="card-row">
                                            <span className="card-label">Bank:</span>
                                            <div className="card-value-group">
                                                <span className="card-value">{request.bankName}</span>
                                                <span className="card-value-sub">{request.accountNumber}</span>
                                            </div>
                                        </div>
                                        <div className="card-row">
                                            <span className="card-label">Request Date:</span>
                                            <span className="card-value">{formatDate(request.requestDate)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

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
                                            setShowDetailModal(false);
                                            openRejectModal(selectedRequest.id);
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
                                            setShowDetailModal(false);
                                            openApproveModal(selectedRequest.id);
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

                {/* Approve Confirmation Modal */}
                <ConfirmModal
                    open={showApproveModal}
                    onClose={() => {
                        setShowApproveModal(false);
                        setRequestToAction(null);
                    }}
                    onConfirm={() => {
                        if (requestToAction !== null) {
                            handleApprove(requestToAction);
                        }
                    }}
                    title="Approve Withdrawal Request"
                    message="Confirm that payment has been completed and approve this withdrawal request?"
                    confirmText="Approve"
                    cancelText="Cancel"
                    type="success"
                />

                {/* Reject Confirmation Modal */}
                <ConfirmModal
                    open={showRejectModal}
                    onClose={() => {
                        setShowRejectModal(false);
                        setRequestToAction(null);
                    }}
                    onConfirm={() => {
                        if (requestToAction !== null) {
                            handleReject(requestToAction);
                        }
                    }}
                    title="Reject Withdrawal Request"
                    message="Are you sure you want to reject this withdrawal request?"
                    confirmText="Reject"
                    cancelText="Cancel"
                    type="danger"
                />
            </div>
        </AdminLayout>
    );
}
