import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

export default function App() {
    return (
        <Routes>
            {/* Public dashboard at root */}
            <Route path="/" element={<Dashboard />} />
            {/* Public login page */}
            <Route path="/login" element={<Login />} />
            {/* Redirect legacy /dashboard to root */}
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route
                path="*"
                element={<Navigate to="/" replace />}
            />
        </Routes>
    );
}
