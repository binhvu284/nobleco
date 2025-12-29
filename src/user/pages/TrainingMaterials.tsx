import { useState, useEffect } from 'react';
import UserLayout from '../components/UserLayout';
import ComingSoon from '../components/ComingSoon';
import { IconBook } from '../../admin/components/icons';

export default function TrainingMaterials() {
    const [stats, setStats] = useState<Array<{ label: string; value: number; suffix?: string }>>([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('/api/stats');
                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data) {
                        setStats([
                            { label: 'Total Users', value: result.data.totalUsers },
                            { label: 'Total Products', value: result.data.totalProducts },
                            { label: 'Completed Orders', value: result.data.totalOrders }
                        ]);
                    }
                }
            } catch (error) {
                console.error('Error fetching stats:', error);
            }
        };
        fetchStats();
    }, []);

    return (
        <UserLayout title="Training Materials">
            <ComingSoon
                title="Training Materials"
                description="Our training materials section is currently under development. Soon you'll have access to comprehensive guides, videos, and resources to enhance your skills."
                icon={<IconBook style={{ width: '64px', height: '64px' }} />}
                stats={stats}
            />
        </UserLayout>
    );
}
