import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
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
  id: string;
  name: string;
  description: string;
  productCount: number;
  color: string;
  createdAt: string;
}

// Sample category data
const sampleCategories: Category[] = [
  {
    id: '1',
    name: 'Electronics',
    description: 'Electronic devices and gadgets',
    productCount: 25,
    color: '#3B82F6',
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    name: 'Clothing',
    description: 'Fashion and apparel items',
    productCount: 18,
    color: '#EF4444',
    createdAt: '2024-01-10'
  },
  {
    id: '3',
    name: 'Home & Garden',
    description: 'Home improvement and garden supplies',
    productCount: 12,
    color: '#10B981',
    createdAt: '2024-01-08'
  },
  {
    id: '4',
    name: 'Books',
    description: 'Books and educational materials',
    productCount: 8,
    color: '#F59E0B',
    createdAt: '2024-01-05'
  },
  {
    id: '5',
    name: 'Sports',
    description: 'Sports equipment and accessories',
    productCount: 15,
    color: '#8B5CF6',
    createdAt: '2024-01-03'
  },
  {
    id: '6',
    name: 'Beauty',
    description: 'Beauty and personal care products',
    productCount: 22,
    color: '#EC4899',
    createdAt: '2024-01-01'
  }
];

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>(sampleCategories);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

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
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (categoryId: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      setCategories(categories.filter(cat => cat.id !== categoryId));
    }
  };

  const handleEdit = (category: Category) => {
    console.log('Edit category:', category);
  };

  const handleCreateCategory = () => {
    setShowCreateModal(true);
  };

  const handleMoreClick = (categoryId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setActiveDropdown(activeDropdown === categoryId ? null : categoryId);
  };

  const handleSeeDetail = (category: Category) => {
    console.log('See detail for category:', category);
    setActiveDropdown(null);
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

        {/* Content */}
        {viewMode === 'table' && !isMobile ? (
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
                  <tr key={category.id}>
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
                      <span className="description">{category.description}</span>
                    </td>
                    <td>
                      <span className="product-count">{category.productCount}</span>
                    </td>
                    <td>
                      <span className="created-date">{category.createdAt}</span>
                    </td>
                    <td>
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
                            <button className="unified-dropdown-item danger" onClick={() => handleDelete(category.id)}>
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
        ) : (
          <div className="cards-grid">
            {filteredCategories.map((category) => (
              <div key={category.id} className="category-card">
                <div className="card-header">
                  <div className="card-title">
                    <div 
                      className="color-dot" 
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <h3>{category.name}</h3>
                  </div>
                  <div className="card-actions">
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
                          <button className="unified-dropdown-item danger" onClick={() => handleDelete(category.id)}>
                            <IconTrash2 />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <p className="description">{category.description}</p>
                  <div className="card-stats">
                    <span className="product-count">{category.productCount} products</span>
                    <span className="created-date">{category.createdAt}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {filteredCategories.length === 0 && (
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
      </div>
    </AdminLayout>
  );
}
