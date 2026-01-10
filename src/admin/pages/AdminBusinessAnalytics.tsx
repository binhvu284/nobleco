import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import InventoryByCategorySection from '../components/InventoryByCategorySection';
import InventoryByPriceLevelSection from '../components/InventoryByPriceLevelSection';
import { useTranslation } from '../../shared/contexts/TranslationContext';
import { getCurrentUser } from '../../auth';
import { useNavigate } from 'react-router-dom';

// Mock data for development - will be replaced with API data
const MOCK_JEWELRY_CATEGORIES = [
    { id: 1, name: 'Rings' },
    { id: 2, name: 'Necklaces' },
    { id: 3, name: 'Earrings' },
    { id: 4, name: 'Bracelets' },
    { id: 5, name: 'Pendants' }
];

const MOCK_CENTERSTONE_CATEGORIES = [
    { id: 1, name: 'Diamond' },
    { id: 2, name: 'Ruby' },
    { id: 3, name: 'Sapphire' },
    { id: 4, name: 'Emerald' }
];

const MOCK_JEWELRY_DATA = [
    { categoryId: 1, categoryName: 'Rings', totalStock: 150, stockProportion: 35.3, inventoryValue: 450000000, valueProportion: 45.0, averagePrice: 3000000 },
    { categoryId: 2, categoryName: 'Necklaces', totalStock: 80, stockProportion: 18.8, inventoryValue: 280000000, valueProportion: 28.0, averagePrice: 3500000 },
    { categoryId: 3, categoryName: 'Earrings', totalStock: 120, stockProportion: 28.2, inventoryValue: 180000000, valueProportion: 18.0, averagePrice: 1500000 },
    { categoryId: 4, categoryName: 'Bracelets', totalStock: 50, stockProportion: 11.8, inventoryValue: 60000000, valueProportion: 6.0, averagePrice: 1200000 },
    { categoryId: 5, categoryName: 'Pendants', totalStock: 25, stockProportion: 5.9, inventoryValue: 30000000, valueProportion: 3.0, averagePrice: 1200000 }
];

const MOCK_CENTERSTONE_DATA = [
    { categoryId: 1, categoryName: 'Diamond', totalStock: 50, stockProportion: 45.5, inventoryValue: 2500000000, valueProportion: 62.5, averagePrice: 50000000 },
    { categoryId: 2, categoryName: 'Ruby', totalStock: 30, stockProportion: 27.3, inventoryValue: 900000000, valueProportion: 22.5, averagePrice: 30000000 },
    { categoryId: 3, categoryName: 'Sapphire', totalStock: 20, stockProportion: 18.2, inventoryValue: 400000000, valueProportion: 10.0, averagePrice: 20000000 },
    { categoryId: 4, categoryName: 'Emerald', totalStock: 10, stockProportion: 9.0, inventoryValue: 200000000, valueProportion: 5.0, averagePrice: 20000000 }
];

export default function AdminBusinessAnalytics() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const currentUser = getCurrentUser();
    const [loading, setLoading] = useState(true);
    const [dataLoading, setDataLoading] = useState(false);

    // State for inventory data
    const [jewelryCategories, setJewelryCategories] = useState(MOCK_JEWELRY_CATEGORIES);
    const [centerstoneCategories, setCenterstoneCategories] = useState(MOCK_CENTERSTONE_CATEGORIES);
    const [jewelryData, setJewelryData] = useState(MOCK_JEWELRY_DATA);
    const [centerstoneData, setCenterstoneData] = useState(MOCK_CENTERSTONE_DATA);

    // Check if user is admin (not coworker)
    useEffect(() => {
        if (currentUser?.role === 'coworker') {
            navigate('/admin-access-denied');
        } else {
            setLoading(false);
            // TODO: Fetch real data from API
            // fetchInventoryData();
        }
    }, [currentUser, navigate]);

    // TODO: Implement API data fetching
    // const fetchInventoryData = async () => {
    //     setDataLoading(true);
    //     try {
    //         const authToken = localStorage.getItem('nobleco_auth_token');
    //         const response = await fetch('/api/admin/inventory-analytics', {
    //             headers: { 'Authorization': `Bearer ${authToken}` }
    //         });
    //         const result = await response.json();
    //         if (result.success) {
    //             setJewelryCategories(result.data.jewelryCategories);
    //             setCenterstoneCategories(result.data.centerstoneCategories);
    //             setJewelryData(result.data.jewelryData);
    //             setCenterstoneData(result.data.centerstoneData);
    //         }
    //     } catch (error) {
    //         console.error('Error fetching inventory data:', error);
    //     } finally {
    //         setDataLoading(false);
    //     }
    // };

    if (loading) {
        return (
            <AdminLayout title={t('businessAnalytics.title')}>
                <div className="dashboard-page">
                    <div className="skeleton skeleton-card" style={{ height: '400px' }} />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title={t('businessAnalytics.title')}>
            <div className="dashboard-page">
                {/* Inventory Structure by Category Section */}
                <InventoryByCategorySection
                    jewelryCategories={jewelryCategories}
                    centerstoneCategories={centerstoneCategories}
                    jewelryData={jewelryData}
                    centerstoneData={centerstoneData}
                    loading={dataLoading}
                />

                {/* Inventory Structure by Price Level Section */}
                <div style={{ marginTop: '48px' }}>
                    <InventoryByPriceLevelSection loading={dataLoading} />
                </div>
            </div>
        </AdminLayout>
    );
}
