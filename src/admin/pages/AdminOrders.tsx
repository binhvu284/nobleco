import AdminLayout from '../components/AdminLayout';

export default function AdminOrders() {
    return (
        <AdminLayout title="Orders">
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '60vh',
                textAlign: 'center',
                color: '#6b7280'
            }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📦</div>
                <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#1f2937' }}>Coming Soon</h2>
                <p style={{ fontSize: '1.1rem', maxWidth: '400px' }}>
                    The Admin Orders management page is currently under development. 
                    This feature will allow you to view, track, and manage all orders across the platform.
                </p>
            </div>
        </AdminLayout>
    );
}
