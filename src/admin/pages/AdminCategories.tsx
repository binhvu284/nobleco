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
  IconEye
} from '../components/icons';

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
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [showCreateModal, setShowCreateModal] = useState(false);
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

  // Fetch categories from database
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/categories');
      
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

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

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
      const response = await fetch(`/api/categories?id=${categoryToDelete.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete category' }));
        throw new Error(errorData.error || 'Failed to delete category');
      }

      // Show success notification
      setNotification({
        type: 'success',
        message: 'Category deleted successfully'
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
        message: err instanceof Error ? err.message : 'Failed to delete category'
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
    console.log('Edit category:', category);
  };

  const handleCreateCategory = () => {
    setShowCreateModal(true);
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
    <AdminLayout title="Categories Management">
      <div className="admin-categories-page">
        {/* Clean Toolbar */}
        <div className="categories-toolbar">
          <div className="toolbar-left">
            <div className="search-container">
              <IconSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
            
            {/* Mobile column selector - hidden on categories since it's not needed */}
            <div className="mobile-column-selector mobile-only" style={{ display: 'none' }}>
            </div>
            
            <button 
              className="create-btn" 
              onClick={handleCreateCategory}
              title="Create Category"
            >
              <IconPlus />
              <span className="desktop-only">Create Category</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-state">
            <p>Loading categories...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={fetchCategories}>Try Again</button>
          </div>
        )}

        {/* Content */}
        {!loading && !error && viewMode === 'table' && !isMobile ? (
          <div className="table-container">
            <table className="categories-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Products</th>
                  <th>Created</th>
                  <th>Actions</th>
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
                      <div className={`unified-dropdown ${activeDropdown === category.id ? 'active' : ''}`}>
                        <button 
                          className="unified-more-btn" 
                          title="More options"
                          onClick={(e) => handleMoreClick(category.id, e)}
                        >
                          <IconMoreVertical />
                        </button>
                        {activeDropdown === category.id && (
                          <div className="unified-dropdown-menu">
                            <button className="unified-dropdown-item" onClick={() => handleSeeDetail(category)}>
                              <IconEye />
                              See Detail
                            </button>
                            <button className="unified-dropdown-item" onClick={() => handleEdit(category)}>
                              <IconEdit />
                              Edit
                            </button>
                            <button className="unified-dropdown-item danger" onClick={() => handleDeleteClick(category)}>
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
                        title="More options"
                        onClick={(e) => handleMoreClick(category.id, e)}
                      >
                        <IconMoreVertical />
                      </button>
                      {activeDropdown === category.id && (
                        <div className="unified-dropdown-menu">
                          <button className="unified-dropdown-item" onClick={() => handleSeeDetail(category)}>
                            <IconEye />
                            See Detail
                          </button>
                          <button className="unified-dropdown-item" onClick={() => handleEdit(category)}>
                            <IconEdit />
                            Edit
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
                  <p className="description">{category.description || 'No description'}</p>
                  <div className="card-stats">
                    <span className="product-count">{category.product_count} products</span>
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
            <h3>No categories found</h3>
            <p>Try adjusting your search or create a new category</p>
            <button className="create-btn" onClick={handleCreateCategory}>
              <IconPlus />
              Create Category
            </button>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>Create New Category</h2>
                <button 
                  className="close-btn"
                  onClick={() => setShowCreateModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="form-group">
                    <label>Category Name</label>
                    <input 
                      type="text" 
                      placeholder="Enter category name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea 
                      placeholder="Enter category description"
                      rows={3}
                    />
                  </div>
                  <div className="form-group">
                    <label>Color</label>
                    <input 
                      type="color" 
                      defaultValue="#3B82F6"
                    />
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button 
                  className="btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button className="btn-primary">
                  Create Category
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Category Detail Modal */}
        <CategoryDetailModal
          open={showDetailModal}
          onClose={handleCloseDetail}
          category={selectedCategory}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          open={showDeleteConfirm}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Delete Category"
          message={`Are you sure you want to delete "${categoryToDelete?.name}"? ${
            categoryToDelete?.product_count && categoryToDelete.product_count > 0
              ? `This category has ${categoryToDelete.product_count} product${categoryToDelete.product_count > 1 ? 's' : ''}. `
              : ''
          }This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
          loading={deleteLoading}
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
