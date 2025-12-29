import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import ClientDetailModal from '../components/ClientDetailModal';
import { 
    IconEye, 
    IconTrash2, 
    IconSearch, 
    IconFilter, 
    IconPlus, 
    IconMoreVertical,
    IconList,
    IconGrid
} from '../components/icons';
import { getAvatarInitial, getAvatarColor } from '../../utils/avatarUtils';
import { useTranslation } from '../../shared/contexts/TranslationContext';

interface Client {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    birthday: string | null;
    location: string | null;
    description: string | null;
    order_count: number;
    completed_orders_count?: number;
    created_by: number | null;
    created_by_user: {
        id: number;
        name: string;
        refer_code: string;
        avatar?: string;
    } | null;
    created_at: string;
    updated_at: string;
    avatar?: string; // Avatar URL from database
}

export default function AdminClients() {
    const { t } = useTranslation();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
    const [isMobile, setIsMobile] = useState(false);

    const fetchClients = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch('/api/clients');
            if (!response.ok) {
                throw new Error('Failed to fetch clients');
            }
            const data = await response.json();
            
            // Fetch avatars for all clients and created_by_user
            const clientsWithAvatars = await Promise.all(
                (data || []).map(async (client: Client) => {
                    // Fetch client avatar (if client avatars exist in future)
                    let clientAvatar = null;
                    try {
                        // For now, clients might not have avatars, but we'll try
                        // If there's a client-avatars API in the future, use it here
                        // const avatarRes = await fetch(`/api/client-avatars?clientId=${client.id}`);
                        // if (avatarRes.ok) {
                        //     const avatarData = await avatarRes.json();
                        //     if (avatarData?.url) {
                        //         clientAvatar = avatarData.url;
                        //     }
                        // }
                    } catch (error) {
                        // Silently fail - clients might not have avatars yet
                    }
                    
                    // Fetch avatar for created_by_user
                    let createdByAvatar = null;
                    if (client.created_by_user?.id) {
                        try {
                            const avatarRes = await fetch(`/api/user-avatars?userId=${client.created_by_user.id}`);
                            if (avatarRes.ok) {
                                const avatarData = await avatarRes.json();
                                if (avatarData?.url) {
                                    createdByAvatar = avatarData.url;
                                }
                            }
                        } catch (error) {
                            console.warn(`Could not fetch avatar for user ${client.created_by_user.id}:`, error);
                        }
                    }
                    
                    return {
                        ...client,
                        avatar: clientAvatar,
                        created_by_user: client.created_by_user ? {
                            ...client.created_by_user,
                            avatar: createdByAvatar
                        } : null
                    };
                })
            );
            
            setClients(clientsWithAvatars);
        } catch (err) {
            console.error('Error fetching clients:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch clients');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client.phone && client.phone.includes(searchQuery)) ||
        (client.email && client.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (client.created_by_user && client.created_by_user.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleClientClick = (client: Client) => {
        setSelectedClient(client);
        setShowDetailModal(true);
    };

    const handleViewDetail = (client: Client, e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }
        setSelectedClient(client);
        setShowDetailModal(true);
    };

    const handleCloseDetail = () => {
        setShowDetailModal(false);
        setSelectedClient(null);
    };

    const handleDeleteClick = (client: Client, e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }
        setClientToDelete(client);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!clientToDelete) return;

        try {
            setDeleteLoading(true);
            const response = await fetch(`/api/clients?id=${clientToDelete.id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete client');
            }

            // Refresh clients list
            await fetchClients();
            setShowDeleteModal(false);
            setClientToDelete(null);
        } catch (err) {
            console.error('Error deleting client:', err);
            alert(t('adminClients.deleteFailed'));
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
        setClientToDelete(null);
    };

    const handleDropdownToggle = (clientId: number) => {
        setActiveDropdown(activeDropdown === clientId ? null : clientId);
    };

    const handleDropdownClose = () => {
        setActiveDropdown(null);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return t('common.notAvailable');
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
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

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (activeDropdown !== null) {
                const target = event.target as HTMLElement;
                if (!target.closest('.unified-dropdown')) {
                    setActiveDropdown(null);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeDropdown]);

    return (
        <AdminLayout title={t('adminClients.title')}>
            <div className="admin-clients-page">
                {/* Clean Toolbar */}
                <div className="categories-toolbar">
                    <div className="toolbar-left">
                        <div className="search-container">
                            <IconSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder={t('adminClients.searchPlaceholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input"
                            />
                        </div>
                        <button className="btn-filter" title={t('adminClients.filter')}>
                            <IconFilter />
                        </button>
                    </div>
                    <div className="toolbar-right">
                        {/* Desktop view toggle */}
                        <div className="view-toggle desktop-only">
                            <button
                                className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                                onClick={() => !isMobile && setViewMode('table')}
                                title={t('adminClients.tableView')}
                                disabled={isMobile}
                            >
                                <IconList />
                            </button>
                            <button
                                className={`view-btn ${viewMode === 'card' ? 'active' : ''}`}
                                onClick={() => setViewMode('card')}
                                title={t('adminClients.cardView')}
                            >
                                <IconGrid />
                            </button>
                        </div>
                        
                        {/* Mobile column selector - hidden on clients since it's not needed */}
                        <div className="mobile-column-selector mobile-only" style={{ display: 'none' }}>
                        </div>
                        
                        <button 
                            className="create-btn"
                            title={t('adminClients.createClient')}
                        >
                            <IconPlus />
                            <span className="desktop-only">{t('adminClients.createClient')}</span>
                        </button>
                    </div>
                </div>

                {/* Table View */}
                {viewMode === 'table' && !isMobile ? (
                    <div className="clients-table-container">
                    <div className="table-wrap">
                        <table className="clients-table">
                            <thead>
                                <tr>
                                    <th>{t('adminClients.name')}</th>
                                    <th>{t('adminClients.phone')}</th>
                                    <th>{t('adminClients.ordersMade')}</th>
                                    <th>{t('adminClients.madeBy')}</th>
                                    <th>{t('adminClients.createDate')}</th>
                                    <th>{t('adminClients.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                                <div className="loading-spinner"></div>
                                                <p style={{ color: 'var(--muted)', margin: 0 }}>{t('adminClients.loading')}</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : error ? (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--error)' }}>
                                            {error}
                                        </td>
                                    </tr>
                                ) : filteredClients.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                                            {t('adminClients.noClientsFound')}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredClients.map((client) => (
                                        <tr 
                                            key={client.id} 
                                            className="client-row-clickable"
                                            onClick={() => handleClientClick(client)}
                                        >
                                            <td>
                                                <div className="client-name-with-avatar">
                                                    {client.avatar ? (
                                                        <img 
                                                            src={client.avatar} 
                                                            alt={client.name}
                                                            className="client-avatar-img"
                                                            onError={(e) => {
                                                                // Fallback to letter avatar if image fails to load
                                                                const target = e.target as HTMLImageElement;
                                                                target.style.display = 'none';
                                                                const fallback = target.nextElementSibling as HTMLElement;
                                                                if (fallback) fallback.style.display = 'flex';
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div 
                                                        className="client-avatar-letter"
                                                        style={{
                                                            display: client.avatar ? 'none' : 'flex',
                                                            backgroundColor: getAvatarColor(client.name)
                                                        }}
                                                    >
                                                        {getAvatarInitial(client.name)}
                                                    </div>
                                                    <span className="client-name">{client.name}</span>
                                                </div>
                                            </td>
                                            <td>{client.phone || t('common.notAvailable')}</td>
                                            <td>
                                                <span className="orders-badge">{client.completed_orders_count || 0}</span>
                                            </td>
                                            <td>
                                                <div className="made-by">
                                                    {client.created_by_user ? (
                                                        <>
                                                            {client.created_by_user.avatar ? (
                                                                <img 
                                                                    src={client.created_by_user.avatar} 
                                                                    alt={client.created_by_user.name}
                                                                    className="creator-avatar-img"
                                                                    onError={(e) => {
                                                                        const target = e.target as HTMLImageElement;
                                                                        target.style.display = 'none';
                                                                        const fallback = target.nextElementSibling as HTMLElement;
                                                                        if (fallback) fallback.style.display = 'flex';
                                                                    }}
                                                                />
                                                            ) : null}
                                                            <div 
                                                                className="creator-avatar"
                                                                style={{
                                                                    display: client.created_by_user.avatar ? 'none' : 'flex',
                                                                    backgroundColor: getAvatarColor(client.created_by_user.name)
                                                                }}
                                                            >
                                                                {getAvatarInitial(client.created_by_user.name)}
                                                            </div>
                                                            <span>{client.created_by_user.name}</span>
                                                        </>
                                                    ) : (
                                                        <span>{t('common.notAvailable')}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>{formatDate(client.created_at)}</td>
                                            <td>
                                                <div 
                                                    className={`unified-dropdown ${activeDropdown === client.id ? 'active' : ''}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <button 
                                                        className="unified-more-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDropdownToggle(client.id);
                                                        }}
                                                        title={t('adminClients.moreActions')}
                                                    >
                                                        <IconMoreVertical />
                                                    </button>
                                                    {activeDropdown === client.id && (
                                                        <div className="unified-dropdown-menu">
                                                            <button 
                                                                className="unified-dropdown-item"
                                                                onClick={(e) => {
                                                                    handleViewDetail(client, e);
                                                                    handleDropdownClose();
                                                                }}
                                                            >
                                                                <IconEye />
                                                                {t('adminClients.viewDetails')}
                                                            </button>
                                                            <button 
                                                                className="unified-dropdown-item danger"
                                                                onClick={(e) => {
                                                                    handleDeleteClick(client, e);
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
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                ) : (
                    /* Card View */
                    <div className="clients-grid clients-grid-2">
                        {loading ? (
                            <div className="empty-state">
                                <div className="loading-spinner"></div>
                                <p>{t('adminClients.loading')}</p>
                            </div>
                        ) : error ? (
                            <div className="empty-state">
                                <p style={{ color: 'var(--error)' }}>{error}</p>
                            </div>
                        ) : filteredClients.length === 0 ? (
                            <div className="empty-state">
                                <p>{t('adminClients.noClientsFound')}</p>
                            </div>
                        ) : (
                            filteredClients.map((client) => (
                                <div 
                                    key={client.id} 
                                    className="client-card client-card-clickable"
                                    onClick={() => handleClientClick(client)}
                                >
                                    <div className="card-header">
                                        {client.avatar ? (
                                            <img 
                                                src={client.avatar} 
                                                alt={client.name}
                                                className="client-avatar-img-card"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                    const fallback = target.nextElementSibling as HTMLElement;
                                                    if (fallback) fallback.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div 
                                            className="client-avatar"
                                            style={{
                                                display: client.avatar ? 'none' : 'flex',
                                                backgroundColor: getAvatarColor(client.name)
                                            }}
                                        >
                                            {getAvatarInitial(client.name)}
                                        </div>
                                        <div className="card-info">
                                            <h3>{client.name}</h3>
                                            <p className="client-phone">{client.phone || t('common.notAvailable')}</p>
                                        </div>
                                        <div className="card-meta">
                                            <span className="orders-badge">{client.order_count} {t('adminClients.orders')}</span>
                                            <span className="created-date">{formatDate(client.created_at)}</span>
                                        </div>
                                        <div 
                                            className="unified-dropdown"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                className="unified-more-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDropdownToggle(client.id);
                                                }}
                                            >
                                                <IconMoreVertical />
                                            </button>
                                            {activeDropdown === client.id && (
                                                <div className="unified-dropdown-menu">
                                                    <button 
                                                        className="unified-dropdown-item"
                                                        onClick={(e) => {
                                                            handleViewDetail(client, e);
                                                            handleDropdownClose();
                                                        }}
                                                    >
                                                        <IconEye />
                                                        View Details
                                                    </button>
                                                    <button 
                                                        className="unified-dropdown-item danger"
                                                        onClick={(e) => {
                                                            handleDeleteClick(client, e);
                                                            handleDropdownClose();
                                                        }}
                                                    >
                                                        <IconTrash2 />
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="card-body">
                                        <div className="card-detail">
                                            <span className="detail-label">{t('adminClients.madeBy')}:</span>
                                            <div className="made-by-compact">
                                                {client.created_by_user ? (
                                                    <>
                                                        {client.created_by_user.avatar ? (
                                                            <img 
                                                                src={client.created_by_user.avatar} 
                                                                alt={client.created_by_user.name}
                                                                className="creator-avatar-img-small"
                                                                onError={(e) => {
                                                                    const target = e.target as HTMLImageElement;
                                                                    target.style.display = 'none';
                                                                    const fallback = target.nextElementSibling as HTMLElement;
                                                                    if (fallback) fallback.style.display = 'flex';
                                                                }}
                                                            />
                                                        ) : null}
                                                        <div 
                                                            className="creator-avatar-small"
                                                            style={{
                                                                display: client.created_by_user.avatar ? 'none' : 'flex',
                                                                backgroundColor: getAvatarColor(client.created_by_user.name)
                                                            }}
                                                        >
                                                            {getAvatarInitial(client.created_by_user.name)}
                                                        </div>
                                                        <span className="detail-value">{client.created_by_user.name}</span>
                                                    </>
                                                ) : (
                                                    <span className="detail-value">{t('common.notAvailable')}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Empty State */}
                {viewMode === 'table' && filteredClients.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-icon">👥</div>
                        <h3>{t('adminClients.noClientsFound')}</h3>
                        <p>{t('adminClients.tryAdjustingSearch')}</p>
                    </div>
                )}

                {/* Client Detail Modal */}
                <ClientDetailModal
                    open={showDetailModal}
                    onClose={handleCloseDetail}
                    client={selectedClient}
                />

                {/* Delete Confirmation Modal */}
                {showDeleteModal && clientToDelete && (
                    <div className="modal-overlay" onClick={handleDeleteCancel}>
                        <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{t('adminClients.deleteClient')}</h2>
                                <button 
                                    className="modal-close"
                                    onClick={handleDeleteCancel}
                                >
                                    ×
                                </button>
                            </div>
                            <div className="modal-body">
                                <p>{t('adminClients.confirmDelete').replace('{{name}}', clientToDelete.name)}</p>
                                <p className="warning-text">{t('adminClients.actionCannotBeUndone')}</p>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    className="btn-secondary"
                                    onClick={handleDeleteCancel}
                                >
                                    {t('common.cancel')}
                                </button>
                                <button 
                                    className="btn-danger"
                                    onClick={handleDeleteConfirm}
                                    disabled={deleteLoading}
                                >
                                    {deleteLoading ? t('common.deleting') : t('common.delete')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}