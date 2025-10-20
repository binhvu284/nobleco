import AdminLayout from '../components/AdminLayout';

export default function AdminCategory() {
    return (
        <AdminLayout title="Product Categories">
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '60vh',
                textAlign: 'center',
                color: 'var(--muted)'
            }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏷️</div>
                <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Coming Soon</h2>
                <p style={{ fontSize: '1.1rem', maxWidth: '400px' }}>
                    The Product Categories management page is currently under development. 
                    This feature will allow you to create, edit, and organize product categories.
                </p>
            </div>
        </AdminLayout>
    );
}
