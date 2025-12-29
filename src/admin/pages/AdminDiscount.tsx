import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { useTranslation } from '../../shared/contexts/TranslationContext';
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
    const { t } = useTranslation();
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
                    throw new Error(t('common.authTokenNotFound'));
                }

                const response = await fetch('/api/discount-codes', {
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Failed to fetch discount codes' }));
                    throw new Error(errorData.error || t('adminDiscount.failedFetchDiscountCodes'));
                }

                const data = await response.json();
                setDiscountCodes(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Error fetching discount codes:', err);
                setError(err instanceof Error ? err.message : t('adminDiscount.failedLoadDiscountCodes'));
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
                    throw new Error(t('common.authTokenNotFound'));
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
                throw new Error(error.error || t('adminDiscount.failedDeleteDiscount'));
            }

            setDiscountCodes(discountCodes.filter(d => d.id !== discountToDelete.id));
            setShowDeleteConfirm(false);
            setDiscountToDelete(null);
            setSuccessMessage(t('adminDiscount.discountDeleted'));
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error('Error deleting discount code:', err);
            setError(err instanceof Error ? err.message : t('adminDiscount.failedDeleteDiscount'));
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
                    throw new Error(t('common.authTokenNotFound'));
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
                throw new Error(error.error || t('adminDiscount.failedUpdateStatus'));
            }

            const updated = await response.json();
            setDiscountCodes(discountCodes.map(d => 
                d.id === discountToToggle.id ? updated : d
            ));
            setShowStatusConfirm(false);
            setDiscountToToggle(null);
            setSuccessMessage(updated.status === 'active' ? t('adminDiscount.discountStatusUpdatedActivated') : t('adminDiscount.discountStatusUpdatedDeactivated'));
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error('Error toggling discount code status:', err);
            setError(err instanceof Error ? err.message : t('adminDiscount.failedUpdateStatus'));
            setTimeout(() => setError(null), 5000);
        } finally {
            setStatusLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/3da31dfe-5721-4e1a-a160-93fd6dd15ec4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminDiscount.tsx:266',message:'handleSubmit function called',data:{submitting,isEditMode},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        e.preventDefault();
        
        // Prevent double submission
        if (submitting) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/3da31dfe-5721-4e1a-a160-93fd6dd15ec4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminDiscount.tsx:270',message:'handleSubmit blocked - already submitting',data:{submitting},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            console.warn('Form submission already in progress');
            return;
        }
        
        // Validate form before submitting
        if (!formData.code || formData.code.trim() === '') {
            setError(t('adminDiscount.discountCodeRequired'));
            setTimeout(() => setError(null), 5000);
            return;
        }
        
        if (!formData.discount_rate || formData.discount_rate.trim() === '' || isNaN(parseFloat(formData.discount_rate)) || parseFloat(formData.discount_rate) <= 0 || parseFloat(formData.discount_rate) > 100) {
            setError(t('adminDiscount.invalidDiscountRate'));
            setTimeout(() => setError(null), 5000);
            return;
        }
        
        if (formData.max_usage_type === 'limited' && (!formData.max_usage || formData.max_usage.trim() === '' || isNaN(parseInt(formData.max_usage)) || parseInt(formData.max_usage) <= 0)) {
            setError(t('adminDiscount.invalidMaxUsage'));
            setTimeout(() => setError(null), 5000);
            return;
        }
        
        if (formData.valid_from && formData.valid_until && formData.valid_until_type !== 'unlimited' && new Date(formData.valid_from) > new Date(formData.valid_until)) {
            setError(t('adminDiscount.validFromBeforeUntil'));
            setTimeout(() => setError(null), 5000);
            return;
        }
        
        // Check for duplicate code before submitting
        if (codeDuplicateError) {
            setError(t('adminDiscount.fixDuplicateCodeError'));
            setTimeout(() => setError(null), 5000);
            return;
        }
        
        // Additional duplicate check on submit (in case user bypassed the onChange check)
        const duplicate = discountCodes.find(d => d.code === formData.code.trim() && (!isEditMode || d.id !== editingDiscount?.id));
        if (duplicate) {
            setError(t('adminDiscount.codeExistsChooseDifferent'));
            setCodeDuplicateError(t('adminDiscount.codeDuplicateError'));
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
                throw new Error(errorData.error || (isEditMode ? t('adminDiscount.failedUpdateDiscount') : t('adminDiscount.failedCreateDiscount')));
            }

            const savedDiscount = await response.json();
            
            if (isEditMode) {
                setDiscountCodes(discountCodes.map(d => 
                    d.id === editingDiscount.id ? savedDiscount : d
                ));
                setSuccessMessage(t('adminDiscount.discountUpdated'));
            } else {
                setDiscountCodes([savedDiscount, ...discountCodes]);
                setSuccessMessage(t('adminDiscount.discountCreated'));
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
        <AdminLayout title={t('adminDiscount.title')}>
            <div className="admin-discount-page">
                {/* Toolbar */}
                <div className="orders-toolbar">
                    <div className="toolbar-left">
                        <div className="search-container">
                            <IconSearch />
                            <input
                                type="text"
                                className="search-input"
                                placeholder={t('adminDiscount.searchPlaceholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="btn-filter" title={t('common.filter')}>
                            <IconFilter />
                        </button>
                    </div>
                    <div className="toolbar-right">
                        <button
                            className="btn-view-toggle"
                            onClick={() => setViewMode(viewMode === 'table' ? 'card' : 'table')}
                            title={viewMode === 'table' ? t('common.cardView') : t('common.tableView')}
                        >
                            {viewMode === 'table' ? <IconGrid /> : <IconList />}
                        </button>
                        <button className="btn-primary" onClick={handleCreate}>
                            <IconPlus />
                            <span>{t('adminDiscount.createDiscountCode')}</span>
                        </button>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>{t('adminDiscount.loadingDiscountCodes')}</p>
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
                                    <th>{t('adminDiscount.code')}</th>
                                    <th>{t('adminDiscount.discountRate')}</th>
                                    <th>{t('adminDiscount.status')}</th>
                                    <th>{t('adminDiscount.usage')}</th>
                                    <th>{t('adminDiscount.validPeriod')}</th>
                                    <th>{t('adminDiscount.description')}</th>
                                    <th>{t('adminDiscount.created')}</th>
                                    <th>{t('adminDiscount.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDiscountCodes.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="empty-state">
                                            <div className="empty-icon">🎫</div>
                                            <h3>{t('adminDiscount.noDiscountCodesFound')}</h3>
                                            <p>{t('adminDiscount.createFirstDiscountCode')}</p>
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
                                                            {t('adminDiscount.active')}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <IconX style={{ width: '12px', height: '12px' }} />
                                                            {t('adminDiscount.inactive')}
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
                                                    {discount.description || t('common.notAvailable')}
                                                </span>
                                            </td>
                                            <td>{formatDateTime(discount.created_at)}</td>
                                            <td>
                                                <div className={`unified-dropdown ${activeDropdown === discount.id ? 'active' : ''}`}>
                                                    <button
                                                        className="unified-more-btn"
                                                        onClick={() => setActiveDropdown(activeDropdown === discount.id ? null : discount.id)}
                                                        title={t('adminDiscount.moreActions')}
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
                                                                {t('common.edit')}
                                                            </button>
                                                            <button
                                                                className="unified-dropdown-item"
                                                                onClick={() => handleToggleStatus(discount)}
                                                            >
                                                                <IconPower />
                                                                {discount.status === 'active' ? t('adminDiscount.deactivate') : t('adminDiscount.activate')}
                                                            </button>
                                                            <button
                                                                className="unified-dropdown-item danger"
                                                                onClick={() => handleDelete(discount)}
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
                )}

                {/* Card View */}
                {!loading && !error && viewMode === 'card' && (
                    <div className="card-grid">
                        {filteredDiscountCodes.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">🎫</div>
                                <h3>{t('adminDiscount.noDiscountCodesFound')}</h3>
                                <p>{t('adminDiscount.createFirstDiscountCode')}</p>
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
                                            <span className="label">{t('adminDiscount.discountRate')}:</span>
                                            <span className="value discount-rate">{discount.discount_rate}%</span>
                                        </div>
                                        <div className="card-row">
                                            <span className="label">{t('adminDiscount.status')}:</span>
                                            <span className={`status-badge ${discount.status}`}>
                                                {discount.status === 'active' ? (
                                                    <>
                                                        <IconCheck style={{ width: '12px', height: '12px' }} />
                                                        {t('adminDiscount.active')}
                                                    </>
                                                ) : (
                                                    <>
                                                        <IconX style={{ width: '12px', height: '12px' }} />
                                                        {t('adminDiscount.inactive')}
                                                    </>
                                                )}
                                            </span>
                                        </div>
                                        <div className="card-row">
                                            <span className="label">{t('adminDiscount.usage')}:</span>
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
                                                <span className="label">{t('adminDiscount.description')}:</span>
                                                <span className="value">{discount.description}</span>
                                            </div>
                                        )}
                                        <div className="card-row">
                                            <span className="label">{t('adminDiscount.validPeriod')}:</span>
                                            <span className="value">
                                                {formatDate(discount.valid_from)} → {formatDate(discount.valid_until)}
                                            </span>
                                        </div>
                                        <div className="card-row">
                                            <span className="label">{t('adminDiscount.created')}:</span>
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
                                    {isEditMode ? t('adminDiscount.editDiscountTitle') : t('adminDiscount.createDiscountTitle')}
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
                                paddingBottom: '100px',
                                overflowY: 'auto',
                                flex: 1,
                                minHeight: 0,
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                            <form id="discount-form" onSubmit={(e) => {
                                // #region agent log
                                fetch('http://127.0.0.1:7242/ingest/3da31dfe-5721-4e1a-a160-93fd6dd15ec4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminDiscount.tsx:847',message:'Form onSubmit handler called',data:{formId:'discount-form'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                                // #endregion
                                handleSubmit(e);
                            }} style={{
                                display: 'flex',
                                flexDirection: 'column',
                                flex: 1,
                                minHeight: 0
                            }}>
                                <div className="form-group">
                                    <label>
                                        {t('adminDiscount.code')} <span className="required">*</span>
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
                                                    setCodeDuplicateError(t('adminDiscount.codeDuplicateError'));
                                                }
                                            }
                                        }}
                                        placeholder={t('adminDiscount.codePlaceholder')}
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
                                        {t('adminDiscount.discountRate')} (%) <span className="required">*</span>
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="number"
                                            value={formData.discount_rate}
                                            onChange={(e) => setFormData({ ...formData, discount_rate: e.target.value })}
                                            placeholder={t('adminDiscount.enterDiscountRate')}
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
                                        {t('adminDiscount.discountRateHint')}
                                    </small>
                                </div>
                                <div className="form-group">
                                    <label>{t('adminDiscount.description')}</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder={t('adminDiscount.enterDescription')}
                                        rows={3}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{t('adminDiscount.maxUsageType')}</label>
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
                                            {t('adminDiscount.unlimited')}
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
                                            {t('adminDiscount.limited')}
                                        </button>
                                    </div>
                                    {formData.max_usage_type === 'limited' && (
                                        <input
                                            type="number"
                                            value={formData.max_usage}
                                            onChange={(e) => setFormData({ ...formData, max_usage: e.target.value })}
                                            placeholder={t('adminDiscount.enterMaxUsage')}
                                            min="1"
                                            required={formData.max_usage_type === 'limited'}
                                        />
                                    )}
                                    <small style={{ color: '#6c757d', marginTop: '4px', display: 'block' }}>
                                        {formData.max_usage_type === 'unlimited' 
                                            ? t('adminDiscount.unlimitedUsageHint')
                                            : t('adminDiscount.limitedUsageHint')}
                                    </small>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>{t('adminDiscount.validFrom')}</label>
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
                                                {t('adminDiscount.today')}
                                            </button>
                                        </div>
                                        <small style={{ color: '#6c757d', marginTop: '4px', display: 'block' }}>
                                            {t('adminDiscount.validFromHint')}
                                        </small>
                                    </div>
                                    <div className="form-group">
                                        <label>{t('adminDiscount.validUntilType')}</label>
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
                                                    {t('adminDiscount.unlimited')}
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
                                                    {t('adminDiscount.custom')}
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
                                                            {t('adminDiscount.aWeekLater')}
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
                                                            {t('adminDiscount.aMonthLater')}
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
                                                            {t('adminDiscount.threeMonthsLater')}
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
                                                            {t('adminDiscount.aYearLater')}
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        <small style={{ color: '#6c757d', marginTop: '4px', display: 'block' }}>
                                            {formData.valid_until_type === 'unlimited' 
                                                ? t('adminDiscount.codeNeverExpires')
                                                : t('adminDiscount.whenCodeExpires')}
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
                                        ⚠️ {t('adminDiscount.validFromBeforeUntil')}
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
                                zIndex: 100,
                                boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)'
                            }}>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
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
                                        padding: '12px 24px',
                                        borderRadius: '8px',
                                        border: '1px solid #d1d5db',
                                        backgroundColor: submitting ? '#f3f4f6' : '#fff',
                                        color: submitting ? '#9ca3af' : '#374151',
                                        cursor: submitting ? 'not-allowed' : 'pointer',
                                        fontWeight: '500',
                                        fontSize: '15px',
                                        transition: 'all 0.2s',
                                        minWidth: '120px',
                                        position: 'relative',
                                        zIndex: 101
                                    }}
                                    disabled={submitting}
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
                                    {t('common.cancel')}
                                </button>
                                <button 
                                    type="button"
                                    onClick={(e) => {
                                        // #region agent log
                                        const isDisabled = submitting || !formData.code || formData.code.trim() === '' || !!codeDuplicateError || !formData.discount_rate || formData.discount_rate.trim() === '' || isNaN(parseFloat(formData.discount_rate)) || parseFloat(formData.discount_rate) <= 0 || parseFloat(formData.discount_rate) > 100 || (formData.valid_from && formData.valid_until && formData.valid_until_type !== 'unlimited' && new Date(formData.valid_from) > new Date(formData.valid_until)) || (formData.max_usage_type === 'limited' && (!formData.max_usage || formData.max_usage.trim() === '' || isNaN(parseInt(formData.max_usage)) || parseInt(formData.max_usage) <= 0));
                                        fetch('http://127.0.0.1:7242/ingest/3da31dfe-5721-4e1a-a160-93fd6dd15ec4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminDiscount.tsx:1301',message:'Create button clicked',data:{submitting,isDisabled,formDataCode:formData.code,codeDuplicateError,formDataDiscountRate:formData.discount_rate,buttonDisabled:isDisabled},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                                        // #endregion
                                        e.preventDefault();
                                        // Prevent double submission
                                        if (submitting) {
                                            // #region agent log
                                            fetch('http://127.0.0.1:7242/ingest/3da31dfe-5721-4e1a-a160-93fd6dd15ec4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminDiscount.tsx:1305',message:'Submission blocked - already submitting',data:{submitting},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                                            // #endregion
                                            return;
                                        }
                                        // Find and submit the form
                                        const form = document.getElementById('discount-form') as HTMLFormElement;
                                        // #region agent log
                                        fetch('http://127.0.0.1:7242/ingest/3da31dfe-5721-4e1a-a160-93fd6dd15ec4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminDiscount.tsx:1308',message:'Form lookup result',data:{formFound:!!form,formId:'discount-form'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                                        // #endregion
                                        if (form) {
                                            // #region agent log
                                            fetch('http://127.0.0.1:7242/ingest/3da31dfe-5721-4e1a-a160-93fd6dd15ec4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminDiscount.tsx:1310',message:'Calling form.requestSubmit()',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                                            // #endregion
                                            form.requestSubmit();
                                        } else {
                                            // #region agent log
                                            fetch('http://127.0.0.1:7242/ingest/3da31dfe-5721-4e1a-a160-93fd6dd15ec4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminDiscount.tsx:1312',message:'Form not found - cannot submit',data:{formId:'discount-form'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                                            // #endregion
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
                                        zIndex: 101
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
                                                <span>{isEditMode ? t('adminDiscount.updating') : t('adminDiscount.creating')}</span>
                                            </>
                                        ) : (
                                            <>
                                                <IconCheck style={{ width: '18px', height: '18px' }} />
                                                <span>{isEditMode ? t('adminDiscount.updateDiscountCode') : t('adminDiscount.createDiscountCode')}</span>
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
                                        bottom: '80px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        zIndex: 50,
                                        borderRadius: '8px',
                                        backdropFilter: 'blur(2px)',
                                        pointerEvents: 'none'
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
                                                {isEditMode ? t('adminDiscount.updatingDiscountCode') : t('adminDiscount.creatingDiscountCode')}
                                            </span>
                                            <span style={{
                                                color: '#6b7280',
                                                fontSize: '14px',
                                                textAlign: 'center',
                                                maxWidth: '300px'
                                            }}>
                                                {t('adminDiscount.pleaseWait')}
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
                        title={t('adminDiscount.deleteConfirm')}
                        message={t('adminDiscount.deleteConfirmMessage').replace('{{code}}', discountToDelete.code)}
                        confirmText={t('common.delete')}
                        cancelText={t('common.cancel')}
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
                        title={discountToToggle.status === 'active' ? t('adminDiscount.deactivateDiscountTitle') : t('adminDiscount.activateDiscountTitle')}
                        message={discountToToggle.status === 'active' 
                            ? t('adminDiscount.toggleStatusConfirmDeactivate').replace('{{code}}', discountToToggle.code)
                            : t('adminDiscount.toggleStatusConfirmActivate').replace('{{code}}', discountToToggle.code)}
                        confirmText={discountToToggle.status === 'active' ? t('adminDiscount.deactivate') : t('adminDiscount.activate')}
                        cancelText={t('common.cancel')}
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


