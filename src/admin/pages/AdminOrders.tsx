import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { IconSearch, IconFilter, IconList, IconGrid, IconEye, IconTrash2, IconMoreVertical } from '../components/icons';

// Order status type
type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

// Order interface
interface Order {
    id: string;
    orderCode: string;
    productCount: number;
    orderValue: number;
    status: OrderStatus;
    createdAt: string;
    createdBy: {
        name: string;
        email: string;
        avatar?: string;
    };
}

// Mock data
const mockOrders: Order[] = [
    {
        id: '1',
        orderCode: 'ORD-2024-001',
        productCount: 3,
        orderValue: 299.99,
        status: 'completed',
        createdAt: '2024-01-15',
        createdBy: {
            name: 'John Doe',
            email: 'john.doe@example.com',
        }
    },
    {
        id: '2',
        orderCode: 'ORD-2024-002',
        productCount: 5,
        orderValue: 499.50,
        status: 'processing',
        createdAt: '2024-01-14',
        createdBy: {
            name: 'Jane Smith',
            email: 'jane.smith@example.com',
        }
    },
    {
        id: '3',
        orderCode: 'ORD-2024-003',
        productCount: 2,
        orderValue: 150.00,
        status: 'pending',
        createdAt: '2024-01-13',
        createdBy: {
            name: 'Mike Johnson',
            email: 'mike.j@example.com',
        }
    },
    {
        id: '4',
        orderCode: 'ORD-2024-004',
        productCount: 8,
        orderValue: 750.25,
        status: 'completed',
        createdAt: '2024-01-12',
        createdBy: {
            name: 'Sarah Wilson',
            email: 'sarah.w@example.com',
        }
    },
    {
        id: '5',
        orderCode: 'ORD-2024-005',
        productCount: 1,
        orderValue: 89.99,
        status: 'cancelled',
        createdAt: '2024-01-11',
        createdBy: {
            name: 'Robert Brown',
            email: 'robert.b@example.com',
        }
    },
];

export default function AdminOrders() {
    const [orders, setOrders] = useState<Order[]>(mockOrders);
    const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile view
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

    // Filter orders
    const filteredOrders = orders.filter(order => {
        const matchesSearch = 
            order.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.createdBy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.createdBy.email.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
        
        return matchesSearch && matchesStatus;
    });

    // Get status display
    const getStatusDisplay = (status: OrderStatus) => {
        const statusConfig = {
            pending: { label: 'Pending', class: 'status-pending' },
            processing: { label: 'Processing', class: 'status-processing' },
            completed: { label: 'Completed', class: 'status-completed' },
            cancelled: { label: 'Cancelled', class: 'status-cancelled' },
        };
        return statusConfig[status];
    };

    // Handle view detail
    const handleViewDetail = (orderId: string) => {
        console.log('View order detail:', orderId);
        // TODO: Navigate to order detail page
    };

    // Handle delete
    const handleDelete = (orderId: string) => {
        if (confirm('Are you sure you want to delete this order?')) {
            setOrders(orders.filter(o => o.id !== orderId));
            setActiveDropdown(null);
        }
    };

    // Toggle dropdown
    const toggleDropdown = (orderId: string) => {
        setActiveDropdown(activeDropdown === orderId ? null : orderId);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.unified-dropdown')) {
                setActiveDropdown(null);
            }
            if (!target.closest('.filter-dropdown-container')) {
                setShowFilterDropdown(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <AdminLayout title="Orders Management">
            <div className="admin-orders-page">
                {/* Toolbar */}
                <div className="orders-toolbar">
                    <div className="toolbar-left">
                        {/* Search */}
                        <div className="search-container">
                            <IconSearch />
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search orders..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Filter */}
                        <div className="filter-dropdown-container">
                            <button 
                                className="btn-filter"
                                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                                title="Filter by status"
                            >
                                <IconFilter />
                            </button>
                            {showFilterDropdown && (
                                <div className="filter-dropdown-menu">
                                    <button 
                                        className={`filter-option ${filterStatus === 'all' ? 'active' : ''}`}
                                        onClick={() => {
                                            setFilterStatus('all');
                                            setShowFilterDropdown(false);
                                        }}
                                    >
                                        All Orders
                                    </button>
                                    <button 
                                        className={`filter-option ${filterStatus === 'pending' ? 'active' : ''}`}
                                        onClick={() => {
                                            setFilterStatus('pending');
                                            setShowFilterDropdown(false);
                                        }}
                                    >
                                        Pending
                                    </button>
                                    <button 
                                        className={`filter-option ${filterStatus === 'processing' ? 'active' : ''}`}
                                        onClick={() => {
                                            setFilterStatus('processing');
                                            setShowFilterDropdown(false);
                                        }}
                                    >
                                        Processing
                                    </button>
                                    <button 
                                        className={`filter-option ${filterStatus === 'completed' ? 'active' : ''}`}
                                        onClick={() => {
                                            setFilterStatus('completed');
                                            setShowFilterDropdown(false);
                                        }}
                                    >
                                        Completed
                                    </button>
                                    <button 
                                        className={`filter-option ${filterStatus === 'cancelled' ? 'active' : ''}`}
                                        onClick={() => {
                                            setFilterStatus('cancelled');
                                            setShowFilterDropdown(false);
                                        }}
                                    >
                                        Cancelled
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="toolbar-right">
                        {/* View Toggle */}
                        <div className="view-toggle desktop-only">
                            <button
                                className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                                onClick={() => !isMobile && setViewMode('table')}
                                disabled={isMobile}
                                title="Table view"
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
                    </div>
                </div>


                {/* Table View */}
                {viewMode === 'table' && !isMobile ? (
                    <div className="orders-table-container">
                        <table className="orders-table">
                            <thead>
                                <tr>
                                    <th>Order Code</th>
                                    <th>Products</th>
                                    <th>Order Value</th>
                                    <th>Status</th>
                                    <th>Created Date</th>
                                    <th>Created By</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map((order) => (
                                    <tr key={order.id}>
                                        <td>
                                            <span className="order-code">{order.orderCode}</span>
                                        </td>
                                        <td>
                                            <span className="product-count">{order.productCount} items</span>
                                        </td>
                                        <td>
                                            <span className="order-value">${order.orderValue.toFixed(2)}</span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${getStatusDisplay(order.status).class}`}>
                                                {getStatusDisplay(order.status).label}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="order-date">{order.createdAt}</span>
                                        </td>
                                        <td>
                                            <div className="user-info">
                                                <div className="user-avatar">
                                                    {order.createdBy.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="user-details">
                                                    <div className="user-name">{order.createdBy.name}</div>
                                                    <div className="user-email">{order.createdBy.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={`unified-dropdown ${activeDropdown === order.id ? 'active' : ''}`}>
                                                <button
                                                    className="unified-more-btn"
                                                    onClick={() => toggleDropdown(order.id)}
                                                >
                                                    <IconMoreVertical />
                                                </button>
                                                {activeDropdown === order.id && (
                                                    <div className="unified-dropdown-menu">
                                                        <button
                                                            className="unified-dropdown-item"
                                                            onClick={() => handleViewDetail(order.id)}
                                                        >
                                                            <IconEye />
                                                            View Detail
                                                        </button>
                                                        <button
                                                            className="unified-dropdown-item danger"
                                                            onClick={() => handleDelete(order.id)}
                                                        >
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

                        {filteredOrders.length === 0 && (
                            <div className="empty-state">
                                <div className="empty-icon">📦</div>
                                <p>No orders found</p>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Card View */
                    <div className="orders-grid">
                        {filteredOrders.map((order) => (
                            <div key={order.id} className="order-card">
                                <div className="card-header">
                                    <div className="card-title">
                                        <span className="order-code">{order.orderCode}</span>
                                        <span className={`status-badge ${getStatusDisplay(order.status).class}`}>
                                            {getStatusDisplay(order.status).label}
                                        </span>
                                    </div>
                                    <div className={`unified-dropdown ${activeDropdown === order.id ? 'active' : ''}`}>
                                        <button
                                            className="unified-more-btn"
                                            onClick={() => toggleDropdown(order.id)}
                                        >
                                            <IconMoreVertical />
                                        </button>
                                        {activeDropdown === order.id && (
                                            <div className="unified-dropdown-menu">
                                                <button
                                                    className="unified-dropdown-item"
                                                    onClick={() => handleViewDetail(order.id)}
                                                >
                                                    <IconEye />
                                                    View Detail
                                                </button>
                                                <button
                                                    className="unified-dropdown-item danger"
                                                    onClick={() => handleDelete(order.id)}
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
                                        <span className="card-label">Products:</span>
                                        <span className="card-value">{order.productCount} items</span>
                                    </div>
                                    <div className="card-row">
                                        <span className="card-label">Order Value:</span>
                                        <span className="card-value order-value">${order.orderValue.toFixed(2)}</span>
                                    </div>
                                    <div className="card-row">
                                        <span className="card-label">Created Date:</span>
                                        <span className="card-value">{order.createdAt}</span>
                                    </div>
                                </div>

                                <div className="card-footer">
                                    <div className="user-info">
                                        <div className="user-avatar">
                                            {order.createdBy.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="user-details">
                                            <div className="user-name">{order.createdBy.name}</div>
                                            <div className="user-email">{order.createdBy.email}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {filteredOrders.length === 0 && (
                            <div className="empty-state">
                                <div className="empty-icon">📦</div>
                                <p>No orders found</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
