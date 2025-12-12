import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { IconSearch, IconFilter, IconMoreVertical, IconEye, IconTrash2, IconList, IconGrid, IconX, IconChevronDown } from '../components/icons';
import ConfirmModal from '../components/ConfirmModal';
import { getAvatarColor, getAvatarInitial } from '../../utils/avatarUtils';

type RequestStatus = 'pending' | 'approve' | 'reject';

type WithdrawRequest = {
    id: number;
    user_id: number;
    point: number;
    amount: number;
    request_date: string;
    completed_date?: string | null;
    status: RequestStatus;
    bank_name: string;
    bank_owner_name: string;
    bank_number: string;
    admin_notes?: string | null;
    users?: {
        id: number;
        name: string;
        email: string;
        level: 'guest' | 'member' | 'unit manager' | 'brand manager';
        avatar_url?: string | null;
    };
};

type SortField = 'user' | 'point' | 'amount' | 'request_date' | null;
type SortDirection = 'asc' | 'desc' | null;

export default function AdminRequest() {
    const [requests, setRequests] = useState<WithdrawRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRequest, setSelectedRequest] = useState<WithdrawRequest | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showFilterPopup, setShowFilterPopup] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [requestToAction, setRequestToAction] = useState<number | null>(null);
    const [requestToDelete, setRequestToDelete] = useState<number | null>(null);
    const [loadingAction, setLoadingAction] = useState<{ type: 'approve' | 'reject' | 'delete' | null; requestId: number | null }>({ type: null, requestId: null });
    const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
    const [failedAvatars, setFailedAvatars] = useState<Set<number>>(new Set());
    
    // Sorting state
    const [sortField, setSortField] = useState<SortField>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);
    
    // Filter states
    const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [pointMin, setPointMin] = useState<string>('');
    const [pointMax, setPointMax] = useState<string>('');
    const [amountMin, setAmountMin] = useState<string>('');
    const [amountMax, setAmountMax] = useState<string>('');
    const [requestDateFrom, setRequestDateFrom] = useState<string>('');
    const [requestDateTo, setRequestDateTo] = useState<string>('');
    const [completedDateFrom, setCompletedDateFrom] = useState<string>('');
    const [completedDateTo, setCompletedDateTo] = useState<string>('');
    const [showLevelDropdown, setShowLevelDropdown] = useState(false);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [levelSearchQuery, setLevelSearchQuery] = useState('');
    const [statusSearchQuery, setStatusSearchQuery] = useState('');

    const levelOptions = ['guest', 'member', 'unit manager', 'brand manager'];
    const statusOptions = ['pending', 'approve', 'reject'];

    // Load withdraw requests from API
    const loadRequests = useCallback(async () => {
        try {
            setLoading(true);
            const authToken = localStorage.getItem('nobleco_auth_token');
            const response = await fetch('/api/admin-withdraw-requests', {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Loaded withdraw requests:', data?.length || 0, 'requests');
                
                // Fetch avatars for users that don't have them in the response
                const requestsWithAvatars = await Promise.all(
                    (data || []).map(async (request: WithdrawRequest) => {
                        if (request.users && !request.users.avatar_url) {
                            try {
                                const avatarRes = await fetch(`/api/user-avatars?userId=${request.users.id}`);
                                if (avatarRes.ok) {
                                    const avatarData = await avatarRes.json();
                                    if (avatarData?.url) {
                                        request.users.avatar_url = avatarData.url;
                                    }
                                }
                            } catch (error) {
                                console.warn(`Could not fetch avatar for user ${request.users.id}:`, error);
                            }
                        }
                        return request;
                    })
                );
                
                console.log('Sample request with avatar:', requestsWithAvatars?.[0]);
                setRequests(requestsWithAvatars);
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('Failed to load withdraw requests:', response.status, errorData);
                setRequests([]);
            }
        } catch (error) {
            console.error('Error loading withdraw requests:', error);
            setRequests([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadRequests();
    }, [loadRequests]);

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
            'approve': '#10b981',
            'reject': '#ef4444'
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
        if (status === 'approve') {
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

    const formatVND = (amount: number): string => {
        return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
    };

    // Filter and sort requests
    const filteredAndSortedRequests = useMemo(() => {
        let filtered = requests.filter(request => {
            const user = request.users;
            if (!user) {
                console.warn('Request missing user data:', request.id);
                return false;
            }

            // Search filter
            const matchesSearch = 
                user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email.toLowerCase().includes(searchQuery.toLowerCase());

            // Level filter
            const matchesLevel = selectedLevels.length === 0 || selectedLevels.includes(user.level);

            // Status filter
            const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(request.status);

            // Point range filter
            const matchesPoint = (!pointMin || request.point >= parseFloat(pointMin)) &&
                                (!pointMax || request.point <= parseFloat(pointMax));

            // Amount range filter
            const matchesAmount = (!amountMin || request.amount >= parseFloat(amountMin)) &&
                                (!amountMax || request.amount <= parseFloat(amountMax));

            // Request date range filter
            const requestDate = new Date(request.request_date);
            const matchesRequestDate = (!requestDateFrom || requestDate >= new Date(requestDateFrom)) &&
                                    (!requestDateTo || requestDate <= new Date(requestDateTo + 'T23:59:59'));

            // Completed date range filter
            const matchesCompletedDate = (!completedDateFrom || !completedDateTo || !request.completed_date) ||
                                       (request.completed_date &&
                                        new Date(request.completed_date) >= new Date(completedDateFrom) &&
                                        new Date(request.completed_date) <= new Date(completedDateTo + 'T23:59:59'));

            return matchesSearch && matchesLevel && matchesStatus && matchesPoint && matchesAmount && matchesRequestDate && matchesCompletedDate;
        });

        // Apply sorting
        if (sortField && sortDirection) {
            filtered = [...filtered].sort((a, b) => {
                let aValue: any;
                let bValue: any;

                switch (sortField) {
                    case 'user':
                        aValue = a.users?.name || '';
                        bValue = b.users?.name || '';
                        break;
                    case 'point':
                        aValue = a.point;
                        bValue = b.point;
                        break;
                    case 'amount':
                        aValue = a.amount;
                        bValue = b.amount;
                        break;
                    case 'request_date':
                        aValue = new Date(a.request_date).getTime();
                        bValue = new Date(b.request_date).getTime();
                        break;
                    default:
                        return 0;
                }

                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return sortDirection === 'asc' 
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue);
                }

                return sortDirection === 'asc' 
                    ? (aValue > bValue ? 1 : -1)
                    : (bValue > aValue ? 1 : -1);
            });
        }

        return filtered;
    }, [requests, searchQuery, selectedLevels, selectedStatuses, pointMin, pointMax, amountMin, amountMax, requestDateFrom, requestDateTo, completedDateFrom, completedDateTo, sortField, sortDirection]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            if (sortDirection === 'asc') {
                setSortDirection('desc');
            } else if (sortDirection === 'desc') {
                setSortField(null);
                setSortDirection(null);
            } else {
                setSortDirection('asc');
            }
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) {
            return (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.3 }}>
                    <path d="M8 9l4-4 4 4"/>
                    <path d="M8 15l4 4 4-4"/>
                </svg>
            );
        }
        if (sortDirection === 'asc') {
            return (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 9l4-4 4 4"/>
                </svg>
            );
        }
        return (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 15l4 4 4-4"/>
            </svg>
        );
    };

    const handleApprove = async (requestId: number) => {
        setLoadingAction({ type: 'approve', requestId });
        try {
            const authToken = localStorage.getItem('nobleco_auth_token');
            const response = await fetch('/api/admin-withdraw-requests', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    id: requestId,
                    status: 'approve'
                })
            });

            if (response.ok) {
                await loadRequests();
                setShowDetailModal(false);
                setSelectedRequest(null);
                setShowApproveModal(false);
                setRequestToAction(null);
                setActiveDropdown(null);
            } else {
                const error = await response.json().catch(() => ({ error: 'Failed to approve request' }));
                throw new Error(error.error || 'Failed to approve request');
            }
        } catch (error) {
            console.error('Error approving request:', error);
            alert((error as Error).message || 'Failed to approve request');
        } finally {
            setLoadingAction({ type: null, requestId: null });
        }
    };

    const handleReject = async (requestId: number) => {
        setLoadingAction({ type: 'reject', requestId });
        try {
            const authToken = localStorage.getItem('nobleco_auth_token');
            const response = await fetch('/api/admin-withdraw-requests', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    id: requestId,
                    status: 'reject'
                })
            });

            if (response.ok) {
                await loadRequests();
                setShowDetailModal(false);
                setSelectedRequest(null);
                setShowRejectModal(false);
                setRequestToAction(null);
                setActiveDropdown(null);
            } else {
                const error = await response.json().catch(() => ({ error: 'Failed to reject request' }));
                throw new Error(error.error || 'Failed to reject request');
            }
        } catch (error) {
            console.error('Error rejecting request:', error);
            alert((error as Error).message || 'Failed to reject request');
        } finally {
            setLoadingAction({ type: null, requestId: null });
        }
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
        setRequestToDelete(requestId);
        setShowDeleteModal(true);
        setActiveDropdown(null);
    };

    const confirmDelete = async () => {
        if (!requestToDelete) return;
        setLoadingAction({ type: 'delete', requestId: requestToDelete });
        try {
            const authToken = localStorage.getItem('nobleco_auth_token');
            const response = await fetch(`/api/admin-withdraw-requests?id=${requestToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (response.ok) {
                await loadRequests();
                setShowDeleteModal(false);
                setRequestToDelete(null);
                setActiveDropdown(null);
            } else {
                const error = await response.json().catch(() => ({ error: 'Failed to delete request' }));
                throw new Error(error.error || 'Failed to delete request');
            }
        } catch (error) {
            console.error('Error deleting request:', error);
            alert((error as Error).message || 'Failed to delete request');
        } finally {
            setLoadingAction({ type: null, requestId: null });
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

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.unified-dropdown')) {
                setActiveDropdown(null);
            }
            if (!target.closest('.filter-dropdown-wrapper')) {
                setShowLevelDropdown(false);
                setShowStatusDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    if (loading) {
        return (
            <AdminLayout title="Withdraw Request">
                <div className="empty-state">
                    <div className="loading-spinner"></div>
                    <p>Loading requests...</p>
                </div>
            </AdminLayout>
        );
    }

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
                        <div className="filter-dropdown-container">
                            <button 
                                className="btn-filter"
                                onClick={() => setShowFilterPopup(true)}
                                title="Filter requests"
                            >
                                <IconFilter />
                            </button>
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
                                    <th 
                                        className="sortable-header"
                                        onClick={() => handleSort('user')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <span>User</span>
                                        {getSortIcon('user')}
                                    </th>
                                    <th>Level</th>
                                    <th 
                                        className="sortable-header"
                                        onClick={() => handleSort('point')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <span>Points</span>
                                        {getSortIcon('point')}
                                    </th>
                                    <th 
                                        className="sortable-header"
                                        onClick={() => handleSort('amount')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <span>Amount</span>
                                        {getSortIcon('amount')}
                                    </th>
                                    <th>Bank Info</th>
                                    <th 
                                        className="sortable-header"
                                        onClick={() => handleSort('request_date')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <span>Request Date</span>
                                        {getSortIcon('request_date')}
                                    </th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAndSortedRequests.length === 0 ? (
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
                                    filteredAndSortedRequests.map((request) => {
                                        const user = request.users;
                                        if (!user) return null;
                                        
                                        return (
                                            <tr key={request.id} onClick={() => openDetailModal(request)} style={{ cursor: 'pointer' }}>
                                                <td>#{request.id}</td>
                                                <td>
                                                    <div className="user-info">
                                                        {user.avatar_url && !failedAvatars.has(user.id) ? (
                                                            <img 
                                                                src={user.avatar_url} 
                                                                alt={user.name}
                                                                className="user-avatar-img"
                                                                onError={() => {
                                                                    setFailedAvatars(prev => new Set(prev).add(user.id));
                                                                }}
                                                            />
                                                        ) : (
                                                            <div 
                                                                className="user-avatar"
                                                                style={{ backgroundColor: getAvatarColor(user.name) }}
                                                            >
                                                                {getAvatarInitial(user.name)}
                                                            </div>
                                                        )}
                                                        <div className="user-details">
                                                            <div className="user-name">{user.name}</div>
                                                            <div className="user-email">{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span
                                                        className="level-badge"
                                                        style={{ backgroundColor: getLevelColor(user.level) }}
                                                    >
                                                        {user.level}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="points-value">{request.point.toLocaleString()} pts</span>
                                                </td>
                                                <td>
                                                    <span className="amount-value">{formatVND(request.amount)}</span>
                                                </td>
                                                <td>
                                                    <div className="bank-info">
                                                        <div className="bank-name">{request.bank_name}</div>
                                                        <div className="account-number">{request.bank_number}</div>
                                                    </div>
                                                </td>
                                                <td>{formatDate(request.request_date)}</td>
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
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDelete(request.id);
                                                                    }}
                                                                    disabled={loadingAction.type === 'delete' && loadingAction.requestId === request.id}
                                                                >
                                                                    <IconTrash2 />
                                                                    {loadingAction.type === 'delete' && loadingAction.requestId === request.id ? 'Deleting...' : 'Delete'}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    /* Card View */
                    <div className="orders-grid">
                        {filteredAndSortedRequests.length === 0 ? (
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
                            filteredAndSortedRequests.map((request) => {
                                const user = request.users;
                                if (!user) return null;
                                
                                return (
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
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                openApproveModal(request.id);
                                                                            }}
                                                                            disabled={loadingAction.type === 'approve' && loadingAction.requestId === request.id}
                                                                        >
                                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                                                <polyline points="22 4 12 14.01 9 11.01" />
                                                                            </svg>
                                                                            {loadingAction.type === 'approve' && loadingAction.requestId === request.id ? 'Approving...' : 'Approve'}
                                                                        </button>
                                                                        <button
                                                                            className="unified-dropdown-item"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                openRejectModal(request.id);
                                                                            }}
                                                                            disabled={loadingAction.type === 'reject' && loadingAction.requestId === request.id}
                                                                        >
                                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                                <circle cx="12" cy="12" r="10" />
                                                                                <line x1="15" y1="9" x2="9" y2="15" />
                                                                                <line x1="9" y1="9" x2="15" y2="15" />
                                                                            </svg>
                                                                            {loadingAction.type === 'reject' && loadingAction.requestId === request.id ? 'Rejecting...' : 'Reject'}
                                                                        </button>
                                                                    </>
                                                                )}
                                                                <button
                                                                    className="unified-dropdown-item danger"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDelete(request.id);
                                                                    }}
                                                                    disabled={loadingAction.type === 'delete' && loadingAction.requestId === request.id}
                                                                >
                                                                    <IconTrash2 />
                                                                    {loadingAction.type === 'delete' && loadingAction.requestId === request.id ? 'Deleting...' : 'Delete'}
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
                                                        {user.avatar_url && !failedAvatars.has(user.id) ? (
                                                            <img 
                                                                src={user.avatar_url} 
                                                                alt={user.name}
                                                                className="user-avatar-img"
                                                                style={{ width: '32px', height: '32px' }}
                                                                onError={() => {
                                                                    setFailedAvatars(prev => new Set(prev).add(user.id));
                                                                }}
                                                            />
                                                        ) : (
                                                            <div 
                                                                className="user-avatar"
                                                                style={{ backgroundColor: getAvatarColor(user.name), width: '32px', height: '32px', fontSize: '14px' }}
                                                            >
                                                                {getAvatarInitial(user.name)}
                                                            </div>
                                                        )}
                                                        <div className="user-details">
                                                            <div className="user-name">{user.name}</div>
                                                            <div className="user-email">{user.email}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="card-row">
                                                <span className="card-label">Level:</span>
                                                <span
                                                    className="level-badge"
                                                    style={{ backgroundColor: getLevelColor(user.level) }}
                                                >
                                                    {user.level}
                                                </span>
                                            </div>
                                            <div className="card-row">
                                                <span className="card-label">Points:</span>
                                                <span className="card-value points-value">{request.point.toLocaleString()} pts</span>
                                            </div>
                                            <div className="card-row">
                                                <span className="card-label">Amount:</span>
                                                <span className="card-value amount-value">{formatVND(request.amount)}</span>
                                            </div>
                                            <div className="card-row">
                                                <span className="card-label">Bank:</span>
                                                <div className="card-value-group">
                                                    <span className="card-value">{request.bank_name}</span>
                                                    <span className="card-value-sub">{request.bank_number}</span>
                                                </div>
                                            </div>
                                            <div className="card-row">
                                                <span className="card-label">Request Date:</span>
                                                <span className="card-value">{formatDate(request.request_date)}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {/* Detail Modal */}
                {showDetailModal && selectedRequest && selectedRequest.users && (
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
                                        <div className="detail-item detail-item-full">
                                            <div className="user-info-modal">
                                                {selectedRequest.users.avatar_url && selectedRequest.users.id && !failedAvatars.has(selectedRequest.users.id) ? (
                                                    <img 
                                                        src={selectedRequest.users.avatar_url} 
                                                        alt={selectedRequest.users.name}
                                                        className="user-avatar-img-modal"
                                                        onError={() => {
                                                            if (selectedRequest.users?.id) {
                                                                setFailedAvatars(prev => new Set(prev).add(selectedRequest.users!.id));
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <div 
                                                        className="user-avatar-modal"
                                                        style={{ backgroundColor: getAvatarColor(selectedRequest.users.name) }}
                                                    >
                                                        {getAvatarInitial(selectedRequest.users.name)}
                                                    </div>
                                                )}
                                                <div className="user-details-modal">
                                                    <div className="user-name-modal">{selectedRequest.users.name}</div>
                                                    <div className="user-email-modal">{selectedRequest.users.email}</div>
                                                </div>
                                                <span
                                                    className="level-badge-modal"
                                                    style={{ backgroundColor: getLevelColor(selectedRequest.users.level) }}
                                                >
                                                    {selectedRequest.users.level}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="detail-section">
                                    <h4>Bank Information</h4>
                                    <div className="detail-grid detail-grid-inline">
                                        <div className="detail-item">
                                            <span className="detail-label">Bank Name:</span>
                                            <span className="detail-value">{selectedRequest.bank_name}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Account Owner:</span>
                                            <span className="detail-value">{selectedRequest.bank_owner_name}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Account Number:</span>
                                            <span className="detail-value">{selectedRequest.bank_number}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="detail-section">
                                    <h4>Request Information</h4>
                                    <div className="detail-grid detail-grid-4col">
                                        <div className="detail-item">
                                            <span className="detail-label">Request ID:</span>
                                            <span className="detail-value">#{selectedRequest.id}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Points:</span>
                                            <span className="detail-value points-value-modal">{selectedRequest.point.toLocaleString()} pts</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Amount:</span>
                                            <span className="detail-value amount-value-modal">{formatVND(selectedRequest.amount)}</span>
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
                                    <div className="detail-grid detail-grid-2col">
                                        <div className="detail-item">
                                            <span className="detail-label">Request Date:</span>
                                            <span className="detail-value">{formatDate(selectedRequest.request_date)}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Completed Date:</span>
                                            <span className="detail-value">
                                                {selectedRequest.completed_date ? formatDate(selectedRequest.completed_date) : '-'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {selectedRequest.admin_notes && (
                                    <div className="detail-section">
                                        <h4>Admin Notes</h4>
                                        <div className="detail-grid">
                                            <div className="detail-item detail-item-full">
                                                <span className="detail-value">{selectedRequest.admin_notes}</span>
                                            </div>
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

                {/* Filter Popup */}
                <>
                    <div className={`filter-popup-overlay ${showFilterPopup ? 'active' : ''}`} onClick={() => setShowFilterPopup(false)} />
                    <div className={`filter-popup ${showFilterPopup ? 'active' : ''}`}>
                        <div className="filter-popup-header">
                            <h3>Filter Requests</h3>
                            <button className="filter-popup-close" onClick={() => setShowFilterPopup(false)}>
                                <IconX />
                            </button>
                        </div>
                        <div className="filter-popup-content">
                            {/* Level Filter */}
                            <div className="filter-group">
                                <label>Level</label>
                                <div className="filter-dropdown-wrapper">
                                    <button
                                        className={`filter-select-btn ${showLevelDropdown ? 'active' : ''}`}
                                        onClick={() => setShowLevelDropdown(!showLevelDropdown)}
                                    >
                                        <span className={selectedLevels.length > 0 ? 'has-selection' : ''}>
                                            {selectedLevels.length === 0
                                                ? 'All Levels'
                                                : `${selectedLevels.length} level${selectedLevels.length > 1 ? 's' : ''} selected`}
                                        </span>
                                        <IconChevronDown />
                                    </button>
                                    {showLevelDropdown && (
                                        <div className="filter-dropdown-menu-multi">
                                            <div className="filter-dropdown-search">
                                                <IconSearch />
                                                <input
                                                    type="text"
                                                    placeholder="Search levels..."
                                                    className="filter-search-input"
                                                    value={levelSearchQuery}
                                                    onChange={(e) => setLevelSearchQuery(e.target.value)}
                                                />
                                            </div>
                                            <div className="filter-dropdown-options">
                                                {levelOptions
                                                    .filter(level => 
                                                        level.toLowerCase().includes(levelSearchQuery.toLowerCase())
                                                    )
                                                    .map(level => (
                                                        <label key={level} className="filter-checkbox-option">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedLevels.includes(level)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setSelectedLevels([...selectedLevels, level]);
                                                                    } else {
                                                                        setSelectedLevels(selectedLevels.filter(l => l !== level));
                                                                    }
                                                                }}
                                                            />
                                                            <span>{level}</span>
                                                        </label>
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Status Filter */}
                            <div className="filter-group">
                                <label>Status</label>
                                <div className="filter-dropdown-wrapper">
                                    <button
                                        className={`filter-select-btn ${showStatusDropdown ? 'active' : ''}`}
                                        onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                                    >
                                        <span className={selectedStatuses.length > 0 ? 'has-selection' : ''}>
                                            {selectedStatuses.length === 0
                                                ? 'All Statuses'
                                                : `${selectedStatuses.length} status${selectedStatuses.length > 1 ? 'es' : ''} selected`}
                                        </span>
                                        <IconChevronDown />
                                    </button>
                                    {showStatusDropdown && (
                                        <div className="filter-dropdown-menu-multi">
                                            <div className="filter-dropdown-search">
                                                <IconSearch />
                                                <input
                                                    type="text"
                                                    placeholder="Search statuses..."
                                                    className="filter-search-input"
                                                    value={statusSearchQuery}
                                                    onChange={(e) => setStatusSearchQuery(e.target.value)}
                                                />
                                            </div>
                                            <div className="filter-dropdown-options">
                                                {statusOptions
                                                    .filter(status => 
                                                        status.toLowerCase().includes(statusSearchQuery.toLowerCase())
                                                    )
                                                    .map(status => (
                                                        <label key={status} className="filter-checkbox-option">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedStatuses.includes(status)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setSelectedStatuses([...selectedStatuses, status]);
                                                                    } else {
                                                                        setSelectedStatuses(selectedStatuses.filter(s => s !== status));
                                                                    }
                                                                }}
                                                            />
                                                            <span>{status}</span>
                                                        </label>
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Point Range */}
                            <div className="filter-group">
                                <label>Point Range</label>
                                <div className="filter-range-inputs">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={pointMin}
                                        onChange={(e) => setPointMin(e.target.value)}
                                        className="filter-input"
                                    />
                                    <span>to</span>
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={pointMax}
                                        onChange={(e) => setPointMax(e.target.value)}
                                        className="filter-input"
                                    />
                                </div>
                            </div>

                            {/* Amount Range */}
                            <div className="filter-group">
                                <label>Amount Range</label>
                                <div className="filter-range-inputs">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={amountMin}
                                        onChange={(e) => setAmountMin(e.target.value)}
                                        className="filter-input"
                                    />
                                    <span>to</span>
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={amountMax}
                                        onChange={(e) => setAmountMax(e.target.value)}
                                        className="filter-input"
                                    />
                                </div>
                            </div>

                            {/* Request Date Range */}
                            <div className="filter-group">
                                <label>Request Date</label>
                                <div className="filter-range-inputs">
                                    <input
                                        type="date"
                                        value={requestDateFrom}
                                        onChange={(e) => setRequestDateFrom(e.target.value)}
                                        className="filter-input"
                                    />
                                    <span>to</span>
                                    <input
                                        type="date"
                                        value={requestDateTo}
                                        onChange={(e) => setRequestDateTo(e.target.value)}
                                        className="filter-input"
                                    />
                                </div>
                            </div>

                            {/* Completed Date Range */}
                            <div className="filter-group">
                                <label>Completed Date</label>
                                <div className="filter-range-inputs">
                                    <input
                                        type="date"
                                        value={completedDateFrom}
                                        onChange={(e) => setCompletedDateFrom(e.target.value)}
                                        className="filter-input"
                                    />
                                    <span>to</span>
                                    <input
                                        type="date"
                                        value={completedDateTo}
                                        onChange={(e) => setCompletedDateTo(e.target.value)}
                                        className="filter-input"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="filter-popup-footer">
                            <button
                                className="btn-filter-clear"
                                onClick={() => {
                                    setSelectedLevels([]);
                                    setSelectedStatuses([]);
                                    setPointMin('');
                                    setPointMax('');
                                    setAmountMin('');
                                    setAmountMax('');
                                    setRequestDateFrom('');
                                    setRequestDateTo('');
                                    setCompletedDateFrom('');
                                    setCompletedDateTo('');
                                }}
                            >
                                Clear All
                            </button>
                            <button
                                className="btn-filter-apply"
                                onClick={() => setShowFilterPopup(false)}
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </>

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
                    loading={loadingAction.type === 'approve' && loadingAction.requestId === requestToAction}
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
                    loading={loadingAction.type === 'reject' && loadingAction.requestId === requestToAction}
                />

                {/* Delete Confirmation Modal */}
                <ConfirmModal
                    open={showDeleteModal}
                    onClose={() => {
                        setShowDeleteModal(false);
                        setRequestToDelete(null);
                    }}
                    onConfirm={confirmDelete}
                    title="Delete Withdrawal Request"
                    message="Are you sure you want to delete this withdrawal request? This action cannot be undone."
                    confirmText="Delete"
                    cancelText="Cancel"
                    type="danger"
                    loading={loadingAction.type === 'delete' && loadingAction.requestId === requestToDelete}
                />
            </div>
        </AdminLayout>
    );
}
