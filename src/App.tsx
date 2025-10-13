import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { isAuthenticated } from './auth';

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Login />} />
            <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
            </Route>
            <Route
                path="*"
                element={<Navigate to={isAuthenticated() ? '/dashboard' : '/'} replace />}
            />
        </Routes>
    );
}
