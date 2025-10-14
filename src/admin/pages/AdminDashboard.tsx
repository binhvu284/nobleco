import AdminHeader from '../components/AdminHeader';

export default function AdminDashboard() {
    return (
        <div className="container">
            <div className="navbar">
                <div className="brand">Nobleco Admin</div>
            </div>
            <div className="content">
                <AdminHeader />
                <h2>Admin Dashboard</h2>
                <p>Welcome to the admin area. Add admin widgets and management tools here.</p>
            </div>
        </div>
    );
}
