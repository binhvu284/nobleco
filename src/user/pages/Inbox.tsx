import { useState, useEffect } from 'react';
import UserLayout from '../components/UserLayout';
import ComingSoon from '../components/ComingSoon';
import { IconMail } from '../../admin/components/icons';

export default function Inbox() {
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
        <UserLayout title="Inbox">
            <ComingSoon
                title="Inbox"
                description="Your message center is currently under development. We're working hard to bring you a seamless communication experience."
                icon={<IconMail style={{ width: '64px', height: '64px' }} />}
                stats={stats}
            />
        </UserLayout>
    );
}

