import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './user/pages/Login';
import Dashboard from './user/pages/Dashboard';
import AdminDashboard from './admin/pages/AdminDashboard';

export default function App() {
    return (
        <Routes>
            {/* Public dashboard at root */}
            <Route path="/" element={<Dashboard />} />
            {/* Public login page */}
            <Route path="/login" element={<Login />} />
            {/* Admin routes */}
            <Route path="/admin-dashboard" element={<AdminDashboard />} />

            {/* Redirect legacy /dashboard to root */}
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route
                path="*"
                element={<Navigate to="/" replace />}
            />
        </Routes>
    );
}
