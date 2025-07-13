import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listDotGiamGia, deactivateDotGiamGia, getPagedDotGiamGia, filterDotGiamGia, searchDotGiamGia } from '../../service/DotGiamGiaService'
import { FaEdit, FaSyncAlt } from 'react-icons/fa';




const ListDotGiamGiaComponent = () => {
  const [dotGiamGia, setDotGiamGia] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const size = 5;

  const [keyword, setKeyword] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [trangThai, setTrangThai] = useState('');
  const [sortBy, setSortBy] = useState('');

  const navigator = useNavigate();

    useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user || user.role !== 'ADMIN') {
      message.error('Bạn không có quyền truy cập trang này!');
      navigator('/login');
      return;
    }
    
    fetchFilteredDots(0);
  }, [navigator]);

  const statusMap = {
    0: <span className="badge bg-primary">Chưa Kích Hoạt</span>,
    1: <span className="badge bg-success">Đang Hoạt động</span>,
    2: <span className="badge bg-secondary">Hết Hạn</span>,
    3: <span className="badge bg-danger">Ngưng Hoạt Động</span>
  };

  const kieuGiamGiaMap = {
    GIAM_GIA_CO_DINH: 'Giảm cố định',
    GIAM_GIA_PHAN_TRAM: 'Giảm phần trăm',
  };

  const renderStatus = (status) => statusMap[status] || <span className="badge bg-light text-dark">Không rõ</span>;

  const formatCurrency = (value) => {
    if (value == null || isNaN(value)) return '';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatGiaTriGiam = (giaTriGiam, kieuGiamGia) => {
    return kieuGiamGia === 'GIAM_GIA_PHAN_TRAM' ? `${giaTriGiam}%` : formatCurrency(giaTriGiam);
  };

  const fetchFilteredDots = (page = 0) => {
    const params = {
      keyword,
      start: startDate || undefined,
      end: endDate || undefined,
      status: trangThai !== '' ? Number(trangThai) : undefined,
      sortBy,
      page,
      size
    };

    console.log('GỬI LÊN:', params);

    filterDotGiamGia(params)
      .then((res) => {
        setDotGiamGia(res.data.content);
        setCurrentPage(page);
        setTotalPages(res.data.totalPages);
      })
      .catch((err) => console.error(err));
  };

  const handleDeactivate = async (idDotGiamGia) => {
    const isConfirmed = window.confirm("Bạn có muốn chuyển trạng thái sang 'Ngưng hoạt động' không?");
    if (!isConfirmed) return;

    try {
      await deactivateDotGiamGia(idDotGiamGia);
      alert("Đã chuyển trạng thái sang 'Ngưng hoạt động'");
      fetchFilteredDots(currentPage);
    } catch (error) {
      alert("Lỗi khi đổi trạng thái");
      console.error(error);
    }
  };

  useEffect(() => {
    fetchFilteredDots(0);
    setCurrentPage(0);
  }, [keyword, startDate, endDate, trangThai, sortBy]);


  function taoDotGiamGia() {


    navigator('/tao-dot-giam-gia')


  }



  return (
    <div className='container'>
      <h2 className='text-center'>Đợt Giảm Giá</h2>

      {/* Bộ lọc */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <div className="d-flex align-items-center flex-wrap gap-2">
          <input
            type="text"
            className="form-control"
            placeholder="Tìm Phiếu Giảm Giá"
            style={{ height: '40px', width: '180px' }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />

          <button
            className="btn text-dark"
            onClick={() => {
              setKeyword('');
              setStartDate('');
              setEndDate('');
              setTrangThai('');
              setSortBy('');
              setCurrentPage(0);
            }}
            style={{ backgroundColor: '#ffc107', height: '40px', fontWeight: '500', padding: '0 16px', whiteSpace: 'nowrap' }}
          >
            Làm Mới
          </button>

          <input
            type="date"
            className="form-control"
            style={{ height: '40px', width: '140px' }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <input
            type="date"
            className="form-control"
            style={{ height: '40px', width: '140px' }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <button
          className="btn btn-success"
          style={{
            height: '40px',
            fontWeight: '500',
            padding: '0 16px',
            whiteSpace: 'nowrap'
          }}
          onClick={taoDotGiamGia}
        >
          + Tạo đợt giảm giá
        </button>

      </div>

      {/* Trạng thái + Sắp xếp */}
      <div className="d-flex justify-content-center align-items-center flex-wrap gap-3 mb-4 mt-2">
        <div className="d-flex align-items-center">
          <span className="me-2">Trạng Thái:</span>
          <select
            className="form-select"
            style={{ width: '150px', height: '40px' }}
            value={trangThai}
            onChange={(e) => {
              setTrangThai(e.target.value);
            }}
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
              setCurrentPage(0);
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

      {/* Bảng */}
      <table className='table table-bordered table-hover text-center'>
        <thead>
          <tr>
            <th>STT</th>
            <th>Mã</th>
            <th>Tên</th>
            <th>Mô tả</th>
            <th>Kiểu giảm giá</th>
            <th>Giá trị giảm</th>
            <th>Thời gian</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {
            dotGiamGia.map((dotGiam, index) => (
              <tr key={dotGiam.idDotGiamGia}>
                <td>{currentPage * size + index + 1}</td>
                <td>{dotGiam.idDotGiamGia}</td>
                <td>{dotGiam.tenDot}</td>
                <td>{dotGiam.moTa}</td>
                <td>{kieuGiamGiaMap[dotGiam.kieuGiamGia] || dotGiam.kieuGiamGia}</td>
                <td style={{ color: 'red' }}>{formatGiaTriGiam(dotGiam.giaTriGiam, dotGiam.kieuGiamGia)}</td>
                <td>{dotGiam.ngayBatDau} - {dotGiam.ngayKetThuc}</td>
                <td>{renderStatus(dotGiam.trangThai)}</td>
                <td>
                  <FaEdit className="me-3 text-warning" style={{ cursor: 'pointer' }} title="Chỉnh sửa" />
                  <FaSyncAlt
                    className={`text-danger ${dotGiam.trangThai === 3 ? 'opacity-25' : ''}`}
                    style={{ cursor: dotGiam.trangThai === 3 ? 'not-allowed' : 'pointer' }}
                    onClick={() => {
                      if (dotGiam.trangThai !== 3) handleDeactivate(dotGiam.idDotGiamGia);
                    }}
                    title="Ngưng hoạt động"
                  />
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>

      {/* Phân trang */}
      <div className="d-flex justify-content-center mt-4">
        <nav>
          <ul className="pagination">
            <li className={`page-item ${currentPage === 0 ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => fetchFilteredDots(currentPage - 1)}>«</button>
            </li>

            {[...Array(totalPages).keys()].map((pageNum) => (
              <li key={pageNum} className={`page-item ${pageNum === currentPage ? 'active' : ''}`}>
                <button className="page-link" onClick={() => fetchFilteredDots(pageNum)}>{pageNum + 1}</button>
              </li>
            ))}

            <li className={`page-item ${currentPage === totalPages - 1 ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => fetchFilteredDots(currentPage + 1)}>»</button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default ListDotGiamGiaComponent;
