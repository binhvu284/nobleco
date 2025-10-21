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
import UserOrders from './user/pages/UserOrders';
import UserTraining from './user/pages/UserTraining';
import UserClient from './user/pages/UserClient';
import AdminDashboard from './admin/pages/AdminDashboard';
import AdminUsers from './admin/pages/AdminUsers';
import AdminAdminUsers from './admin/pages/AdminAdminUsers';
import AdminClients from './admin/pages/AdminClients';
import AdminProducts from './admin/pages/AdminProducts';
import AdminProductDetail from './admin/pages/AdminProductDetail';
import AdminCategories from './admin/pages/AdminCategories';
import AdminOrders from './admin/pages/AdminOrders';
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
                <Route path="/orders" element={<UserOrders />} />
                <Route path="/training" element={<UserTraining />} />
                <Route path="/client" element={<UserClient />} />
            </Route>
            
            {/* Protected Admin routes - require 'admin' role */}
            <Route element={<ProtectedRoute requiredRole="admin" />}>
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/admin-users" element={<AdminUsers />} />
                <Route path="/admin-admin-users" element={<AdminAdminUsers />} />
                <Route path="/admin-clients" element={<AdminClients />} />
                <Route path="/admin-products" element={<AdminProducts />} />
                <Route path="/admin-product-detail/:id" element={<AdminProductDetail />} />
                <Route path="/admin-categories" element={<AdminCategories />} />
                <Route path="/admin-orders" element={<AdminOrders />} />
                <Route path="/admin-commission" element={<AdminCommission />} />
                <Route path="/admin-request" element={<AdminRequest />} />
            </Route>

            {/* Catchall: redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
