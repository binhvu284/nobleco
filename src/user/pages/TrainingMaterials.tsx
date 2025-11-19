import { useState } from 'react';
import UserLayout from '../components/UserLayout';
import { IconSearch, IconFilter, IconBook, IconFileText, IconDownload, IconPlay, IconCalendar, IconUser } from '../../admin/components/icons';
import AuthFooter from '../../components/AuthFooter';

interface Material {
    id: number;
    title: string;
    description: string;
    type: 'document' | 'video' | 'presentation' | 'guide';
    category: 'product' | 'sales' | 'brand' | 'general';
    author: string;
    publishedAt: string;
    fileUrl?: string;
    duration?: string;
    pages?: number;
    downloads: number;
    featured: boolean;
}

export default function TrainingMaterials() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'document' | 'video' | 'presentation' | 'guide'>('all');
    const [filterCategory, setFilterCategory] = useState<'all' | 'product' | 'sales' | 'brand' | 'general'>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

    // Mock data - will be replaced with API calls later
    const [materials] = useState<Material[]>([
        {
            id: 1,
            title: 'Product Knowledge Guide 2025',
            description: 'Comprehensive guide covering all product features, specifications, and selling points.',
            type: 'document',
            category: 'product',
            author: 'Product Team',
            publishedAt: '2025-01-15T10:00:00',
            fileUrl: '#',
            pages: 45,
            downloads: 342,
            featured: true
        },
        {
            id: 2,
            title: 'Sales Techniques Masterclass',
            description: 'Learn advanced sales techniques and strategies from industry experts.',
            type: 'video',
            category: 'sales',
            author: 'Sales Training Team',
            publishedAt: '2025-01-14T15:30:00',
            fileUrl: '#',
            duration: '45 min',
            downloads: 289,
            featured: true
        },
        {
            id: 3,
            title: 'Brand Story Presentation',
            description: 'Understanding our brand values, mission, and how to communicate them effectively.',
            type: 'presentation',
            category: 'brand',
            author: 'Marketing Team',
            publishedAt: '2025-01-13T09:20:00',
            fileUrl: '#',
            pages: 28,
            downloads: 156,
            featured: false
        },
        {
            id: 4,
            title: 'Customer Service Best Practices',
            description: 'Essential guidelines for providing excellent customer service and building relationships.',
            type: 'guide',
            category: 'sales',
            author: 'Customer Success Team',
            publishedAt: '2025-01-12T11:45:00',
            fileUrl: '#',
            pages: 32,
            downloads: 201,
            featured: false
        },
        {
            id: 5,
            title: 'New Product Launch Training',
            description: 'Complete training module for the latest product launch, including features and positioning.',
            type: 'video',
            category: 'product',
            author: 'Training Team',
            publishedAt: '2025-01-11T14:15:00',
            fileUrl: '#',
            duration: '30 min',
            downloads: 278,
            featured: false
        },
        {
            id: 6,
            title: 'Sales Process Documentation',
            description: 'Step-by-step guide to our sales process from initial contact to closing.',
            type: 'document',
            category: 'sales',
            author: 'Sales Operations',
            publishedAt: '2025-01-10T16:00:00',
            fileUrl: '#',
            pages: 18,
            downloads: 234,
            featured: false
        }
    ]);

    const filteredMaterials = materials.filter(material => {
        const matchesSearch = searchQuery === '' || 
            material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            material.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || material.type === filterType;
        const matchesCategory = filterCategory === 'all' || material.category === filterCategory;
        return matchesSearch && matchesType && matchesCategory;
    });

    const featuredMaterials = filteredMaterials.filter(m => m.featured);
    const regularMaterials = filteredMaterials.filter(m => !m.featured);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'video': return <IconPlay />;
            case 'document': return <IconFileText />;
            case 'presentation': return <IconFileText />;
            case 'guide': return <IconBook />;
            default: return <IconFileText />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'video': return '#ef4444';
            case 'document': return '#3b82f6';
            case 'presentation': return '#8b5cf6';
            case 'guide': return '#10b981';
            default: return '#6b7280';
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'product': return '#3b82f6';
            case 'sales': return '#10b981';
            case 'brand': return '#f59e0b';
            case 'general': return '#6b7280';
            default: return '#6b7280';
        }
    };

    const getCategoryLabel = (category: string) => {
        return category.charAt(0).toUpperCase() + category.slice(1);
    };

    return (
        <UserLayout title="Training Materials">
            <div className="training-materials-page">
                {/* Header */}
                <div className="training-header">
                    <div className="header-content">
                        <div>
                            <h1>Training Materials</h1>
                            <p>Access documents, videos, and guides to enhance your knowledge and skills</p>
                        </div>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="training-toolbar">
                    <div className="toolbar-left">
                        <div className="search-container">
                            <IconSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search materials..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input"
                            />
                        </div>
                        <select 
                            value={filterType} 
                            onChange={(e) => setFilterType(e.target.value as any)}
                            className="filter-select"
                        >
                            <option value="all">All Types</option>
                            <option value="document">Documents</option>
                            <option value="video">Videos</option>
                            <option value="presentation">Presentations</option>
                            <option value="guide">Guides</option>
                        </select>
                        <select 
                            value={filterCategory} 
                            onChange={(e) => setFilterCategory(e.target.value as any)}
                            className="filter-select"
                        >
                            <option value="all">All Categories</option>
                            <option value="product">Product</option>
                            <option value="sales">Sales</option>
                            <option value="brand">Brand</option>
                            <option value="general">General</option>
                        </select>
                    </div>
                    <div className="toolbar-right">
                        <div className="view-toggle">
                            <button
                                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                onClick={() => setViewMode('grid')}
                                title="Grid view"
                            >
                                Grid
                            </button>
                            <button
                                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                                onClick={() => setViewMode('list')}
                                title="List view"
                            >
                                List
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="training-content">
                    {/* Featured Materials */}
                    {featuredMaterials.length > 0 && (
                        <section className="featured-section">
                            <h2 className="section-title">Featured</h2>
                            <div className={`materials-grid ${viewMode}`}>
                                {featuredMaterials.map((material) => (
                                    <article 
                                        key={material.id} 
                                        className={`material-card featured ${viewMode}`}
                                        onClick={() => setSelectedMaterial(material)}
                                    >
                                        <div className="material-icon" style={{ color: getTypeColor(material.type) }}>
                                            {getTypeIcon(material.type)}
                                        </div>
                                        <div className="material-content">
                                            <div className="material-meta">
                                                <span 
                                                    className="category-badge"
                                                    style={{ backgroundColor: getCategoryColor(material.category) + '20', color: getCategoryColor(material.category) }}
                                                >
                                                    {getCategoryLabel(material.category)}
                                                </span>
                                                <span className="material-date">
                                                    <IconCalendar style={{ width: '14px', height: '14px' }} />
                                                    {formatDate(material.publishedAt)}
                                                </span>
                                            </div>
                                            <h3 className="material-title">{material.title}</h3>
                                            <p className="material-description">{material.description}</p>
                                            <div className="material-footer">
                                                <span className="material-author">
                                                    <IconUser style={{ width: '14px', height: '14px' }} />
                                                    {material.author}
                                                </span>
                                                <span className="material-stats">
                                                    {material.duration && <span>{material.duration}</span>}
                                                    {material.pages && <span>{material.pages} pages</span>}
                                                    <span>{material.downloads} downloads</span>
                                                </span>
                                            </div>
                                        </div>
                                        <button className="material-action-btn">
                                            {material.type === 'video' ? <IconPlay /> : <IconDownload />}
                                        </button>
                                    </article>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Regular Materials */}
                    {regularMaterials.length > 0 && (
                        <section className="materials-section">
                            {featuredMaterials.length > 0 && <h2 className="section-title">All Materials</h2>}
                            <div className={`materials-grid ${viewMode}`}>
                                {regularMaterials.map((material) => (
                                    <article 
                                        key={material.id} 
                                        className={`material-card ${viewMode}`}
                                        onClick={() => setSelectedMaterial(material)}
                                    >
                                        <div className="material-icon" style={{ color: getTypeColor(material.type) }}>
                                            {getTypeIcon(material.type)}
                                        </div>
                                        <div className="material-content">
                                            <div className="material-meta">
                                                <span 
                                                    className="category-badge"
                                                    style={{ backgroundColor: getCategoryColor(material.category) + '20', color: getCategoryColor(material.category) }}
                                                >
                                                    {getCategoryLabel(material.category)}
                                                </span>
                                                <span className="material-date">
                                                    <IconCalendar style={{ width: '14px', height: '14px' }} />
                                                    {formatDate(material.publishedAt)}
                                                </span>
                                            </div>
                                            <h3 className="material-title">{material.title}</h3>
                                            <p className="material-description">{material.description}</p>
                                            <div className="material-footer">
                                                <span className="material-author">
                                                    <IconUser style={{ width: '14px', height: '14px' }} />
                                                    {material.author}
                                                </span>
                                                <span className="material-stats">
                                                    {material.duration && <span>{material.duration}</span>}
                                                    {material.pages && <span>{material.pages} pages</span>}
                                                    <span>{material.downloads} downloads</span>
                                                </span>
                                            </div>
                                        </div>
                                        <button className="material-action-btn">
                                            {material.type === 'video' ? <IconPlay /> : <IconDownload />}
                                        </button>
                                    </article>
                                ))}
                            </div>
                        </section>
                    )}

                    {filteredMaterials.length === 0 && (
                        <div className="empty-state">
                            <IconBook style={{ fontSize: '64px', color: '#9ca3af', marginBottom: '24px' }} />
                            <h3>No materials found</h3>
                            <p>Try adjusting your search or filter criteria</p>
                        </div>
                    )}
                </div>

                {/* Material Detail Modal */}
                {selectedMaterial && (
                    <div className="modal-overlay" onClick={() => setSelectedMaterial(null)}>
                        <div className="modal-content material-detail-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{selectedMaterial.title}</h2>
                                <button className="modal-close" onClick={() => setSelectedMaterial(null)}>✕</button>
                            </div>
                            <div className="modal-body">
                                <div className="material-detail-meta">
                                    <span 
                                        className="category-badge"
                                        style={{ backgroundColor: getCategoryColor(selectedMaterial.category) + '20', color: getCategoryColor(selectedMaterial.category) }}
                                    >
                                        {getCategoryLabel(selectedMaterial.category)}
                                    </span>
                                    <span className="material-date">
                                        <IconCalendar style={{ width: '14px', height: '14px' }} />
                                        {formatDate(selectedMaterial.publishedAt)}
                                    </span>
                                    <span className="material-author">
                                        <IconUser style={{ width: '14px', height: '14px' }} />
                                        {selectedMaterial.author}
                                    </span>
                                    <span className="material-stats">
                                        {selectedMaterial.duration && <span>{selectedMaterial.duration}</span>}
                                        {selectedMaterial.pages && <span>{selectedMaterial.pages} pages</span>}
                                        <span>{selectedMaterial.downloads} downloads</span>
                                    </span>
                                </div>
                                <div className="material-detail-content">
                                    <p>{selectedMaterial.description}</p>
                                </div>
                                <div className="material-detail-actions">
                                    <button className="btn-primary">
                                        {selectedMaterial.type === 'video' ? (
                                            <>
                                                <IconPlay /> Watch Video
                                            </>
                                        ) : (
                                            <>
                                                <IconDownload /> Download
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {/* Temporary footer for proof - will be removed later */}
            <AuthFooter />
        </UserLayout>
    );
}

