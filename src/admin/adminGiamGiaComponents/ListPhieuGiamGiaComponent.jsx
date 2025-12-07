import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { deleteVoucher, listVouchers, searchVoucher, filterVouchers, getPagedVouchers, deactivateVoucher } from '../../service/PhieuGiamGiaService'
import { FaEdit, FaSyncAlt } from 'react-icons/fa';



const ListPhieuGiamGiaComponent = () => {


  const [vouchers, setVouchers] = useState([])
  const navigator = useNavigate();

  const [keyword, setKeyword] = useState('')
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [trangThai, setTrangThai] = useState('');
  const [sortBy, setSortBy] = useState('');

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const size = 5;

  const location = useLocation();


  const statusMap = {
    0: <span className="badge bg-primary">Chưa Kích Hoạt</span>,
    1: <span className="badge bg-success">Đang Hoạt động</span>,
    2: <span className="badge bg-secondary">Hết Hạn</span>,
    3: <span className="badge bg-danger">Ngưng Hoạt Động</span>
  };

  const kieuGiamGiaMap = {
    GIAM_CO_DINH: 'Giảm cố định',
    GIAM_PHAN_TRAM: 'Giảm phần trăm',
  };

  const renderStatus = (status) => statusMap[status] || <span className="badge bg-light text-dark">Không rõ</span>;



  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user || user.role !== 'ADMIN') {
      message.error('Bạn không có quyền truy cập trang này!');
      navigator('/login');
      return;
    }

    fetchPagedVouchers(0);
  }, [navigator]);
  
  const fetchPagedVouchers = (page) => {
    getPagedVouchers(page, size)
      .then((res) => {
        setVouchers(res.data.vouchers);
        setCurrentPage(res.data.currentPage);
        setTotalPages(res.data.totalPages);
      })
      .catch((err) => console.error(err));
  };


  const formatCurrency = (value) => {
    if (value == null || isNaN(value)) return '';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // useEffect(() => {
  //   if (location.state && location.state.newVoucher) {
  //     setVouchers(prev => [location.state.newVoucher, ...prev]);
  //     window.history.replaceState({}, document.title);
  //   }
  // }, [location.state]);


  useEffect(() => {


    fetchPagedVouchers(0);

  }, [])

  useEffect(() => {
    handleFilter();
  }, [keyword, startDate, endDate, trangThai, sortBy]);


  

  function getAllVoucher() {


    listVouchers().then((respone) => {


      setVouchers(respone.data);


    }).catch(error => {

      console.error(error)
    })


  }

  function addVoucher() {


    navigator('/admin/add-phieu-giam-gia')


  }


  function updateVoucher(idPhieugiamgia) {


    navigator(`/admin/edit-phieu-giam-gia/${idPhieugiamgia}`);


  }


  // function removeVoucher(idPhieugiamgia) {

  //   const isConfirmed = window.confirm("Bạn có muốn xóa phiếu giảm giá này không?");
  //   if (!isConfirmed) return;

  //   console.log(idPhieugiamgia)

  //   deleteVoucher(idPhieugiamgia).then((respone) => {

  //     alert("✅ Đã xóa phiếu giảm giá thành công!");
  //     fetchPagedVouchers(0);

  //   }).catch(error => {
  //     alert("❌ Xóa thất bại. Vui lòng thử lại!");
  //     console.error(error)
  //   })

  // }

  const formatGiaTriGiam = (giaTriGiam, kieuGiamGia) => {
    if (kieuGiamGia === 'GIAM_PHAN_TRAM') {
      return `${giaTriGiam}%`;
    } else {
      return formatCurrency(giaTriGiam);
    }
  };



  function handleSearch() {
    if (!keyword.trim()) {
      fetchPagedVouchers(0); // nếu rỗng thì load lại tất cả
      return;
    }

    searchVoucher(keyword)
      .then((response) => {
        setVouchers(response.data);
      })
      .catch((error) => {
        alert("❌ Tìm kiếm thất bại");
        console.error(error);
      });
  }


  const handleFilter = () => {
    const params = {
      keyword: keyword || null,
      startDate: startDate || null,
      endDate: endDate || null,
      trangThai: trangThai !== '' ? parseInt(trangThai) : null,
      sortBy: sortBy || null,
    };

    console.log("🟢 Params gửi:", params);

    filterVouchers(params)
      .then((res) => setVouchers(res.data))
      .catch((err) => {
        console.error(err);
        alert('❌ Lọc thất bại!');
      });
  };


  const handleDeactivate = async (idPhieugiamgia) => {

    const isConfirmed = window.confirm("Bạn có muốn chuyển trạng thái sang 'Ngưng hoạt động' không?");
    if (!isConfirmed) return;


    try {
      await deactivateVoucher(idPhieugiamgia);
      alert("Đã chuyển trạng thái sang 'Ngưng hoạt động'");
      fetchPagedVouchers(currentPage);
    } catch (error) {
      alert("Lỗi khi đổi trạng thái");
    }
  };



  return (


    <div className='container mt-4'>

      <h1 className="text-center">Phiếu Giảm Giá</h1>

      {/* Dòng 1: Tìm kiếm + ngày + nút tạo */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <div className="d-flex align-items-center flex-wrap gap-2">
          {/* Tìm kiếm */}
          <input
            type="text"
            className="form-control"
            placeholder="Tìm Phiếu Giảm Giá"
            style={{ height: '40px', width: '180px' }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch();
            }}
          />

          {/* Làm mới */}
          <button
            className="btn text-dark"
            onClick={() => {
              setKeyword('');
              fetchPagedVouchers(0);
            }}
            style={{
              backgroundColor: '#ffc107',
              height: '40px',
              fontWeight: '500',
              padding: '0 16px',
              whiteSpace: 'nowrap'
            }}
          >
            Làm Mới
          </button>

          {/* Ngày bắt đầu */}
          <input
            type="date"
            className="form-control"
            style={{ height: '40px', width: '140px' }}
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              handleFilter();
            }}
          />

          {/* Ngày kết thúc */}
          <input
            type="date"
            className="form-control"
            style={{ height: '40px', width: '140px' }}
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              handleFilter();
            }}
          />
        </div>

        {/* Nút tạo phiếu */}
        <button
          className="btn btn-success"
          style={{
            height: '40px',
            fontWeight: '500',
            padding: '0 16px',
            whiteSpace: 'nowrap'
          }}
          onClick={addVoucher}
        >
          + Tạo phiếu giảm giá
        </button>
      </div>

      {/* Dòng 2: Trạng thái + Sắp xếp – căn giữa + cách bảng */}
      <div className="d-flex justify-content-center align-items-center flex-wrap gap-3 mb-4 mt-2">
        <div className="d-flex align-items-center">
          <span className="me-2">Trạng Thái:</span>
          <select
            className="form-select"
            style={{ width: '150px', height: '40px' }}
            value={trangThai}
            onChange={(e) => setTrangThai(e.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="0">Chưa Kích Hoạt</option>
            <option value="1">Đang Hoạt động</option>
            <option value="2">Hết Hạn</option>
            <option value="3">Ngưng Hoạt Động</option>

          </select>
        </div>

        <div className="d-flex align-items-center">
          <span className="me-2">Sắp Xếp:</span>
          <select
            className="form-select"
            style={{ width: '160px', height: '40px' }}
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              handleFilter();
            }}
          >
            <option value="">Mặc định</option>
            <option value="ten_asc">Tên (A-Z)</option>
            <option value="ten_desc">Tên (Z-A)</option>
            <option value="ngayBatDau_asc">Ngày Bắt Đầu ↑</option>
            <option value="ngayBatDau_desc">Ngày Bắt Đầu ↓</option>
            <option value="ngayKetThuc_asc">Ngày Kết Thúc ↑</option>
            <option value="ngayKetThuc_desc">Ngày Kết Thúc ↓</option>
          </select>
        </div>
      </div>



      <table className='table table-bordered table-hover text-center'>

        <thead className='table-light'>

          <tr >
            <th >STT</th>
            <th>Mã</th>
            <th>Tên</th>
            <th>Số lượng</th>
            <th>Kiểu giảm giá</th>
            <th>Giá trị giảm</th>
            <th>Thời gian</th>
            {/* <th>Giá trị tối thiểu</th>
            <th>Giá trị tối đa</th> */}
            <th>Điều kiện áp dụng</th>
            <th>Mô tả</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
          </tr>

        </thead>


        <tbody>

          {


            vouchers.map((vouchers, index) =>

              <tr key={vouchers.idPhieugiamgia}>

                <td>{index + 1}</td>
                <td>{vouchers.idPhieugiamgia}</td>
                <td>{vouchers.ten}</td>
                <td>{vouchers.soLuong}</td>
                <td>{kieuGiamGiaMap[vouchers.kieuGiamGia] || vouchers.kieuGiamGia}</td>

                <td style={{ color: 'red' }}>
                  {formatGiaTriGiam(vouchers.giaTriGiam, vouchers.kieuGiamGia)}
                </td>

                <td>
                  {vouchers.ngayBatDau} - {vouchers.ngayKetThuc}

                </td>

                {/* <td>{formatCurrency(vouchers.giaTriMin)}</td>
                <td>{formatCurrency(vouchers.giaTriMax)}</td> */}
                <td>
                  {formatCurrency(vouchers.giaTriMin)} - {formatCurrency(vouchers.giaTriMax)}
                </td>
                <td>{vouchers.moTa}</td>
                <td>

                  {renderStatus(vouchers.trangThai)}

                </td>

                <td>
                  <FaEdit
                    className="me-3 text-warning"
                    style={{ cursor: 'pointer' }}
                    onClick={() => updateVoucher(vouchers.idPhieugiamgia)}
                    title="Chỉnh sửa"
                  />

                  <FaSyncAlt
                    className={`text-danger ${vouchers.trangThai === 3 ? 'opacity-25' : ''}`}
                    style={{ cursor: vouchers.trangThai === 3 ? 'not-allowed' : 'pointer' }}
                    onClick={() => {
                      if (vouchers.trangThai !== 3) handleDeactivate(vouchers.idPhieugiamgia);
                    }}
                    title="Ngưng hoạt động"
                  />
                </td>









              </tr>)



          }


        </tbody>


      </table>

      {/* Thanh phân trang */}
      <div className="d-flex justify-content-center mt-4">
        <nav>
          <ul className="pagination">

            <li className={`page-item ${currentPage === 0 ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => fetchPagedVouchers(currentPage - 1)}>«</button>
            </li>

            {[...Array(totalPages).keys()].map((pageNum) => (
              <li
                key={pageNum}
                className={`page-item ${pageNum === currentPage ? 'active' : ''}`}
              >
                <button
                  className="page-link"
                  onClick={() => fetchPagedVouchers(pageNum)}
                >
                  {pageNum + 1}
                </button>
              </li>
            ))}

            <li className={`page-item ${currentPage === totalPages - 1 ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => fetchPagedVouchers(currentPage + 1)}>»</button>
            </li>

          </ul>
        </nav>
      </div>


    </div>




  )





}

export default ListPhieuGiamGiaComponent