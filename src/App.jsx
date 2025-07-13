import { useState, useEffect } from 'react';
import './App.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  Routes, Route, BrowserRouter as Router, useNavigate, useLocation, Navigate,
} from 'react-router-dom';
import AppLayout from './layout/AppLayout';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Profile from './components/Profile';
import CustomerHome from './components/CustomerHome';
import { message } from 'antd';
import api from './service/api';

// Component quản lý
import ListDonhangComponent from './admin/adminDonHangComponents/ListDonHangComponent';
import ListPhieuGiamGiaComponent from './admin/adminGiamGiaComponents/ListPhieuGiamGiaComponent';
import PhieuGiamGiaComponent from './admin/adminGiamGiaComponents/PhieuGiamGiaComponent';
import ListCpuComponent from './admin/adminSanPhamComponents/ListCpuComponent';
import AddCpuComponent from './admin/adminSanPhamComponents/AddCpuComponent';
import ListSanPhamComponent from './admin/adminSanPhamComponents/ListSanPhamComponent';
import ListDanhMucComponent from './admin/adminSanPhamComponents/ListDanhMucComponent';
import ListHangComponent from './admin/adminSanPhamComponents/ListHangComponent';
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

      if (storedUser && storedToken) {
        try {
          const response = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${storedToken}` },
            withCredentials: true,
          });

          const userData = response.data.data;
          const updatedUser = {
            ten: userData.ten,
            email: userData.email,
            soDienThoai: userData.soDienThoai,
            gioiTinh: userData.gioiTinh,
            ngaySinh: userData.ngaySinh,
            anh: userData.anh,
            role: userData.tenChucVu ? userData.tenChucVu.toUpperCase() : 'USER',
          };

          sessionStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
          setToken(storedToken);
        } catch (error) {
          console.error('Failed to restore session:', error);
          sessionStorage.clear();
          setToken(null);
          setUser(null);
          if (!['/login', '/register', '/forgot-password', '/reset-password'].includes(location.pathname)) {
            message.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
            navigate('/login');
          }
        }
      } else {
        if (!['/login', '/register', '/forgot-password', '/reset-password'].includes(location.pathname)) {
          navigate('/login');
        }
      }

      setLoadingSession(false);
    };

    restoreSession();
  }, [navigate, location.pathname]);

  const handleLogout = async () => {
    try {
      const token = sessionStorage.getItem('accessToken');
      if (token) {
        await api.post('/auth/signout', null, {
          headers: { Authorization: `Bearer ${token}` },
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

  const routes = [
    { path: '/', element: <ListThongKeComponent />, roles: ['ADMIN', 'NHAN_VIEN'] },
    { path: '/admin/thong-ke', element: <ListThongKeComponent />, roles: ['ADMIN', 'NHAN_VIEN'] },
    { path: '/admin/don-hang', element: <ListDonhangComponent />, roles: ['ADMIN', 'NHAN_VIEN'] },
    { path: '/admin/phieu-giam-gia', element: <ListPhieuGiamGiaComponent />, roles: ['ADMIN'] },
    { path: '/admin/add-phieu-giam-gia', element: <PhieuGiamGiaComponent />, roles: ['ADMIN'] },
    { path: '/admin/edit-phieu-giam-gia/:idPhieugiamgia', element: <PhieuGiamGiaComponent />, roles: ['ADMIN'] },
    { path: '/dot-giam-gia', element: <ListDotGiamGiaComponent />, roles: ['ADMIN'] },
    { path: '/tao-dot-giam-gia', element: <DotGiamGiaComponents />, roles: ['ADMIN'] },
    { path: '/admin/san-pham', element: <ListSanPhamComponent />, roles: ['ADMIN'] },
    { path: '/admin/cpu', element: <ListCpuComponent />, roles: ['ADMIN'] },
    { path: '/admin/add-cpu', element: <AddCpuComponent />, roles: ['ADMIN'] },
    { path: '/admin/update-cpu/:id', element: <AddCpuComponent />, roles: ['ADMIN'] },
    { path: '/admin/do-hoa', element: <ListDoHoaComponent />, roles: ['ADMIN'] },
    { path: '/admin/add-do-hoa', element: <AddDoHoaComponent />, roles: ['ADMIN'] },
    { path: '/admin/update-do-hoa/:id', element: <AddDoHoaComponent />, roles: ['ADMIN'] },
    { path: '/admin/danh-muc', element: <ListDanhMucComponent />, roles: ['ADMIN'] },
    { path: '/admin/hang', element: <ListHangComponent />, roles: ['ADMIN'] },
    { path: '/admin/seri', element: <ListSeriComponent />, roles: ['ADMIN'] },
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
    { path: '/profile', element: <Profile />, roles: ['ADMIN', 'NHAN_VIEN', 'KHACH_HANG'] },
    { path: '/customer/home', element: <CustomerHome user={user} />, roles: ['KHACH_HANG'] },
  ];

  const noLayoutPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
  const shouldRenderLayout = !noLayoutPaths.includes(location.pathname);

  if (loadingSession) return <div>Loading...</div>;

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} closeOnClick pauseOnHover theme="light" />
      {shouldRenderLayout ? (
        <AppLayout user={user} onLogout={handleLogout}>
          <Routes>
            {routes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={
                  user && route.roles.includes(user.role)
                    ? route.element
                    : <Navigate to={user?.role === 'KHACH_HANG' ? '/customer/home' : '/login'} replace />
                }
              />
            ))}
          </Routes>
        </AppLayout>
      ) : (
        <Routes>
          <Route path="/" element={<Login setToken={setToken} setUser={setUser} />} />
          <Route path="/login" element={<Login setToken={setToken} setUser={setUser} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      )}
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
