import { useState } from 'react'
import Menu from './layout/Menu'
import './App.css'
import AppLayout from './layout/AppLayout'
import { Routes, Route, BrowserRouter as Router } from 'react-router-dom'
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

function App() {
  const [count, setCount] = useState()

  return (
    <>


      <Router>

        <AppLayout>

          <Routes>

            {/* // Đơn hàng  */}
            <Route path='/admin/don-hang' element={<ListDonhangComponent />}></Route>

            {/* // http://localhost:3000 */}
            <Route path='/' element={<ListPhieuGiamGiaComponent />}></Route>

            {/* // http://localhost:3000/admin/phieu-giam-gia */}
            <Route path='/admin/phieu-giam-gia' element={<ListPhieuGiamGiaComponent />}></Route>

            {/* // http://localhost:3000/admin/add-phieu-giam-gia */}
            <Route path='/admin/add-phieu-giam-gia' element={<PhieuGiamGiaComponent />}></Route>


            {/* // http://localhost:3000/admin/edit-phieu-giam-gia/1 */}
            <Route path='/admin/edit-phieu-giam-gia/:idPhieugiamgia' element={<PhieuGiamGiaComponent />}></Route>



            {/* // Sản phẩm */}
            <Route path='/admin/san-pham' element={<ListSanPhamComponent />}></Route>

            <Route path='/admin/do-hoa' element={<ListDoHoaComponent />}></Route>
            {/*// http://localhost:3000/admin/add-doHoa */}
            <Route path='/admin/add-do-hoa' element={<AddDoHoaComponent />}></Route>
            {/*// http://localhost:3000/admin/update-doHoa/1 */}
            <Route path='/admin/update-do-hoa/:id' element={<AddDoHoaComponent />}></Route>


            {/*// http://localhost:3000/admin/cpu */}
            <Route path='/admin/cpu' element={<ListCpuComponent />}></Route>
            {/*// http://localhost:3000/admin/add-cpu */}
            <Route path='/admin/add-cpu' element={<AddCpuComponent />}></Route>
            {/*// http://localhost:3000/admin/update-cpu/1 */}
            <Route path='/admin/update-cpu/:id' element={<AddCpuComponent />}></Route>


            <Route path='/admin/danh-muc' element={<ListDanhMucComponent />}></Route>

            <Route path='/admin/hang' element={<ListHangComponent />}></Route>

            <Route path='/admin/seri' element={<ListSeriComponent />}></Route>

            <Route path='/admin/mau-sac' element={<ListMauSacComponent />}></Route>

            <Route path='/admin/add-mausac' element={<AddMauSacComponent />}></Route>
            {/*// http://localhost:3000/admin/update-cpu/1 */}
            <Route path='/admin/update-mausac/:id' element={<AddMauSacComponent />}></Route>

            <Route path='/admin/pin' element={<ListPinComponent />}></Route>

            <Route path='/admin/ram' element={<ListRamComponent />}></Route>
            <Route path='/admin/add-ram' element={<AddRamComponent />}></Route>
            <Route path='/admin/update-ram/:id' element={<AddRamComponent />}></Route>


            <Route path='/admin/rom' element={<ListRomComponent />}></Route>
            <Route path='/admin/add-rom' element={<AddRomComponent />}></Route>
            <Route path='/admin/update-rom/:id' element={<AddRomComponent />}></Route>

            <Route path='/admin/man-hinh' element={<ListManHinhComponent />}></Route>

            {/* // Tài Khoản */}

            <Route path='/admin/nhan-vien' element={<ListNhanVienComponent />}></Route>

            <Route path='/admin/khach-hang' element={<ListKhachHangComponent />}></Route>

            {/* // Thống Kê */}

            {/* //http://localhost:3000 */}
            <Route path='/' element={<ListThongKeComponent />}></Route>
            <Route path='/admin/thong-ke' element={<ListThongKeComponent />}></Route>

            {/* // Bán Tại Quầy */}

            <Route path='/admin/ban-hang-tai-quay' element={<ListBanTaiQuayComponent />}></Route>

            {/* // Trả Hàng */}

            <Route path='/admin/tra-hang' element={<ListTraHangComponent />}></Route>

          </Routes>


        </AppLayout>



      </Router>

    </>
  )
}

export default App
