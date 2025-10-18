import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { IconEye, IconTrash2, IconSearch, IconFilter, IconPlus, IconMoreHorizontal } from '../components/icons';

interface Client {
    id: number;
    name: string;
    phone: string;
    ordersMade: number;
    madeBy: string;
    createDate: string;
}

export default function AdminClients() {
    const [clients, setClients] = useState<Client[]>([
        {
            id: 1,
            name: 'John Smith',
            phone: '+1 (555) 123-4567',
            ordersMade: 5,
            madeBy: 'Alice Johnson',
            createDate: '2024-01-15'
        },
        {
            id: 2,
            name: 'Sarah Wilson',
            phone: '+1 (555) 987-6543',
            ordersMade: 12,
            madeBy: 'Bob Brown',
            createDate: '2024-01-20'
        },
        {
            id: 3,
            name: 'Michael Davis',
            phone: '+1 (555) 456-7890',
            ordersMade: 3,
            madeBy: 'Alice Johnson',
            createDate: '2024-02-01'
        },
        {
            id: 4,
            name: 'Emily Chen',
            phone: '+1 (555) 321-0987',
            ordersMade: 8,
            madeBy: 'Charlie Wilson',
            createDate: '2024-02-10'
        },
        {
            id: 5,
            name: 'David Rodriguez',
            phone: '+1 (555) 654-3210',
            ordersMade: 15,
            madeBy: 'Bob Brown',
            createDate: '2024-02-15'
        }
    ]);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
    const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.phone.includes(searchQuery) ||
        client.madeBy.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleViewDetail = (client: Client) => {
        setSelectedClient(client);
    };

    const handleDeleteClick = (client: Client) => {
        setClientToDelete(client);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = () => {
        if (clientToDelete) {
            setClients(clients.filter(client => client.id !== clientToDelete.id));
            setShowDeleteModal(false);
            setClientToDelete(null);
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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (activeDropdown !== null) {
                const target = event.target as HTMLElement;
                if (!target.closest('.action-dropdown')) {
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
                {/* Header */}
                <div className="clients-header">
                    <div className="clients-header-info">
                        <h1>Client Management</h1>
                        <p>Manage and view all client information</p>
                    </div>
                    <button className="btn-create-client" title="Add New Client">
                        <IconPlus />
                        Add Client
                    </button>
                </div>

                {/* Search and Filter Bar */}
                <div className="clients-toolbar">
                    <div className="search-box">
                        <IconSearch />
                        <input
                            type="text"
                            placeholder="Search clients by name, phone, or creator..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="filter-controls">
                        <button className="filter-btn">
                            <IconFilter />
                            Filter
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="clients-stats">
                    <div className="stat-card">
                        <div className="stat-value">{clients.length}</div>
                        <div className="stat-label">Total Clients</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{clients.reduce((sum, client) => sum + client.ordersMade, 0)}</div>
                        <div className="stat-label">Total Orders</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{new Set(clients.map(client => client.madeBy)).size}</div>
                        <div className="stat-label">Active Creators</div>
                    </div>
                </div>

                {/* Clients Table */}
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
                                {filteredClients.map((client) => (
                                    <tr key={client.id}>
                                        <td>
                                            <span className="client-name">{client.name}</span>
                                        </td>
                                        <td>{client.phone}</td>
                                        <td>
                                            <span className="orders-badge">{client.ordersMade}</span>
                                        </td>
                                        <td>
                                            <div className="made-by">
                                                <div className="creator-avatar">
                                                    {client.madeBy.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                </div>
                                                <span>{client.madeBy}</span>
                                            </div>
                                        </td>
                                        <td>{formatDate(client.createDate)}</td>
                                        <td>
                                            <div className="action-dropdown">
                                                <button 
                                                    className="btn-more"
                                                    onClick={() => handleDropdownToggle(client.id)}
                                                    title="More Actions"
                                                >
                                                    <IconMoreHorizontal />
                                                </button>
                                                {activeDropdown === client.id && (
                                                    <div className="dropdown-menu">
                                                        <button 
                                                            className="dropdown-item"
                                                            onClick={() => {
                                                                handleViewDetail(client);
                                                                handleDropdownClose();
                                                            }}
                                                        >
                                                            <IconEye />
                                                            View Details
                                                        </button>
                                                        <button 
                                                            className="dropdown-item delete"
                                                            onClick={() => {
                                                                handleDeleteClick(client);
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
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Empty State */}
                {filteredClients.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-icon">👥</div>
                        <h3>No clients found</h3>
                        <p>Try adjusting your search criteria or add a new client.</p>
                    </div>
                )}

                {/* Client Detail Modal */}
                {selectedClient && (
                    <div className="modal-overlay" onClick={() => setSelectedClient(null)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Client Details</h2>
                                <button 
                                    className="modal-close"
                                    onClick={() => setSelectedClient(null)}
                                >
                                    ×
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="client-detail-info">
                                    <div className="detail-row">
                                        <label>Name:</label>
                                        <span>{selectedClient.name}</span>
                                    </div>
                                    <div className="detail-row">
                                        <label>Phone:</label>
                                        <span>{selectedClient.phone}</span>
                                    </div>
                                    <div className="detail-row">
                                        <label>Orders Made:</label>
                                        <span className="orders-badge">{selectedClient.ordersMade}</span>
                                    </div>
                                    <div className="detail-row">
                                        <label>Created By:</label>
                                        <span>{selectedClient.madeBy}</span>
                                    </div>
                                    <div className="detail-row">
                                        <label>Create Date:</label>
                                        <span>{formatDate(selectedClient.createDate)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    className="btn-secondary"
                                    onClick={() => setSelectedClient(null)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}