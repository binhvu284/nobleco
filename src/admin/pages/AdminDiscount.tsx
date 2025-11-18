import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import ConfirmModal from '../components/ConfirmModal';
import { 
    IconPlus,
    IconSearch,
    IconFilter,
    IconGrid,
    IconList,
    IconMoreVertical,
    IconEdit,
    IconTrash2,
    IconEye,
    IconTicket,
    IconPower,
    IconX,
    IconCheck
} from '../components/icons';

// Discount Code interface
interface DiscountCode {
    id: number;
    code: string;
    discount_rate: number; // Percentage (0-100)
    status: 'active' | 'inactive';
    description: string | null;
    usage_count: number;
    max_usage: number | null;
    valid_from: string | null;
    valid_until: string | null;
    created_at: string;
    updated_at: string;
}

export default function AdminDiscount() {
    const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
    const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showStatusConfirm, setShowStatusConfirm] = useState(false);
    const [discountToDelete, setDiscountToDelete] = useState<DiscountCode | null>(null);
    const [discountToToggle, setDiscountToToggle] = useState<DiscountCode | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [statusLoading, setStatusLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    // Form state for creating/editing discount code
    const [formData, setFormData] = useState({
        code: '',
        discount_rate: 0,
        description: '',
        max_usage: '',
        valid_from: '',
        valid_until: ''
    });
    const [editingDiscount, setEditingDiscount] = useState<DiscountCode | null>(null);
    
    const isEditMode = !!editingDiscount;

    // Mock data for UI demonstration (will be replaced with API calls later)
    useEffect(() => {
        // Simulate loading
        setTimeout(() => {
            setDiscountCodes([
                {
                    id: 1,
                    code: 'WELCOME10',
                    discount_rate: 10,
                    status: 'active',
                    description: 'Welcome discount for new customers',
                    usage_count: 45,
                    max_usage: 100,
                    valid_from: '2025-01-01T00:00:00Z',
                    valid_until: '2025-12-31T23:59:59Z',
                    created_at: '2025-01-01T00:00:00Z',
                    updated_at: '2025-01-15T10:30:00Z'
                },
                {
                    id: 2,
                    code: 'SUMMER25',
                    discount_rate: 25,
                    status: 'active',
                    description: 'Summer sale discount',
                    usage_count: 120,
                    max_usage: 200,
                    valid_from: '2025-06-01T00:00:00Z',
                    valid_until: '2025-08-31T23:59:59Z',
                    created_at: '2025-05-15T00:00:00Z',
                    updated_at: '2025-05-15T00:00:00Z'
                },
                {
                    id: 3,
                    code: 'EXPIRED50',
                    discount_rate: 50,
                    status: 'inactive',
                    description: 'Expired promotional code',
                    usage_count: 5,
                    max_usage: 10,
                    valid_from: '2024-12-01T00:00:00Z',
                    valid_until: '2024-12-31T23:59:59Z',
                    created_at: '2024-11-20T00:00:00Z',
                    updated_at: '2025-01-01T00:00:00Z'
                }
            ]);
            setLoading(false);
        }, 500);
    }, []);

    // Mobile detection and view mode management
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            if (mobile && viewMode === 'table') {
                setViewMode('card');
            }
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, [viewMode]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (activeDropdown !== null) {
                const target = e.target as HTMLElement;
                if (!target.closest('.unified-dropdown') && !target.closest('.unified-dropdown-trigger')) {
                    setActiveDropdown(null);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeDropdown]);

    // Filter discount codes based on search term
    const filteredDiscountCodes = discountCodes.filter(discount => {
        const searchLower = searchTerm.toLowerCase();
        return (
            discount.code.toLowerCase().includes(searchLower) ||
            (discount.description && discount.description.toLowerCase().includes(searchLower))
        );
    });

    const handleCreate = () => {
        setFormData({
            code: '',
            discount_rate: 0,
            description: '',
            max_usage: '',
            valid_from: '',
            valid_until: ''
        });
        setEditingDiscount(null);
        setShowCreateModal(true);
    };

    const handleEdit = (discount: DiscountCode) => {
        setEditingDiscount(discount);
        setFormData({
            code: discount.code,
            discount_rate: discount.discount_rate,
            description: discount.description || '',
            max_usage: discount.max_usage?.toString() || '',
            valid_from: discount.valid_from ? new Date(discount.valid_from).toISOString().slice(0, 16) : '',
            valid_until: discount.valid_until ? new Date(discount.valid_until).toISOString().slice(0, 16) : ''
        });
        setShowEditModal(true);
        setActiveDropdown(null);
    };

    const handleDelete = (discount: DiscountCode) => {
        setDiscountToDelete(discount);
        setShowDeleteConfirm(true);
        setActiveDropdown(null);
    };

    const handleToggleStatus = (discount: DiscountCode) => {
        setDiscountToToggle(discount);
        setShowStatusConfirm(true);
        setActiveDropdown(null);
    };

    const confirmDelete = async () => {
        if (!discountToDelete) return;
        
        setDeleteLoading(true);
        try {
            // TODO: API call to delete discount code
            // await fetch(`/api/discount-codes/${discountToDelete.id}`, { method: 'DELETE' });
            
            // Mock deletion for UI
            setDiscountCodes(discountCodes.filter(d => d.id !== discountToDelete.id));
            setShowDeleteConfirm(false);
            setDiscountToDelete(null);
        } catch (err) {
            console.error('Error deleting discount code:', err);
        } finally {
            setDeleteLoading(false);
        }
    };

    const confirmToggleStatus = async () => {
        if (!discountToToggle) return;
        
        setStatusLoading(true);
        try {
            // TODO: API call to toggle status
            // await fetch(`/api/discount-codes/${discountToToggle.id}/toggle-status`, { method: 'PATCH' });
            
            // Mock status toggle for UI
            setDiscountCodes(discountCodes.map(d => 
                d.id === discountToToggle.id 
                    ? { ...d, status: d.status === 'active' ? 'inactive' : 'active' as 'active' | 'inactive' }
                    : d
            ));
            setShowStatusConfirm(false);
            setDiscountToToggle(null);
        } catch (err) {
            console.error('Error toggling discount code status:', err);
        } finally {
            setStatusLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        
        try {
            if (isEditMode && editingDiscount) {
                // TODO: API call to update discount code
                // await fetch(`/api/discount-codes/${editingDiscount.id}`, { 
                //     method: 'PUT',
                //     headers: { 'Content-Type': 'application/json' },
                //     body: JSON.stringify(formData)
                // });
                
                // Mock update for UI
                setDiscountCodes(discountCodes.map(d => 
                    d.id === editingDiscount.id 
                        ? { 
                            ...d, 
                            code: formData.code,
                            discount_rate: formData.discount_rate,
                            description: formData.description || null,
                            max_usage: formData.max_usage ? parseInt(formData.max_usage) : null,
                            valid_from: formData.valid_from ? new Date(formData.valid_from).toISOString() : null,
                            valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
                            updated_at: new Date().toISOString()
                        }
                        : d
                ));
            } else {
                // TODO: API call to create discount code
                // await fetch('/api/discount-codes', { 
                //     method: 'POST',
                //     headers: { 'Content-Type': 'application/json' },
                //     body: JSON.stringify(formData)
                // });
                
                // Mock create for UI
                const newDiscount: DiscountCode = {
                    id: Math.max(...discountCodes.map(d => d.id), 0) + 1,
                    code: formData.code,
                    discount_rate: formData.discount_rate,
                    status: 'active',
                    description: formData.description || null,
                    usage_count: 0,
                    max_usage: formData.max_usage ? parseInt(formData.max_usage) : null,
                    valid_from: formData.valid_from ? new Date(formData.valid_from).toISOString() : null,
                    valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                setDiscountCodes([...discountCodes, newDiscount]);
            }
            
            setShowCreateModal(false);
            setShowEditModal(false);
            setEditingDiscount(null);
            setFormData({
                code: '',
                discount_rate: 0,
                description: '',
                max_usage: '',
                valid_from: '',
                valid_until: ''
            });
        } catch (err) {
            console.error('Error saving discount code:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <AdminLayout title="Discount Codes">
            <div className="admin-discount-page">
                {/* Toolbar */}
                <div className="orders-toolbar">
                    <div className="toolbar-left">
                        <div className="search-container">
                            <IconSearch />
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search discount codes..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="btn-filter" title="Filter">
                            <IconFilter />
                        </button>
                    </div>
                    <div className="toolbar-right">
                        <button
                            className="btn-view-toggle"
                            onClick={() => setViewMode(viewMode === 'table' ? 'card' : 'table')}
                            title={`Switch to ${viewMode === 'table' ? 'card' : 'table'} view`}
                        >
                            {viewMode === 'table' ? <IconGrid /> : <IconList />}
                        </button>
                        <button className="btn-primary" onClick={handleCreate}>
                            <IconPlus />
                            <span>Create Discount Code</span>
                        </button>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Loading discount codes...</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="error-state">
                        <p>{error}</p>
                    </div>
                )}

                {/* Table View */}
                {!loading && !error && viewMode === 'table' && (
                    <div className="table-wrap">
                        <table className="orders-table">
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Discount Rate</th>
                                    <th>Status</th>
                                    <th>Usage</th>
                                    <th>Valid Period</th>
                                    <th>Description</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDiscountCodes.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="empty-state">
                                            <div className="empty-icon">🎫</div>
                                            <h3>No discount codes found</h3>
                                            <p>Create your first discount code to get started.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredDiscountCodes.map((discount) => (
                                        <tr key={discount.id}>
                                            <td>
                                                <div className="code-cell">
                                                    <IconTicket style={{ width: '18px', height: '18px', color: 'var(--primary)' }} />
                                                    <strong>{discount.code}</strong>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="discount-rate">{discount.discount_rate}%</span>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${discount.status}`}>
                                                    {discount.status === 'active' ? (
                                                        <>
                                                            <IconCheck style={{ width: '12px', height: '12px' }} />
                                                            Active
                                                        </>
                                                    ) : (
                                                        <>
                                                            <IconX style={{ width: '12px', height: '12px' }} />
                                                            Inactive
                                                        </>
                                                    )}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="usage-count">
                                                    {discount.usage_count}
                                                    {discount.max_usage && ` / ${discount.max_usage}`}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="date-range">
                                                    <span>{formatDate(discount.valid_from)}</span>
                                                    <span className="date-separator">→</span>
                                                    <span>{formatDate(discount.valid_until)}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="description-cell" title={discount.description || ''}>
                                                    {discount.description || 'N/A'}
                                                </span>
                                            </td>
                                            <td>{formatDateTime(discount.created_at)}</td>
                                            <td>
                                                <div className={`unified-dropdown ${activeDropdown === discount.id ? 'active' : ''}`}>
                                                    <button
                                                        className="unified-more-btn"
                                                        onClick={() => setActiveDropdown(activeDropdown === discount.id ? null : discount.id)}
                                                        title="More Actions"
                                                    >
                                                        <IconMoreVertical />
                                                    </button>
                                                    {activeDropdown === discount.id && (
                                                        <div className="unified-dropdown-menu">
                                                            <button
                                                                className="unified-dropdown-item"
                                                                onClick={() => handleEdit(discount)}
                                                            >
                                                                <IconEdit />
                                                                Edit
                                                            </button>
                                                            <button
                                                                className="unified-dropdown-item"
                                                                onClick={() => handleToggleStatus(discount)}
                                                            >
                                                                <IconPower />
                                                                {discount.status === 'active' ? 'Deactivate' : 'Activate'}
                                                            </button>
                                                            <button
                                                                className="unified-dropdown-item danger"
                                                                onClick={() => handleDelete(discount)}
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
                )}

                {/* Card View */}
                {!loading && !error && viewMode === 'card' && (
                    <div className="card-grid">
                        {filteredDiscountCodes.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">🎫</div>
                                <h3>No discount codes found</h3>
                                <p>Create your first discount code to get started.</p>
                            </div>
                        ) : (
                            filteredDiscountCodes.map((discount) => (
                                <div key={discount.id} className="discount-card">
                                    <div className="card-header">
                                        <div className="card-title">
                                            <IconTicket style={{ width: '20px', height: '20px', color: 'var(--primary)' }} />
                                            <strong>{discount.code}</strong>
                                        </div>
                                        <div className={`unified-dropdown ${activeDropdown === discount.id ? 'active' : ''}`}>
                                            <button
                                                className="unified-more-btn"
                                                onClick={() => setActiveDropdown(activeDropdown === discount.id ? null : discount.id)}
                                                title="More Actions"
                                            >
                                                <IconMoreVertical />
                                            </button>
                                            {activeDropdown === discount.id && (
                                                <div className="unified-dropdown-menu">
                                                    <button
                                                        className="unified-dropdown-item"
                                                        onClick={() => handleEdit(discount)}
                                                    >
                                                        <IconEdit />
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="unified-dropdown-item"
                                                        onClick={() => handleToggleStatus(discount)}
                                                    >
                                                        <IconPower />
                                                        {discount.status === 'active' ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                    <button
                                                        className="unified-dropdown-item danger"
                                                        onClick={() => handleDelete(discount)}
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
                                            <span className="label">Discount Rate:</span>
                                            <span className="value discount-rate">{discount.discount_rate}%</span>
                                        </div>
                                        <div className="card-row">
                                            <span className="label">Status:</span>
                                            <span className={`status-badge ${discount.status}`}>
                                                {discount.status === 'active' ? (
                                                    <>
                                                        <IconCheck style={{ width: '12px', height: '12px' }} />
                                                        Active
                                                    </>
                                                ) : (
                                                    <>
                                                        <IconX style={{ width: '12px', height: '12px' }} />
                                                        Inactive
                                                    </>
                                                )}
                                            </span>
                                        </div>
                                        <div className="card-row">
                                            <span className="label">Usage:</span>
                                            <span className="value">
                                                {discount.usage_count}
                                                {discount.max_usage && ` / ${discount.max_usage}`}
                                            </span>
                                        </div>
                                        {discount.description && (
                                            <div className="card-row">
                                                <span className="label">Description:</span>
                                                <span className="value">{discount.description}</span>
                                            </div>
                                        )}
                                        <div className="card-row">
                                            <span className="label">Valid Period:</span>
                                            <span className="value">
                                                {formatDate(discount.valid_from)} → {formatDate(discount.valid_until)}
                                            </span>
                                        </div>
                                        <div className="card-row">
                                            <span className="label">Created:</span>
                                            <span className="value">{formatDateTime(discount.created_at)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Create/Edit Modal */}
                {(showCreateModal || showEditModal) && (
                    <div className="modal-overlay" onClick={() => {
                        setShowCreateModal(false);
                        setShowEditModal(false);
                        setEditingDiscount(null);
                        setFormData({
                            code: '',
                            discount_rate: 0,
                            description: '',
                            max_usage: '',
                            valid_from: '',
                            valid_until: ''
                        });
                    }}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{isEditMode ? 'Edit Discount Code' : 'Create Discount Code'}</h2>
                                <button
                                    className="modal-close"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setShowEditModal(false);
                                        setEditingDiscount(null);
                                        setFormData({
                                            code: '',
                                            discount_rate: 0,
                                            description: '',
                                            max_usage: '',
                                            valid_from: '',
                                            valid_until: ''
                                        });
                                    }}
                                >
                                    <IconX />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="modal-body">
                                <div className="form-group">
                                    <label>
                                        Discount Code <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        placeholder="e.g., WELCOME10"
                                        required
                                        maxLength={50}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>
                                        Discount Rate (%) <span className="required">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.discount_rate}
                                        onChange={(e) => setFormData({ ...formData, discount_rate: parseFloat(e.target.value) || 0 })}
                                        placeholder="0"
                                        required
                                        min="0"
                                        max="100"
                                        step="0.01"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Enter description (optional)"
                                        rows={3}
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Max Usage</label>
                                        <input
                                            type="number"
                                            value={formData.max_usage}
                                            onChange={(e) => setFormData({ ...formData, max_usage: e.target.value })}
                                            placeholder="Unlimited"
                                            min="1"
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Valid From</label>
                                        <input
                                            type="datetime-local"
                                            value={formData.valid_from}
                                            onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Valid Until</label>
                                        <input
                                            type="datetime-local"
                                            value={formData.valid_until}
                                            onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="secondary-btn"
                                        onClick={() => {
                                            setShowCreateModal(false);
                                            setShowEditModal(false);
                                            setEditingDiscount(null);
                                            setFormData({
                                                code: '',
                                                discount_rate: 0,
                                                description: '',
                                                max_usage: '',
                                                valid_from: '',
                                                valid_until: ''
                                            });
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="primary-btn" disabled={submitting}>
                                        {submitting ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && discountToDelete && (
                    <ConfirmModal
                        isOpen={showDeleteConfirm}
                        onClose={() => {
                            setShowDeleteConfirm(false);
                            setDiscountToDelete(null);
                        }}
                        onConfirm={confirmDelete}
                        title="Delete Discount Code"
                        message={`Are you sure you want to delete the discount code "${discountToDelete.code}"? This action cannot be undone.`}
                        confirmText="Delete"
                        cancelText="Cancel"
                        type="danger"
                        isLoading={deleteLoading}
                    />
                )}

                {/* Status Toggle Confirmation Modal */}
                {showStatusConfirm && discountToToggle && (
                    <ConfirmModal
                        isOpen={showStatusConfirm}
                        onClose={() => {
                            setShowStatusConfirm(false);
                            setDiscountToToggle(null);
                        }}
                        onConfirm={confirmToggleStatus}
                        title={discountToToggle.status === 'active' ? 'Deactivate Discount Code' : 'Activate Discount Code'}
                        message={`Are you sure you want to ${discountToToggle.status === 'active' ? 'deactivate' : 'activate'} the discount code "${discountToToggle.code}"?`}
                        confirmText={discountToToggle.status === 'active' ? 'Deactivate' : 'Activate'}
                        cancelText="Cancel"
                        type={discountToToggle.status === 'active' ? 'warning' : 'info'}
                        isLoading={statusLoading}
                    />
                )}
            </div>
        </AdminLayout>
    );
}

