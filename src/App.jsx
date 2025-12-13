// src/App.js
import { useState, useEffect } from 'react';
import './App.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import {
  Routes,
  Route,
  BrowserRouter as Router,
  useNavigate,
  useLocation,
  Navigate,
} from 'react-router-dom';

import { message } from 'antd';
import api from './service/api';

import AppLayout from './layout/AppLayout';
import CustomerLayout from './layout/CustomerLayout';

// Auth
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import Profile from './components/Profile';
import CustomerHome from './components/CustomerHome';

// Admin components
import ListDonhangComponent from './admin/adminDonHangComponents/ListDonHangComponent';
import OrderDetailComponent from './admin/adminDonHangComponents/OrderDetailComponent';

import ListPhieuGiamGiaComponent from './admin/adminGiamGiaComponents/ListPhieuGiamGiaComponent';
import PhieuGiamGiaComponent from './admin/adminGiamGiaComponents/PhieuGiamGiaComponent';

import ListCpuComponent from './admin/adminSanPhamComponents/ListCpuComponent';
import AddCpuComponent from './admin/adminSanPhamComponents/AddCpuComponent';

import ListSanPhamComponent from './admin/adminSanPhamComponents/ListSanPhamComponent';
import AddLapTopComponent from './admin/adminSanPhamComponents/AddLapTopComponent';
import ListSanPhamCTComponent from './admin/adminSanPhamComponents/ListSanPhamCTComponent';
import AddLapTopCTComponent from './admin/adminSanPhamComponents/AddLapTopCTComponent';
import UpdateLapTopCTComponent from './admin/adminSanPhamComponents/UpdateLapTopCTComponent';

import ListDoHoaComponent from './admin/adminSanPhamComponents/ListDoHoaComponent';
import AddDoHoaComponent from './admin/adminSanPhamComponents/AddDoHoaComponent';

import ListMauSacComponent from './admin/adminSanPhamComponents/ListMauSacComponent';
import AddMauSacComponent from './admin/adminSanPhamComponents/AddMauSacComponent';

import ListPinComponent from './admin/adminSanPhamComponents/ListPinComponent';
import ListRamComponent from './admin/adminSanPhamComponents/ListRamComponent';
import AddRamComponent from './admin/adminSanPhamComponents/AddRamComponent';
import ListRomComponent from './admin/adminSanPhamComponents/ListRomComponent';
import AddRomComponent from './admin/adminSanPhamComponents/AddRomComponent';
import ListManHinhComponent from './admin/adminSanPhamComponents/ListManHinhComponent';

import ListHeDieuHanhComponent from './admin/adminSanPhamComponents/ListHeDieuHanhComponent';
import ListThuongHieuComponent from './admin/adminSanPhamComponents/ListThuongHieuComponent';
import ListKichThuocComponent from './admin/adminSanPhamComponents/ListKichThuocComponent';

// (từ nhánh kia)

import ListHangComponent from './admin/adminSanPhamComponents/ListHangComponent';
import ListSeriComponent from './admin/adminSanPhamComponents/ListSeriComponent';

import ListNhanVienComponent from './admin/adminTaiKhoanComponents/ListNhanVienComponent';
import AddNhanVienComponent from './admin/adminTaiKhoanComponents/AddNhanVienComponent';
import EditNhanVienComponent from './admin/adminTaiKhoanComponents/EditNhanVienComponent';

import ListKhachHangComponent from './admin/adminTaiKhoanComponents/ListKhachHangComponent';
import AddKhachHangComponent from './admin/adminTaiKhoanComponents/AddKhachHangComponent';
import EditKhachHangComponent from './admin/adminTaiKhoanComponents/EditKhachHangComponent';

import ListThongKeComponent from './admin/adminThongKeComponents/ListThongKeComponent';
import ListBanTaiQuayComponent from './admin/adminBanHangTaiQuayComponents/ListBanTaiQuayComponent';
import ListTraHangComponent from './admin/adminTraHangComponents/ListTraHangComponent';

import ListDotGiamGiaComponent from './admin/adminDotGiamGiaComponents/ListDotGiamGiaComponent';
import DotGiamGiaComponents from './admin/adminDotGiamGiaComponents/DotGiamGiaComponent';

// POS result pages (admin)
import PaymentSuccessPage from './admin/adminBanHangTaiQuayComponents/PaymentSuccessPage';
import PaymentFailedPage from './admin/adminBanHangTaiQuayComponents/PaymentFailedPage';

// Customer pages (nhánh kia)
import HomePage from './pages/customer/HomePage';
import ProductListPage from './pages/customer/ProductListPage';
import ProductDetailPage from './pages/customer/ProductDetailPage';
import CartPage from './pages/customer/CartPage';
import OrderInformationPage from './pages/customer/OrderInformationPage';
import OrderLookupPage from './pages/customer/OrderLookupPage';
import OrderDetailPage from './pages/customer/OrderDetailPage';
import CustomerPaymentSuccessPage from './pages/customer/PaymentSuccessPage';
import AdminProfile from './components/AdminProfile';
// ✅ Auth pages (không layout)
const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'];

// ✅ Customer public pages (không cần login)
const CUSTOMER_PUBLIC_PATHS = [
  '/',
  '/products',
  '/product-detail',
  '/cart',
  '/tra-cuu',
  '/client/payment/payment-success',
];

// Component check role
const RequireRole = ({ user, roles, children }) => {
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) {
    // KHACH_HANG mà vào nhầm admin → về customer/home
    if (user.role === 'KHACH_HANG') return <Navigate to="/customer/home" replace />;
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AppContent = () => {
  const [token, setToken] = useState(sessionStorage.getItem('accessToken'));
  const [user, setUser] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const restoreSession = async () => {
      const storedUser = sessionStorage.getItem('user');
      const storedToken = sessionStorage.getItem('accessToken');

      const pathname = location.pathname;

      const isAuthPage = AUTH_PATHS.includes(pathname);

      // helper: map user from /auth/me
      const mapUser = (userData) => ({
        ten: userData.ten,
        email: userData.email,
        soDienThoai: userData.soDienThoai,
        gioiTinh: userData.gioiTinh,
        ngaySinh: userData.ngaySinh,
        anh: userData.anh,
        role: userData.tenChucVu ? userData.tenChucVu.toUpperCase() : 'USER',
      });

      // 1) Nếu đã có storedUser + token → verify lại bằng /auth/me
      if (storedUser && storedToken) {
        try {
          const response = await api.get('/auth/me'); // interceptor tự gắn token nếu có
          const userData = response.data.data;
          const updatedUser = mapUser(userData);

          sessionStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
          setToken(storedToken);
        } catch (error) {
          console.error('Failed to restore session from storage:', error);
          sessionStorage.clear();
          setToken(null);
          setUser(null);

          // nếu không phải auth page thì đá về login
          if (!isAuthPage) {
            message.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
            navigate('/login');
          }
        } finally {
          setLoadingSession(false);
        }
        return;
      }

      // 2) Không có token trong sessionStorage
      // - Nếu đang ở auth page => không cần gọi /auth/me
      if (isAuthPage) {
        setLoadingSession(false);
        return;
      }

      // - Nếu đang ở customer public page => cho vào luôn (không bắt login)
      const isCustomerPublic =
        CUSTOMER_PUBLIC_PATHS.some((p) =>
          p === '/' ? pathname === '/' : pathname.startsWith(p)
        );

      if (isCustomerPublic) {
        setLoadingSession(false);
        return;
      }

      // - Còn lại: thử restore bằng cookie (SSO giữa tab)
      try {
        const response = await api.get('/auth/me');
        const userData = response.data.data;
        const updatedUser = mapUser(userData);

        sessionStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setToken(sessionStorage.getItem('accessToken') || null);
      } catch (error) {
        console.error('Failed to restore session from cookie:', error);
        sessionStorage.clear();
        setToken(null);
        setUser(null);
        navigate('/login');
      } finally {
        setLoadingSession(false);
      }
    };

    restoreSession();
  }, [navigate, location.pathname]);

  const handleLogout = async () => {
    try {
      const t = sessionStorage.getItem('accessToken');
      if (t) {
        await api.post('/auth/signout', null, {
          headers: { Authorization: `Bearer ${t}` },
          withCredentials: true,
        });
      }
    } finally {
      sessionStorage.clear();
      setToken(null);
      setUser(null);
      message.success('Đăng xuất thành công!');
      navigate('/login');
    }
  };

  if (loadingSession) return <div>Loading...</div>;

  // ===== Admin routes list (AppLayout) =====
  const adminRoutes = [
    { path: '/', element: <ListThongKeComponent />, roles: ['ADMIN', 'NHAN_VIEN'] },
    { path: '/admin/thong-ke', element: <ListThongKeComponent />, roles: ['ADMIN', 'NHAN_VIEN'] },

    { path: '/admin/don-hang', element: <ListDonhangComponent />, roles: ['ADMIN', 'NHAN_VIEN'] },
    { path: '/admin/orders/:id', element: <OrderDetailComponent />, roles: ['ADMIN', 'NHAN_VIEN'] },

    { path: '/admin/phieu-giam-gia', element: <ListPhieuGiamGiaComponent />, roles: ['ADMIN'] },
    { path: '/admin/add-phieu-giam-gia', element: <PhieuGiamGiaComponent />, roles: ['ADMIN'] },
    { path: '/admin/edit-phieu-giam-gia/:idPhieugiamgia', element: <PhieuGiamGiaComponent />, roles: ['ADMIN'] },

    { path: '/dot-giam-gia', element: <ListDotGiamGiaComponent />, roles: ['ADMIN'] },
    { path: '/tao-dot-giam-gia', element: <DotGiamGiaComponents />, roles: ['ADMIN'] },

    { path: '/admin/lap-top', element: <ListSanPhamComponent />, roles: ['ADMIN'] },
    { path: '/admin/lap-top-ct/:idLaptop', element: <ListSanPhamCTComponent />, roles: ['ADMIN'] },
    { path: '/admin/lap-top-ct/add/:idLaptop', element: <AddLapTopCTComponent />, roles: ['ADMIN'] },
    { path: '/admin/lap-top-ct/edit/:id', element: <UpdateLapTopCTComponent />, roles: ['ADMIN'] },
    { path: '/admin/add-lap-top', element: <AddLapTopComponent />, roles: ['ADMIN'] },
    { path: '/admin/sua-lap-top/:id', element: <AddLapTopComponent />, roles: ['ADMIN'] },

    { path: '/admin/cpu', element: <ListCpuComponent />, roles: ['ADMIN'] },
    { path: '/admin/add-cpu', element: <AddCpuComponent />, roles: ['ADMIN'] },
    { path: '/admin/update-cpu/:id', element: <AddCpuComponent />, roles: ['ADMIN'] },

    { path: '/admin/do-hoa', element: <ListDoHoaComponent />, roles: ['ADMIN'] },
    { path: '/admin/add-do-hoa', element: <AddDoHoaComponent />, roles: ['ADMIN'] },
    { path: '/admin/update-do-hoa/:id', element: <AddDoHoaComponent />, roles: ['ADMIN'] },


    { path: '/admin/hang', element: <ListHangComponent />, roles: ['ADMIN'] },
    { path: '/admin/seri', element: <ListSeriComponent />, roles: ['ADMIN'] },

    { path: '/admin/kich-thuoc', element: <ListKichThuocComponent />, roles: ['ADMIN'] },
    { path: '/admin/he-dieu-hanh', element: <ListHeDieuHanhComponent />, roles: ['ADMIN'] },
    { path: '/admin/thuong-hieu', element: <ListThuongHieuComponent />, roles: ['ADMIN'] },

    { path: '/admin/mau-sac', element: <ListMauSacComponent />, roles: ['ADMIN'] },
    { path: '/admin/add-mausac', element: <AddMauSacComponent />, roles: ['ADMIN'] },
    { path: '/admin/update-mausac/:id', element: <AddMauSacComponent />, roles: ['ADMIN'] },

    { path: '/admin/pin', element: <ListPinComponent />, roles: ['ADMIN'] },
    { path: '/admin/ram', element: <ListRamComponent />, roles: ['ADMIN'] },
    { path: '/admin/add-ram', element: <AddRamComponent />, roles: ['ADMIN'] },
    { path: '/admin/rom', element: <ListRomComponent />, roles: ['ADMIN'] },
    { path: '/admin/add-rom', element: <AddRomComponent />, roles: ['ADMIN'] },
    { path: '/admin/man-hinh', element: <ListManHinhComponent />, roles: ['ADMIN'] },

    { path: '/admin/khach-hang', element: <ListKhachHangComponent />, roles: ['ADMIN'] },
    { path: '/admin/khach-hang/add', element: <AddKhachHangComponent />, roles: ['ADMIN'] },
    { path: '/admin/khach-hang/edit/:id', element: <EditKhachHangComponent />, roles: ['ADMIN'] },

    { path: '/admin/nhan-vien', element: <ListNhanVienComponent />, roles: ['ADMIN'] },
    { path: '/admin/nhan-vien/add', element: <AddNhanVienComponent />, roles: ['ADMIN'] },
    { path: '/admin/nhan-vien/edit/:id', element: <EditNhanVienComponent />, roles: ['ADMIN'] },

    { path: '/admin/ban-hang-tai-quay', element: <ListBanTaiQuayComponent />, roles: ['ADMIN', 'NHAN_VIEN'] },
    { path: '/admin/tra-hang', element: <ListTraHangComponent />, roles: ['ADMIN', 'NHAN_VIEN'] },

    // POS result pages (admin)
    { path: '/pos/payment-success', element: <PaymentSuccessPage />, roles: ['ADMIN', 'NHAN_VIEN'] },
    { path: '/pos/payment-failed', element: <PaymentFailedPage />, roles: ['ADMIN', 'NHAN_VIEN'] },

    // common protected
    // { path: '/profile', element: <Profile />, roles: ['ADMIN', 'NHAN_VIEN', 'KHACH_HANG'] },
    { path: '/admin/profile', element: <AdminProfile user={user} onLogout={handleLogout} />, roles: ['ADMIN', 'NHAN_VIEN'] },
    { path: '/customer/home', element: <CustomerHome user={user} />, roles: ['KHACH_HANG'] },
  ];

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        theme="light"
      />

      <Routes>
        {/* ================= AUTH (NO LAYOUT) ================= */}
        <Route path="/login" element={<Login setToken={setToken} setUser={setUser} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ================= CUSTOMER (CustomerLayout) ================= */}
        <Route
          path="/"
          element={
            <CustomerLayout>
              <HomePage />
            </CustomerLayout>
          }
        />
        <Route
          path="/products"
          element={
            <CustomerLayout>
              <ProductListPage />
            </CustomerLayout>
          }
        />
        <Route
          path="/product-detail/:id"
          element={
            <CustomerLayout>
              <ProductDetailPage />
            </CustomerLayout>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireRole user={user} roles={['KHACH_HANG']}>
              <CustomerLayout>
                <Profile />
              </CustomerLayout>
            </RequireRole>
          }
        />
        <Route
          path="/cart"
          element={
            <CustomerLayout>
              <CartPage />
            </CustomerLayout>
          }
        />
        <Route
          path="/tra-cuu"
          element={
            <CustomerLayout>
              <OrderLookupPage />
            </CustomerLayout>
          }
        />
        <Route
          path="/client/payment/payment-success"
          element={
            <CustomerLayout>
              <CustomerPaymentSuccessPage />
            </CustomerLayout>
          }
        />

        {/* Customer cần đăng nhập */}
        <Route
          path="/orders"
          element={
            <RequireRole user={user} roles={['KHACH_HANG']}>
              <CustomerLayout>
                <OrderInformationPage />
              </CustomerLayout>
            </RequireRole>
          }
        />
        <Route
          path="/order-detail/:idOrder"
          element={
            <RequireRole user={user} roles={['KHACH_HANG']}>
              <CustomerLayout>
                <OrderDetailPage />
              </CustomerLayout>
            </RequireRole>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireRole user={user} roles={['ADMIN', 'NHAN_VIEN', 'KHACH_HANG']}>
              <CustomerLayout>
                <Profile />
              </CustomerLayout>
            </RequireRole>
          }
        />

        {/* ================= ADMIN (AppLayout + role check) ================= */}
        <Route
          path="/*"
          element={
            <AppLayout user={user} onLogout={handleLogout}>
              <Routes>
                {adminRoutes.map((route) => (
                  <Route
                    key={route.path}
                    path={route.path}
                    element={
                      <RequireRole user={user} roles={route.roles}>
                        {route.element}
                      </RequireRole>
                    }
                  />
                ))}
              </Routes>
            </AppLayout>
          }
        />
      </Routes>
    </>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
