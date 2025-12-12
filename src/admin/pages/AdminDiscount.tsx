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
    const [codeDuplicateError, setCodeDuplicateError] = useState<string | null>(null);
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
        discount_rate: '',
        description: '',
        max_usage: '',
        max_usage_type: 'unlimited' as 'unlimited' | 'limited',
        valid_from: '',
        valid_until: '',
        valid_until_type: 'custom' as 'unlimited' | 'custom'
    });
    const [editingDiscount, setEditingDiscount] = useState<DiscountCode | null>(null);
    
    const isEditMode = !!editingDiscount;
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Fetch discount codes from API
    useEffect(() => {
        const fetchDiscountCodes = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const authToken = localStorage.getItem('nobleco_auth_token');
                if (!authToken) {
                    throw new Error('Authentication token not found. Please log in again.');
                }

                const response = await fetch('/api/discount-codes', {
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Failed to fetch discount codes' }));
                    throw new Error(errorData.error || `Failed to fetch discount codes (${response.status})`);
                }

                const data = await response.json();
                setDiscountCodes(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Error fetching discount codes:', err);
                setError(err instanceof Error ? err.message : 'Failed to load discount codes');
            } finally {
                setLoading(false);
            }
        };

        fetchDiscountCodes();
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
            discount_rate: '',
            description: '',
            max_usage: '',
            max_usage_type: 'unlimited',
            valid_from: '',
            valid_until: '',
            valid_until_type: 'custom'
        });
        setEditingDiscount(null);
        setShowCreateModal(true);
    };

    const handleEdit = (discount: DiscountCode) => {
        setEditingDiscount(discount);
        setCodeDuplicateError(null);
        setFormData({
            code: discount.code,
            discount_rate: discount.discount_rate.toString(),
            description: discount.description || '',
            max_usage: discount.max_usage?.toString() || '',
            max_usage_type: discount.max_usage === null ? 'unlimited' : 'limited',
            valid_from: discount.valid_from ? new Date(discount.valid_from).toISOString().slice(0, 16) : '',
            valid_until: discount.valid_until ? new Date(discount.valid_until).toISOString().slice(0, 16) : '',
            valid_until_type: discount.valid_until === null ? 'unlimited' : 'custom'
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
            const authToken = localStorage.getItem('nobleco_auth_token');
            if (!authToken) {
                throw new Error('Authentication token not found');
            }

            const response = await fetch(`/api/discount-codes?id=${discountToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete discount code');
            }

            setDiscountCodes(discountCodes.filter(d => d.id !== discountToDelete.id));
            setShowDeleteConfirm(false);
            setDiscountToDelete(null);
            setSuccessMessage('Discount code deleted successfully');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error('Error deleting discount code:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete discount code');
            setTimeout(() => setError(null), 5000);
        } finally {
            setDeleteLoading(false);
        }
    };

    const confirmToggleStatus = async () => {
        if (!discountToToggle) return;
        
        setStatusLoading(true);
        try {
            const authToken = localStorage.getItem('nobleco_auth_token');
            if (!authToken) {
                throw new Error('Authentication token not found');
            }

            const response = await fetch(`/api/discount-codes?id=${discountToToggle.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'toggle-status' })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to toggle discount code status');
            }

            const updated = await response.json();
            setDiscountCodes(discountCodes.map(d => 
                d.id === discountToToggle.id ? updated : d
            ));
            setShowStatusConfirm(false);
            setDiscountToToggle(null);
            setSuccessMessage(`Discount code ${updated.status === 'active' ? 'activated' : 'deactivated'} successfully`);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error('Error toggling discount code status:', err);
            setError(err instanceof Error ? err.message : 'Failed to toggle status');
            setTimeout(() => setError(null), 5000);
        } finally {
            setStatusLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Prevent double submission
        if (submitting) {
            console.warn('Form submission already in progress');
            return;
        }
        
        // Validate form before submitting
        if (!formData.code || formData.code.trim() === '') {
            setError('Discount code is required');
            setTimeout(() => setError(null), 5000);
            return;
        }
        
        if (!formData.discount_rate || formData.discount_rate.trim() === '' || isNaN(parseFloat(formData.discount_rate)) || parseFloat(formData.discount_rate) <= 0 || parseFloat(formData.discount_rate) > 100) {
            setError('Please enter a valid discount rate between 0.01 and 100');
            setTimeout(() => setError(null), 5000);
            return;
        }
        
        if (formData.max_usage_type === 'limited' && (!formData.max_usage || formData.max_usage.trim() === '' || isNaN(parseInt(formData.max_usage)) || parseInt(formData.max_usage) <= 0)) {
            setError('Please enter a valid maximum usage limit');
            setTimeout(() => setError(null), 5000);
            return;
        }
        
        if (formData.valid_from && formData.valid_until && formData.valid_until_type !== 'unlimited' && new Date(formData.valid_from) > new Date(formData.valid_until)) {
            setError('Valid From date must be before Valid Until date');
            setTimeout(() => setError(null), 5000);
            return;
        }
        
        // Check for duplicate code before submitting
        if (codeDuplicateError) {
            setError('Please fix the duplicate code error before submitting');
            setTimeout(() => setError(null), 5000);
            return;
        }
        
        // Additional duplicate check on submit (in case user bypassed the onChange check)
        const duplicate = discountCodes.find(d => d.code === formData.code.trim() && (!isEditMode || d.id !== editingDiscount?.id));
        if (duplicate) {
            setError('This discount code already exists. Please choose a different code.');
            setCodeDuplicateError('This discount code already exists');
            setTimeout(() => {
                setError(null);
                setCodeDuplicateError(null);
            }, 5000);
            return;
        }
        
        setSubmitting(true);
        setError(null);
        setCodeDuplicateError(null);
        
        try {
            const authToken = localStorage.getItem('nobleco_auth_token');
            if (!authToken) {
                throw new Error('Authentication token not found. Please log in again.');
            }

            const url = isEditMode && editingDiscount 
                ? `/api/discount-codes?id=${editingDiscount.id}`
                : '/api/discount-codes';
            
            const method = isEditMode ? 'PUT' : 'POST';
            
            // Calculate valid_until based on type
            let validUntil = null;
            if (formData.valid_until_type === 'unlimited') {
                validUntil = null;
            } else {
                validUntil = formData.valid_until || null;
            }

            const payload = {
                code: formData.code,
                discount_rate: parseFloat(formData.discount_rate),
                description: formData.description || null,
                max_usage: formData.max_usage_type === 'limited' && formData.max_usage ? parseInt(formData.max_usage) : null,
                valid_from: formData.valid_from || null,
                valid_until: validUntil
            };

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `Failed to ${isEditMode ? 'update' : 'create'} discount code` }));
                throw new Error(errorData.error || `Failed to ${isEditMode ? 'update' : 'create'} discount code (${response.status})`);
            }

            const savedDiscount = await response.json();
            
            if (isEditMode) {
                setDiscountCodes(discountCodes.map(d => 
                    d.id === editingDiscount.id ? savedDiscount : d
                ));
                setSuccessMessage('Discount code updated successfully');
            } else {
                setDiscountCodes([savedDiscount, ...discountCodes]);
                setSuccessMessage('Discount code created successfully');
            }
            
            setTimeout(() => setSuccessMessage(null), 3000);
            
            setShowCreateModal(false);
            setShowEditModal(false);
            setEditingDiscount(null);
            setCodeDuplicateError(null);
            setFormData({
                code: '',
                discount_rate: '',
                description: '',
                max_usage: '',
                max_usage_type: 'unlimited',
                valid_from: '',
                valid_until: '',
                valid_until_type: 'custom'
            });
        } catch (err) {
            console.error('Error saving discount code:', err);
            setError(err instanceof Error ? err.message : `Failed to ${isEditMode ? 'update' : 'create'} discount code`);
            setTimeout(() => setError(null), 5000);
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

                {/* Success Message */}
                {successMessage && (
                    <div className="success-message" style={{
                        padding: '12px 16px',
                        marginBottom: '16px',
                        backgroundColor: '#d4edda',
                        color: '#155724',
                        borderRadius: '6px',
                        border: '1px solid #c3e6cb',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <IconCheck style={{ width: '16px', height: '16px' }} />
                        <span>{successMessage}</span>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="error-state" style={{
                        padding: '12px 16px',
                        marginBottom: '16px',
                        backgroundColor: '#f8d7da',
                        color: '#721c24',
                        borderRadius: '6px',
                        border: '1px solid #f5c6cb',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <IconX style={{ width: '16px', height: '16px' }} />
                        <span>{error}</span>
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
                                                <div className="usage-cell">
                                                    <span className="usage-count">
                                                        {discount.usage_count}
                                                        {discount.max_usage && ` / ${discount.max_usage}`}
                                                    </span>
                                                    {discount.max_usage && (
                                                        <div className="usage-progress" style={{
                                                            width: '100%',
                                                            height: '4px',
                                                            backgroundColor: '#e9ecef',
                                                            borderRadius: '2px',
                                                            marginTop: '4px',
                                                            overflow: 'hidden'
                                                        }}>
                                                            <div style={{
                                                                width: `${Math.min((discount.usage_count / discount.max_usage) * 100, 100)}%`,
                                                                height: '100%',
                                                                backgroundColor: discount.usage_count >= discount.max_usage 
                                                                    ? '#dc3545' 
                                                                    : discount.usage_count / discount.max_usage > 0.8 
                                                                    ? '#ffc107' 
                                                                    : '#28a745',
                                                                transition: 'width 0.3s ease'
                                                            }} />
                                                        </div>
                                                    )}
                                                </div>
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
                                            <div style={{ flex: 1 }}>
                                                <span className="value">
                                                    {discount.usage_count}
                                                    {discount.max_usage && ` / ${discount.max_usage}`}
                                                </span>
                                                {discount.max_usage && (
                                                    <div className="usage-progress" style={{
                                                        width: '100%',
                                                        height: '6px',
                                                        backgroundColor: '#e9ecef',
                                                        borderRadius: '3px',
                                                        marginTop: '6px',
                                                        overflow: 'hidden'
                                                    }}>
                                                        <div style={{
                                                            width: `${Math.min((discount.usage_count / discount.max_usage) * 100, 100)}%`,
                                                            height: '100%',
                                                            backgroundColor: discount.usage_count >= discount.max_usage 
                                                                ? '#dc3545' 
                                                                : discount.usage_count / discount.max_usage > 0.8 
                                                                ? '#ffc107' 
                                                                : '#28a745',
                                                            transition: 'width 0.3s ease'
                                                        }} />
                                                    </div>
                                                )}
                                            </div>
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
                            discount_rate: '',
                            description: '',
                            max_usage: '',
                            max_usage_type: 'unlimited',
                            valid_from: '',
                            valid_until: '',
                            valid_until_type: 'custom'
                        });
                    }}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
                            maxWidth: '800px',
                            width: '90%',
                            maxHeight: '90vh',
                            display: 'flex',
                            flexDirection: 'column',
                            backgroundColor: '#fff',
                            borderRadius: '8px',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div className="modal-header" style={{
                                padding: '20px 24px',
                                borderBottom: '1px solid #e5e7eb',
                                flexShrink: 0,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#111827' }}>
                                    {isEditMode ? 'Edit Discount Code' : 'Create Discount Code'}
                                </h2>
                                <button
                                    className="modal-close"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setShowEditModal(false);
                                        setEditingDiscount(null);
                                        setFormData({
                                            code: '',
                                            discount_rate: '',
                                            description: '',
                                            max_usage: '',
                                            max_usage_type: 'unlimited',
                                            valid_from: '',
                                            valid_until: '',
                                            valid_until_type: 'custom'
                                        });
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '4px',
                                        color: '#6b7280'
                                    }}
                                >
                                    <IconX />
                                </button>
                            </div>
                            <div className="modal-body" style={{
                                padding: '24px',
                                paddingBottom: '0',
                                overflowY: 'auto',
                                flex: 1,
                                minHeight: 0,
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                            <form onSubmit={handleSubmit} style={{
                                display: 'flex',
                                flexDirection: 'column',
                                flex: 1,
                                minHeight: 0
                            }}>
                                <div className="form-group">
                                    <label>
                                        Discount Code <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={async (e) => {
                                            const newCode = e.target.value.toUpperCase();
                                            setFormData({ ...formData, code: newCode });
                                            setCodeDuplicateError(null);
                                            
                                            // Check for duplicate code (only if code is not empty and not the same as current editing code)
                                            if (newCode.trim() && (!isEditMode || newCode !== editingDiscount?.code)) {
                                                const duplicate = discountCodes.find(d => d.code === newCode.trim());
                                                if (duplicate) {
                                                    setCodeDuplicateError('This discount code already exists');
                                                }
                                            }
                                        }}
                                        placeholder="e.g., WELCOME10"
                                        required
                                        maxLength={50}
                                        style={{
                                            borderColor: codeDuplicateError ? '#ef4444' : undefined
                                        }}
                                    />
                                    {codeDuplicateError && (
                                        <small style={{ 
                                            color: '#ef4444', 
                                            marginTop: '4px', 
                                            display: 'block',
                                            fontSize: '13px'
                                        }}>
                                            ⚠️ {codeDuplicateError}
                                        </small>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label>
                                        Discount Rate (%) <span className="required">*</span>
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="number"
                                            value={formData.discount_rate}
                                            onChange={(e) => setFormData({ ...formData, discount_rate: e.target.value })}
                                            placeholder="Enter discount rate"
                                            required
                                            min="0.01"
                                            max="100"
                                            step="0.01"
                                            style={{ paddingRight: formData.discount_rate ? '50px' : '12px' }}
                                        />
                                        {formData.discount_rate && parseFloat(formData.discount_rate) > 0 && (
                                            <span style={{
                                                position: 'absolute',
                                                right: '12px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                color: '#28a745',
                                                fontWeight: '600',
                                                fontSize: '14px'
                                            }}>
                                                {parseFloat(formData.discount_rate)}%
                                            </span>
                                        )}
                                    </div>
                                    <small style={{ color: '#6c757d', marginTop: '4px', display: 'block' }}>
                                        Enter a value between 0.01 and 100
                                    </small>
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
                                <div className="form-group">
                                    <label>Max Usage</label>
                                    <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, max_usage_type: 'unlimited', max_usage: '' })}
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: '6px',
                                                border: '1px solid #d1d5db',
                                                backgroundColor: formData.max_usage_type === 'unlimited' ? '#2563eb' : '#fff',
                                                color: formData.max_usage_type === 'unlimited' ? '#fff' : '#374151',
                                                cursor: 'pointer',
                                                fontWeight: formData.max_usage_type === 'unlimited' ? '600' : '400',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            Unlimited
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, max_usage_type: 'limited' })}
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: '6px',
                                                border: '1px solid #d1d5db',
                                                backgroundColor: formData.max_usage_type === 'limited' ? '#2563eb' : '#fff',
                                                color: formData.max_usage_type === 'limited' ? '#fff' : '#374151',
                                                cursor: 'pointer',
                                                fontWeight: formData.max_usage_type === 'limited' ? '600' : '400',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            Limited
                                        </button>
                                    </div>
                                    {formData.max_usage_type === 'limited' && (
                                        <input
                                            type="number"
                                            value={formData.max_usage}
                                            onChange={(e) => setFormData({ ...formData, max_usage: e.target.value })}
                                            placeholder="Enter maximum usage count"
                                            min="1"
                                            required={formData.max_usage_type === 'limited'}
                                        />
                                    )}
                                    <small style={{ color: '#6c757d', marginTop: '4px', display: 'block' }}>
                                        {formData.max_usage_type === 'unlimited' 
                                            ? 'No limit on how many times this code can be used'
                                            : 'Enter the maximum number of times this code can be used'}
                                    </small>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Valid From</label>
                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                            <input
                                                type="datetime-local"
                                                value={formData.valid_from}
                                                onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                                                style={{ flex: 1 }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const now = new Date();
                                                    const year = now.getFullYear();
                                                    const month = String(now.getMonth() + 1).padStart(2, '0');
                                                    const day = String(now.getDate()).padStart(2, '0');
                                                    const hours = String(now.getHours()).padStart(2, '0');
                                                    const minutes = String(now.getMinutes()).padStart(2, '0');
                                                    setFormData({ ...formData, valid_from: `${year}-${month}-${day}T${hours}:${minutes}` });
                                                }}
                                                style={{
                                                    padding: '8px 16px',
                                                    borderRadius: '6px',
                                                    border: '1px solid #2563eb',
                                                    backgroundColor: '#fff',
                                                    color: '#2563eb',
                                                    cursor: 'pointer',
                                                    fontWeight: '500',
                                                    whiteSpace: 'nowrap',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#eff6ff';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#fff';
                                                }}
                                            >
                                                Today
                                            </button>
                                        </div>
                                        <small style={{ color: '#6c757d', marginTop: '4px', display: 'block' }}>
                                            When the code becomes active
                                        </small>
                                    </div>
                                    <div className="form-group">
                                        <label>Valid Until</label>
                                        <div style={{ marginBottom: '8px' }}>
                                            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, valid_until_type: 'unlimited', valid_until: '' })}
                                                    style={{
                                                        padding: '8px 16px',
                                                        borderRadius: '6px',
                                                        border: '1px solid #d1d5db',
                                                        backgroundColor: formData.valid_until_type === 'unlimited' ? '#2563eb' : '#fff',
                                                        color: formData.valid_until_type === 'unlimited' ? '#fff' : '#374151',
                                                        cursor: 'pointer',
                                                        fontSize: '14px',
                                                        fontWeight: formData.valid_until_type === 'unlimited' ? '600' : '400',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    Unlimited
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, valid_until_type: 'custom' })}
                                                    style={{
                                                        padding: '8px 16px',
                                                        borderRadius: '6px',
                                                        border: '1px solid #d1d5db',
                                                        backgroundColor: formData.valid_until_type === 'custom' ? '#2563eb' : '#fff',
                                                        color: formData.valid_until_type === 'custom' ? '#fff' : '#374151',
                                                        cursor: 'pointer',
                                                        fontSize: '14px',
                                                        fontWeight: formData.valid_until_type === 'custom' ? '600' : '400',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    Custom Date
                                                </button>
                                            </div>
                                            {formData.valid_until_type === 'custom' && (
                                                <>
                                                    <input
                                                        type="datetime-local"
                                                        value={formData.valid_until}
                                                        onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                                                        min={formData.valid_from || undefined}
                                                        style={{ width: '100%', marginBottom: '12px' }}
                                                    />
                                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (formData.valid_from) {
                                                                    const fromDate = new Date(formData.valid_from);
                                                                    fromDate.setDate(fromDate.getDate() + 7);
                                                                    setFormData({ 
                                                                        ...formData, 
                                                                        valid_until: fromDate.toISOString().slice(0, 16)
                                                                    });
                                                                }
                                                            }}
                                                            style={{
                                                                padding: '6px 12px',
                                                                borderRadius: '6px',
                                                                border: '1px solid #d1d5db',
                                                                backgroundColor: '#fff',
                                                                color: '#374151',
                                                                cursor: 'pointer',
                                                                fontSize: '13px',
                                                                fontWeight: '400',
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.backgroundColor = '#f3f4f6';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.backgroundColor = '#fff';
                                                            }}
                                                        >
                                                            A Week Later
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (formData.valid_from) {
                                                                    const fromDate = new Date(formData.valid_from);
                                                                    fromDate.setMonth(fromDate.getMonth() + 1);
                                                                    setFormData({ 
                                                                        ...formData, 
                                                                        valid_until: fromDate.toISOString().slice(0, 16)
                                                                    });
                                                                }
                                                            }}
                                                            style={{
                                                                padding: '6px 12px',
                                                                borderRadius: '6px',
                                                                border: '1px solid #d1d5db',
                                                                backgroundColor: '#fff',
                                                                color: '#374151',
                                                                cursor: 'pointer',
                                                                fontSize: '13px',
                                                                fontWeight: '400',
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.backgroundColor = '#f3f4f6';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.backgroundColor = '#fff';
                                                            }}
                                                        >
                                                            A Month Later
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (formData.valid_from) {
                                                                    const fromDate = new Date(formData.valid_from);
                                                                    fromDate.setMonth(fromDate.getMonth() + 3);
                                                                    setFormData({ 
                                                                        ...formData, 
                                                                        valid_until: fromDate.toISOString().slice(0, 16)
                                                                    });
                                                                }
                                                            }}
                                                            style={{
                                                                padding: '6px 12px',
                                                                borderRadius: '6px',
                                                                border: '1px solid #d1d5db',
                                                                backgroundColor: '#fff',
                                                                color: '#374151',
                                                                cursor: 'pointer',
                                                                fontSize: '13px',
                                                                fontWeight: '400',
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.backgroundColor = '#f3f4f6';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.backgroundColor = '#fff';
                                                            }}
                                                        >
                                                            3 Months Later
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (formData.valid_from) {
                                                                    const fromDate = new Date(formData.valid_from);
                                                                    fromDate.setFullYear(fromDate.getFullYear() + 1);
                                                                    setFormData({ 
                                                                        ...formData, 
                                                                        valid_until: fromDate.toISOString().slice(0, 16)
                                                                    });
                                                                }
                                                            }}
                                                            style={{
                                                                padding: '6px 12px',
                                                                borderRadius: '6px',
                                                                border: '1px solid #d1d5db',
                                                                backgroundColor: '#fff',
                                                                color: '#374151',
                                                                cursor: 'pointer',
                                                                fontSize: '13px',
                                                                fontWeight: '400',
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.backgroundColor = '#f3f4f6';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.backgroundColor = '#fff';
                                                            }}
                                                        >
                                                            A Year Later
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        <small style={{ color: '#6c757d', marginTop: '4px', display: 'block' }}>
                                            {formData.valid_until_type === 'unlimited' 
                                                ? 'Code will never expire'
                                                : 'When the code expires'}
                                        </small>
                                    </div>
                                </div>
                                {formData.valid_from && formData.valid_until && formData.valid_until_type !== 'unlimited' && new Date(formData.valid_from) > new Date(formData.valid_until) && (
                                    <div style={{
                                        padding: '8px 12px',
                                        backgroundColor: '#fff3cd',
                                        color: '#856404',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        marginTop: '8px',
                                        border: '1px solid #ffeaa7'
                                    }}>
                                        ⚠️ Valid From date must be before Valid Until date
                                    </div>
                                )}
                            </form>
                            </div>
                            <div className="modal-footer" style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '12px',
                                padding: '20px 24px',
                                borderTop: '1px solid #e5e7eb',
                                flexShrink: 0,
                                backgroundColor: '#fff',
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                zIndex: 10,
                                boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)'
                            }}>
                                <button
                                    type="button"
                                        onClick={() => {
                                            setShowCreateModal(false);
                                            setShowEditModal(false);
                                            setEditingDiscount(null);
                                            setFormData({
                                                code: '',
                                                discount_rate: '',
                                                description: '',
                                                max_usage: '',
                                                max_usage_type: 'unlimited',
                                                valid_from: '',
                                                valid_until: '',
                                                valid_until_type: 'custom'
                                            });
                                        }}
                                        disabled={submitting}
                                        style={{
                                            padding: '12px 24px',
                                            borderRadius: '8px',
                                            border: '1px solid #d1d5db',
                                            backgroundColor: submitting ? '#f3f4f6' : '#fff',
                                            color: submitting ? '#9ca3af' : '#374151',
                                            cursor: submitting ? 'not-allowed' : 'pointer',
                                            fontWeight: '500',
                                            fontSize: '15px',
                                            transition: 'all 0.2s',
                                            minWidth: '120px'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!submitting) {
                                                e.currentTarget.style.backgroundColor = '#f9fafb';
                                                e.currentTarget.style.borderColor = '#9ca3af';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!submitting) {
                                                e.currentTarget.style.backgroundColor = '#fff';
                                                e.currentTarget.style.borderColor = '#d1d5db';
                                            }
                                        }}
                                    >
                                        Cancel
                                    </button>
                                <button 
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        // Prevent double submission
                                        if (submitting) {
                                            return;
                                        }
                                        // Find and submit the form
                                        const form = document.getElementById('discount-form') as HTMLFormElement;
                                        if (form) {
                                            form.requestSubmit();
                                        }
                                    }}
                                        disabled={submitting || !formData.code || formData.code.trim() === '' || !!codeDuplicateError || !formData.discount_rate || formData.discount_rate.trim() === '' || isNaN(parseFloat(formData.discount_rate)) || parseFloat(formData.discount_rate) <= 0 || parseFloat(formData.discount_rate) > 100 || (formData.valid_from && formData.valid_until && formData.valid_until_type !== 'unlimited' && new Date(formData.valid_from) > new Date(formData.valid_until)) || (formData.max_usage_type === 'limited' && (!formData.max_usage || formData.max_usage.trim() === '' || isNaN(parseInt(formData.max_usage)) || parseInt(formData.max_usage) <= 0))}
                                        style={{
                                            padding: '12px 24px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            backgroundColor: submitting || !formData.code || formData.code.trim() === '' || !!codeDuplicateError || !formData.discount_rate || formData.discount_rate.trim() === '' || isNaN(parseFloat(formData.discount_rate)) || parseFloat(formData.discount_rate) <= 0 || parseFloat(formData.discount_rate) > 100 || (formData.valid_from && formData.valid_until && formData.valid_until_type !== 'unlimited' && new Date(formData.valid_from) > new Date(formData.valid_until)) || (formData.max_usage_type === 'limited' && (!formData.max_usage || formData.max_usage.trim() === '' || isNaN(parseInt(formData.max_usage)) || parseInt(formData.max_usage) <= 0)) ? '#9ca3af' : '#2563eb',
                                            color: '#fff',
                                            cursor: submitting || !formData.code || formData.code.trim() === '' || !!codeDuplicateError || !formData.discount_rate || formData.discount_rate.trim() === '' || isNaN(parseFloat(formData.discount_rate)) || parseFloat(formData.discount_rate) <= 0 || parseFloat(formData.discount_rate) > 100 || (formData.valid_from && formData.valid_until && formData.valid_until_type !== 'unlimited' && new Date(formData.valid_from) > new Date(formData.valid_until)) || (formData.max_usage_type === 'limited' && (!formData.max_usage || formData.max_usage.trim() === '' || isNaN(parseInt(formData.max_usage)) || parseInt(formData.max_usage) <= 0)) ? 'not-allowed' : 'pointer',
                                            fontWeight: '600',
                                            fontSize: '15px',
                                            transition: 'all 0.2s',
                                            minWidth: '180px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            position: 'relative',
                                            pointerEvents: submitting ? 'none' : 'auto'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!e.currentTarget.disabled) {
                                                e.currentTarget.style.backgroundColor = '#1d4ed8';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!e.currentTarget.disabled) {
                                                e.currentTarget.style.backgroundColor = '#2563eb';
                                            }
                                        }}
                                    >
                                        {submitting ? (
                                            <>
                                                <div style={{
                                                    width: '16px',
                                                    height: '16px',
                                                    border: '2px solid #fff',
                                                    borderTopColor: 'transparent',
                                                    borderRadius: '50%',
                                                    animation: 'spin 0.6s linear infinite',
                                                    display: 'inline-block'
                                                }} />
                                                <span>{isEditMode ? 'Updating...' : 'Creating...'}</span>
                                            </>
                                        ) : (
                                            <>
                                                <IconCheck style={{ width: '18px', height: '18px' }} />
                                                <span>{isEditMode ? 'Update Discount Code' : 'Create Discount Code'}</span>
                                            </>
                                        )}
                                    </button>
                            </div>
                            {submitting && (
                                <div 
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        zIndex: 1000,
                                        borderRadius: '8px',
                                        backdropFilter: 'blur(2px)',
                                        pointerEvents: 'auto'
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '16px',
                                        padding: '24px'
                                    }}>
                                        <div style={{
                                            width: '56px',
                                            height: '56px',
                                            border: '5px solid #e5e7eb',
                                            borderTopColor: '#2563eb',
                                            borderRadius: '50%',
                                            animation: 'spin 0.8s linear infinite'
                                        }} />
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}>
                                            <span style={{
                                                color: '#111827',
                                                fontSize: '18px',
                                                fontWeight: '600'
                                            }}>
                                                {isEditMode ? 'Updating Discount Code...' : 'Creating Discount Code...'}
                                            </span>
                                            <span style={{
                                                color: '#6b7280',
                                                fontSize: '14px',
                                                textAlign: 'center',
                                                maxWidth: '300px'
                                            }}>
                                                Please wait, this may take a moment on slower connections
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && discountToDelete && (
                    <ConfirmModal
                        open={showDeleteConfirm}
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
                        loading={deleteLoading}
                    />
                )}

                {/* Status Toggle Confirmation Modal */}
                {showStatusConfirm && discountToToggle && (
                    <ConfirmModal
                        open={showStatusConfirm}
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
                        loading={statusLoading}
                    />
                )}
            </div>
            <style dangerouslySetInnerHTML={{
                __html: `
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `
            }} />
        </AdminLayout>
    );
}


