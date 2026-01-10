import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import CoworkerProtectedRoute from './components/CoworkerProtectedRoute';
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
import Checkout from './user/pages/Checkout';
import Payment from './user/pages/Payment';
import Inbox from './user/pages/Inbox';
import Library from './user/pages/Library';
import TrainingMaterials from './user/pages/TrainingMaterials';
import AdminDashboard from './admin/pages/AdminDashboard';
import AdminBusinessAnalytics from './admin/pages/AdminBusinessAnalytics';
import AdminUsers from './admin/pages/AdminUsers';
import AdminAdminUsers from './admin/pages/AdminAdminUsers';
import AdminClients from './admin/pages/AdminClients';
import AdminProducts from './admin/pages/AdminProducts';
import AdminProductDetail from './admin/pages/AdminProductDetail';
import AdminCategories from './admin/pages/AdminCategories';
import AdminOrders from './admin/pages/AdminOrders';
import AdminCommission from './admin/pages/AdminCommission';
import AdminRequest from './admin/pages/AdminRequest';
import AdminDiscount from './admin/pages/AdminDiscount';
import AccessDenied from './admin/pages/AccessDenied';
// Profile/Setting modals are launched from headers; no route imports

export default function App() {
    return (
        <Routes>
            {/* Public routes - accessible without authentication */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Protected User routes - require 'user' role */}
            <Route element={<ProtectedRoute requiredRole="user" />}>
                <Route path="/dashboard" element={<UserDashboard />} />
                <Route path="/inbox" element={<Inbox />} />
                <Route path="/member" element={<UserMember />} />
                <Route path="/product" element={<UserProduct />} />
                <Route path="/wallet" element={<UserWallet />} />
                <Route path="/orders" element={<UserOrders />} />
                <Route path="/training" element={<UserTraining />} />
                <Route path="/client" element={<UserClient />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/payment" element={<Payment />} />
                <Route path="/library" element={<Library />} />
                <Route path="/training-materials" element={<TrainingMaterials />} />
            </Route>
            
            {/* Protected Admin routes - require 'admin' role or 'coworker' with permissions */}
            <Route element={<ProtectedRoute requiredRole="admin" />}>
                <Route path="/admin-access-denied" element={<AccessDenied />} />
                <Route path="/admin-dashboard" element={<CoworkerProtectedRoute><AdminDashboard /></CoworkerProtectedRoute>} />
                <Route path="/admin-analytics" element={<AdminBusinessAnalytics />} />
                <Route path="/admin-users" element={<CoworkerProtectedRoute><AdminUsers /></CoworkerProtectedRoute>} />
                <Route path="/admin-admin-users" element={<CoworkerProtectedRoute><AdminAdminUsers /></CoworkerProtectedRoute>} />
                <Route path="/admin-clients" element={<CoworkerProtectedRoute><AdminClients /></CoworkerProtectedRoute>} />
                <Route path="/admin-products" element={<CoworkerProtectedRoute><AdminProducts /></CoworkerProtectedRoute>} />
                <Route path="/admin-product-detail/:id" element={<CoworkerProtectedRoute><AdminProductDetail /></CoworkerProtectedRoute>} />
                <Route path="/admin-categories" element={<CoworkerProtectedRoute><AdminCategories /></CoworkerProtectedRoute>} />
                <Route path="/admin-orders" element={<CoworkerProtectedRoute><AdminOrders /></CoworkerProtectedRoute>} />
                <Route path="/admin-commission" element={<CoworkerProtectedRoute><AdminCommission /></CoworkerProtectedRoute>} />
                <Route path="/admin-request" element={<CoworkerProtectedRoute><AdminRequest /></CoworkerProtectedRoute>} />
                <Route path="/admin-discount" element={<CoworkerProtectedRoute><AdminDiscount /></CoworkerProtectedRoute>} />
            </Route>

            {/* Catchall: redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
