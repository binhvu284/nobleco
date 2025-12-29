import { useState, useEffect } from 'react';
import UserLayout from '../components/UserLayout';
import ComingSoon from '../components/ComingSoon';
import { IconLibrary } from '../../admin/components/icons';

export default function Library() {
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
        <UserLayout title="Library">
            <ComingSoon
                title="Library"
                description="Your content library is currently under development. We're building a comprehensive resource center for news, community updates, and events."
                icon={<IconLibrary style={{ width: '64px', height: '64px' }} />}
                stats={stats}
            />
        </UserLayout>
    );
}
