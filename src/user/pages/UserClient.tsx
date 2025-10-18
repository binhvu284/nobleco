import { useState } from 'react';
import UserLayout from '../components/UserLayout';

type Client = {
    id: number;
    name: string;
    phone: string;
    email?: string;
    gender?: 'Male' | 'Female' | 'Other';
    age?: number;
    description?: string;
    createdAt: string;
};

export default function UserClient() {
    const [clients, setClients] = useState<Client[]>([
        {
            id: 1,
            name: 'John Smith',
            phone: '+1 (555) 123-4567',
            email: 'john.smith@email.com',
            gender: 'Male',
            age: 35,
            description: 'Regular customer, prefers organic products',
            createdAt: '2025-10-15 14:30'
        },
        {
            id: 2,
            name: 'Sarah Johnson',
            phone: '+1 (555) 987-6543',
            email: 'sarah.j@email.com',
            gender: 'Female',
            age: 28,
            description: 'Interested in skincare products',
            createdAt: '2025-10-14 10:15'
        },
        {
            id: 3,
            name: 'Michael Chen',
            phone: '+1 (555) 456-7890',
            gender: 'Male',
            createdAt: '2025-10-13 16:45'
        }
    ]);

    const [showModal, setShowModal] = useState(false);
    const [viewClient, setViewClient] = useState<Client | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

    // Form states
    const [formData, setFormData] = useState<Partial<Client>>({
        name: '',
        phone: '',
        email: '',
        gender: undefined,
        age: undefined,
        description: ''
    });

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.phone.includes(searchQuery) ||
        client.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreateClient = () => {
        setFormData({
            name: '',
            phone: '',
            email: '',
            gender: undefined,
            age: undefined,
            description: ''
        });
        setViewClient(null);
        setShowModal(true);
    };

    const handleViewClient = (client: Client) => {
        setViewClient(client);
        setFormData(client);
        setShowModal(true);
        setMenuOpenId(null);
    };

    const handleEditClient = (client: Client) => {
        setViewClient(client);
        setFormData(client);
        setShowModal(true);
        setMenuOpenId(null);
    };

    const handleDeleteClient = (id: number) => {
        if (confirm('Are you sure you want to delete this client?')) {
            setClients(clients.filter(c => c.id !== id));
            setMenuOpenId(null);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (viewClient) {
            // Update existing client
            setClients(clients.map(c => 
                c.id === viewClient.id 
                    ? { ...c, ...formData } as Client
                    : c
            ));
        } else {
            // Create new client
            const newClient: Client = {
                id: Date.now(),
                name: formData.name!,
                phone: formData.phone!,
                email: formData.email,
                gender: formData.gender,
                age: formData.age,
                description: formData.description,
                createdAt: new Date().toLocaleString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                }).replace(',', '')
            };
            setClients([newClient, ...clients]);
        }

        setShowModal(false);
        setFormData({
            name: '',
            phone: '',
            email: '',
            gender: undefined,
            age: undefined,
            description: ''
        });
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
                {/* Header Section */}
                <div className="client-header">
                    <div className="client-header-info">
                        <h1>Client Management</h1>
                        <p>Store and manage your client information for faster order processing</p>
                    </div>
                    <button className="btn-create-client" onClick={handleCreateClient}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19"/>
                            <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Add New Client
                    </button>
                </div>

                {/* Search Bar */}
                <div className="client-search">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.35-4.35"/>
                    </svg>
                    <input
                        type="text"
                        placeholder="Search clients by name, phone, or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Clients Grid */}
                {filteredClients.length === 0 ? (
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
                            <div key={client.id} className="client-card">
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
                                            <div className="menu">
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
                                                    onClick={() => handleDeleteClient(client.id)}
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
                                    {client.age && (
                                        <div className="client-detail">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                                <line x1="16" y1="2" x2="16" y2="6"/>
                                                <line x1="8" y1="2" x2="8" y2="6"/>
                                                <line x1="3" y1="10" x2="21" y2="10"/>
                                            </svg>
                                            <span>{client.age} years old</span>
                                        </div>
                                    )}
                                    {client.description && (
                                        <div className="client-description">
                                            <p>{client.description}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="client-card-footer">
                                    <span className="client-date">Added: {client.createdAt}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Client Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal-card client-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{viewClient ? 'Client Details' : 'Add New Client'}</h2>
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

                                <div className="form-group">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        value={formData.email || ''}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="Enter email address"
                                    />
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
                                        <label>Age</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="150"
                                            value={formData.age || ''}
                                            onChange={(e) => setFormData({ ...formData, age: e.target.value ? parseInt(e.target.value) : undefined })}
                                            placeholder="Enter age"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Description / Notes</label>
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
            </div>
        </UserLayout>
    );
}

