import { useEffect, useMemo, useState, useRef } from 'react';
import AdminLayout from '../components/AdminLayout';
import UserDetailModal from '../components/UserDetailModal';
import { 
    IconSearch, 
    IconFilter, 
    IconList, 
    IconGrid,
    IconPlus,
    IconMoreVertical,
    IconChevronUp,
    IconChevronDown
} from '../components/icons';
import { getAvatarInitial, getAvatarColor } from '../../utils/avatarUtils';
import { useTranslation } from '../../shared/contexts/TranslationContext';

type User = {
    id: string | number;
    email: string;
    name?: string;
    role?: string;
    points?: number;
    level?: string;
    status?: string;
    created_at?: string;
    refer_code?: string;
    phone?: string;
    address?: string;
    referred_by?: string;
    avatar?: string; // Avatar URL from database
};

type Level = 'guest' | 'member' | 'unit manager' | 'brand manager';
type Status = 'active' | 'inactive';
type Row = {
    id: string | number;
    name: string;
    email: string;
    phone?: string;
    level: Level;
    points: number;
    status: Status;
    createdAt: string;
    createdAtDate?: Date; // For sorting
};

export default function AdminUsers() {
    const { t } = useTranslation();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [menuOpenId, setMenuOpenId] = useState<string | number | null>(null);
    
    // Search and filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [filterLevel, setFilterLevel] = useState<Level | 'all'>('all');
    const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all');
    const [filterDateFrom, setFilterDateFrom] = useState<string>('');
    const [filterDateTo, setFilterDateTo] = useState<string>('');
    const [filterPointsMin, setFilterPointsMin] = useState<string>('');
    const [filterPointsMax, setFilterPointsMax] = useState<string>('');

    // Sorting states
    const [sortColumn, setSortColumn] = useState<'name' | 'email' | 'phone' | 'points' | 'status' | 'createdAt' | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // View mode states
    const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
    const [isMobile, setIsMobile] = useState(false);

    // Mobile states
    const [filterPopupOpen, setFilterPopupOpen] = useState(false);

    // Modal states
    const [deleteModal, setDeleteModal] = useState<{ show: boolean; userId: string | number | null; userEmail: string }>({ 
        show: false, 
        userId: null, 
        userEmail: '' 
    });
    const [selectedUserForDetail, setSelectedUserForDetail] = useState<User | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    
    // Edit level modal states
    const [editLevelModal, setEditLevelModal] = useState<{ show: boolean; userId: string | number | null; userName: string; currentLevel: string }>({
        show: false,
        userId: null,
        userName: '',
        currentLevel: ''
    });
    const [availableLevels, setAvailableLevels] = useState<Level[]>([]);
    const [selectedLevel, setSelectedLevel] = useState<Level>('guest');
    const [isUpdatingLevel, setIsUpdatingLevel] = useState(false);
    const [isLevelDropdownOpen, setIsLevelDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const dropdownToggleRef = useRef<HTMLButtonElement>(null);

    // Edit Senior Consultant modal states
    const [editSeniorConsultantModal, setEditSeniorConsultantModal] = useState<{ 
        show: boolean; 
        userId: string | number | null; 
        userName: string; 
        currentSeniorConsultantId: string | number | null;
        currentSeniorConsultantName: string | null;
        currentSeniorConsultantEmail: string | null;
    }>({
        show: false,
        userId: null,
        userName: '',
        currentSeniorConsultantId: null,
        currentSeniorConsultantName: null,
        currentSeniorConsultantEmail: null
    });
    const [referCodeInput, setReferCodeInput] = useState('');
    const [isUpdatingSeniorConsultant, setIsUpdatingSeniorConsultant] = useState(false);
    const [isLoadingReferrerInfo, setIsLoadingReferrerInfo] = useState(false);
    const [referCodeError, setReferCodeError] = useState<string | null>(null);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/users');
            if (!res.ok) throw new Error(`Request failed: ${res.status}`);
            const data = await res.json();
            const usersList = Array.isArray(data) ? data : [];
            
            // Fetch avatars for all users
            const usersWithAvatars = await Promise.all(
                usersList.map(async (user: User) => {
                    try {
                        const avatarRes = await fetch(`/api/user-avatars?userId=${user.id}`);
                        if (avatarRes.ok) {
                            const avatarData = await avatarRes.json();
                            if (avatarData?.url) {
                                return { ...user, avatar: avatarData.url };
                            }
                        }
                    } catch (error) {
                        console.warn(`Could not fetch avatar for user ${user.id}:`, error);
                    }
                    return user;
                })
            );
            
            setUsers(usersWithAvatars);
        } catch (e: any) {
            setError(e?.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;
        (async () => {
            await fetchUsers();
            await fetchAvailableLevels();
        })();
        return () => { cancelled = true; };
    }, []);

    // Close level dropdown when clicking outside
    useEffect(() => {
        if (!isLevelDropdownOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.user-level-custom-dropdown')) {
                setIsLevelDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isLevelDropdownOpen]);

    // Adjust dropdown max-height to prevent cutoff (always opens downward)
    useEffect(() => {
        if (!isLevelDropdownOpen || !dropdownRef.current || !dropdownToggleRef.current) return;

        const adjustMaxHeight = () => {
            const dropdown = dropdownRef.current;
            const toggle = dropdownToggleRef.current;
            if (!dropdown || !toggle) return;

            const toggleRect = toggle.getBoundingClientRect();
            // Calculate available space below the button
            const spaceBelow = window.innerHeight - toggleRect.bottom - 20;
            
            // Set max-height to fit available space, with a minimum of 150px
            dropdown.style.maxHeight = `${Math.max(150, Math.min(300, spaceBelow))}px`;
        };

        // Adjust on mount and window resize
        adjustMaxHeight();
        window.addEventListener('resize', adjustMaxHeight);
        window.addEventListener('scroll', adjustMaxHeight, true);

        return () => {
            window.removeEventListener('resize', adjustMaxHeight);
            window.removeEventListener('scroll', adjustMaxHeight, true);
        };
    }, [isLevelDropdownOpen]);

    const fetchAvailableLevels = async () => {
        try {
            const res = await fetch('/api/commission-rates');
            if (!res.ok) throw new Error('Failed to load commission rates');
            const data = await res.json();
            // Extract user_level values from commission rates
            const levels = data.map((rate: any) => rate.user_level as Level);
            setAvailableLevels(levels);
        } catch (e: any) {
            console.error('Error loading available levels:', e);
            // Fallback to default levels if API fails
            setAvailableLevels(['guest', 'member', 'unit manager', 'brand manager']);
        }
    };

    // Mobile detection and view mode management
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            // Force card view on mobile
            if (mobile && viewMode === 'table') {
                setViewMode('card');
            }
        };

        // Check on mount
        checkMobile();

        // Add resize listener
        window.addEventListener('resize', checkMobile);

        // Cleanup
        return () => window.removeEventListener('resize', checkMobile);
    }, [viewMode]);

    const openDeleteModal = (userId: string | number, userEmail: string) => {
        setDeleteModal({ show: true, userId, userEmail });
        setMenuOpenId(null);
    };

    const closeDeleteModal = () => {
        setDeleteModal({ show: false, userId: null, userEmail: '' });
    };

    const updateUserStatus = async (userId: string | number, newStatus: Status) => {
        setIsUpdatingStatus(true);
        setMenuOpenId(null);
        try {
            const res = await fetch('/api/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: userId, status: newStatus }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to update user status');
            }

            setSuccessMessage(`User status updated to ${newStatus} successfully`);
            setTimeout(() => setSuccessMessage(null), 3000);
            await fetchUsers();
        } catch (e: any) {
            setErrorMessage(`Error updating status: ${e.message}`);
            setTimeout(() => setErrorMessage(null), 4000);
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const openEditLevelModal = (userId: string | number, userName: string, currentLevel: string) => {
        setEditLevelModal({
            show: true,
            userId,
            userName,
            currentLevel: currentLevel || 'guest'
        });
        setSelectedLevel((currentLevel as Level) || 'guest');
        setMenuOpenId(null);
    };

    const closeEditLevelModal = () => {
        setEditLevelModal({ show: false, userId: null, userName: '', currentLevel: '' });
        setSelectedLevel('guest');
        setIsLevelDropdownOpen(false);
    };

    const getLevelLabel = (level: Level): string => {
        const labels: Record<Level, string> = {
            'guest': t('adminUsers.guest'),
            'member': t('adminUsers.member'),
            'unit manager': t('adminUsers.unitManager'),
            'brand manager': t('adminUsers.brandManager')
        };
        return labels[level];
    };

    const getStatusLabel = (status: Status): string => {
        return status === 'active' ? t('adminUsers.active') : t('adminUsers.inactive');
    };

    const getLevelColor = (level: Level): string => {
        const colors: Record<Level, string> = {
            'guest': '#94a3b8',
            'member': '#3b82f6',
            'unit manager': '#8b5cf6',
            'brand manager': '#f59e0b'
        };
        return colors[level];
    };

    const updateUserLevel = async () => {
        if (!editLevelModal.userId) return;

        setIsUpdatingLevel(true);
        try {
            const res = await fetch('/api/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: editLevelModal.userId, level: selectedLevel }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to update user level');
            }

            setSuccessMessage(`User level updated to ${selectedLevel} successfully`);
            setTimeout(() => setSuccessMessage(null), 3000);
            closeEditLevelModal();
            await fetchUsers();
        } catch (e: any) {
            setErrorMessage(`Error updating level: ${e.message}`);
            setTimeout(() => setErrorMessage(null), 4000);
        } finally {
            setIsUpdatingLevel(false);
        }
    };

    const openEditSeniorConsultantModal = async (userId: string | number, userName: string) => {
        // Show modal immediately with loading state
        setEditSeniorConsultantModal({
            show: true,
            userId,
            userName,
            currentSeniorConsultantId: null,
            currentSeniorConsultantName: null,
            currentSeniorConsultantEmail: null
        });
        setReferCodeInput('');
        setReferCodeError(null);
        setMenuOpenId(null);
        setIsLoadingReferrerInfo(true);

        // Fetch current senior consultant info
        try {
            const user = users.find(u => u.id === userId);
            let currentSeniorConsultantId: string | number | null = null;
            let currentSeniorConsultantName: string | null = null;
            let currentSeniorConsultantEmail: string | null = null;

            if (user?.referred_by) {
                // Fetch the senior consultant details
                const hierarchyRes = await fetch(`/api/users?endpoint=hierarchy&userId=${userId}`);
                if (hierarchyRes.ok) {
                    const hierarchyData = await hierarchyRes.json();
                    if (hierarchyData.superior) {
                        currentSeniorConsultantId = hierarchyData.superior.id;
                        currentSeniorConsultantName = hierarchyData.superior.name || hierarchyData.superior.email;
                        currentSeniorConsultantEmail = hierarchyData.superior.email || null;
                    }
                }
            }

            setEditSeniorConsultantModal({
                show: true,
                userId,
                userName,
                currentSeniorConsultantId,
                currentSeniorConsultantName,
                currentSeniorConsultantEmail
            });
        } catch (error) {
            console.error('Error fetching senior consultant info:', error);
            // Keep modal open even if fetch fails
            setEditSeniorConsultantModal({
                show: true,
                userId,
                userName,
                currentSeniorConsultantId: null,
                currentSeniorConsultantName: null,
                currentSeniorConsultantEmail: null
            });
        } finally {
            setIsLoadingReferrerInfo(false);
        }
    };

    const closeEditSeniorConsultantModal = () => {
        setEditSeniorConsultantModal({ 
            show: false, 
            userId: null, 
            userName: '', 
            currentSeniorConsultantId: null,
            currentSeniorConsultantName: null,
            currentSeniorConsultantEmail: null
        });
        setReferCodeInput('');
        setReferCodeError(null);
        setIsLoadingReferrerInfo(false);
    };


    const removeSeniorConsultant = async () => {
        if (!editSeniorConsultantModal.userId) return;

        setIsUpdatingSeniorConsultant(true);
        setReferCodeError(null);
        try {
            const res = await fetch('/api/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: editSeniorConsultantModal.userId, 
                    referred_by: null 
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to remove referrer');
            }

            setSuccessMessage('Referrer removed successfully');
            setTimeout(() => setSuccessMessage(null), 3000);
            closeEditSeniorConsultantModal();
            await fetchUsers();
        } catch (e: any) {
            setReferCodeError(e.message || 'Failed to remove referrer');
        } finally {
            setIsUpdatingSeniorConsultant(false);
        }
    };

    const updateSeniorConsultant = async () => {
        if (!editSeniorConsultantModal.userId || !referCodeInput.trim()) {
            setReferCodeError('Please enter a refer code');
            return;
        }

        setIsUpdatingSeniorConsultant(true);
        setReferCodeError(null);
        try {
            const res = await fetch('/api/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: editSeniorConsultantModal.userId, 
                    refer_code: referCodeInput.trim().toUpperCase()
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Invalid refer code');
            }

            setSuccessMessage('Referrer updated successfully');
            setTimeout(() => setSuccessMessage(null), 3000);
            closeEditSeniorConsultantModal();
            await fetchUsers();
        } catch (e: any) {
            setReferCodeError(e.message || 'Invalid refer code');
        } finally {
            setIsUpdatingSeniorConsultant(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteModal.userId) return;

        setIsDeleting(true);
        try {
            const res = await fetch('/api/users', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: deleteModal.userId }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to delete user');
            }

            // Close modal and show success message
            closeDeleteModal();
            setSuccessMessage(`User ${deleteModal.userEmail} has been deleted successfully`);
            
            // Auto-hide success message after 3 seconds
            setTimeout(() => setSuccessMessage(null), 3000);

            // Refresh the user list
            await fetchUsers();
        } catch (e: any) {
            closeDeleteModal();
            setErrorMessage(`Error deleting user: ${e.message}`);
            setTimeout(() => setErrorMessage(null), 4000);
        } finally {
            setIsDeleting(false);
        }
    };

    // Handle sort
    const handleSort = (column: 'name' | 'email' | 'phone' | 'points' | 'status' | 'createdAt') => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    // Filter and search logic
    const filteredRows = useMemo(() => {
        // Build display rows from API data
        const rows: Row[] = users.map((u) => ({
            id: u.id,
            name: u.name || (u.email ? u.email.split('@')[0] : ''),
            email: u.email,
            phone: u.phone,
            level: (u.level as Level) || 'guest',
            points: u.points ?? 0,
            status: (u.status as Status) || 'active',
            createdAt: u.created_at ? new Date(u.created_at).toLocaleString() : '',
            createdAtDate: u.created_at ? new Date(u.created_at) : undefined,
        }));

        // Apply filters
        let filtered = rows.filter((row) => {
            // Search filter (id, name, or email)
            const matchesSearch = searchQuery === '' ||
                String(row.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
                row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                row.email.toLowerCase().includes(searchQuery.toLowerCase());

            // Level filter
            const matchesLevel = filterLevel === 'all' || row.level === filterLevel;

            // Status filter
            const matchesStatus = filterStatus === 'all' || row.status === filterStatus;

            // Date range filter
            let matchesDate = true;
            if (filterDateFrom || filterDateTo) {
                if (row.createdAtDate) {
                    const rowDate = new Date(row.createdAtDate);
                    rowDate.setHours(0, 0, 0, 0);
                    
                    if (filterDateFrom) {
                        const fromDate = new Date(filterDateFrom);
                        fromDate.setHours(0, 0, 0, 0);
                        if (rowDate < fromDate) matchesDate = false;
                    }
                    
                    if (filterDateTo) {
                        const toDate = new Date(filterDateTo);
                        toDate.setHours(23, 59, 59, 999);
                        if (rowDate > toDate) matchesDate = false;
                    }
                } else {
                    matchesDate = false;
                }
            }

            // Points range filter
            let matchesPoints = true;
            if (filterPointsMin !== '') {
                const minPoints = parseInt(filterPointsMin, 10);
                if (isNaN(minPoints) || row.points < minPoints) matchesPoints = false;
            }
            if (filterPointsMax !== '') {
                const maxPoints = parseInt(filterPointsMax, 10);
                if (isNaN(maxPoints) || row.points > maxPoints) matchesPoints = false;
            }

            return matchesSearch && matchesLevel && matchesStatus && matchesDate && matchesPoints;
        });

        // Apply sorting
        if (sortColumn) {
            filtered = [...filtered].sort((a, b) => {
                let aValue: string | number | Date | undefined;
                let bValue: string | number | Date | undefined;

                switch (sortColumn) {
                    case 'name':
                        aValue = a.name.toLowerCase();
                        bValue = b.name.toLowerCase();
                        break;
                    case 'email':
                        aValue = a.email.toLowerCase();
                        bValue = b.email.toLowerCase();
                        break;
                    case 'phone':
                        aValue = (a.phone || '').toLowerCase();
                        bValue = (b.phone || '').toLowerCase();
                        break;
                    case 'points':
                        aValue = a.points;
                        bValue = b.points;
                        break;
                    case 'status':
                        aValue = a.status.toLowerCase();
                        bValue = b.status.toLowerCase();
                        break;
                    case 'createdAt':
                        aValue = a.createdAtDate || new Date(0);
                        bValue = b.createdAtDate || new Date(0);
                        break;
                    default:
                        return 0;
                }

                if (aValue === undefined && bValue === undefined) return 0;
                if (aValue === undefined) return 1;
                if (bValue === undefined) return -1;

                if (aValue instanceof Date && bValue instanceof Date) {
                    return sortDirection === 'asc' 
                        ? aValue.getTime() - bValue.getTime()
                        : bValue.getTime() - aValue.getTime();
                }

                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    return sortDirection === 'asc' 
                        ? aValue - bValue
                        : bValue - aValue;
                }

                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return sortDirection === 'asc'
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue);
                }

                return 0;
            });
        }

        return filtered;
    }, [users, searchQuery, filterLevel, filterStatus, filterDateFrom, filterDateTo, filterPointsMin, filterPointsMax, sortColumn, sortDirection]);

    return (
        <AdminLayout title={t('adminUsers.title')}>
            <div className="admin-users">
                {/* Clean Toolbar */}
                <div className="categories-toolbar">
                    <div className="toolbar-left">
                        <div className="search-container">
                            <IconSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder={t('adminUsers.searchPlaceholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input"
                            />
                        </div>
                        <button 
                            className="btn-filter" 
                            title={t('adminUsers.filter')}
                            onClick={() => setFilterPopupOpen(true)}
                        >
                            <IconFilter />
                        </button>
                    </div>
                    <div className="toolbar-right">
                        {/* Desktop view toggle */}
                        <div className="view-toggle desktop-only">
                            <button
                                className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                                onClick={() => !isMobile && setViewMode('table')}
                                title={t('adminUsers.tableView')}
                                disabled={isMobile}
                            >
                                <IconList />
                            </button>
                            <button
                                className={`view-btn ${viewMode === 'card' ? 'active' : ''}`}
                                onClick={() => setViewMode('card')}
                                title={t('adminUsers.cardView')}
                            >
                                <IconGrid />
                            </button>
                        </div>
                        
                        {/* Mobile column selector - hidden on users since it's not needed */}
                        <div className="mobile-column-selector mobile-only" style={{ display: 'none' }}>
                        </div>
                    </div>
                </div>

                {/* Table View */}
                {viewMode === 'table' && !isMobile ? (
                    <div className="table-wrap">
                        <table className="table">
                        <thead>
                            <tr>
                                <th 
                                    style={{ width: 180, cursor: 'pointer', userSelect: 'none' }}
                                    onClick={() => handleSort('name')}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {t('users.name')}
                                        {sortColumn === 'name' && (
                                            sortDirection === 'asc' ? <IconChevronUp width={14} height={14} /> : <IconChevronDown width={14} height={14} />
                                        )}
                                    </div>
                                </th>
                                <th 
                                    style={{ width: 220, cursor: 'pointer', userSelect: 'none' }}
                                    onClick={() => handleSort('email')}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {t('users.email')}
                                        {sortColumn === 'email' && (
                                            sortDirection === 'asc' ? <IconChevronUp width={14} height={14} /> : <IconChevronDown width={14} height={14} />
                                        )}
                                    </div>
                                </th>
                                <th 
                                    style={{ width: 150, cursor: 'pointer', userSelect: 'none' }}
                                    onClick={() => handleSort('phone')}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {t('users.phone')}
                                        {sortColumn === 'phone' && (
                                            sortDirection === 'asc' ? <IconChevronUp width={14} height={14} /> : <IconChevronDown width={14} height={14} />
                                        )}
                                    </div>
                                </th>
                                <th style={{ width: 150 }}>{t('users.level')}</th>
                                <th 
                                    style={{ width: 90, cursor: 'pointer', userSelect: 'none' }}
                                    onClick={() => handleSort('points')}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {t('adminUsers.points')}
                                        {sortColumn === 'points' && (
                                            sortDirection === 'asc' ? <IconChevronUp width={14} height={14} /> : <IconChevronDown width={14} height={14} />
                                        )}
                                    </div>
                                </th>
                                <th 
                                    style={{ width: 110, cursor: 'pointer', userSelect: 'none' }}
                                    onClick={() => handleSort('status')}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {t('users.status')}
                                        {sortColumn === 'status' && (
                                            sortDirection === 'asc' ? <IconChevronUp width={14} height={14} /> : <IconChevronDown width={14} height={14} />
                                        )}
                                    </div>
                                </th>
                                <th 
                                    style={{ width: 160, cursor: 'pointer', userSelect: 'none' }}
                                    onClick={() => handleSort('createdAt')}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {t('adminUsers.createdAt')}
                                        {sortColumn === 'createdAt' && (
                                            sortDirection === 'asc' ? <IconChevronUp width={14} height={14} /> : <IconChevronDown width={14} height={14} />
                                        )}
                                    </div>
                                </th>
                                <th style={{ width: 60 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                                {loading ? (
                                    // Show skeleton loading rows
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={`skeleton-${i}`} className="row-loading">
                                            <td><div className="skeleton skeleton-text" style={{ width: '120px' }}></div></td>
                                            <td><div className="skeleton skeleton-text" style={{ width: '180px' }}></div></td>
                                            <td><div className="skeleton skeleton-text" style={{ width: '120px' }}></div></td>
                                            <td><div className="skeleton skeleton-badge"></div></td>
                                            <td><div className="skeleton skeleton-text" style={{ width: '50px' }}></div></td>
                                            <td><div className="skeleton skeleton-badge"></div></td>
                                            <td><div className="skeleton skeleton-text" style={{ width: '100px' }}></div></td>
                                            <td></td>
                                        </tr>
                                    ))
                                ) : filteredRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="muted">{t('adminUsers.noUsersFound')}</td>
                                    </tr>
                                ) : (
                                    filteredRows.map((r) => {
                                        const user = users.find(u => u.id === r.id);
                                        return (
                                            <tr 
                                                key={String(r.id)} 
                                                className="user-row-clickable"
                                                onClick={() => {
                                                    if (user) {
                                                        setSelectedUserForDetail(user);
                                                    }
                                                }}
                                            >
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        {user?.avatar ? (
                                                            <img 
                                                                src={user.avatar} 
                                                                alt={r.name}
                                                                style={{
                                                                    width: '32px',
                                                                    height: '32px',
                                                                    borderRadius: '50%',
                                                                    objectFit: 'cover'
                                                                }}
                                                                onError={(e) => {
                                                                    const target = e.target as HTMLImageElement;
                                                                    target.style.display = 'none';
                                                                    const parent = target.parentElement;
                                                                    if (parent) {
                                                                        const fallback = document.createElement('div');
                                                                        fallback.style.cssText = `
                                                                            width: 32px;
                                                                            height: 32px;
                                                                            border-radius: 50%;
                                                                            background-color: ${getAvatarColor(r.name)};
                                                                            display: flex;
                                                                            align-items: center;
                                                                            justify-content: center;
                                                                            color: white;
                                                                            font-size: 14px;
                                                                            font-weight: 600;
                                                                            text-transform: uppercase;
                                                                        `;
                                                                        fallback.textContent = getAvatarInitial(r.name);
                                                                        parent.appendChild(fallback);
                                                                    }
                                                                }}
                                                            />
                                                        ) : (
                                                            <div 
                                                                style={{
                                                                    width: '32px',
                                                                    height: '32px',
                                                                    borderRadius: '50%',
                                                                    backgroundColor: getAvatarColor(r.name),
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    color: 'white',
                                                                    fontSize: '14px',
                                                                    fontWeight: 600,
                                                                    textTransform: 'uppercase'
                                                                }}
                                                            >
                                                                {getAvatarInitial(r.name)}
                                                            </div>
                                                        )}
                                                        <span>{r.name}</span>
                                                    </div>
                                                </td>
                                                <td>{r.email}</td>
                                                <td>{user?.phone || 'N/A'}</td>
                                                <td>
                                                    <span className={`badge ${`badge-level-${r.level.replace(/\s+/g, '-')}`}`}>
                                                        {getLevelLabel(r.level)}
                                                    </span>
                                                </td>
                                                <td className="points-value">{r.points}</td>
                                                <td>
                                                    <span className={`badge ${r.status === 'active' ? 'badge-success' : 'badge-muted'}`}>{getStatusLabel(r.status)}</span>
                                                </td>
                                                <td>{r.createdAt}</td>
                                                <td className="row-actions">
                                                    <button
                                                        className="more-btn"
                                                        aria-label={t('adminUsers.moreActions')}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setMenuOpenId((prev) => prev === r.id ? null : r.id);
                                                        }}
                                                    >
                                                        ⋯
                                                    </button>
                                                {menuOpenId === r.id && (
                                                    <div className="menu" onClick={(e) => e.stopPropagation()}>
                                                        <button 
                                                            className="menu-item" 
                                                            onClick={() => {
                                                                if (user) {
                                                                    setSelectedUserForDetail(user);
                                                                    setMenuOpenId(null);
                                                                }
                                                            }}
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                                <circle cx="12" cy="12" r="3" />
                                                            </svg>
                                                            {t('adminUsers.viewDetails')}
                                                        </button>
                                                        <button 
                                                            className="menu-item" 
                                                            onClick={() => openEditLevelModal(r.id, r.name, r.level)}
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                            </svg>
                                                            {t('adminUsers.editLevel')}
                                                        </button>
                                                        <button 
                                                            className="menu-item" 
                                                            onClick={() => openEditSeniorConsultantModal(r.id, r.name)}
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                                                <circle cx="9" cy="7" r="4" />
                                                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                                            </svg>
                                                            {t('adminUsers.editSeniorConsultant')}
                                                        </button>
                                                        <button 
                                                            className="menu-item" 
                                                            onClick={() => updateUserStatus(r.id, r.status === 'active' ? 'inactive' : 'active')}
                                                            disabled={isUpdatingStatus}
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                {r.status === 'active' ? (
                                                                    <path d="M18 6L6 18M6 6l12 12" />
                                                                ) : (
                                                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" />
                                                                )}
                                                            </svg>
                                                            {r.status === 'active' ? t('adminUsers.inactive') : t('adminUsers.active')}
                                                        </button>
                                                        <button className="menu-item danger" onClick={() => openDeleteModal(r.id, r.email)}>
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
                                                            </svg>
                                                            {t('adminUsers.deleteUser')}
                                                        </button>
                                                    </div>
                                                )}
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
                    <div className={`users-grid users-grid-2`}>
                        {loading ? (
                            // Show skeleton loading cards
                            Array.from({ length: 6 }).map((_, i) => (
                                <div key={`skeleton-card-${i}`} className="user-card skeleton-card">
                                    <div className="card-header">
                                        <div className="skeleton skeleton-avatar"></div>
                                        <div className="card-info">
                                            <div className="skeleton skeleton-text" style={{ width: '120px', height: '16px' }}></div>
                                            <div className="skeleton skeleton-text" style={{ width: '180px', height: '14px', marginTop: '8px' }}></div>
                                        </div>
                                    </div>
                                    <div className="card-body">
                                        <div className="skeleton skeleton-badge" style={{ width: '80px' }}></div>
                                        <div className="skeleton skeleton-badge" style={{ width: '60px', marginTop: '8px' }}></div>
                                    </div>
                                </div>
                            ))
                        ) : filteredRows.length === 0 ? (
                            <div className="empty-state">
                                <p>No users found</p>
                            </div>
                        ) : (
                            filteredRows.map((r) => {
                                const user = users.find(u => u.id === r.id);
                                return (
                                    <div 
                                        key={String(r.id)} 
                                        className="user-card user-card-clickable"
                                        onClick={() => {
                                            if (user) {
                                                setSelectedUserForDetail(user);
                                            }
                                        }}
                                    >
                                        <div className="card-header">
                                            {user?.avatar ? (
                                                <img 
                                                    className="user-avatar"
                                                    src={user.avatar}
                                                    alt={r.name}
                                                    style={{
                                                        width: '48px',
                                                        height: '48px',
                                                        borderRadius: '50%',
                                                        objectFit: 'cover'
                                                    }}
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.style.display = 'none';
                                                        const parent = target.parentElement;
                                                        if (parent) {
                                                            const fallback = document.createElement('div');
                                                            fallback.className = 'user-avatar';
                                                            fallback.style.cssText = `
                                                                width: 48px;
                                                                height: 48px;
                                                                border-radius: 50%;
                                                                background-color: ${getAvatarColor(r.name)};
                                                                display: flex;
                                                                align-items: center;
                                                                justify-content: center;
                                                                color: white;
                                                                font-size: 20px;
                                                                font-weight: 600;
                                                                text-transform: uppercase;
                                                            `;
                                                            fallback.textContent = getAvatarInitial(r.name);
                                                            parent.appendChild(fallback);
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <div 
                                                    className="user-avatar"
                                                    style={{
                                                        backgroundColor: getAvatarColor(r.name),
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white',
                                                        fontSize: '20px',
                                                        fontWeight: 600,
                                                        textTransform: 'uppercase'
                                                    }}
                                                >
                                                    {getAvatarInitial(r.name)}
                                                </div>
                                            )}
                                            <div className="card-info">
                                                <h3>{r.name}</h3>
                                                <p className="user-email">{r.email}</p>
                                                <p className="user-phone" style={{ fontSize: '0.875rem', color: 'var(--muted)', marginTop: '4px' }}>{user?.phone || 'N/A'}</p>
                                            </div>
                                            <div className="card-meta">
                                                <span className={`badge ${r.status === 'active' ? 'badge-success' : 'badge-muted'}`}>{getStatusLabel(r.status)}</span>
                                                <span className="created-date">{r.createdAt}</span>
                                            </div>
                                            <div className="unified-dropdown">
                                                <button
                                                    className="unified-more-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setMenuOpenId((prev) => prev === r.id ? null : r.id);
                                                    }}
                                                >
                                                    <IconMoreVertical />
                                                </button>
                                                {menuOpenId === r.id && (
                                                    <div className="unified-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                                                        <button 
                                                            className="unified-dropdown-item" 
                                                            onClick={() => {
                                                                if (user) {
                                                                    setSelectedUserForDetail(user);
                                                                    setMenuOpenId(null);
                                                                }
                                                            }}
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                                <circle cx="12" cy="12" r="3" />
                                                            </svg>
                                                            View Detail
                                                        </button>
                                                        <button 
                                                            className="unified-dropdown-item" 
                                                            onClick={() => openEditLevelModal(r.id, r.name, r.level)}
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                            </svg>
                                                            {t('adminUsers.editLevel')}
                                                        </button>
                                                        <button 
                                                            className="unified-dropdown-item" 
                                                            onClick={() => openEditSeniorConsultantModal(r.id, r.name)}
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                                                <circle cx="9" cy="7" r="4" />
                                                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                                            </svg>
                                                            {t('adminUsers.editReferrer')}
                                                        </button>
                                                        {r.status === 'active' ? (
                                                            <button 
                                                                className="unified-dropdown-item" 
                                                                onClick={() => updateUserStatus(r.id, 'inactive')}
                                                                disabled={isUpdatingStatus}
                                                            >
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <circle cx="12" cy="12" r="10" />
                                                                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                                                                </svg>
                                                                {t('adminUsers.deactivate')}
                                                            </button>
                                                        ) : (
                                                            <button 
                                                                className="unified-dropdown-item" 
                                                                onClick={() => updateUserStatus(r.id, 'active')}
                                                                disabled={isUpdatingStatus}
                                                            >
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <polyline points="20 6 9 17 4 12" />
                                                                </svg>
                                                                {t('adminUsers.activate')}
                                                            </button>
                                                        )}
                                                        <button 
                                                            className="unified-dropdown-item danger" 
                                                            onClick={() => openDeleteModal(r.id, r.email)}
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <polyline points="3 6 5 6 21 6" />
                                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                            </svg>
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="card-body">
                                            <div className="card-detail">
                                                <span className="detail-label">Phone:</span>
                                                <span className="detail-value">{user?.phone || 'N/A'}</span>
                                            </div>
                                            <div className="card-detail">
                                                <span className="detail-label">Level:</span>
                                                <span className={`badge ${`badge-level-${r.level.replace(/\s+/g, '-')}`}`}>
                                                    {getLevelLabel(r.level)}
                                                </span>
                                            </div>
                                            <div className="card-detail">
                                                <span className="detail-label">Points:</span>
                                                <span className="detail-value points-value">{r.points}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteModal.show && (
                <div className="modal-overlay" onClick={closeDeleteModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{t('adminUsers.confirmDelete')}</h3>
                            <button className="modal-close" onClick={closeDeleteModal}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="modal-icon-warning">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                    <line x1="12" y1="9" x2="12" y2="13" />
                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                            </div>
                            <p className="modal-message">
                                {t('adminUsers.deleteConfirm')} <strong>{deleteModal.userEmail}</strong>?
                            </p>
                            <p className="modal-submessage">{t('adminUsers.deleteConfirmMessage')}</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={closeDeleteModal} disabled={isDeleting}>
                                {t('common.cancel')}
                            </button>
                            <button className="btn-danger" onClick={confirmDelete} disabled={isDeleting}>
                                {isDeleting ? t('adminUsers.deleting') : t('adminUsers.deleteUser')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Notification */}
            {successMessage && (
                <div className="notification notification-success">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <span>{successMessage}</span>
                    <button className="notification-close" onClick={() => setSuccessMessage(null)}>×</button>
                </div>
            )}

            {/* Error Notification */}
            {errorMessage && (
                <div className="notification notification-error">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{errorMessage}</span>
                    <button className="notification-close" onClick={() => setErrorMessage(null)}>×</button>
                </div>
            )}

            {/* Filter Popup */}
            {filterPopupOpen && (
                <>
                    <div className="filter-popup-overlay active" onClick={() => setFilterPopupOpen(false)} />
                    <div className={`filter-popup ${filterPopupOpen ? 'active' : ''}`}>
                        <div className="filter-popup-header">
                            <h3 className="filter-popup-title">{t('common.filter')}</h3>
                            <button className="filter-popup-close" onClick={() => setFilterPopupOpen(false)}>×</button>
                        </div>
                        <div className="filter-popup-body">
                            <div className="filter-popup-group">
                                <label className="filter-popup-label">{t('users.level')}</label>
                                <select
                                    value={filterLevel}
                                    onChange={(e) => setFilterLevel(e.target.value as Level | 'all')}
                                    className="filter-select"
                                >
                                    <option value="all">{t('adminUsers.allLevels')}</option>
                                    <option value="guest">{t('adminUsers.guest')}</option>
                                    <option value="member">{t('adminUsers.member')}</option>
                                    <option value="unit manager">{t('adminUsers.unitManager')}</option>
                                    <option value="brand manager">{t('adminUsers.brandManager')}</option>
                                </select>
                            </div>
                            <div className="filter-popup-group">
                                <label className="filter-popup-label">{t('adminUsers.pointsRange')}</label>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <input
                                        type="number"
                                        placeholder={t('adminUsers.min')}
                                        value={filterPointsMin}
                                        onChange={(e) => setFilterPointsMin(e.target.value)}
                                        className="filter-price-input"
                                        style={{ flex: 1 }}
                                    />
                                    <span style={{ color: '#6b7280' }}>{t('common.or')}</span>
                                    <input
                                        type="number"
                                        placeholder={t('adminUsers.max')}
                                        value={filterPointsMax}
                                        onChange={(e) => setFilterPointsMax(e.target.value)}
                                        className="filter-price-input"
                                        style={{ flex: 1 }}
                                    />
                                </div>
                            </div>
                            <div className="filter-popup-group">
                                <label className="filter-popup-label">{t('users.status')}</label>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value as Status | 'all')}
                                    className="filter-select"
                                >
                                    <option value="all">{t('adminUsers.filterByStatus')}</option>
                                    <option value="active">{t('adminUsers.active')}</option>
                                    <option value="inactive">{t('adminUsers.inactive')}</option>
                                </select>
                            </div>
                            <div className="filter-popup-group">
                                <label className="filter-popup-label">{t('adminUsers.dateRange')}</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div>
                                        <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>{t('adminUsers.from')}</label>
                                        <input
                                            type="date"
                                            value={filterDateFrom}
                                            onChange={(e) => setFilterDateFrom(e.target.value)}
                                            className="filter-date"
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>{t('adminUsers.to')}</label>
                                        <input
                                            type="date"
                                            value={filterDateTo}
                                            onChange={(e) => setFilterDateTo(e.target.value)}
                                            className="filter-date"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="filter-popup-footer">
                            <button 
                                className="btn-secondary"
                                onClick={() => {
                                    setFilterLevel('all');
                                    setFilterStatus('all');
                                    setFilterDateFrom('');
                                    setFilterDateTo('');
                                    setFilterPointsMin('');
                                    setFilterPointsMax('');
                                }}
                            >
                                {t('adminUsers.clearFilters')}
                            </button>
                            <button 
                                className="btn-primary"
                                onClick={() => setFilterPopupOpen(false)}
                            >
                                {t('adminUsers.applyFilters')}
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Edit Level Modal */}
            {editLevelModal.show && (
                <div className="modal-overlay" onClick={closeEditLevelModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{t('adminUsers.editLevelTitle')}</h3>
                            <button className="modal-close" onClick={closeEditLevelModal}>×</button>
                        </div>
                        <div className="modal-body">
                            <p className="modal-message" style={{ marginBottom: '20px' }}>
                                {t('adminUsers.selectLevel')} <strong>{editLevelModal.userName || t('common.user')}</strong>
                            </p>
                            <div className="form-group">
                                <label className="form-label">{t('users.level')}</label>
                                <div className="user-level-custom-dropdown">
                                    <button
                                        ref={dropdownToggleRef}
                                        type="button"
                                        className={`user-level-dropdown-toggle ${isLevelDropdownOpen ? 'active' : ''}`}
                                        onClick={() => {
                                            if (!isUpdatingLevel) {
                                                setIsLevelDropdownOpen(!isLevelDropdownOpen);
                                            }
                                        }}
                                        disabled={isUpdatingLevel}
                                    >
                                        <div className="user-level-selected">
                                            <div 
                                                className="level-indicator-small" 
                                                style={{ backgroundColor: getLevelColor(selectedLevel) }}
                                            />
                                            <span>{getLevelLabel(selectedLevel)}</span>
                                        </div>
                                        <svg 
                                            className={`dropdown-arrow ${isLevelDropdownOpen ? 'rotated' : ''}`}
                                            width="16" 
                                            height="16" 
                                            viewBox="0 0 16 16" 
                                            fill="none" 
                                            stroke="currentColor" 
                                            strokeWidth="2"
                                        >
                                            <path d="M4 6l4 4 4-4" />
                                        </svg>
                                    </button>
                                    {isLevelDropdownOpen && (
                                        <div 
                                            ref={dropdownRef}
                                            className="user-level-dropdown-menu"
                                        >
                                            {availableLevels.map((level) => (
                                                <button
                                                    key={level}
                                                    type="button"
                                                    className={`user-level-option ${selectedLevel === level ? 'selected' : ''}`}
                                                    onClick={() => {
                                                        setSelectedLevel(level);
                                                        setIsLevelDropdownOpen(false);
                                                    }}
                                                >
                                                    <div 
                                                        className="level-indicator-small" 
                                                        style={{ backgroundColor: getLevelColor(level) }}
                                                    />
                                                    <span>{getLevelLabel(level)}</span>
                                                    {selectedLevel === level && (
                                                        <svg 
                                                            width="16" 
                                                            height="16" 
                                                            viewBox="0 0 16 16" 
                                                            fill="none" 
                                                            stroke="currentColor" 
                                                            strokeWidth="2"
                                                        >
                                                            <polyline points="4 8 6 10 12 4" />
                                                        </svg>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {editLevelModal.currentLevel && (
                                <div style={{ marginTop: '12px', padding: '12px', background: '#f3f4f6', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{t('adminUsers.currentLevel')}: </span>
                                    <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1d2939' }}>
                                        {getLevelLabel(editLevelModal.currentLevel as Level)}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={closeEditLevelModal} disabled={isUpdatingLevel}>
                                {t('common.cancel')}
                            </button>
                            <button className="btn-primary" onClick={updateUserLevel} disabled={isUpdatingLevel}>
                                {isUpdatingLevel ? t('common.loading') : t('adminUsers.updateLevel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Senior Consultant Modal */}
            {editSeniorConsultantModal.show && (
                <div className="modal-overlay" onClick={closeEditSeniorConsultantModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{t('adminUsers.editReferrerTitle')}</h3>
                            <button className="modal-close" onClick={closeEditSeniorConsultantModal}>×</button>
                        </div>
                        <div className="modal-body">
                            <p className="modal-message" style={{ marginBottom: '20px' }}>
                                {t('adminUsers.editSeniorConsultantTitle')} <strong>{editSeniorConsultantModal.userName || t('common.user')}</strong>
                            </p>
                            
                            {isLoadingReferrerInfo ? (
                                // Loading state
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'center', 
                                    alignItems: 'center', 
                                    padding: '40px',
                                    flexDirection: 'column',
                                    gap: '16px'
                                }}>
                                    <div className="loading-spinner" style={{
                                        width: '40px',
                                        height: '40px',
                                        border: '4px solid #f3f4f6',
                                        borderTop: '4px solid #3b82f6',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite'
                                    }}></div>
                                    <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>{t('adminUsers.loadingReferrerInfo')}</p>
                                </div>
                            ) : editSeniorConsultantModal.currentSeniorConsultantId ? (
                                // User has a referrer - show current referrer with avatar and both remove/change options
                                <div className="form-group">
                                    <div style={{ 
                                        padding: '16px', 
                                        background: '#f3f4f6', 
                                        borderRadius: '8px',
                                        marginBottom: '20px'
                                    }}>
                                        <div style={{ 
                                            fontSize: '0.875rem', 
                                            color: '#6b7280',
                                            marginBottom: '12px'
                                        }}>
                                            {t('adminUsers.currentReferrer')}
                                        </div>
                                        <div style={{ 
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '12px'
                                        }}>
                                            <div style={{
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '50%',
                                                backgroundColor: getAvatarColor(editSeniorConsultantModal.currentSeniorConsultantName || ''),
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontSize: '1.25rem',
                                                fontWeight: '600',
                                                flexShrink: 0
                                            }}>
                                                {getAvatarInitial(editSeniorConsultantModal.currentSeniorConsultantName || '')}
                                            </div>
                                            <div style={{ 
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'flex-start',
                                                justifyContent: 'center',
                                                gap: '4px'
                                            }}>
                                                <div style={{ 
                                                    fontSize: '1rem', 
                                                    fontWeight: '500', 
                                                    color: '#1d2939',
                                                    textAlign: 'left',
                                                    lineHeight: '1.5'
                                                }}>
                                                    {editSeniorConsultantModal.currentSeniorConsultantName || 'Unknown'}
                                                </div>
                                                {editSeniorConsultantModal.currentSeniorConsultantEmail && (
                                                    <div style={{
                                                        fontSize: '0.875rem',
                                                        color: '#6b7280',
                                                        textAlign: 'left',
                                                        lineHeight: '1.5'
                                                    }}>
                                                        {editSeniorConsultantModal.currentSeniorConsultantEmail}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Change Referrer Section */}
                                    <div style={{ marginBottom: '16px' }}>
                                        <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>
                                            {t('adminUsers.changeReferrer')}
                                        </label>
                                        <input
                                            type="text"
                                            className={`form-input ${referCodeError ? 'error' : ''}`}
                                            placeholder={t('adminUsers.enterNewReferCode')}
                                            value={referCodeInput}
                                            onChange={(e) => {
                                                setReferCodeInput(e.target.value.toUpperCase());
                                                setReferCodeError(null);
                                            }}
                                            disabled={isUpdatingSeniorConsultant}
                                            style={{ textTransform: 'uppercase', marginBottom: '8px' }}
                                        />
                                        {referCodeError && (
                                            <div style={{ 
                                                marginTop: '4px', 
                                                color: '#dc2626', 
                                                fontSize: '0.875rem' 
                                            }}>
                                                {referCodeError}
                                            </div>
                                        )}
                                        <button 
                                            className="btn-primary" 
                                            onClick={updateSeniorConsultant} 
                                            disabled={isUpdatingSeniorConsultant || !referCodeInput.trim()}
                                            style={{ 
                                                width: '100%', 
                                                textAlign: 'center',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center'
                                            }}
                                        >
                                            {isUpdatingSeniorConsultant ? t('adminUsers.updating') : t('adminUsers.changeReferrer')}
                                        </button>
                                    </div>

                                    {/* Divider */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        margin: '20px 0',
                                        gap: '12px'
                                    }}>
                                        <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
                                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{t('common.or')}</span>
                                        <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
                                    </div>

                                    {/* Remove Referrer Button */}
                                    <button 
                                        className="btn-danger" 
                                        onClick={removeSeniorConsultant}
                                        disabled={isUpdatingSeniorConsultant}
                                        style={{ 
                                            width: '100%',
                                            textAlign: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        {isUpdatingSeniorConsultant ? t('common.loading') : t('adminUsers.removeReferrer')}
                                    </button>
                                </div>
                            ) : (
                                // User doesn't have a referrer - show input only
                                <div className="form-group">
                                    <label className="form-label">{t('adminUsers.enterReferCode')}</label>
                                    <input
                                        type="text"
                                        className={`form-input ${referCodeError ? 'error' : ''}`}
                                        placeholder={t('adminUsers.enterReferCode')}
                                        value={referCodeInput}
                                        onChange={(e) => {
                                            setReferCodeInput(e.target.value.toUpperCase());
                                            setReferCodeError(null);
                                        }}
                                        disabled={isUpdatingSeniorConsultant}
                                        style={{ textTransform: 'uppercase' }}
                                    />
                                    {referCodeError && (
                                        <div style={{ 
                                            marginTop: '8px', 
                                            color: '#dc2626', 
                                            fontSize: '0.875rem' 
                                        }}>
                                            {referCodeError}
                                        </div>
                                    )}
                                    <div style={{ 
                                        marginTop: '12px', 
                                        padding: '12px', 
                                        background: '#f3f4f6', 
                                        borderRadius: '8px',
                                        fontSize: '0.875rem',
                                        color: '#6b7280',
                                        marginBottom: '16px'
                                    }}>
                                        {t('adminUsers.enterReferCodeDescription')}
                                    </div>
                                    <button 
                                        className="btn-primary" 
                                        onClick={updateSeniorConsultant} 
                                        disabled={isUpdatingSeniorConsultant || !referCodeInput.trim()}
                                        style={{ 
                                            width: '100%', 
                                            textAlign: 'center',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center'
                                        }}
                                    >
                                        {isUpdatingSeniorConsultant ? t('adminUsers.adding') : t('adminUsers.addReferrer')}
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button 
                                className="btn-secondary" 
                                onClick={closeEditSeniorConsultantModal} 
                                disabled={isUpdatingSeniorConsultant || isLoadingReferrerInfo}
                                style={{ width: '100%' }}
                            >
                                {t('common.cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* User Detail Modal */}
            <UserDetailModal 
                open={selectedUserForDetail !== null}
                onClose={() => setSelectedUserForDetail(null)}
                user={selectedUserForDetail}
                onEditReferrer={(userId, userName) => {
                    setSelectedUserForDetail(null); // Close user detail modal
                    openEditSeniorConsultantModal(userId, userName);
                }}
            />
        </AdminLayout>
    );
}
