import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated, getUserRole } from '../auth';

interface ProtectedRouteProps {
    requiredRole?: 'user' | 'admin';
}

export default function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
    // Check if user is authenticated
    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    // If a specific role is required, check if user has that role
    if (requiredRole) {
        const userRole = getUserRole();
        
        // If user doesn't have the required role, redirect
        if (userRole !== requiredRole) {
            // Redirect admin to admin dashboard, user to user dashboard
            if (userRole === 'admin') {
                return <Navigate to="/admin-dashboard" replace />;
            } else {
                return <Navigate to="/dashboard" replace />;
            }
        }
    }

    return <Outlet />;
}
