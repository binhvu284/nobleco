import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import CategoryDetailModal from '../components/CategoryDetailModal';
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
  IconPackage,
  IconX
} from '../components/icons';
import { useTranslation } from '../../shared/contexts/TranslationContext';

// Category interface
interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parent_id: number | null;
  level: number;
  color: string;
  status: 'active' | 'inactive';
  is_featured: boolean;
  product_count: number;
  created_at: string;
  updated_at: string;
}

export default function AdminCategories() {
  const { t } = useTranslation();
  const [categoryType, setCategoryType] = useState<'jewelry' | 'centerstone'>('jewelry');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  
  // Form state for creating/editing category
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
  const [pendingClose, setPendingClose] = useState<(() => void) | null>(null);
  
  const isEditMode = !!editingCategory;
  const showCategoryModal = editingCategory !== null || showCreateModal;
  
  // Check if form has unsaved changes
  const hasUnsavedChanges = (): boolean => {
    if (!isEditMode || !editingCategory) return false;
    
    return (
      formData.name.trim() !== editingCategory.name ||
      formData.description.trim() !== (editingCategory.description || '') ||
      formData.color !== editingCategory.color
    );
  };
  
  // Handle close with unsaved changes check
  const handleCloseRequest = (closeAction: () => void) => {
    if (isEditMode && hasUnsavedChanges()) {
      setPendingClose(() => closeAction);
      setShowUnsavedConfirm(true);
    } else {
      closeAction();
    }
  };
  
  // Confirm discard changes
  const handleDiscardChanges = () => {
    if (pendingClose) {
      pendingClose();
      setPendingClose(null);
    }
    setShowUnsavedConfirm(false);
    setEditingCategory(null);
    setShowCreateModal(false);
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6'
    });
  };
  
  // Cancel discard (go back to editing)
  const handleCancelDiscard = () => {
    setShowUnsavedConfirm(false);
    setPendingClose(null);
  };

  // Fetch categories from database
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const endpoint = categoryType === 'jewelry' ? '/api/categories' : '/api/centerstone-categories';
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch categories' }));
        throw new Error(errorData.error || 'Failed to fetch categories');
      }
      
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  // Reset loading state when categoryType changes
  useEffect(() => {
    setLoading(true);
    setError(null);
    setCategories([]);
  }, [categoryType]);

  // Fetch categories on mount and when category type changes
  useEffect(() => {
    fetchCategories();
  }, [categoryType]);

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

  // Filter categories based on search term
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setShowDeleteConfirm(true);
    setActiveDropdown(null);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    try {
      setDeleteLoading(true);
      const endpoint = categoryType === 'jewelry' ? '/api/categories' : '/api/centerstone-categories';
      const response = await fetch(`${endpoint}?id=${categoryToDelete.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete category' }));
        throw new Error(errorData.error || 'Failed to delete category');
      }

      // Show success notification
      setNotification({
        type: 'success',
        message: t('adminCategories.categoryDeleted')
      });

      // Auto-hide notification after 3 seconds
      setTimeout(() => setNotification(null), 3000);

      // Close modal and refresh categories list
      setShowDeleteConfirm(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (err) {
      console.error('Error deleting category:', err);
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : t('adminCategories.failedDeleteCategory')
      });

      // Auto-hide notification after 3 seconds
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setCategoryToDelete(null);
  };

  const handleEdit = (category: Category) => {
    setActiveDropdown(null);
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color
    });
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setShowCreateModal(true);
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6'
    });
  };


  // Handle form submission
  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setNotification({
        type: 'error',
        message: t('adminCategories.categoryNameRequired')
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    // Validate hex color
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexColorRegex.test(formData.color)) {
      setNotification({
        type: 'error',
        message: t('adminCategories.invalidHexColor')
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    try {
      setSubmitting(true);
      
      let response;
      
      if (isEditMode && editingCategory) {
        // Update existing category
        // Generate new slug if name changed
        const slug = formData.name.toLowerCase() !== editingCategory.name.toLowerCase()
          ? formData.name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, '')
          : editingCategory.slug;

        const endpoint = categoryType === 'jewelry' ? '/api/categories' : '/api/centerstone-categories';
        response = await fetch(`${endpoint}?id=${editingCategory.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            slug: slug,
            description: formData.description.trim() || null,
            color: formData.color
          })
        });
      } else {
        // Create new category
        // Generate slug from name
        const slug = formData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        const endpoint = categoryType === 'jewelry' ? '/api/categories' : '/api/centerstone-categories';
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            slug: slug,
            description: formData.description.trim() || null,
            color: formData.color,
            status: 'active'
          })
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          error: isEditMode ? 'Failed to update category' : 'Failed to create category' 
        }));
        throw new Error(errorData.error || (isEditMode ? 'Failed to update category' : 'Failed to create category'));
      }

      // Show success notification
      setNotification({
        type: 'success',
        message: isEditMode ? t('adminCategories.categoryUpdated') : t('adminCategories.categoryCreated')
      });
      setTimeout(() => setNotification(null), 3000);

      // Close modal and refresh
      setEditingCategory(null);
      setShowCreateModal(false);
      setFormData({
        name: '',
        description: '',
        color: '#3B82F6'
      });
      fetchCategories();
    } catch (err) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} category:`, err);
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : (isEditMode ? t('adminCategories.failedUpdateCategory') : t('adminCategories.failedCreateCategory'))
      });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setSubmitting(false);
    }
  };


  const handleMoreClick = (categoryId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setActiveDropdown(activeDropdown === categoryId ? null : categoryId);
  };

  const handleSeeDetail = (category: Category) => {
    setSelectedCategory(category);
    setShowDetailModal(true);
    setActiveDropdown(null);
  };

  const handleCloseDetail = () => {
    setSelectedCategory(null);
    setShowDetailModal(false);
  };

  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category);
    setShowDetailModal(true);
  };

  const handleCloseDropdown = () => {
    setActiveDropdown(null);
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.actions-cell') && !target.closest('.card-actions')) {
        setActiveDropdown(null);
      }
    };
    if (activeDropdown) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [activeDropdown]);

  return (
    <AdminLayout title={t('adminCategories.title')}>
      <div className="admin-categories-page">
        {/* Navigation Tabs */}
        <div className="product-type-tabs">
          <button
            className={`tab-button ${categoryType === 'jewelry' ? 'active' : ''}`}
            onClick={() => {
              setCategoryType('jewelry');
              setSearchTerm('');
            }}
          >
            {t('adminCategories.jewelryCategories')}
          </button>
          <button
            className={`tab-button ${categoryType === 'centerstone' ? 'active' : ''}`}
            onClick={() => {
              setCategoryType('centerstone');
              setSearchTerm('');
            }}
          >
            {t('adminCategories.centerstoneCategories')}
          </button>
        </div>

        {/* Clean Toolbar */}
        <div className="categories-toolbar">
          <div className="toolbar-left">
            <div className="search-container">
              <IconSearch className="search-icon" />
              <input
                type="text"
                placeholder={t('adminCategories.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <button className="btn-filter" title={t('adminCategories.filter')}>
              <IconFilter />
            </button>
          </div>
          <div className="toolbar-right">
            <button 
              className="btn-add" 
              onClick={handleAddCategory}
            >
              <IconPlus />
              <span>{t('adminCategories.createCategory')}</span>
            </button>
            {/* Desktop view toggle */}
            <div className="view-toggle desktop-only">
              <button
                className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => !isMobile && setViewMode('table')}
                title={t('adminCategories.tableView')}
                disabled={isMobile}
              >
                <IconList />
              </button>
              <button
                className={`view-btn ${viewMode === 'card' ? 'active' : ''}`}
                onClick={() => setViewMode('card')}
                title={t('adminCategories.cardView')}
              >
                <IconGrid />
              </button>
            </div>
            
            {/* Mobile column selector - hidden on categories since it's not needed */}
            <div className="mobile-column-selector mobile-only" style={{ display: 'none' }}>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-state">
            <p>{t('adminCategories.loading')}</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={fetchCategories}>{t('common.retry')}</button>
          </div>
        )}

        {/* Content */}
        {!loading && !error && viewMode === 'table' && !isMobile ? (
          <div className="categories-table-container">
            <table className="categories-table">
              <thead>
                <tr>
                  <th>{t('adminCategories.name')}</th>
                  <th>{t('adminCategories.description')}</th>
                  <th>{t('adminCategories.productCount')}</th>
                  <th>{t('adminCategories.createdAt')}</th>
                  <th>{t('adminCategories.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((category) => (
                  <tr 
                    key={category.id}
                    onClick={() => handleCategoryClick(category)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div className="category-cell">
                        <div 
                          className="color-dot" 
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span className="category-name">{category.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="description">{category.description || '—'}</span>
                    </td>
                    <td>
                      <span className="product-count">{category.product_count}</span>
                    </td>
                    <td>
                      <span className="created-date">{new Date(category.created_at).toLocaleDateString()}</span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div 
                        className={`unified-dropdown ${activeDropdown === category.id ? 'active' : ''}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="unified-more-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoreClick(category.id, e);
                          }}
                          title={t('adminCategories.moreActions')}
                        >
                          <IconMoreVertical />
                        </button>
                        {activeDropdown === category.id && (
                          <div className="unified-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                            <button className="unified-dropdown-item" onClick={() => handleSeeDetail(category)}>
                              <IconEye />
                              {t('adminCategories.viewDetails')}
                            </button>
                            <button className="unified-dropdown-item" onClick={() => handleEdit(category)}>
                              <IconEdit />
                              {t('common.edit')}
                            </button>
                            <button className="unified-dropdown-item danger" onClick={() => handleDeleteClick(category)}>
                              <IconTrash2 />
                              {t('common.delete')}
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
        ) : !loading && !error ? (
          <div className="cards-grid">
            {filteredCategories.map((category) => (
              <div 
                key={category.id} 
                className="category-card"
                onClick={() => handleCategoryClick(category)}
                style={{ cursor: 'pointer' }}
              >
                <div className="card-header">
                  <div className="card-title">
                    <div 
                      className="color-dot" 
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <h3>{category.name}</h3>
                  </div>
                  <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                    <div className={`unified-dropdown ${activeDropdown === category.id ? 'active' : ''}`}>
                      <button 
                        className="unified-more-btn" 
                        title={t('adminCategories.moreOptions')}
                        onClick={(e) => handleMoreClick(category.id, e)}
                      >
                        <IconMoreVertical />
                      </button>
                      {activeDropdown === category.id && (
                        <div className="unified-dropdown-menu">
                          <button className="unified-dropdown-item" onClick={() => handleSeeDetail(category)}>
                            <IconEye />
                            {t('adminCategories.viewDetails')}
                          </button>
                          <button className="unified-dropdown-item" onClick={() => handleEdit(category)}>
                            <IconEdit />
                            {t('common.edit')}
                          </button>
                          <button className="unified-dropdown-item danger" onClick={() => handleDeleteClick(category)}>
                            <IconTrash2 />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <p className="description">{category.description || t('adminCategories.noDescription')}</p>
                  <div className="card-stats">
                    <span className="product-count">{category.product_count} {t('adminCategories.products')}</span>
                    <span className="created-date">{new Date(category.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Empty state */}
        {!loading && !error && filteredCategories.length === 0 && (
          <div className="empty-state">
            <h3>{t('adminCategories.noCategoriesFound')}</h3>
            <p>{t('adminCategories.tryAdjustingSearch')}</p>
          </div>
        )}

        {/* Category Create/Edit Modal */}
        {showCategoryModal && (
          <div 
            className="modal-overlay"
            onClick={() => handleCloseRequest(() => {
              setEditingCategory(null);
              setShowCreateModal(false);
              setFormData({ name: '', description: '', color: '#3B82F6' });
            })}
          >
            <div 
              className="category-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="category-modal-header">
                <h2>{isEditMode ? t('adminCategories.editCategory') : t('adminCategories.addNewCategory')}</h2>
                <button 
                  className="category-modal-close"
                  onClick={() => handleCloseRequest(() => {
                    setEditingCategory(null);
                    setShowCreateModal(false);
                    setFormData({ name: '', description: '', color: '#3B82F6' });
                  })}
                >
                  <IconX />
                </button>
              </div>

              <form onSubmit={handleSubmitCategory} className="category-modal-form">
                <div className="category-modal-body">
                  <div className="form-group">
                    <label htmlFor="category-name">
                      {t('adminCategories.name')} <span className="required">*</span>
                    </label>
                    <input
                      id="category-name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={t('adminCategories.enterCategoryName')}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="category-description">{t('adminCategories.description')}</label>
                    <textarea
                      id="category-description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder={t('adminCategories.enterCategoryDescription')}
                      rows={4}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="category-color">{t('adminCategories.color')}</label>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <input
                        id="category-color"
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        style={{ width: '60px', height: '40px', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        placeholder="#3B82F6"
                        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
                      />
                    </div>
                  </div>
                </div>

                <div className="category-modal-footer">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => handleCloseRequest(() => {
                      setEditingCategory(null);
                      setShowCreateModal(false);
                      setFormData({ name: '', description: '', color: '#3B82F6' });
                    })}
                    disabled={submitting}
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={submitting}
                  >
                    {submitting 
                      ? (isEditMode ? t('common.saving') : t('common.creating')) 
                      : (isEditMode ? t('adminCategories.saveCategory') : t('adminCategories.createCategory'))}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Category Detail Modal */}
        <CategoryDetailModal
          open={showDetailModal}
          onClose={handleCloseDetail}
          category={selectedCategory}
          onEdit={handleEdit}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          open={showDeleteConfirm}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title={t('adminCategories.deleteCategory')}
          message={t('adminCategories.deleteConfirm').replace('{{name}}', categoryToDelete?.name || '').replace('{{products}}', categoryToDelete?.product_count && categoryToDelete.product_count > 0 ? t('adminCategories.deleteConfirmProducts').replace('{{count}}', categoryToDelete.product_count.toString()).replace(/{{count, plural, one \{\} other \{s\}\}}/g, categoryToDelete.product_count > 1 ? 's' : '') : '')}
          confirmText={t('common.delete')}
          cancelText={t('common.cancel')}
          type="danger"
          loading={deleteLoading}
        />

        {/* Unsaved Changes Confirmation Modal */}
        <ConfirmModal
          open={showUnsavedConfirm}
          onClose={handleCancelDiscard}
          onConfirm={handleDiscardChanges}
          title={t('adminCategories.unsavedChanges')}
          message={t('adminCategories.unsavedChangesMessage')}
          confirmText={t('adminCategories.discardChanges')}
          cancelText={t('adminCategories.goBack')}
          type="warning"
          loading={false}
        />

        {/* Notification Toast */}
        {notification && (
          <div className={`notification-toast ${notification.type}`}>
            <div className="notification-content">
              <span className="notification-icon">
                {notification.type === 'success' ? '✓' : '✕'}
              </span>
              <span className="notification-message">{notification.message}</span>
            </div>
            <button 
              className="notification-close"
              onClick={() => setNotification(null)}
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
