import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './user/pages/Login';
import SignUp from './user/pages/SignUp';
import ForgotPassword from './user/pages/ForgotPassword';
import Dashboard from './user/pages/Dashboard';
import AdminDashboard from './admin/pages/AdminDashboard';
import AdminUsers from './admin/pages/AdminUsers';

export default function App() {
    return (
        <Routes>
            {/* Public dashboard at root */}
            <Route path="/" element={<Dashboard />} />
            {/* Public auth pages */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            {/* Admin routes */}
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/admin-users" element={<AdminUsers />} />

            {/* Redirect legacy /dashboard to root */}
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route
                path="*"
                element={<Navigate to="/" replace />}
            />
        </Routes>
    );
}
