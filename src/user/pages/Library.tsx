import { useState } from 'react';
import UserLayout from '../components/UserLayout';
import { IconSearch, IconFilter, IconLibrary, IconCalendar, IconUser } from '../../admin/components/icons';
import AuthFooter from '../../components/AuthFooter';

interface Post {
    id: number;
    title: string;
    excerpt: string;
    content: string;
    category: 'news' | 'community' | 'event' | 'announcement';
    author: string;
    publishedAt: string;
    imageUrl?: string;
    views: number;
    featured: boolean;
}

export default function Library() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<'all' | 'news' | 'community' | 'event' | 'announcement'>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);

    // Mock data - will be replaced with API calls later
    const [posts] = useState<Post[]>([
        {
            id: 1,
            title: 'New Product Line Launch',
            excerpt: 'Discover our latest collection featuring innovative designs and premium quality materials.',
            content: 'We are thrilled to announce the launch of our new product line. This collection represents months of research and development, bringing you the finest quality products that combine style and functionality.',
            category: 'news',
            author: 'Admin Team',
            publishedAt: '2025-01-15T10:00:00',
            imageUrl: '/images/logo.png',
            views: 245,
            featured: true
        },
        {
            id: 2,
            title: 'Community Meetup This Weekend',
            excerpt: 'Join us for an exciting community event with networking opportunities and exclusive deals.',
            content: 'We\'re hosting a special community meetup this weekend. Connect with fellow members, share experiences, and enjoy exclusive deals available only at this event.',
            category: 'event',
            author: 'Events Team',
            publishedAt: '2025-01-14T15:30:00',
            views: 189,
            featured: true
        },
        {
            id: 3,
            title: 'Success Stories: Member Spotlight',
            excerpt: 'Read about how our members are achieving their goals and building successful businesses.',
            content: 'This month we\'re highlighting some amazing success stories from our community members. Learn about their journey and get inspired.',
            category: 'community',
            author: 'Community Manager',
            publishedAt: '2025-01-13T09:20:00',
            views: 312,
            featured: false
        },
        {
            id: 4,
            title: 'Important Policy Update',
            excerpt: 'Please review the latest updates to our policies and procedures.',
            content: 'We have made some important updates to our policies. Please take a moment to review these changes as they may affect your account.',
            category: 'announcement',
            author: 'Admin Team',
            publishedAt: '2025-01-12T11:45:00',
            views: 156,
            featured: false
        },
        {
            id: 5,
            title: 'Tips for Better Sales Performance',
            excerpt: 'Learn proven strategies to improve your sales performance and increase your earnings.',
            content: 'In this article, we share valuable tips and strategies that have helped our top performers achieve outstanding results.',
            category: 'community',
            author: 'Sales Team',
            publishedAt: '2025-01-11T14:15:00',
            views: 278,
            featured: false
        },
        {
            id: 6,
            title: 'Upcoming Training Webinar',
            excerpt: 'Register now for our free training webinar on advanced sales techniques.',
            content: 'Don\'t miss this opportunity to learn from industry experts. Our upcoming webinar covers advanced sales techniques and strategies.',
            category: 'event',
            author: 'Training Team',
            publishedAt: '2025-01-10T16:00:00',
            views: 201,
            featured: false
        }
    ]);

    const filteredPosts = posts.filter(post => {
        const matchesSearch = searchQuery === '' || 
            post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === 'all' || post.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const featuredPosts = filteredPosts.filter(post => post.featured);
    const regularPosts = filteredPosts.filter(post => !post.featured);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'news': return '#3b82f6';
            case 'community': return '#10b981';
            case 'event': return '#f59e0b';
            case 'announcement': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getCategoryLabel = (category: string) => {
        switch (category) {
            case 'news': return 'News';
            case 'community': return 'Community';
            case 'event': return 'Event';
            case 'announcement': return 'Announcement';
            default: return category;
        }
    };

    return (
        <UserLayout title="Library">
            <div className="library-page">
                {/* Header */}
                <div className="library-header">
                    <div className="header-content">
                        <div>
                            <h1>Library</h1>
                            <p>Stay updated with news, community updates, and events</p>
                        </div>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="library-toolbar">
                    <div className="toolbar-left">
                        <div className="search-container">
                            <IconSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search posts..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input"
                            />
                        </div>
                        <select 
                            value={filterCategory} 
                            onChange={(e) => setFilterCategory(e.target.value as any)}
                            className="filter-select"
                        >
                            <option value="all">All Categories</option>
                            <option value="news">News</option>
                            <option value="community">Community</option>
                            <option value="event">Events</option>
                            <option value="announcement">Announcements</option>
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
                <div className="library-content">
                    {/* Featured Posts */}
                    {featuredPosts.length > 0 && (
                        <section className="featured-section">
                            <h2 className="section-title">Featured</h2>
                            <div className={`posts-grid ${viewMode}`}>
                                {featuredPosts.map((post) => (
                                    <article 
                                        key={post.id} 
                                        className={`post-card featured ${viewMode}`}
                                        onClick={() => setSelectedPost(post)}
                                    >
                                        {post.imageUrl && (
                                            <div className="post-image">
                                                <img src={post.imageUrl} alt={post.title} />
                                            </div>
                                        )}
                                        <div className="post-content">
                                            <div className="post-meta">
                                                <span 
                                                    className="category-badge"
                                                    style={{ backgroundColor: getCategoryColor(post.category) + '20', color: getCategoryColor(post.category) }}
                                                >
                                                    {getCategoryLabel(post.category)}
                                                </span>
                                                <span className="post-date">
                                                    <IconCalendar style={{ width: '14px', height: '14px' }} />
                                                    {formatDate(post.publishedAt)}
                                                </span>
                                            </div>
                                            <h3 className="post-title">{post.title}</h3>
                                            <p className="post-excerpt">{post.excerpt}</p>
                                            <div className="post-footer">
                                                <span className="post-author">
                                                    <IconUser style={{ width: '14px', height: '14px' }} />
                                                    {post.author}
                                                </span>
                                                <span className="post-views">{post.views} views</span>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Regular Posts */}
                    {regularPosts.length > 0 && (
                        <section className="posts-section">
                            {featuredPosts.length > 0 && <h2 className="section-title">All Posts</h2>}
                            <div className={`posts-grid ${viewMode}`}>
                                {regularPosts.map((post) => (
                                    <article 
                                        key={post.id} 
                                        className={`post-card ${viewMode}`}
                                        onClick={() => setSelectedPost(post)}
                                    >
                                        {post.imageUrl && viewMode === 'grid' && (
                                            <div className="post-image">
                                                <img src={post.imageUrl} alt={post.title} />
                                            </div>
                                        )}
                                        <div className="post-content">
                                            <div className="post-meta">
                                                <span 
                                                    className="category-badge"
                                                    style={{ backgroundColor: getCategoryColor(post.category) + '20', color: getCategoryColor(post.category) }}
                                                >
                                                    {getCategoryLabel(post.category)}
                                                </span>
                                                <span className="post-date">
                                                    <IconCalendar style={{ width: '14px', height: '14px' }} />
                                                    {formatDate(post.publishedAt)}
                                                </span>
                                            </div>
                                            <h3 className="post-title">{post.title}</h3>
                                            <p className="post-excerpt">{post.excerpt}</p>
                                            <div className="post-footer">
                                                <span className="post-author">
                                                    <IconUser style={{ width: '14px', height: '14px' }} />
                                                    {post.author}
                                                </span>
                                                <span className="post-views">{post.views} views</span>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </section>
                    )}

                    {filteredPosts.length === 0 && (
                        <div className="empty-state">
                            <IconLibrary style={{ fontSize: '64px', color: '#9ca3af', marginBottom: '24px' }} />
                            <h3>No posts found</h3>
                            <p>Try adjusting your search or filter criteria</p>
                        </div>
                    )}
                </div>

                {/* Post Detail Modal */}
                {selectedPost && (
                    <div className="modal-overlay" onClick={() => setSelectedPost(null)}>
                        <div className="modal-content post-detail-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{selectedPost.title}</h2>
                                <button className="modal-close" onClick={() => setSelectedPost(null)}>✕</button>
                            </div>
                            <div className="modal-body">
                                <div className="post-detail-meta">
                                    <span 
                                        className="category-badge"
                                        style={{ backgroundColor: getCategoryColor(selectedPost.category) + '20', color: getCategoryColor(selectedPost.category) }}
                                    >
                                        {getCategoryLabel(selectedPost.category)}
                                    </span>
                                    <span className="post-date">
                                        <IconCalendar style={{ width: '14px', height: '14px' }} />
                                        {formatDate(selectedPost.publishedAt)}
                                    </span>
                                    <span className="post-author">
                                        <IconUser style={{ width: '14px', height: '14px' }} />
                                        {selectedPost.author}
                                    </span>
                                    <span className="post-views">{selectedPost.views} views</span>
                                </div>
                                {selectedPost.imageUrl && (
                                    <div className="post-detail-image">
                                        <img src={selectedPost.imageUrl} alt={selectedPost.title} />
                                    </div>
                                )}
                                <div className="post-detail-content">
                                    <p>{selectedPost.content}</p>
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

