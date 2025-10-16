import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './user/pages/Login';
import SignUp from './user/pages/SignUp';
import ForgotPassword from './user/pages/ForgotPassword';
import Home from './user/pages/Home';
import UserDashboard from './user/pages/UserDashboard';
import UserMember from './user/pages/UserMember';
import UserProduct from './user/pages/UserProduct';
import UserWallet from './user/pages/UserWallet';
import UserPayment from './user/pages/UserPayment';
import UserTraining from './user/pages/UserTraining';
import AdminDashboard from './admin/pages/AdminDashboard';
import AdminUsers from './admin/pages/AdminUsers';
import AdminProduct from './admin/pages/AdminProduct';
import AdminCommission from './admin/pages/AdminCommission';
import AdminRequest from './admin/pages/AdminRequest';
// Profile/Setting modals are launched from headers; no route imports

export default function App() {
    return (
        <Routes>
            {/* Public routes - accessible without authentication */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Protected User routes - require 'user' role */}
            <Route element={<ProtectedRoute requiredRole="user" />}>
                <Route path="/dashboard" element={<UserDashboard />} />
                <Route path="/member" element={<UserMember />} />
                <Route path="/product" element={<UserProduct />} />
                <Route path="/wallet" element={<UserWallet />} />
                <Route path="/payment" element={<UserPayment />} />
                <Route path="/training" element={<UserTraining />} />
            </Route>
            
            {/* Protected Admin routes - require 'admin' role */}
            <Route element={<ProtectedRoute requiredRole="admin" />}>
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/admin-users" element={<AdminUsers />} />
                <Route path="/admin-product" element={<AdminProduct />} />
                <Route path="/admin-commission" element={<AdminCommission />} />
                <Route path="/admin-request" element={<AdminRequest />} />
            </Route>

            {/* Catchall: redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
