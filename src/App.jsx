import { useState, useEffect } from 'react';
import './App.css';
import AppLayout from './layout/AppLayout';
import { Routes, Route, BrowserRouter as Router, useNavigate, useLocation } from 'react-router-dom'; // Import useLocation
import Login from './components/Login';
import Profile from './components/Profile';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import ListDonhangComponent from './admin/adminDonHangComponents/ListDonHangComponent'
import ListPhieuGiamGiaComponent from './admin/adminGiamGiaComponents/ListPhieuGiamGiaComponent'
import ListCpuComponent from './admin/adminSanPhamComponents/ListCpuComponent'
import ListSanPhamComponent from './admin/adminSanPhamComponents/ListSanPhamComponent'
import ListDanhMucComponent from './admin/adminSanPhamComponents/ListDanhMucComponent'
import ListHangComponent from './admin/adminSanPhamComponents/ListHangComponent'
import ListDoHoaComponent from './admin/adminSanPhamComponents/ListDoHoaComponent'
import ListMauSacComponent from './admin/adminSanPhamComponents/ListMauSacComponent'
import ListPinComponent from './admin/adminSanPhamComponents/ListPinComponent'
import ListRamComponent from './admin/adminSanPhamComponents/ListRamComponent'
import ListRomComponent from './admin/adminSanPhamComponents/ListRomComponent'
import ListManHinhComponent from './admin/adminSanPhamComponents/ListManHinhComponent'
import ListKhachHangComponent from './admin/adminTaiKhoanComponents/ListKhachHangComponent'
import ListNhanVienComponent from './admin/adminTaiKhoanComponents/ListNhanVienComponent'
import ListThongKeComponent from './admin/adminThongKeComponents/ListThongKeComponent'
import ListBanTaiQuayComponent from './admin/adminBanHangTaiQuayComponents/ListBanTaiQuayComponent'
import ListTraHangComponent from './admin/adminTraHangComponents/ListTraHangComponent'
import AddCpuComponent from './admin/adminSanPhamComponents/AddCpuComponent'
import AddDoHoaComponent from './admin/adminSanPhamComponents/AddDoHoaComponent'
import ListSeriComponent from './admin/adminSanPhamComponents/ListSeriComponent'
import AddMauSacComponent from './admin/adminSanPhamComponents/AddMauSacComponent'
import AddRomComponent from './admin/adminSanPhamComponents/AddRomComponent'
import AddRamComponent from './admin/adminSanPhamComponents/AddRamComponent'
import PhieuGiamGiaComponent from './admin/adminGiamGiaComponents/PhieuGiamGiaComponent'
import { message } from 'antd';


// Component này sẽ chứa logic chính và sử dụng các hooks của React Router
const AppContent = () => {
  const [token, setToken] = useState(localStorage.getItem('accessToken'));
  const [user, setUser] = useState(null);
  const navigate = useNavigate(); // Hook này cần nằm trong Router
  const location = useLocation(); // Hook này cần nằm trong Router

  // Các đường dẫn KHÔNG cần hiển thị AppLayout (header và sidebar)
  const noLayoutPaths = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
  ];

  // Kiểm tra xem có nên hiển thị AppLayout không
  const shouldRenderLayout = !noLayoutPaths.includes(location.pathname);

  // Load user data from localStorage when the component mounts
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user data from localStorage:", e);
        localStorage.removeItem('user'); // Clear corrupted data
      }
    }
  }, []);

  // Handles the logout process: clears data and redirects
  const handleLogout = () => {
    localStorage.removeItem('accessToken'); // Clear the authentication token
    localStorage.removeItem('user');       // Clear user data
    setToken(null);                       // Update token state to null
    setUser(null);                         // Update user state to null
    message.success('Đăng xuất thành công!'); // Show a success message
    navigate('/'); // Redirect về trang đăng nhập sau khi đăng xuất
  };

  return (
    <>
      {shouldRenderLayout ? (
        // Nếu cần AppLayout, render AppLayout và bên trong là các Route cần nó
        <AppLayout user={user} onLogout={handleLogout}>
          <Routes>
            {/* Các Routes cần có Layout */}
            <Route path='/' element={<ListThongKeComponent />}></Route>
            <Route path='/admin/thong-ke' element={<ListThongKeComponent />}></Route>

            {/* User Profile Route */}
            <Route path='/profile' element={<Profile />} />

            {/* Admin/Dashboard Routes */}
            <Route path='/admin/don-hang' element={<ListDonhangComponent />}></Route>
            <Route path='/admin/phieu-giam-gia' element={<ListPhieuGiamGiaComponent />}></Route>
            <Route path='/admin/add-phieu-giam-gia' element={<PhieuGiamGiaComponent />}></Route>
            <Route path='/admin/edit-phieu-giam-gia/:idPhieugiamgia' element={<PhieuGiamGiaComponent />}></Route>
            <Route path='/admin/san-pham' element={<ListSanPhamComponent />}></Route>
            <Route path='/admin/cpu' element={<ListCpuComponent />}></Route>
            <Route path='/admin/add-cpu' element={<AddCpuComponent />}></Route>
            <Route path='/admin/update-cpu/:id' element={<AddCpuComponent />}></Route>
            <Route path='/admin/do-hoa' element={<ListDoHoaComponent />}></Route>
            <Route path='/admin/add-do-hoa' element={<AddDoHoaComponent />}></Route>
            <Route path='/admin/update-do-hoa/:id' element={<AddDoHoaComponent />}></Route>
            <Route path='/admin/danh-muc' element={<ListDanhMucComponent />}></Route>
            <Route path='/admin/hang' element={<ListHangComponent />}></Route>
            <Route path='/admin/seri' element={<ListSeriComponent />}></Route>
            <Route path='/admin/mau-sac' element={<ListMauSacComponent />}></Route>
            <Route path='/admin/add-mausac' element={<AddMauSacComponent />}></Route>
            <Route path='/admin/update-mausac/:id' element={<AddMauSacComponent />}></Route>
            <Route path='/admin/pin' element={<ListPinComponent />}></Route>
            <Route path='/admin/ram' element={<ListRamComponent />}></Route>
            <Route path='/admin/add-ram' element={<AddRamComponent />}></Route>
            <Route path='/admin/rom' element={<ListRomComponent />}></Route>
            <Route path='/admin/man-hinh' element={<ListManHinhComponent />}></Route>
            <Route path='/admin/khach-hang' element={<ListKhachHangComponent />}></Route>
            <Route path='/admin/nhan-vien' element={<ListNhanVienComponent />}></Route>
            <Route path='/admin/ban-tai-quay' element={<ListBanTaiQuayComponent />}></Route>
            <Route path='/admin/tra-hang' element={<ListTraHangComponent />}></Route>
          </Routes>
        </AppLayout>
      ) : (
        // Nếu không cần AppLayout, chỉ render các Route cần thiết
        <Routes>
          {/* Các Routes KHÔNG cần có Layout */}
          <Route path='/' element={<Login setToken={setToken} setUser={setUser} />} /> {/* Mặc định vào login */}
          <Route path='/login' element={<Login setToken={setToken} setUser={setUser} />} />
          <Route path='/register' element={<Register />} />
          <Route path='/forgot-password' element={<ForgotPassword />} />
          <Route path='/reset-password' element={<ResetPassword />} />
          {/* Bạn có thể thêm một Route 404 cho các đường dẫn không khớp */}
          {/* <Route path="*" element={<div>404 - Không tìm thấy trang</div>} /> */}
        </Routes>
      )}
    </>
  );
};

// Component App chính chỉ có nhiệm vụ bọc ứng dụng trong BrowserRouter
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;