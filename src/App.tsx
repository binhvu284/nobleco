import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { isAuthenticated } from './auth';

function Home() {
    return isAuthenticated() ? <Dashboard /> : <Login />;
}

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
            </Route>
            <Route
                path="*"
                element={<Navigate to={isAuthenticated() ? '/' : '/'} replace />}
            />
        </Routes>
    );
}
