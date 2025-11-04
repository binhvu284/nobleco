import { useState, useEffect } from 'react';
import UserLayout from '../components/UserLayout';
import { getCurrentUser } from '../../auth';

type Client = {
    id: number;
    name: string;
    phone: string;
    email?: string;
    gender?: 'Male' | 'Female' | 'Other';
    birthday?: string;
    location?: string;
    description?: string;
    created_at?: string;
    createdAt?: string;
};

// Country list for location dropdown
const COUNTRIES = [
    'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Australia', 'Austria', 'Bangladesh',
    'Belgium', 'Brazil', 'Canada', 'Chile', 'China', 'Colombia', 'Czech Republic', 'Denmark',
    'Egypt', 'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'India', 'Indonesia',
    'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Japan', 'Kenya', 'Malaysia', 'Mexico',
    'Netherlands', 'New Zealand', 'Nigeria', 'Norway', 'Pakistan', 'Philippines', 'Poland',
    'Portugal', 'Romania', 'Russia', 'Saudi Arabia', 'Singapore', 'South Africa', 'South Korea',
    'Spain', 'Sweden', 'Switzerland', 'Thailand', 'Turkey', 'Ukraine', 'United Arab Emirates',
    'United Kingdom', 'United States', 'Vietnam', 'Other'
];

export default function UserClient() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewClient, setViewClient] = useState<Client | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Form states
    const [formData, setFormData] = useState<Partial<Client>>({
        name: '',
        phone: '',
        email: '',
        gender: undefined,
        birthday: '',
        location: '',
        description: ''
    });

    // Load clients from API
    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        try {
            setLoading(true);
            const currentUser = getCurrentUser();
            
            if (!currentUser?.id) {
                console.error('User not authenticated');
                setClients([]);
                return;
            }

            // Fetch only clients created by the current user
            // Ensure user ID is properly converted to number
            const userId = typeof currentUser.id === 'string' ? parseInt(currentUser.id, 10) : currentUser.id;
            const response = await fetch(`/api/clients?userId=${userId}`);
            if (response.ok) {
                const data = await response.json();
                setClients(data || []);
            } else {
                console.error('Failed to load clients');
                setClients([]);
            }
        } catch (error) {
            console.error('Error loading clients:', error);
            setClients([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.location?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreateClient = () => {
        setFormData({
            name: '',
            phone: '',
            email: '',
            gender: undefined,
            birthday: '',
            location: '',
            description: ''
        });
        setViewClient(null);
        setShowModal(true);
    };

    const handleViewClient = (client: Client) => {
        setViewClient(client);
        setShowViewModal(true);
        setMenuOpenId(null);
    };

    const handleEditFromView = () => {
        if (viewClient) {
            setFormData({
                ...viewClient,
                birthday: viewClient.birthday ? viewClient.birthday.split('T')[0] : '' // Format date for input
            });
            setShowViewModal(false);
            setShowModal(true);
        }
    };

    const handleEditClient = (client: Client) => {
        setViewClient(client);
        setFormData({
            ...client,
            birthday: client.birthday ? client.birthday.split('T')[0] : '' // Format date for input
        });
        setShowViewModal(false);
        setShowModal(true);
        setMenuOpenId(null);
    };

    const handleDeleteClick = (client: Client) => {
        setClientToDelete(client);
        setShowDeleteConfirm(true);
        setMenuOpenId(null);
    };

    const handleDeleteCancel = () => {
        setShowDeleteConfirm(false);
        setClientToDelete(null);
    };

    const handleDeleteConfirm = async () => {
        if (!clientToDelete) return;

        try {
            setDeleteLoading(true);
            const currentUser = getCurrentUser();
            const userId = typeof currentUser?.id === 'string' ? parseInt(currentUser.id, 10) : currentUser?.id;
            const response = await fetch(`/api/clients?id=${clientToDelete.id}&userId=${userId}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                await loadClients();
                setShowDeleteConfirm(false);
                setClientToDelete(null);
            } else {
                const error = await response.json().catch(() => ({ error: 'Failed to delete client' }));
                alert(error.error || 'Failed to delete client');
            }
        } catch (error) {
            console.error('Error deleting client:', error);
            alert('Failed to delete client');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const currentUser = getCurrentUser();
        if (!currentUser?.id) {
            alert('User not authenticated');
            return;
        }

        try {
            const clientData = {
                name: formData.name!,
                phone: formData.phone || null,
                email: formData.email || null,
                birthday: formData.birthday || null,
                location: formData.location || null,
                description: formData.description || null
            };

            if (viewClient) {
                // Update existing client
                const userId = typeof currentUser.id === 'string' ? parseInt(currentUser.id, 10) : currentUser.id;
                const response = await fetch(`/api/clients?id=${viewClient.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        clientData,
                        userId: userId
                    })
                });

                if (response.ok) {
                    await loadClients();
                    setShowModal(false);
                } else {
                    const error = await response.json();
                    alert(error.error || 'Failed to update client');
                }
            } else {
                // Create new client
                const userId = typeof currentUser.id === 'string' ? parseInt(currentUser.id, 10) : currentUser.id;
                const response = await fetch('/api/clients', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        client: clientData,
                        userId: userId
                    })
                });

                if (response.ok) {
                    await loadClients();
                    setShowModal(false);
                } else {
                    const error = await response.json();
                    alert(error.error || 'Failed to create client');
                }
            }
        } catch (error) {
            console.error('Error saving client:', error);
            alert('Failed to save client');
        }

        setFormData({
            name: '',
            phone: '',
            email: '',
            gender: undefined,
            birthday: '',
            location: '',
            description: ''
        });
    };

    const getAvatarColor = (name: string) => {
        const colors = [
            '#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe',
            '#43e97b', '#fa709a', '#fee140', '#30cfd0', '#a8edea',
            '#fed6e3', '#ffecd2', '#fcb69f', '#ff9a9e', '#fecfef'
        ];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    };

    const getGenderIcon = (gender?: string) => {
        if (gender === 'Male') {
            return (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="10" cy="14" r="6"/>
                    <line x1="14.5" y1="9.5" x2="20" y2="4"/>
                    <polyline points="15 4 20 4 20 9"/>
                </svg>
            );
        } else if (gender === 'Female') {
            return (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="9" r="6"/>
                    <line x1="12" y1="15" x2="12" y2="21"/>
                    <line x1="9" y1="18" x2="15" y2="18"/>
                </svg>
            );
        }
        return (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
            </svg>
        );
    };

    return (
        <UserLayout title="Clients">
            <div className="client-page">
                {/* Toolbar */}
                <div className="client-toolbar">
                    <div className="toolbar-left">
                        <div className="search-container">
                            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8"/>
                                <path d="m21 21-4.35-4.35"/>
                            </svg>
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search clients by name, phone, or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button className="btn-filter" title="Filter clients">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                            </svg>
                        </button>
                    </div>
                    <div className="toolbar-right">
                        <button className="btn-create-client" onClick={handleCreateClient}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            Add New Client
                        </button>
                    </div>
                </div>

                {/* Clients Grid */}
                {loading ? (
                    <div className="empty-state">
                        <div className="loading-spinner"></div>
                        <p>Loading clients...</p>
                    </div>
                ) : filteredClients.length === 0 ? (
                    <div className="empty-state">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        <h3>{searchQuery ? 'No clients found' : 'No clients yet'}</h3>
                        <p>{searchQuery ? 'Try adjusting your search criteria' : 'Start by adding your first client'}</p>
                        {!searchQuery && (
                            <button className="btn-primary" onClick={handleCreateClient}>
                                Add Your First Client
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="client-grid">
                        {filteredClients.map((client) => (
                            <div 
                                key={client.id} 
                                className="client-card"
                                onClick={() => handleViewClient(client)}
                            >
                                <div className="client-card-header">
                                    <div className="client-avatar">
                                        {client.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="client-card-info">
                                        <h3>{client.name}</h3>
                                        <p className="client-phone">{client.phone}</p>
                                    </div>
                                    <div className="client-actions">
                                        <button
                                            className="more-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setMenuOpenId(menuOpenId === client.id ? null : client.id);
                                            }}
                                        >
                                            ⋯
                                        </button>
                                        {menuOpenId === client.id && (
                                            <div className="menu" onClick={(e) => e.stopPropagation()}>
                                                <button 
                                                    className="menu-item"
                                                    onClick={() => handleViewClient(client)}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                                        <circle cx="12" cy="12" r="3"/>
                                                    </svg>
                                                    View Details
                                                </button>
                                                <button 
                                                    className="menu-item"
                                                    onClick={() => handleEditClient(client)}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                                    </svg>
                                                    Edit
                                                </button>
                                                <button 
                                                    className="menu-item danger"
                                                    onClick={() => handleDeleteClick(client)}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/>
                                                    </svg>
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="client-card-body">
                                    {client.email && (
                                        <div className="client-detail">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                                <polyline points="22,6 12,13 2,6"/>
                                            </svg>
                                            <span>{client.email}</span>
                                        </div>
                                    )}
                                    {client.gender && (
                                        <div className="client-detail">
                                            {getGenderIcon(client.gender)}
                                            <span>{client.gender}</span>
                                        </div>
                                    )}
                                    {client.birthday && (
                                        <div className="client-detail">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                                <line x1="16" y1="2" x2="16" y2="6"/>
                                                <line x1="8" y1="2" x2="8" y2="6"/>
                                                <line x1="3" y1="10" x2="21" y2="10"/>
                                            </svg>
                                            <span>{new Date(client.birthday).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}</span>
                                        </div>
                                    )}
                                    {client.location && (
                                        <div className="client-detail">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                                <circle cx="12" cy="10" r="3"/>
                                            </svg>
                                            <span>{client.location}</span>
                                        </div>
                                    )}
                                    {client.description && (
                                        <div className="client-description">
                                            <p>{client.description}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="client-card-footer">
                                    <span className="client-date">
                                        Added: {client.created_at ? new Date(client.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        }) : client.createdAt || 'N/A'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* View Client Detail Modal */}
                {showViewModal && viewClient && (
                    <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
                        <div className="modal-card client-view-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Client Details</h2>
                                <button className="modal-close" onClick={() => setShowViewModal(false)}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18"/>
                                        <line x1="6" y1="6" x2="18" y2="18"/>
                                    </svg>
                                </button>
                            </div>

                            <div className="client-view-content">
                                {/* Client Header */}
                                <div className="client-view-header">
                                    <div 
                                        className="client-view-avatar"
                                        style={{ backgroundColor: getAvatarColor(viewClient.name) }}
                                    >
                                        {viewClient.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="client-view-name-section">
                                        <h1>{viewClient.name}</h1>
                                        {viewClient.phone && <p className="client-view-phone">{viewClient.phone}</p>}
                                    </div>
                                </div>

                                {/* Contact Information */}
                                <div className="client-view-section">
                                    <h3 className="client-view-section-title">Contact Information</h3>
                                    <div className="client-view-grid">
                                        {viewClient.email && (
                                            <div className="client-view-item">
                                                <div className="client-view-label">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                                        <polyline points="22,6 12,13 2,6"/>
                                                    </svg>
                                                    Email
                                                </div>
                                                <div className="client-view-value">{viewClient.email}</div>
                                            </div>
                                        )}
                                        {viewClient.phone && (
                                            <div className="client-view-item">
                                                <div className="client-view-label">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                                                    </svg>
                                                    Phone
                                                </div>
                                                <div className="client-view-value">{viewClient.phone}</div>
                                            </div>
                                        )}
                                        {viewClient.gender && (
                                            <div className="client-view-item">
                                                <div className="client-view-label">
                                                    {getGenderIcon(viewClient.gender)}
                                                    Gender
                                                </div>
                                                <div className="client-view-value">{viewClient.gender}</div>
                                            </div>
                                        )}
                                        {viewClient.birthday && (
                                            <div className="client-view-item">
                                                <div className="client-view-label">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                                        <line x1="16" y1="2" x2="16" y2="6"/>
                                                        <line x1="8" y1="2" x2="8" y2="6"/>
                                                        <line x1="3" y1="10" x2="21" y2="10"/>
                                                    </svg>
                                                    Birthday
                                                </div>
                                                <div className="client-view-value">
                                                    {new Date(viewClient.birthday).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                    {(() => {
                                                        const today = new Date();
                                                        const birthDate = new Date(viewClient.birthday!);
                                                        let age = today.getFullYear() - birthDate.getFullYear();
                                                        const monthDiff = today.getMonth() - birthDate.getMonth();
                                                        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                                                            age--;
                                                        }
                                                        return age !== null ? ` (${age} years old)` : '';
                                                    })()}
                                                </div>
                                            </div>
                                        )}
                                        {viewClient.location && (
                                            <div className="client-view-item">
                                                <div className="client-view-label">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                                        <circle cx="12" cy="10" r="3"/>
                                                    </svg>
                                                    Location
                                                </div>
                                                <div className="client-view-value">{viewClient.location}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Notes */}
                                {viewClient.description && (
                                    <div className="client-view-section">
                                        <h3 className="client-view-section-title">Notes</h3>
                                        <div className="client-view-notes">
                                            <p>{viewClient.description}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Created Date */}
                                <div className="client-view-section">
                                    <div className="client-view-meta">
                                        <span className="client-view-meta-label">Added:</span>
                                        <span className="client-view-meta-value">
                                            {viewClient.created_at ? new Date(viewClient.created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            }) : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="client-view-actions">
                                <button 
                                    type="button" 
                                    className="btn-secondary" 
                                    onClick={() => setShowViewModal(false)}
                                >
                                    Close
                                </button>
                                <button 
                                    type="button" 
                                    className="btn-primary" 
                                    onClick={handleEditFromView}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                    </svg>
                                    Edit Client
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Client Edit/Create Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal-card client-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{viewClient ? 'Edit Client' : 'Add New Client'}</h2>
                                <button className="modal-close" onClick={() => setShowModal(false)}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18"/>
                                        <line x1="6" y1="6" x2="18" y2="18"/>
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="client-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>
                                            Name <span className="required">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Enter client name"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>
                                            Phone <span className="required">*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="Enter phone number"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            value={formData.email || ''}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="Enter email address"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Location</label>
                                        <select
                                            value={formData.location || ''}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        >
                                            <option value="">Select country</option>
                                            {COUNTRIES.map(country => (
                                                <option key={country} value={country}>{country}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Gender</label>
                                        <select
                                            value={formData.gender || ''}
                                            onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'Male' | 'Female' | 'Other' || undefined })}
                                        >
                                            <option value="">Select gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Birthday</label>
                                        <input
                                            type="date"
                                            value={formData.birthday || ''}
                                            onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                                            max={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Note</label>
                                    <textarea
                                        rows={3}
                                        value={formData.description || ''}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Add any notes about this client (preferences, interests, etc.)"
                                    />
                                </div>

                                <div className="modal-actions">
                                    <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary">
                                        {viewClient ? 'Save Changes' : 'Create Client'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <>
                        <div className="confirm-modal-overlay" onClick={handleDeleteCancel}></div>
                        <div className="confirm-modal">
                            <div className="confirm-modal-header">
                                <div className="confirm-modal-icon danger">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                        <line x1="12" y1="9" x2="12" y2="13"></line>
                                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                    </svg>
                                </div>
                                <button 
                                    className="confirm-modal-close"
                                    onClick={handleDeleteCancel}
                                    disabled={deleteLoading}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                            <div className="confirm-modal-content">
                                <h3 className="confirm-modal-title">Delete Client</h3>
                                <p className="confirm-modal-message">
                                    Are you sure you want to delete "{clientToDelete?.name}"? This action cannot be undone.
                                </p>
                            </div>
                            <div className="confirm-modal-footer">
                                <button 
                                    className="btn-confirm-cancel"
                                    onClick={handleDeleteCancel}
                                    disabled={deleteLoading}
                                >
                                    Cancel
                                </button>
                                <button 
                                    className="btn-confirm-action danger"
                                    onClick={handleDeleteConfirm}
                                    disabled={deleteLoading}
                                >
                                    {deleteLoading ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </UserLayout>
    );
}

