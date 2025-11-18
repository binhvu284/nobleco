import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated, getUserRole, getCurrentUser } from '../auth';

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
        const currentUser = getCurrentUser();
        
        // TEMPORARY: Allow coworker role to access admin pages
        // This is to allow coworker accounts to access admin pages and perform logout
        const isCoworker = currentUser?.role === 'coworker' || userRole === 'coworker';
        
        // If user doesn't have the required role, redirect
        if (userRole !== requiredRole && !isCoworker) {
            // Redirect admin to admin dashboard, user to user dashboard
            if (userRole === 'admin') {
                return <Navigate to="/admin-dashboard" replace />;
            } else {
                return <Navigate to="/dashboard" replace />;
            }
        }
        
        // If requiredRole is 'admin', allow both 'admin' and 'coworker' (temporary)
        if (requiredRole === 'admin' && (userRole === 'admin' || isCoworker)) {
            return <Outlet />;
        }
        
        // For user routes, only allow 'user' role
        if (requiredRole === 'user' && userRole !== 'user') {
            return <Navigate to="/dashboard" replace />;
        }
    }

    return <Outlet />;
}
