import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { IconArrowLeft, IconEdit, IconTrash2, IconTag, IconDollarSign, IconFileText } from '../components/icons';

interface Product {
    id: number;
    name: string;
    shortDescription: string;
    longDescription: string;
    price: number;
    stock: number;
    category: string;
    image?: string;
    created_at: string;
}

export default function AdminProductDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Sample product data - in real app, this would come from API
    const sampleProducts: Product[] = [
        {
            id: 1,
            name: "Premium Coffee Beans",
            shortDescription: "High-quality arabica coffee beans",
            longDescription: "Carefully selected arabica coffee beans from the finest plantations. Perfect for coffee enthusiasts who appreciate quality and flavor. These beans are sourced from sustainable farms and roasted to perfection.",
            price: 25.99,
            stock: 50,
            category: "Beverages",
            created_at: "2024-01-15"
        },
        {
            id: 2,
            name: "Organic Green Tea",
            shortDescription: "Premium organic green tea leaves",
            longDescription: "Hand-picked organic green tea leaves with antioxidant properties. Great for health-conscious individuals. This tea is known for its delicate flavor and numerous health benefits.",
            price: 18.50,
            stock: 0,
            category: "Beverages",
            created_at: "2024-01-14"
        },
        {
            id: 3,
            name: "Artisan Chocolate Bar",
            shortDescription: "Dark chocolate with sea salt",
            longDescription: "Premium dark chocolate bar with a hint of sea salt. Made with the finest cocoa beans for an exquisite taste experience. This chocolate is crafted by master chocolatiers using traditional techniques.",
            price: 12.99,
            stock: 25,
            category: "Snacks",
            created_at: "2024-01-13"
        }
    ];

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 500));
                
                const productId = parseInt(id || '0');
                const foundProduct = sampleProducts.find(p => p.id === productId);
                
                if (foundProduct) {
                    setProduct(foundProduct);
                } else {
                    setError('Product not found');
                }
            } catch (err) {
                setError('Failed to load product details');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProduct();
        }
    }, [id]);

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            // In real app, this would make an API call
            navigate('/admin-products');
        }
    };

    const getStockStatus = (stock: number) => {
        return stock > 0 ? 'In stock' : 'Out of stock';
    };

    const getStockStatusClass = (stock: number) => {
        return stock > 0 ? 'in-stock' : 'out-of-stock';
    };

    if (loading) {
        return (
            <AdminLayout title="Product Details">
                <div className="admin-product-detail-page">
                    <div className="loading-state">
                        <div>Loading product details...</div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    if (error || !product) {
        return (
            <AdminLayout title="Product Details">
                <div className="admin-product-detail-page">
                    <div className="error-state">
                        <div>❌</div>
                        <h3>Product not found</h3>
                        <p>The product you're looking for doesn't exist.</p>
                        <button className="btn-back" onClick={() => navigate('/admin-products')}>
                            <IconArrowLeft />
                            Back to Products
                        </button>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Product Details">
            <div className="admin-product-detail-page">
                {/* Header */}
                <div className="product-detail-header">
                    <button className="btn-back" onClick={() => navigate('/admin-products')}>
                        <IconArrowLeft />
                        Back to Products
                    </button>
                    <div className="header-actions">
                        <button className="btn-edit">
                            <IconEdit />
                            Edit Product
                        </button>
                        <button className="btn-delete" onClick={handleDelete}>
                            <IconTrash2 />
                            Delete Product
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="product-detail-content">
                    <div className="product-detail-main">
                        {/* Product Image */}
                        <div className="product-image-section">
                            <div className="product-image-container">
                                📦
                                <div className="product-status-badge">
                                    <span className={`status-badge ${getStockStatusClass(product.stock)}`}>
                                        {getStockStatus(product.stock)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Product Info */}
                        <div className="product-info-section">
                            <div className="product-header">
                                <h1>{product.name}</h1>
                                <div className="product-meta">
                                    <span className="product-id">ID: #{product.id}</span>
                                    <span className="product-date">Created: {product.created_at}</span>
                                </div>
                            </div>
                            <div className="product-description">
                                <h3>Description</h3>
                                <p>{product.longDescription}</p>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="product-detail-sidebar">
                        {/* Product Details */}
                        <div className="detail-card">
                            <h3>Product Details</h3>
                            <div className="detail-item">
                                <IconTag />
                                <div className="detail-content">
                                    <div className="detail-label">Category</div>
                                    <div className="detail-value">{product.category}</div>
                                </div>
                            </div>
                            <div className="detail-item">
                                <IconDollarSign />
                                <div className="detail-content">
                                    <div className="detail-label">Price</div>
                                    <div className="detail-value">${product.price.toFixed(2)}</div>
                                </div>
                            </div>
                            <div className="detail-item">
                                <IconFileText />
                                <div className="detail-content">
                                    <div className="detail-label">Stock</div>
                                    <div className="detail-value">{product.stock} units</div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="detail-card">
                            <h3>Quick Actions</h3>
                            <div className="quick-actions">
                                <button className="quick-action-btn">
                                    <IconEdit />
                                    Edit Product
                                </button>
                                <button className="quick-action-btn">
                                    📊
                                    View Analytics
                                </button>
                                <button className="quick-action-btn">
                                    📦
                                    Manage Stock
                                </button>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="detail-card">
                            <h3>Statistics</h3>
                            <div className="stats-grid">
                                <div className="detail-item">
                                    <div className="detail-content">
                                        <div className="detail-label">Orders</div>
                                        <div className="detail-value">24</div>
                                    </div>
                                </div>
                                <div className="detail-item">
                                    <div className="detail-content">
                                        <div className="detail-label">Views</div>
                                        <div className="detail-value">156</div>
                                    </div>
                                </div>
                                <div className="detail-item">
                                    <div className="detail-content">
                                        <div className="detail-label">Reviews</div>
                                        <div className="detail-value">8</div>
                                    </div>
                                </div>
                                <div className="detail-item">
                                    <div className="detail-content">
                                        <div className="detail-label">Rating</div>
                                        <div className="detail-value">4.5</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
