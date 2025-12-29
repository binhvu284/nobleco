import { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../components/AdminLayout';
import { IconCrown, IconShield, IconTrash2, IconSettings, IconMoreHorizontal, IconPlay, IconPause, IconLoader, IconPlus, IconX, IconEye, IconCheck } from '../components/icons';
import UserDetailModal from '../components/UserDetailModal';
import AdminDetailModal from '../components/AdminDetailModal';
import CoworkerDetailModal from '../components/CoworkerDetailModal';
import { getAvatarInitial, getAvatarColor, getAvatarViewportStyles } from '../../utils/avatarUtils';
import { getCurrentUser } from '../../auth';
import { useTranslation } from '../../shared/contexts/TranslationContext';

interface AdminUser {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'user' | 'coworker';
    points?: number;
    level?: string;
    status: 'active' | 'inactive';
    created_at: string;
    avatar?: string;
    permissions?: string[];
}

interface UserAvatarData {
    url: string;
    viewport_x?: number | null;
    viewport_y?: number | null;
    viewport_size?: number | null;
    width?: number | null;
    height?: number | null;
}

export default function AdminAdminUsers() {
    const { t } = useTranslation();
    const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
    const [coworkers, setCoworkers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [coworkersLoading, setCoworkersLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [coworkersError, setCoworkersError] = useState<string | null>(null);

    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
    const [userToEdit, setUserToEdit] = useState<AdminUser | null>(null);
    const [availablePages, setAvailablePages] = useState<Array<{ page_path: string; page_name: string; section: string | null }>>([]);
    const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
    const [permissionLoading, setPermissionLoading] = useState(false);
    const [permissionSaving, setPermissionSaving] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
    const [activeAdminDropdown, setActiveAdminDropdown] = useState<number | null>(null);
    const [showAdminDetailModal, setShowAdminDetailModal] = useState(false);
    const [adminToView, setAdminToView] = useState<AdminUser | null>(null);
    const [adminToDelete, setAdminToDelete] = useState<AdminUser | null>(null);
    const [showAdminDeleteModal, setShowAdminDeleteModal] = useState(false);
    const [deleteAdminLoading, setDeleteAdminLoading] = useState(false);
    const [statusUpdating, setStatusUpdating] = useState<number | null>(null);
    const [adminAvatars, setAdminAvatars] = useState<Record<number, UserAvatarData | null>>({});
    const [coworkerAvatars, setCoworkerAvatars] = useState<Record<number, UserAvatarData | null>>({});
    const [showAddAdminModal, setShowAddAdminModal] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [showAddCoworkerModal, setShowAddCoworkerModal] = useState(false);
    const [createCoworkerLoading, setCreateCoworkerLoading] = useState(false);
    const [createCoworkerError, setCreateCoworkerError] = useState<string | null>(null);
    const [coworkerFormData, setCoworkerFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [showCoworkerDetailModal, setShowCoworkerDetailModal] = useState(false);
    const [coworkerToView, setCoworkerToView] = useState<AdminUser | null>(null);

    const fetchUserAvatar = async (userId: number): Promise<UserAvatarData | null> => {
        try {
            const response = await fetch(`/api/user-avatars?userId=${userId}`);
            if (response.ok) {
                const avatarData = await response.json();
                if (avatarData?.url) {
                    return avatarData;
                }
            }
        } catch (error) {
            console.error(`Error fetching avatar for user ${userId}:`, error);
        }
        return null;
    };

    const fetchAdminUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch('/api/users?type=admin');
            if (!res.ok) throw new Error(`Request failed: ${res.status}`);
            const data = await res.json();
            // Ensure we have an array and filter to only admin role (safety check)
            const adminList = Array.isArray(data) ? data : [];
            // Sort by name alphabetically
            const sortedAdmins = adminList
                .filter(user => user.role === 'admin')
                .sort((a, b) => {
                    const nameA = (a.name || '').toLowerCase();
                    const nameB = (b.name || '').toLowerCase();
                    return nameA.localeCompare(nameB);
                });
            setAdminUsers(sortedAdmins);

            // Fetch avatars for all admins
            const avatarPromises = sortedAdmins.map(admin => 
                fetchUserAvatar(admin.id).then(avatar => ({ userId: admin.id, avatar }))
            );
            const avatarResults = await Promise.all(avatarPromises);
            const avatarMap: Record<number, UserAvatarData | null> = {};
            avatarResults.forEach(({ userId, avatar }) => {
                avatarMap[userId] = avatar;
            });
            setAdminAvatars(avatarMap);
        } catch (e: any) {
            setError(e?.message || 'Failed to load admin users');
            setAdminUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCoworkers = async () => {
        try {
            setCoworkersLoading(true);
            setCoworkersError(null);
            const res = await fetch('/api/users?type=coworkers');
            if (!res.ok) throw new Error(`Request failed: ${res.status}`);
            const data = await res.json();
            // Ensure we have an array and filter to only coworker role (safety check)
            const coworkerList = Array.isArray(data) ? data : [];
            // Sort by name alphabetically
            const sortedCoworkers = coworkerList
                .filter(user => user.role === 'coworker')
                .sort((a, b) => {
                    const nameA = (a.name || '').toLowerCase();
                    const nameB = (b.name || '').toLowerCase();
                    return nameA.localeCompare(nameB);
                });
            setCoworkers(sortedCoworkers);

            // Fetch avatars for all coworkers
            const avatarPromises = sortedCoworkers.map(coworker => 
                fetchUserAvatar(coworker.id).then(avatar => ({ userId: coworker.id, avatar }))
            );
            const avatarResults = await Promise.all(avatarPromises);
            const avatarMap: Record<number, UserAvatarData | null> = {};
            avatarResults.forEach(({ userId, avatar }) => {
                avatarMap[userId] = avatar;
            });
            setCoworkerAvatars(avatarMap);
        } catch (e: any) {
            setCoworkersError(e?.message || 'Failed to load coworkers');
            setCoworkers([]);
        } finally {
            setCoworkersLoading(false);
        }
    };

    useEffect(() => {
        fetchAdminUsers();
        fetchCoworkers();
    }, []);

    // Get current logged-in user
    const currentUser = getCurrentUser();
    const currentUserId = currentUser ? Number(currentUser.id) : null;

    // Sort administrators with current user first, then alphabetically
    const administrators = useMemo(() => {
        if (!currentUserId) {
            // If no current user, return as-is (already sorted alphabetically)
            return adminUsers;
        }
        
        // Separate current user from others
        const currentUserAdmin = adminUsers.find(admin => admin.id === currentUserId);
        const otherAdmins = adminUsers.filter(admin => admin.id !== currentUserId);
        
        // Sort other admins alphabetically
        const sortedOtherAdmins = [...otherAdmins].sort((a, b) => {
            const nameA = (a.name || '').toLowerCase();
            const nameB = (b.name || '').toLowerCase();
            return nameA.localeCompare(nameB);
        });
        
        // Return current user first, then others
        return currentUserAdmin ? [currentUserAdmin, ...sortedOtherAdmins] : sortedOtherAdmins;
    }, [adminUsers, currentUserId]);

    const [deleteCoworkerLoading, setDeleteCoworkerLoading] = useState(false);

    const handleDeleteClick = (user: AdminUser) => {
        setUserToDelete(user);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!userToDelete) return;
        
        setDeleteCoworkerLoading(true);
        try {
            const authToken = localStorage.getItem('nobleco_auth_token');
            const response = await fetch('/api/users', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ id: userToDelete.id })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: t('adminAdminUsers.failedDeleteCoworker') }));
                throw new Error(errorData.error || t('adminAdminUsers.failedDeleteCoworker'));
            }

            // Refresh coworkers list from database
            await fetchCoworkers();
            setShowDeleteModal(false);
            setUserToDelete(null);
        } catch (error) {
            console.error('Error deleting coworker:', error);
            alert((error as Error).message || t('adminAdminUsers.failedDeleteCoworker'));
        } finally {
            setDeleteCoworkerLoading(false);
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
        setUserToDelete(null);
    };

    const handleAddAdminSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateError(null);

        // Validation
        if (!formData.name.trim()) {
            setCreateError(t('adminAdminUsers.nameRequired'));
            return;
        }
        if (!formData.email.trim()) {
            setCreateError(t('adminAdminUsers.emailRequired'));
            return;
        }
        if (!formData.phone.trim()) {
            setCreateError(t('adminAdminUsers.phoneRequired'));
            return;
        }
        if (!formData.password) {
            setCreateError(t('adminAdminUsers.passwordRequired'));
            return;
        }
        if (formData.password.length < 6) {
            setCreateError(t('adminAdminUsers.passwordMinLength'));
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setCreateError(t('adminAdminUsers.passwordsDoNotMatch'));
            return;
        }

        setCreateLoading(true);
        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email.trim(),
                    name: formData.name.trim(),
                    phone: formData.phone.trim(),
                    password: formData.password,
                    role: 'admin'
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: t('adminAdminUsers.failedCreateAdmin') }));
                throw new Error(errorData.error || t('adminAdminUsers.failedCreateAdmin'));
            }

            // Reset form and close modal
            setFormData({
                name: '',
                email: '',
                phone: '',
                password: '',
                confirmPassword: ''
            });
            setShowAddAdminModal(false);
            setCreateError(null);

            // Refresh admin users list
            await fetchAdminUsers();
        } catch (error) {
            console.error('Error creating admin user:', error);
            setCreateError(error instanceof Error ? error.message : t('adminAdminUsers.failedCreateAdmin'));
        } finally {
            setCreateLoading(false);
        }
    };

    const handleAddAdminCancel = () => {
        setShowAddAdminModal(false);
        setFormData({
            name: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: ''
        });
        setCreateError(null);
    };

    const handleAddCoworkerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateCoworkerError(null);

        // Validation
        if (!coworkerFormData.name.trim()) {
            setCreateCoworkerError(t('adminAdminUsers.nameRequired'));
            return;
        }
        if (!coworkerFormData.email.trim()) {
            setCreateCoworkerError(t('adminAdminUsers.emailRequired'));
            return;
        }
        if (!coworkerFormData.phone.trim()) {
            setCreateCoworkerError(t('adminAdminUsers.phoneRequired'));
            return;
        }
        if (!coworkerFormData.password) {
            setCreateCoworkerError(t('adminAdminUsers.passwordRequired'));
            return;
        }
        if (coworkerFormData.password.length < 6) {
            setCreateCoworkerError(t('adminAdminUsers.passwordMinLength'));
            return;
        }
        if (coworkerFormData.password !== coworkerFormData.confirmPassword) {
            setCreateCoworkerError(t('adminAdminUsers.passwordsDoNotMatch'));
            return;
        }

        setCreateCoworkerLoading(true);
        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: coworkerFormData.email.trim(),
                    name: coworkerFormData.name.trim(),
                    phone: coworkerFormData.phone.trim(),
                    password: coworkerFormData.password,
                    role: 'coworker'
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: t('adminAdminUsers.failedCreateCoworker') }));
                throw new Error(errorData.error || t('adminAdminUsers.failedCreateCoworker'));
            }

            // Reset form and close modal
            setCoworkerFormData({
                name: '',
                email: '',
                phone: '',
                password: '',
                confirmPassword: ''
            });
            setShowAddCoworkerModal(false);
            setCreateCoworkerError(null);

            // Refresh coworkers list
            await fetchCoworkers();
        } catch (error) {
            console.error('Error creating coworker:', error);
            setCreateCoworkerError(error instanceof Error ? error.message : t('adminAdminUsers.failedCreateCoworker'));
        } finally {
            setCreateCoworkerLoading(false);
        }
    };

    const handleAddCoworkerCancel = () => {
        setShowAddCoworkerModal(false);
        setCoworkerFormData({
            name: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: ''
        });
        setCreateCoworkerError(null);
    };

    const handleCoworkerDetailClick = (coworker: AdminUser) => {
        setCoworkerToView(coworker);
        setShowCoworkerDetailModal(true);
        handleDropdownClose();
    };

    const fetchAvailablePages = async () => {
        try {
            const response = await fetch('/api/coworker-permissions?available=true');
            if (response.ok) {
                const data = await response.json();
                setAvailablePages(data);
            }
        } catch (error) {
            console.error('Error fetching available pages:', error);
        }
    };

    const fetchCoworkerPermissions = async (coworkerId: number) => {
        setPermissionLoading(true);
        try {
            const authToken = localStorage.getItem('nobleco_auth_token');
            const response = await fetch(`/api/coworker-permissions?coworkerId=${coworkerId}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                const permissionPaths = new Set<string>(data.map((p: any) => p.page_path as string));
                setSelectedPermissions(permissionPaths);
            } else {
                console.error('Failed to fetch permissions:', response.status);
            }
        } catch (error) {
            console.error('Error fetching coworker permissions:', error);
        } finally {
            setPermissionLoading(false);
        }
    };

    const handlePermissionClick = async (user: AdminUser) => {
        setUserToEdit(user);
        setShowPermissionModal(true);
        await fetchAvailablePages();
        await fetchCoworkerPermissions(user.id);
    };

    const handlePermissionClose = () => {
        setShowPermissionModal(false);
        setUserToEdit(null);
        setSelectedPermissions(new Set());
    };

    const handlePermissionToggle = (pagePath: string) => {
        setSelectedPermissions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(pagePath)) {
                newSet.delete(pagePath);
            } else {
                newSet.add(pagePath);
            }
            return newSet;
        });
    };

    const handlePermissionSave = async () => {
        if (!userToEdit) return;

        setPermissionSaving(true);
        try {
            const authToken = localStorage.getItem('nobleco_auth_token');
            const permissions = Array.from(selectedPermissions).map(pagePath => {
                const page = availablePages.find(p => p.page_path === pagePath);
                return {
                    page_path: pagePath,
                    page_name: page?.page_name || pagePath
                };
            });

            const response = await fetch('/api/coworker-permissions', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    coworkerId: userToEdit.id,
                    permissions
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: t('adminAdminUsers.failedSavePermissions') }));
                throw new Error(errorData.error || t('adminAdminUsers.failedSavePermissions'));
            }

            // Refresh coworkers list
            await fetchCoworkers();
            handlePermissionClose();
        } catch (error) {
            console.error('Error saving permissions:', error);
            alert((error as Error).message || t('adminAdminUsers.failedSavePermissions'));
        } finally {
            setPermissionSaving(false);
        }
    };

    const handleStatusToggle = async (userId: number, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        
        try {
            setStatusUpdating(userId);
            const response = await fetch('/api/users', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: userId,
                    status: newStatus
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to update status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                // Update the coworkers list with the new status
                setCoworkers(prevCoworkers => 
                    prevCoworkers.map(coworker => 
                        coworker.id === userId 
                            ? { ...coworker, status: newStatus as 'active' | 'inactive' }
                            : coworker
                    )
                );
            } else {
                throw new Error(result.error || 'Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            // You could add a toast notification here
            alert(`Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setStatusUpdating(null);
        }
    };

    const handleDropdownToggle = (userId: number) => {
        setActiveDropdown(activeDropdown === userId ? null : userId);
    };

    const handleDropdownClose = () => {
        setActiveDropdown(null);
    };

    const handleAdminDropdownToggle = (adminId: number) => {
        setActiveAdminDropdown(activeAdminDropdown === adminId ? null : adminId);
    };

    const handleAdminDropdownClose = () => {
        setActiveAdminDropdown(null);
    };

    const handleAdminDetailClick = (admin: AdminUser) => {
        setAdminToView(admin);
        setShowAdminDetailModal(true);
        handleAdminDropdownClose();
    };

    const handleAdminDeleteClick = (admin: AdminUser) => {
        setAdminToDelete(admin);
        setShowAdminDeleteModal(true);
        handleAdminDropdownClose();
    };

    const handleAdminDeleteConfirm = async () => {
        if (!adminToDelete) return;
        
        setDeleteAdminLoading(true);
        try {
            const authToken = localStorage.getItem('nobleco_auth_token');
            const response = await fetch('/api/users', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ id: adminToDelete.id })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: t('adminAdminUsers.failedDeleteAdmin') }));
                throw new Error(errorData.error || t('adminAdminUsers.failedDeleteAdmin'));
            }

            // Refresh admin users list from database
            await fetchAdminUsers();
            setShowAdminDeleteModal(false);
            setAdminToDelete(null);
        } catch (error) {
            console.error('Error deleting admin:', error);
            alert((error as Error).message || t('adminAdminUsers.failedDeleteAdmin'));
        } finally {
            setDeleteAdminLoading(false);
        }
    };

    const handleAdminDeleteCancel = () => {
        setShowAdminDeleteModal(false);
        setAdminToDelete(null);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };


    const getPermissionLabel = (permission: string) => {
        const labels: { [key: string]: string } = {
            'all': 'Full Access',
            'products': 'Products',
            'category': 'Category',
            'withdraw_request': 'Withdraw Request'
        };
        return labels[permission] || permission;
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (activeDropdown !== null) {
                if (!target.closest('.unified-dropdown') && !target.closest('.action-dropdown')) {
                    setActiveDropdown(null);
                }
            }
            if (activeAdminDropdown !== null) {
                if (!target.closest('.admin-dropdown')) {
                    setActiveAdminDropdown(null);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeDropdown, activeAdminDropdown]);

    return (
        <AdminLayout title={t('adminAdminUsers.title')}>
            <div className="admin-users-page">

                {/* Administrator Section */}
                <div className="administrator-section admin-users-section">
                    <div className="section-header">
                        <div className="section-title">
                            <IconCrown />
                            <h2>{t('adminAdminUsers.administrator')}</h2>
                            <span className="role-badge admin">{t('adminAdminUsers.highestAuthority')}</span>
                        </div>
                        <button 
                            className="btn-primary create-btn"
                            onClick={() => setShowAddAdminModal(true)}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <IconPlus />
                            <span>{t('common.add')}</span>
                        </button>
                    </div>
                    <div className="section-description">
                        <p>{t('adminAdminUsers.administratorDescription')}</p>
                    </div>
                    
                    <div className="administrator-list">
                        {loading ? (
                            // Loading skeleton
                            Array.from({ length: 2 }).map((_, i) => (
                                <div key={`loading-${i}`} className="administrator-item row-loading">
                                    <div className="admin-avatar">
                                        <div className="skeleton skeleton-circle"></div>
                                    </div>
                                    <div className="admin-details">
                                        <div className="skeleton skeleton-text" style={{ width: '120px', height: '20px' }}></div>
                                        <div className="skeleton skeleton-text" style={{ width: '180px', height: '16px', marginTop: '8px' }}></div>
                                    </div>
                                    <div className="admin-badge">
                                        <div className="skeleton skeleton-badge"></div>
                                    </div>
                                </div>
                            ))
                        ) : error ? (
                            <div className="error-state">
                                <div className="error-icon">⚠️</div>
                                <h3>{t('adminAdminUsers.errorLoadingAdministrators')}</h3>
                                <p>{error}</p>
                                <button className="btn-primary" onClick={fetchAdminUsers}>
                                    {t('common.retry')}
                                </button>
                            </div>
                        ) : administrators.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">👑</div>
                                <h3>{t('adminAdminUsers.noAdministratorsFound')}</h3>
                                <p>{t('adminAdminUsers.noAdministratorsDescription')}</p>
                            </div>
                        ) : (
                            administrators.map((admin) => {
                                const avatar = adminAvatars[admin.id];
                                const hasAvatar = avatar && avatar.url;
                                return (
                                <div 
                                    key={admin.id} 
                                    className="administrator-item"
                                    style={{ cursor: 'pointer' }}
                                    onClick={(e) => {
                                        // Don't trigger if clicking on dropdown button
                                        if ((e.target as HTMLElement).closest('.admin-dropdown')) {
                                            return;
                                        }
                                        handleAdminDetailClick(admin);
                                    }}
                                >
                                    <div 
                                        className="admin-avatar"
                                        style={{
                                            background: hasAvatar ? 'transparent' : `linear-gradient(135deg, ${getAvatarColor(admin.name)}, ${getAvatarColor(admin.name)}dd)`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        {hasAvatar ? (
                                            <img 
                                                src={avatar.url} 
                                                alt={admin.name}
                                                style={getAvatarViewportStyles(avatar, 50)}
                                                onError={(e) => {
                                                    // Fallback to initials if image fails to load
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                    const parent = target.parentElement;
                                                    if (parent) {
                                                        const initials = admin.name.split(' ').map(n => n[0]).join('').toUpperCase() || getAvatarInitial(admin.name);
                                                        parent.innerHTML = initials;
                                                        parent.style.background = `linear-gradient(135deg, ${getAvatarColor(admin.name)}, ${getAvatarColor(admin.name)}dd)`;
                                                    }
                                                }}
                                            />
                                        ) : (
                                            admin.name.split(' ').map(n => n[0]).join('').toUpperCase() || getAvatarInitial(admin.name)
                                        )}
                                    </div>
                                    <div className="admin-details">
                                        <h3 className="admin-name">
                                            {admin.name}
                                            {currentUserId !== null && admin.id === currentUserId && (
                                                <span style={{ marginLeft: '8px', color: 'var(--primary)', fontWeight: '500', fontSize: '0.9em' }}>({t('adminAdminUsers.me')})</span>
                                            )}
                                        </h3>
                                        <p className="admin-email">{admin.email}</p>
                                    </div>
                                    <div className="admin-badge">
                                        <IconCrown />
                                        <span>{t('adminAdminUsers.administrator')}</span>
                                    </div>
                                    <div 
                                        className={`admin-dropdown unified-dropdown ${activeAdminDropdown === admin.id ? 'active' : ''}`}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button 
                                            className="unified-more-btn"
                                            onClick={() => handleAdminDropdownToggle(admin.id)}
                                            title={t('adminAdminUsers.moreActions')}
                                        >
                                            <IconMoreHorizontal />
                                        </button>
                                        {activeAdminDropdown === admin.id && (
                                            <div className="unified-dropdown-menu">
                                                <button 
                                                    className="unified-dropdown-item"
                                                    onClick={() => handleAdminDetailClick(admin)}
                                                >
                                                    <IconEye />
                                                    {t('adminAdminUsers.detail')}
                                                </button>
                                                {administrators.length > 1 && currentUserId !== null && admin.id !== currentUserId && (
                                                    <button 
                                                        className="unified-dropdown-item danger"
                                                        onClick={() => handleAdminDeleteClick(admin)}
                                                    >
                                                        <IconTrash2 />
                                                        {t('common.delete')}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Co-worker Section */}
                <div className="coworker-section coworkers-section">
                    <div className="section-header">
                        <div className="section-title">
                            <IconShield />
                            <h2>{t('adminAdminUsers.coworkers')}</h2>
                            <span className="role-badge coworker">{t('adminAdminUsers.limitedAccess')}</span>
                            <span className="section-stats" style={{ marginLeft: '12px', fontSize: '0.9rem', color: 'var(--muted)' }}>
                                {coworkers.length} {t('adminAdminUsers.coworker')}{coworkers.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                        <button 
                            className="btn-primary create-btn"
                            onClick={() => setShowAddCoworkerModal(true)}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <IconPlus />
                            <span>{t('common.add')}</span>
                        </button>
                    </div>
                    <div className="section-description">
                        <p>{t('adminAdminUsers.coworkerDescription')}</p>
                    </div>

                    <div className="coworker-table-container">
                        {/* Desktop Table */}
                        <div className="table-wrap">
                            <table className="coworker-table">
                                <thead>
                                    <tr>
                                        <th>{t('users.name')}</th>
                                        <th>{t('users.email')}</th>
                                        <th>{t('users.status')}</th>
                                        <th>{t('adminAdminUsers.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {coworkersLoading ? (
                                        // Loading skeleton rows
                                        Array.from({ length: 3 }).map((_, i) => (
                                            <tr key={`loading-${i}`} className="row-loading">
                                                <td>
                                                    <div className="user-info">
                                                        <div className="skeleton skeleton-circle"></div>
                                                        <div className="skeleton skeleton-text" style={{ width: '100px' }}></div>
                                                    </div>
                                                </td>
                                                <td><div className="skeleton skeleton-text" style={{ width: '150px' }}></div></td>
                                                <td><div className="skeleton skeleton-badge"></div></td>
                                                <td><div className="skeleton skeleton-text" style={{ width: '30px' }}></div></td>
                                            </tr>
                                        ))
                                    ) : coworkersError ? (
                                        <tr>
                                            <td colSpan={4} className="error-state">
                                                <div className="error-icon">⚠️</div>
                                                <h3>{t('adminAdminUsers.errorLoadingCoworkers')}</h3>
                                                <p>{coworkersError}</p>
                                                <button className="btn-primary" onClick={fetchCoworkers}>
                                                    {t('common.retry')}
                                                </button>
                                            </td>
                                        </tr>
                                    ) : coworkers.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="empty-state">
                                                <div className="empty-icon">👥</div>
                                                <h3>{t('adminAdminUsers.noCoworkersFound')}</h3>
                                                <p>{t('adminAdminUsers.noCoworkersDescription')}</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        coworkers.map((user) => {
                                            const avatar = coworkerAvatars[user.id];
                                            const hasAvatar = avatar && avatar.url;
                                            return (
                                            <tr 
                                                key={user.id}
                                                style={{ cursor: 'pointer' }}
                                                onClick={(e) => {
                                                    // Don't trigger if clicking on dropdown button
                                                    if ((e.target as HTMLElement).closest('.unified-dropdown')) {
                                                        return;
                                                    }
                                                    handleCoworkerDetailClick(user);
                                                }}
                                            >
                                                <td>
                                                    <div className="user-info">
                                                        <div 
                                                            className="user-avatar"
                                                            style={{
                                                                background: hasAvatar ? 'transparent' : `linear-gradient(135deg, ${getAvatarColor(user.name)}, ${getAvatarColor(user.name)}dd)`,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                overflow: 'hidden'
                                                            }}
                                                        >
                                                            {hasAvatar ? (
                                                                <img 
                                                                    src={avatar.url} 
                                                                    alt={user.name}
                                                                    style={getAvatarViewportStyles(avatar, 40)}
                                                                    onError={(e) => {
                                                                        const target = e.target as HTMLImageElement;
                                                                        target.style.display = 'none';
                                                                        const parent = target.parentElement;
                                                                        if (parent) {
                                                                            const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase() || getAvatarInitial(user.name);
                                                                            parent.innerHTML = initials;
                                                                            parent.style.background = `linear-gradient(135deg, ${getAvatarColor(user.name)}, ${getAvatarColor(user.name)}dd)`;
                                                                        }
                                                                    }}
                                                                />
                                                            ) : (
                                                                user.name.split(' ').map(n => n[0]).join('').toUpperCase() || getAvatarInitial(user.name)
                                                            )}
                                                        </div>
                                                        <span>{user.name}</span>
                                                    </div>
                                                </td>
                                                <td>{user.email}</td>
                                                <td>
                                                    <span className={`status-badge ${user.status}`}>
                                                        {user.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div 
                                                        className={`unified-dropdown ${activeDropdown === user.id ? 'active' : ''}`}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <button 
                                                            className="unified-more-btn"
                                                            onClick={() => handleDropdownToggle(user.id)}
                                                            title={t('adminAdminUsers.moreActions')}
                                                        >
                                                            <IconMoreHorizontal />
                                                        </button>
                                                        {activeDropdown === user.id && (
                                                            <div className="unified-dropdown-menu">
                                                                <button 
                                                                    className="unified-dropdown-item"
                                                                    onClick={() => {
                                                                        handleCoworkerDetailClick(user);
                                                                    }}
                                                                >
                                                                    <IconEye />
                                                                    {t('adminAdminUsers.detail')}
                                                                </button>
                                                                <button 
                                                                    className="unified-dropdown-item"
                                                                    onClick={() => {
                                                                        handlePermissionClick(user);
                                                                        handleDropdownClose();
                                                                    }}
                                                                >
                                                                    <IconSettings />
                                                                    {t('adminAdminUsers.permissions')}
                                                                </button>
                                                                <button 
                                                                    className="unified-dropdown-item"
                                                                    disabled={statusUpdating === user.id}
                                                                    onClick={() => {
                                                                        handleStatusToggle(user.id, user.status);
                                                                        handleDropdownClose();
                                                                    }}
                                                                >
                                                                    {statusUpdating === user.id ? (
                                                                        <IconLoader className="animate-spin" />
                                                                    ) : (
                                                                        user.status === 'active' ? <IconPause /> : <IconPlay />
                                                                    )}
                                                                    {statusUpdating === user.id ? t('common.updating') : (user.status === 'active' ? t('adminUsers.deactivate') : t('adminUsers.activate'))}
                                                                </button>
                                                                <button 
                                                                    className="unified-dropdown-item danger"
                                                                    onClick={() => {
                                                                        handleDeleteClick(user);
                                                                        handleDropdownClose();
                                                                    }}
                                                                >
                                                                    <IconTrash2 />
                                                                    {t('common.delete')}
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

                        {/* Mobile Cards */}
                        <div className="coworker-mobile-cards">
                            {coworkersLoading ? (
                                // Loading skeleton cards
                                Array.from({ length: 3 }).map((_, i) => (
                                    <div key={`loading-${i}`} className="coworker-mobile-card">
                                        <div className="coworker-card-header">
                                            <div className="skeleton skeleton-circle" style={{ width: '40px', height: '40px' }}></div>
                                            <div className="coworker-card-info">
                                                <div className="skeleton skeleton-text" style={{ width: '120px', height: '16px' }}></div>
                                                <div className="skeleton skeleton-text" style={{ width: '180px', height: '14px', marginTop: '4px' }}></div>
                                            </div>
                                        </div>
                                        <div className="coworker-card-footer">
                                            <div className="skeleton skeleton-badge" style={{ width: '60px', height: '24px' }}></div>
                                            <div className="skeleton skeleton-text" style={{ width: '30px', height: '30px' }}></div>
                                        </div>
                                    </div>
                                ))
                            ) : coworkersError ? (
                                <div className="error-state">
                                    <div className="error-icon">⚠️</div>
                                    <h3>{t('adminAdminUsers.errorLoadingCoworkers')}</h3>
                                    <p>{coworkersError}</p>
                                    <button className="btn-primary" onClick={fetchCoworkers}>
                                        {t('common.retry')}
                                    </button>
                                </div>
                            ) : coworkers.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">👥</div>
                                    <h3>No co-workers found</h3>
                                    <p>There are currently no co-workers in the system.</p>
                                </div>
                            ) : (
                                coworkers.map((user) => {
                                    const avatar = coworkerAvatars[user.id];
                                    const hasAvatar = avatar && avatar.url;
                                    return (
                                    <div 
                                        key={user.id} 
                                        className="coworker-mobile-card"
                                        style={{ cursor: 'pointer' }}
                                        onClick={(e) => {
                                            // Don't trigger if clicking on dropdown button
                                            if ((e.target as HTMLElement).closest('.unified-dropdown')) {
                                                return;
                                            }
                                            handleCoworkerDetailClick(user);
                                        }}
                                    >
                                        {/* Three-dot button positioned at top right */}
                                        <div className="coworker-card-actions" onClick={(e) => e.stopPropagation()}>
                                            <div className={`unified-dropdown ${activeDropdown === user.id ? 'active' : ''}`}>
                                                <button 
                                                    className="unified-more-btn"
                                                    onClick={() => handleDropdownToggle(user.id)}
                                                    title={t('adminAdminUsers.moreActions')}
                                                >
                                                    <IconMoreHorizontal />
                                                </button>
                                                {activeDropdown === user.id && (
                                                    <div className="unified-dropdown-menu">
                                                        <button 
                                                            className="unified-dropdown-item"
                                                            onClick={() => {
                                                                handleCoworkerDetailClick(user);
                                                            }}
                                                        >
                                                            <IconEye />
                                                            {t('adminAdminUsers.detail')}
                                                        </button>
                                                        <button 
                                                            className="unified-dropdown-item"
                                                            onClick={() => {
                                                                handlePermissionClick(user);
                                                                handleDropdownClose();
                                                            }}
                                                        >
                                                            <IconSettings />
                                                            Permissions
                                                        </button>
                                                        <button 
                                                            className="unified-dropdown-item"
                                                            disabled={statusUpdating === user.id}
                                                            onClick={() => {
                                                                handleStatusToggle(user.id, user.status);
                                                                handleDropdownClose();
                                                            }}
                                                        >
                                                            {statusUpdating === user.id ? (
                                                                <IconLoader className="animate-spin" />
                                                            ) : (
                                                                user.status === 'active' ? <IconPause /> : <IconPlay />
                                                            )}
                                                            {statusUpdating === user.id ? 'Updating...' : (user.status === 'active' ? 'Deactivate' : 'Activate')}
                                                        </button>
                                                        <button 
                                                            className="unified-dropdown-item danger"
                                                            onClick={() => {
                                                                handleDeleteClick(user);
                                                                handleDropdownClose();
                                                            }}
                                                        >
                                                            <IconTrash2 />
                                                            {t('common.delete')}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="coworker-card-header">
                                            <div 
                                                className="coworker-card-avatar"
                                                style={{
                                                    background: hasAvatar ? 'transparent' : `linear-gradient(135deg, ${getAvatarColor(user.name)}, ${getAvatarColor(user.name)}dd)`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                {hasAvatar ? (
                                                    <img 
                                                        src={avatar.url} 
                                                        alt={user.name}
                                                        style={getAvatarViewportStyles(avatar, 60)}
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.style.display = 'none';
                                                            const parent = target.parentElement;
                                                            if (parent) {
                                                                const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase() || getAvatarInitial(user.name);
                                                                parent.innerHTML = initials;
                                                                parent.style.background = `linear-gradient(135deg, ${getAvatarColor(user.name)}, ${getAvatarColor(user.name)}dd)`;
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    user.name.split(' ').map(n => n[0]).join('').toUpperCase() || getAvatarInitial(user.name)
                                                )}
                                            </div>
                                            <div className="coworker-card-info">
                                                <h3 className="coworker-card-name">{user.name}</h3>
                                                <p className="coworker-card-email">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="coworker-card-footer">
                                            <div className="coworker-card-status">
                                                <span className="coworker-card-status-label">Status:</span>
                                                <span className={`status-badge ${user.status}`}>
                                                    {user.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteModal && userToDelete && (
                    <div className="modal-overlay" onClick={handleDeleteCancel}>
                        <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{t('adminAdminUsers.deleteCoworker')}</h2>
                                <button 
                                    className="modal-close"
                                    onClick={handleDeleteCancel}
                                    disabled={deleteCoworkerLoading}
                                >
                                    <IconX />
                                </button>
                            </div>
                            <div className="modal-body">
                                <p>{t('adminAdminUsers.confirmDeleteCoworker').replace('{{name}}', userToDelete.name)}</p>
                                <p className="warning-text">{t('adminAdminUsers.deleteWarning')}</p>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    className="btn-secondary"
                                    onClick={handleDeleteCancel}
                                    disabled={deleteCoworkerLoading}
                                >
                                    {t('common.cancel')}
                                </button>
                                <button 
                                    className="btn-danger"
                                    onClick={handleDeleteConfirm}
                                    disabled={deleteCoworkerLoading}
                                >
                                    {deleteCoworkerLoading ? (
                                        <>
                                            <IconLoader className="animate-spin" style={{ marginRight: '8px' }} />
                                            Deleting...
                                        </>
                                    ) : (
                                        'Delete'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Admin Modal */}
                {showAddAdminModal && (
                    <div className="modal-overlay" onClick={handleAddAdminCancel}>
                        <div className="modal-content add-admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
                            <div className="modal-header" style={{ flexShrink: 0 }}>
                                <h2>{t('adminAdminUsers.addAdministrator')}</h2>
                                <button 
                                    className="modal-close"
                                    onClick={handleAddAdminCancel}
                                    disabled={createLoading}
                                >
                                    <IconX />
                                </button>
                            </div>
                            <form onSubmit={handleAddAdminSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                                <div className="modal-body" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                                    {createError && (
                                        <div className="error-message" style={{ 
                                            padding: '12px', 
                                            background: '#fee2e2', 
                                            color: '#dc2626', 
                                            borderRadius: '8px', 
                                            marginBottom: '20px',
                                            fontSize: '14px'
                                        }}>
                                            {createError}
                                        </div>
                                    )}
                                    <div className="form-group" style={{ marginBottom: '20px' }}>
                                        <label className="form-label">{t('users.name')} *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.name}
                                            onChange={(e) => {
                                                // Auto-capitalize first letter of each word
                                                const value = e.target.value;
                                                const capitalized = value.split(' ').map(word => 
                                                    word.length > 0 
                                                        ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                                                        : ''
                                                ).join(' ');
                                                setFormData({ ...formData, name: capitalized });
                                            }}
                                            placeholder="Enter full name"
                                            required
                                            disabled={createLoading}
                                        />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '20px' }}>
                                        <label className="form-label">{t('users.email')} *</label>
                                        <input
                                            type="email"
                                            className="form-input"
                                            value={formData.email}
                                            onChange={(e) => {
                                                // Normalize email to lowercase to prevent capitalization issues
                                                const normalizedEmail = e.target.value.toLowerCase();
                                                setFormData({ ...formData, email: normalizedEmail });
                                            }}
                                            placeholder="Enter email address"
                                            required
                                            autoCapitalize="off"
                                            autoCorrect="off"
                                            autoComplete="email"
                                            spellCheck="false"
                                            inputMode="email"
                                            disabled={createLoading}
                                        />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '20px' }}>
                                        <label className="form-label">{t('adminAdminUsers.phoneNumber')} *</label>
                                        <input
                                            type="tel"
                                            className="form-input"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="Enter phone number"
                                            required
                                            disabled={createLoading}
                                        />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '20px' }}>
                                        <label className="form-label">{t('settings.password')} *</label>
                                        <input
                                            type="password"
                                            className="form-input"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            placeholder="Enter password (min 6 characters)"
                                            required
                                            disabled={createLoading}
                                            minLength={6}
                                        />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '20px' }}>
                                        <label className="form-label">{t('adminAdminUsers.confirmPassword')} *</label>
                                        <input
                                            type="password"
                                            className="form-input"
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            placeholder="Confirm password"
                                            required
                                            disabled={createLoading}
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer" style={{ flexShrink: 0, borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px' }}>
                                    <button 
                                        type="button"
                                        className="btn-secondary"
                                        onClick={handleAddAdminCancel}
                                        disabled={createLoading}
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button 
                                        type="submit"
                                        className="btn-primary"
                                        disabled={createLoading}
                                    >
                                        {createLoading ? (
                                            <>
                                                <IconLoader className="animate-spin" style={{ marginRight: '8px' }} />
                                                {t('adminAdminUsers.creating')}
                                            </>
                                        ) : (
                                            t('adminAdminUsers.createAdministrator')
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Permission Settings Modal */}
                {showPermissionModal && userToEdit && (
                    <div className="modal-overlay" onClick={handlePermissionClose}>
                        <div className="modal-content permission-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                            <div className="modal-header" style={{ flexShrink: 0 }}>
                                <h2>{t('adminAdminUsers.permissionSettings')}</h2>
                                <button 
                                    className="modal-close"
                                    onClick={handlePermissionClose}
                                    disabled={permissionSaving}
                                >
                                    <IconX />
                                </button>
                            </div>
                            <div className="modal-body" style={{ flex: '1 1 auto', overflowY: 'auto', padding: '24px' }}>
                                {permissionLoading ? (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                                        <IconLoader className="animate-spin" style={{ width: '24px', height: '24px', color: 'var(--primary)' }} />
                                        <span style={{ marginLeft: '12px', color: 'var(--muted)' }}>{t('adminAdminUsers.loadingPermissions')}</span>
                                    </div>
                                ) : (
                                    <div className="permission-settings">
                                        <div style={{ marginBottom: '24px' }}>
                                            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                                                {t('adminAdminUsers.editPermissionsFor').replace('{{name}}', '')}
                                                <span style={{ color: 'var(--primary)' }}>{userToEdit.name}</span>
                                            </h3>
                                            <p style={{ fontSize: '14px', color: 'var(--muted)', margin: 0 }}>
                                                {t('adminAdminUsers.selectPagesDescription')}
                                            </p>
                                        </div>

                                        {/* Dashboard Section */}
                                        <div className="permission-section" style={{ marginBottom: '20px' }}>
                                            <div className="permission-section-header" style={{ 
                                                padding: '8px 12px', 
                                                marginBottom: '8px'
                                            }}>
                                                <h4 style={{ 
                                                    fontSize: '12px', 
                                                    fontWeight: '500', 
                                                    color: 'var(--muted)', 
                                                    margin: 0, 
                                                    textTransform: 'uppercase', 
                                                    letterSpacing: '0.5px',
                                                    lineHeight: '1.4'
                                                }}>
                                                    {t('adminAdminUsers.dashboard')}
                                                </h4>
                                            </div>
                                            <div className="permission-options" style={{ paddingLeft: '4px' }}>
                                                {availablePages
                                                    .filter(page => page.section === null)
                                                    .map(page => (
                                                        <label 
                                                            key={page.page_path}
                                                            className="permission-option"
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                padding: '8px 12px',
                                                                borderRadius: '6px',
                                                                cursor: 'pointer',
                                                                transition: 'background 0.15s ease',
                                                                marginBottom: '2px',
                                                                lineHeight: '1.4'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.background = 'var(--bg-secondary)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.background = 'transparent';
                                                            }}
                                                        >
                                                            <div style={{ 
                                                                marginRight: '10px',
                                                                position: 'relative',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}>
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={selectedPermissions.has(page.page_path)}
                                                                    onChange={() => handlePermissionToggle(page.page_path)}
                                                                    disabled={permissionSaving}
                                                                    style={{
                                                                        width: '18px',
                                                                        height: '18px',
                                                                        cursor: 'pointer',
                                                                        accentColor: 'var(--primary)',
                                                                        margin: 0,
                                                                        flexShrink: 0
                                                                    }}
                                                                    className="permission-checkbox"
                                                                />
                                                            </div>
                                                            <span style={{ 
                                                                fontSize: '14px', 
                                                                color: 'var(--text-primary)', 
                                                                fontWeight: '500',
                                                                lineHeight: '1.4'
                                                            }}>
                                                                {page.page_name}
                                                            </span>
                                                        </label>
                                                    ))}
                                            </div>
                                        </div>

                                        {/* Users Section */}
                                        <div className="permission-section" style={{ marginBottom: '20px' }}>
                                            <div className="permission-section-header" style={{ 
                                                padding: '8px 12px', 
                                                marginBottom: '8px'
                                            }}>
                                                <h4 style={{ 
                                                    fontSize: '12px', 
                                                    fontWeight: '500', 
                                                    color: 'var(--muted)', 
                                                    margin: 0, 
                                                    textTransform: 'uppercase', 
                                                    letterSpacing: '0.5px',
                                                    lineHeight: '1.4'
                                                }}>
                                                    {t('adminAdminUsers.users')}
                                                </h4>
                                            </div>
                                            <div className="permission-options" style={{ paddingLeft: '4px' }}>
                                                {availablePages
                                                    .filter(page => page.section === 'users' && page.page_path !== '/admin-admin-users')
                                                    .map(page => (
                                                        <label 
                                                            key={page.page_path}
                                                            className="permission-option"
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                padding: '8px 12px',
                                                                borderRadius: '6px',
                                                                cursor: 'pointer',
                                                                transition: 'background 0.15s ease',
                                                                marginBottom: '2px',
                                                                lineHeight: '1.4'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.background = 'var(--bg-secondary)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.background = 'transparent';
                                                            }}
                                                        >
                                                            <div style={{ 
                                                                marginRight: '10px',
                                                                position: 'relative',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}>
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={selectedPermissions.has(page.page_path)}
                                                                    onChange={() => handlePermissionToggle(page.page_path)}
                                                                    disabled={permissionSaving}
                                                                    style={{
                                                                        width: '18px',
                                                                        height: '18px',
                                                                        cursor: 'pointer',
                                                                        accentColor: 'var(--primary)',
                                                                        margin: 0,
                                                                        flexShrink: 0
                                                                    }}
                                                                    className="permission-checkbox"
                                                                />
                                                            </div>
                                                            <span style={{ 
                                                                fontSize: '14px', 
                                                                color: 'var(--text-primary)', 
                                                                fontWeight: '500',
                                                                lineHeight: '1.4'
                                                            }}>
                                                                {page.page_name}
                                                            </span>
                                                        </label>
                                                    ))}
                                            </div>
                                        </div>

                                        {/* Products Section */}
                                        <div className="permission-section" style={{ marginBottom: '20px' }}>
                                            <div className="permission-section-header" style={{ 
                                                padding: '8px 12px', 
                                                marginBottom: '8px'
                                            }}>
                                                <h4 style={{ 
                                                    fontSize: '12px', 
                                                    fontWeight: '500', 
                                                    color: 'var(--muted)', 
                                                    margin: 0, 
                                                    textTransform: 'uppercase', 
                                                    letterSpacing: '0.5px',
                                                    lineHeight: '1.4'
                                                }}>
                                                    {t('adminAdminUsers.products')}
                                                </h4>
                                            </div>
                                            <div className="permission-options" style={{ paddingLeft: '4px' }}>
                                                {availablePages
                                                    .filter(page => page.section === 'products')
                                                    .map(page => (
                                                        <label 
                                                            key={page.page_path}
                                                            className="permission-option"
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                padding: '8px 12px',
                                                                borderRadius: '6px',
                                                                cursor: 'pointer',
                                                                transition: 'background 0.15s ease',
                                                                marginBottom: '2px',
                                                                lineHeight: '1.4'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.background = 'var(--bg-secondary)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.background = 'transparent';
                                                            }}
                                                        >
                                                            <div style={{ 
                                                                marginRight: '10px',
                                                                position: 'relative',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}>
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={selectedPermissions.has(page.page_path)}
                                                                    onChange={() => handlePermissionToggle(page.page_path)}
                                                                    disabled={permissionSaving}
                                                                    style={{
                                                                        width: '18px',
                                                                        height: '18px',
                                                                        cursor: 'pointer',
                                                                        accentColor: 'var(--primary)',
                                                                        margin: 0,
                                                                        flexShrink: 0
                                                                    }}
                                                                    className="permission-checkbox"
                                                                />
                                                            </div>
                                                            <span style={{ 
                                                                fontSize: '14px', 
                                                                color: 'var(--text-primary)', 
                                                                fontWeight: '500',
                                                                lineHeight: '1.4'
                                                            }}>
                                                                {page.page_name}
                                                            </span>
                                                        </label>
                                                    ))}
                                            </div>
                                        </div>

                                        {/* Payment Section */}
                                        <div className="permission-section" style={{ marginBottom: '20px' }}>
                                            <div className="permission-section-header" style={{ 
                                                padding: '8px 12px', 
                                                marginBottom: '8px'
                                            }}>
                                                <h4 style={{ 
                                                    fontSize: '12px', 
                                                    fontWeight: '500', 
                                                    color: 'var(--muted)', 
                                                    margin: 0, 
                                                    textTransform: 'uppercase', 
                                                    letterSpacing: '0.5px',
                                                    lineHeight: '1.4'
                                                }}>
                                                    {t('adminAdminUsers.payment')}
                                                </h4>
                                            </div>
                                            <div className="permission-options" style={{ paddingLeft: '4px' }}>
                                                {availablePages
                                                    .filter(page => page.section === 'payment')
                                                    .map(page => (
                                                        <label 
                                                            key={page.page_path}
                                                            className="permission-option"
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                padding: '8px 12px',
                                                                borderRadius: '6px',
                                                                cursor: 'pointer',
                                                                transition: 'background 0.15s ease',
                                                                marginBottom: '2px',
                                                                lineHeight: '1.4'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.background = 'var(--bg-secondary)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.background = 'transparent';
                                                            }}
                                                        >
                                                            <div style={{ 
                                                                marginRight: '10px',
                                                                position: 'relative',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}>
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={selectedPermissions.has(page.page_path)}
                                                                    onChange={() => handlePermissionToggle(page.page_path)}
                                                                    disabled={permissionSaving}
                                                                    style={{
                                                                        width: '18px',
                                                                        height: '18px',
                                                                        cursor: 'pointer',
                                                                        accentColor: 'var(--primary)',
                                                                        margin: 0,
                                                                        flexShrink: 0
                                                                    }}
                                                                    className="permission-checkbox"
                                                                />
                                                            </div>
                                                            <span style={{ 
                                                                fontSize: '14px', 
                                                                color: 'var(--text-primary)', 
                                                                fontWeight: '500',
                                                                lineHeight: '1.4'
                                                            }}>
                                                                {page.page_name}
                                                            </span>
                                                        </label>
                                                    ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer" style={{ flexShrink: 0, borderTop: '1px solid var(--border)', padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                <button 
                                    className="btn-secondary"
                                    onClick={handlePermissionClose}
                                    disabled={permissionSaving}
                                >
                                    {t('common.cancel')}
                                </button>
                                <button 
                                    className="btn-primary"
                                    onClick={handlePermissionSave}
                                    disabled={permissionSaving || permissionLoading}
                                >
                                    {permissionSaving ? (
                                        <>
                                            <IconLoader className="animate-spin" style={{ marginRight: '8px' }} />
                                            {t('common.saving')}
                                        </>
                                    ) : (
                                        t('common.saveChanges')
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                        {/* Admin Detail Modal */}
                        {showAdminDetailModal && adminToView && adminToView.role !== 'user' && (
                            <AdminDetailModal
                                open={showAdminDetailModal}
                                onClose={() => {
                                    setShowAdminDetailModal(false);
                                    setAdminToView(null);
                                }}
                                admin={{
                                    id: adminToView.id,
                                    name: adminToView.name,
                                    email: adminToView.email,
                                    phone: (adminToView as any).phone,
                                    role: adminToView.role === 'admin' ? 'admin' : 'coworker',
                                    status: adminToView.status,
                                    created_at: adminToView.created_at
                                }}
                            />
                        )}

                        {/* Add Coworker Modal */}
                        {showAddCoworkerModal && (
                            <div className="modal-overlay" onClick={handleAddCoworkerCancel}>
                                <div className="modal-content add-admin-modal add-coworker-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
                                    <div className="modal-header" style={{ flexShrink: 0 }}>
                                        <h2>{t('adminAdminUsers.addCoworker')}</h2>
                                        <button 
                                            className="modal-close"
                                            onClick={handleAddCoworkerCancel}
                                            disabled={createCoworkerLoading}
                                        >
                                            <IconX />
                                        </button>
                                    </div>
                                    <form onSubmit={handleAddCoworkerSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                                        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                                            {createCoworkerError && (
                                                <div className="error-message" style={{ 
                                                    padding: '12px', 
                                                    background: '#fee2e2', 
                                                    color: '#dc2626', 
                                                    borderRadius: '8px', 
                                                    marginBottom: '20px',
                                                    fontSize: '14px'
                                                }}>
                                                    {createCoworkerError}
                                                </div>
                                            )}
                                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                                <label className="form-label">{t('users.name')} *</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={coworkerFormData.name}
                                                    onChange={(e) => {
                                                        // Auto-capitalize first letter of each word
                                                        const value = e.target.value;
                                                        const capitalized = value.split(' ').map(word => 
                                                            word.length > 0 
                                                                ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                                                                : ''
                                                        ).join(' ');
                                                        setCoworkerFormData({ ...coworkerFormData, name: capitalized });
                                                    }}
                                                    placeholder={t('adminAdminUsers.enterFullName')}
                                                    required
                                                    disabled={createCoworkerLoading}
                                                />
                                            </div>
                                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                                <label className="form-label">{t('users.email')} *</label>
                                                <input
                                                    type="email"
                                                    className="form-input"
                                                    value={coworkerFormData.email}
                                                    onChange={(e) => {
                                                        // Normalize email to lowercase to prevent capitalization issues
                                                        const normalizedEmail = e.target.value.toLowerCase();
                                                        setCoworkerFormData({ ...coworkerFormData, email: normalizedEmail });
                                                    }}
                                                    placeholder={t('adminAdminUsers.enterEmailAddress')}
                                                    required
                                                    disabled={createCoworkerLoading}
                                                    autoCapitalize="off"
                                                    autoCorrect="off"
                                                    autoComplete="email"
                                                    spellCheck="false"
                                                    inputMode="email"
                                                />
                                            </div>
                                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                                <label className="form-label">{t('adminAdminUsers.phoneNumber')} *</label>
                                                <input
                                                    type="tel"
                                                    className="form-input"
                                                    value={coworkerFormData.phone}
                                                    onChange={(e) => setCoworkerFormData({ ...coworkerFormData, phone: e.target.value })}
                                                    placeholder={t('adminAdminUsers.enterPhoneNumber')}
                                                    required
                                                    disabled={createCoworkerLoading}
                                                />
                                            </div>
                                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                                <label className="form-label">{t('settings.password')} *</label>
                                                <input
                                                    type="password"
                                                    className="form-input"
                                                    value={coworkerFormData.password}
                                                    onChange={(e) => setCoworkerFormData({ ...coworkerFormData, password: e.target.value })}
                                                    placeholder={t('adminAdminUsers.enterPassword')}
                                                    required
                                                    disabled={createCoworkerLoading}
                                                    minLength={6}
                                                />
                                            </div>
                                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                                <label className="form-label">{t('adminAdminUsers.confirmPassword')} *</label>
                                                <input
                                                    type="password"
                                                    className="form-input"
                                                    value={coworkerFormData.confirmPassword}
                                                    onChange={(e) => setCoworkerFormData({ ...coworkerFormData, confirmPassword: e.target.value })}
                                                    placeholder={t('adminAdminUsers.confirmPasswordPlaceholder')}
                                                    required
                                                    disabled={createCoworkerLoading}
                                                    minLength={6}
                                                />
                                            </div>
                                        </div>
                                        <div className="modal-footer" style={{ flexShrink: 0, borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: 'auto' }}>
                                            <button 
                                                type="button"
                                                className="btn-secondary"
                                                onClick={handleAddCoworkerCancel}
                                                disabled={createCoworkerLoading}
                                                style={{ marginRight: '12px' }}
                                            >
                                                {t('common.cancel')}
                                            </button>
                                            <button 
                                                type="submit"
                                                className="btn-primary"
                                                disabled={createCoworkerLoading}
                                            >
                                                {createCoworkerLoading ? (
                                                    <>
                                                        <IconLoader className="animate-spin" style={{ marginRight: '8px' }} />
                                                        {t('adminAdminUsers.creating')}
                                                    </>
                                                ) : (
                                                    t('adminAdminUsers.createCoworker')
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Coworker Detail Modal */}
                        {showCoworkerDetailModal && coworkerToView && coworkerToView.role === 'coworker' && (
                            <CoworkerDetailModal
                                open={showCoworkerDetailModal}
                                onClose={() => {
                                    setShowCoworkerDetailModal(false);
                                    setCoworkerToView(null);
                                }}
                                coworker={{
                                    id: coworkerToView.id,
                                    name: coworkerToView.name,
                                    email: coworkerToView.email,
                                    phone: (coworkerToView as any).phone,
                                    role: 'coworker' as const,
                                    status: coworkerToView.status,
                                    created_at: coworkerToView.created_at
                                }}
                                onStatusToggle={handleStatusToggle}
                                onEditPermissions={handlePermissionClick}
                            />
                        )}

                {/* Admin Delete Confirmation Modal */}
                {showAdminDeleteModal && adminToDelete && (
                    <div className="modal-overlay" onClick={handleAdminDeleteCancel}>
                        <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{t('adminAdminUsers.deleteAdministrator')}</h2>
                                <button 
                                    className="modal-close"
                                    onClick={handleAdminDeleteCancel}
                                    disabled={deleteAdminLoading}
                                >
                                    <IconX />
                                </button>
                            </div>
                            <div className="modal-body">
                                <p>{t('adminAdminUsers.confirmDeleteAdministrator').replace('{{name}}', adminToDelete.name)}</p>
                                <p className="warning-text">{t('adminAdminUsers.deleteAdminWarning')}</p>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    className="btn-secondary"
                                    onClick={handleAdminDeleteCancel}
                                    disabled={deleteAdminLoading}
                                >
                                    {t('common.cancel')}
                                </button>
                                <button 
                                    className="btn-danger"
                                    onClick={handleAdminDeleteConfirm}
                                    disabled={deleteAdminLoading}
                                >
                                    {deleteAdminLoading ? (
                                        <>
                                            <IconLoader className="animate-spin" style={{ marginRight: '8px' }} />
                                            Deleting...
                                        </>
                                    ) : (
                                        'Delete'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}