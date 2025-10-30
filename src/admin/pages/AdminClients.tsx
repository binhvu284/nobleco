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

interface Client {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    birthday: string | null;
    location: string | null;
    description: string | null;
    order_count: number;
    created_by: number | null;
    created_by_user: {
        id: number;
        name: string;
        refer_code: string;
    } | null;
    created_at: string;
    updated_at: string;
}

export default function AdminClients() {
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
            setClients(data || []);
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
            alert('Failed to delete client. Please try again.');
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
        if (!dateString) return 'N/A';
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
        <AdminLayout title="Client Management">
            <div className="admin-clients-page">
                {/* Clean Toolbar */}
                <div className="categories-toolbar">
                    <div className="toolbar-left">
                        <div className="search-container">
                            <IconSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search clients..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input"
                            />
                        </div>
                        <button className="btn-filter" title="Filter">
                            <IconFilter />
                        </button>
                    </div>
                    <div className="toolbar-right">
                        {/* Desktop view toggle */}
                        <div className="view-toggle desktop-only">
                            <button
                                className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                                onClick={() => !isMobile && setViewMode('table')}
                                title="Table view"
                                disabled={isMobile}
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
                        
                        {/* Mobile column selector - hidden on clients since it's not needed */}
                        <div className="mobile-column-selector mobile-only" style={{ display: 'none' }}>
                        </div>
                        
                        <button 
                            className="create-btn"
                            title="Create Client"
                        >
                            <IconPlus />
                            <span className="desktop-only">Create Client</span>
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
                                    <th>Name</th>
                                    <th>Phone</th>
                                    <th>Orders Made</th>
                                    <th>Made By</th>
                                    <th>Create Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                                            Loading clients...
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
                                            No clients found
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
                                                <span className="client-name">{client.name}</span>
                                            </td>
                                            <td>{client.phone || 'N/A'}</td>
                                            <td>
                                                <span className="orders-badge">{client.order_count}</span>
                                            </td>
                                            <td>
                                                <div className="made-by">
                                                    {client.created_by_user ? (
                                                        <>
                                                            <div className="creator-avatar">
                                                                {client.created_by_user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                            </div>
                                                            <span>{client.created_by_user.name}</span>
                                                        </>
                                                    ) : (
                                                        <span>N/A</span>
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
                                                        title="More Actions"
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
                                <p>Loading clients...</p>
                            </div>
                        ) : error ? (
                            <div className="empty-state">
                                <p style={{ color: 'var(--error)' }}>{error}</p>
                            </div>
                        ) : filteredClients.length === 0 ? (
                            <div className="empty-state">
                                <p>No clients found</p>
                            </div>
                        ) : (
                            filteredClients.map((client) => (
                                <div 
                                    key={client.id} 
                                    className="client-card client-card-clickable"
                                    onClick={() => handleClientClick(client)}
                                >
                                    <div className="card-header">
                                        <div className="client-avatar">
                                            {client.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                        </div>
                                        <div className="card-info">
                                            <h3>{client.name}</h3>
                                            <p className="client-phone">{client.phone || 'N/A'}</p>
                                        </div>
                                        <div className="card-meta">
                                            <span className="orders-badge">{client.order_count} orders</span>
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
                                            <span className="detail-label">Made By:</span>
                                            <div className="made-by-compact">
                                                {client.created_by_user ? (
                                                    <>
                                                        <div className="creator-avatar-small">
                                                            {client.created_by_user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                        </div>
                                                        <span className="detail-value">{client.created_by_user.name}</span>
                                                    </>
                                                ) : (
                                                    <span className="detail-value">N/A</span>
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
                        <h3>No clients found</h3>
                        <p>Try adjusting your search criteria or add a new client.</p>
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
                                <h2>Delete Client</h2>
                                <button 
                                    className="modal-close"
                                    onClick={handleDeleteCancel}
                                >
                                    ×
                                </button>
                            </div>
                            <div className="modal-body">
                                <p>Are you sure you want to delete <strong>{clientToDelete.name}</strong>?</p>
                                <p className="warning-text">This action cannot be undone.</p>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    className="btn-secondary"
                                    onClick={handleDeleteCancel}
                                >
                                    Cancel
                                </button>
                                <button 
                                    className="btn-danger"
                                    onClick={handleDeleteConfirm}
                                    disabled={deleteLoading}
                                >
                                    {deleteLoading ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}