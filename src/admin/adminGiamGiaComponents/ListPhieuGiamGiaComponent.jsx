import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchVoucher, filterVouchers, getPagedVouchers, deactivateVoucher } from '../../service/PhieuGiamGiaService';
import { EditOutlined, StopOutlined, ReloadOutlined } from '@ant-design/icons';
import { Table, Input, Button, Select, Tag, DatePicker, Space, Modal } from 'antd';
import { toast } from 'react-toastify';

const { RangePicker } = DatePicker;
const { Option } = Select;

const ListPhieuGiamGiaComponent = () => {
  const [vouchers, setVouchers] = useState([]);
  const [allVouchers, setAllVouchers] = useState([]); // full list khi filter/search để FE tự phân trang

  const [keyword, setKeyword] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [trangThai, setTrangThai] = useState('');
  const [sortBy, setSortBy] = useState('');

  // ✅ NEW: pagination kiểu Antd Table (giống ListSanPham)
  const [pagination, setPagination] = useState({
    current: 1,  // 1-based
    pageSize: 5,
  });

  const [totalPages, setTotalPages] = useState(0); // server mode
  const navigator = useNavigate();

  let user = null;
  try {
    const raw = sessionStorage.getItem("user");
    user = raw ? JSON.parse(raw) : null;
  } catch {}

  const role = (user?.role || "").trim();
  const isAdmin = role === "ADMIN" || role === "ROLE_ADMIN";

  const size = pagination.pageSize;

  // ✅ đang lọc/search hay không
  const isFiltering = useMemo(() => {
    return (
      keyword.trim() !== '' ||
      startDate !== '' ||
      endDate !== '' ||
      trangThai !== '' ||
      (sortBy && sortBy.trim() !== '')
    );
  }, [keyword, startDate, endDate, trangThai, sortBy]);

  const statusMap = {
    0: <Tag color="blue">Chưa Kích Hoạt</Tag>,
    1: <Tag color="green">Đang Hoạt động</Tag>,
    2: <Tag color="gray">Hết Hạn</Tag>,
    3: <Tag color="red">Ngưng Hoạt Động</Tag>,
  };

  const kieuGiamGiaMap = {
    GIAM_CO_DINH: 'Giảm cố định',
    GIAM_PHAN_TRAM: 'Giảm phần trăm',
  };

  const formatCurrency = (value) => {
    if (value == null || isNaN(value)) return '';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatGiaTriGiam = (giaTriGiam, kieuGiamGia) => {
    return kieuGiamGia === 'GIAM_PHAN_TRAM' ? `${giaTriGiam}%` : formatCurrency(giaTriGiam);
  };

  useEffect(() => {
    const u = JSON.parse(sessionStorage.getItem('user'));
    const allowed = ["ADMIN", "NHAN_VIEN", "ROLE_ADMIN", "ROLE_NHAN_VIEN"];
    if (!u || !allowed.includes(u.role)) {
      toast.error("Bạn không có quyền truy cập trang này!");
      navigator("/admin/thong-ke");
      return;
    }
    fetchPagedVouchers(0, size);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigator]);

  // ✅ khi đổi các filter dropdown/date/sort -> auto filter lại
  useEffect(() => {
    if (!isFiltering) {
      setPagination((prev) => ({ ...prev, current: 1 }));
      fetchPagedVouchers(0, size);
      return;
    }
    applyFilter(1, size);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trangThai, startDate, endDate, sortBy]);

  const fetchPagedVouchers = (page0, pageSize) => {
    getPagedVouchers(page0, pageSize)
      .then((res) => {
        setVouchers(res.data.vouchers || []);
        setTotalPages(res.data.totalPages || 0);
        setAllVouchers([]); // clear mode filter/search
        setPagination({ current: (res.data.currentPage || 0) + 1, pageSize }); // 1-based
      })
      .catch((err) => {
        console.error(err);
        toast.error("Tải danh sách thất bại");
      });
  };

  // ✅ helper: phân trang trên FE từ allVouchers
  const applyClientPaging = (list, current1, pageSize) => {
    const c = Math.max(1, current1);
    setAllVouchers(list);
    setPagination({ current: c, pageSize });

    const start = (c - 1) * pageSize;
    setVouchers(list.slice(start, start + pageSize));
  };

  const handleSearch = () => {
    const kw = keyword.trim();
    if (!kw) {
      setPagination((prev) => ({ ...prev, current: 1 }));
      fetchPagedVouchers(0, size);
      return;
    }

    searchVoucher(kw)
      .then((res) => {
        const list = res.data || [];
        applyClientPaging(list, 1, size);
      })
      .catch((err) => {
        console.error(err);
        toast.error('Tìm kiếm thất bại');
      });
  };

  const applyFilter = (current1 = 1, pageSize = size) => {
    const params = {
      keyword: keyword.trim() ? keyword.trim() : null,
      startDate: startDate || null,
      endDate: endDate || null,
      trangThai: trangThai === "" ? null : Number(trangThai),
      sortBy: sortBy || null,
    };

    filterVouchers(params)
      .then((res) => {
        const list = res.data || [];
        applyClientPaging(list, current1, pageSize);
      })
      .catch((err) => {
        console.error(err);
        toast.error('Lọc thất bại');
      });
  };

  const handleDeactivate = (id) => {
    Modal.confirm({
      title: "Xác nhận ngưng hoạt động",
      content: "Bạn có muốn chuyển trạng thái sang 'Ngưng hoạt động' không?",
      okText: "Xác nhận",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deactivateVoucher(id);
          toast.success("Đã chuyển trạng thái sang 'Ngưng hoạt động'");

          // refresh theo mode hiện tại
          if (isFiltering) {
            applyFilter(pagination.current, pagination.pageSize);
          } else {
            fetchPagedVouchers(pagination.current - 1, pagination.pageSize);
          }
        } catch (e) {
          toast.error("Lỗi khi đổi trạng thái");
        }
      },
    });
  };

  const addVoucher = () => navigator('/admin/add-phieu-giam-gia');
  const updateVoucher = (id) => navigator(`/admin/edit-phieu-giam-gia/${id}`);

  const columns = [
    { title: 'STT', render: (_, __, index) => index + 1 + (pagination.current - 1) * pagination.pageSize },
    { title: 'Mã', dataIndex: 'idPhieugiamgia' },
    { title: 'Tên', dataIndex: 'ten' },
    { title: 'Số lượng', dataIndex: 'soLuong' },
    { title: 'Kiểu giảm giá', render: (_, record) => kieuGiamGiaMap[record.kieuGiamGia] || record.kieuGiamGia },
    { title: 'Giá trị giảm', render: (_, record) => <span style={{ color: 'red' }}>{formatGiaTriGiam(record.giaTriGiam, record.kieuGiamGia)}</span> },
    { title: 'Thời gian', render: (_, record) => `${record.ngayBatDau} - ${record.ngayKetThuc}` },
    { title: 'Điều kiện áp dụng', render: (_, record) => `Tối thiểu: ${formatCurrency(record.giaTriMin)}` },
    { title: 'Mô tả', dataIndex: 'moTa' },
    { title: 'Trạng thái', render: (_, record) => statusMap[record.trangThai] || <Tag>Không rõ</Tag> },
    {
      title: "Hành động",
      render: (_, record) => (
        <Space size="middle">
          <EditOutlined
            style={{
              color: isAdmin ? "orange" : "#999",
              cursor: isAdmin ? "pointer" : "not-allowed",
              opacity: isAdmin ? 1 : 0.4,
            }}
            onClick={() => {
              if (!isAdmin) return toast.warn("Chỉ ADMIN được sửa phiếu giảm giá.");
              updateVoucher(record.idPhieugiamgia);
            }}
          />
          <StopOutlined
            style={{
              color: isAdmin && record.trangThai !== 3 ? "red" : "#999",
              cursor: isAdmin && record.trangThai !== 3 ? "pointer" : "not-allowed",
              opacity: isAdmin && record.trangThai !== 3 ? 1 : 0.3,
            }}
            onClick={() => {
              if (!isAdmin) return toast.warn("Chỉ ADMIN được ngưng phiếu giảm giá.");
              if (record.trangThai === 3) return;
              handleDeactivate(record.idPhieugiamgia);
            }}
          />
        </Space>
      ),
    }
  ];

  const handleReset = () => {
    setKeyword('');
    setStartDate('');
    setEndDate('');
    setTrangThai('');
    setSortBy('');
    setAllVouchers([]);
    setPagination({ current: 1, pageSize: 5 });
    fetchPagedVouchers(0, 5);
  };

  return (
    
     <div style={{ padding: 24 }}>
       <h2 className="text-center">Quản Lý Phiếu Giảm Giá</h2>

      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Tìm Phiếu Giảm Giá"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onSearch={handleSearch}
          enterButton
          style={{ width: 200 }}
        />

  

        <RangePicker
          onChange={(dates) => {
            if (!dates) {
              setStartDate('');
              setEndDate('');
            } else {
              setStartDate(dates[0].format('YYYY-MM-DD'));
              setEndDate(dates[1].format('YYYY-MM-DD'));
            }
          }}
        />

        <Select
          placeholder="Trạng Thái"
          style={{ width: 180 }}
          value={trangThai}
          onChange={(value) => setTrangThai(value)}
        >
          <Option value="">Tất cả</Option>
          <Option value={0}>Chưa Kích Hoạt</Option>
          <Option value={1}>Đang Hoạt động</Option>
          <Option value={2}>Hết Hạn</Option>
          <Option value={3}>Ngưng Hoạt Động</Option>
        </Select>

        <Select
          placeholder="Sắp Xếp"
          style={{ width: 180 }}
          value={sortBy}
          onChange={(val) => setSortBy(val)}
        >
          <Option value="">Mặc định</Option>
          <Option value="ten_asc">Tên (A-Z)</Option>
          <Option value="ten_desc">Tên (Z-A)</Option>
          <Option value="ngayBatDau_asc">Ngày Bắt Đầu ↑</Option>
          <Option value="ngayBatDau_desc">Ngày Bắt Đầu ↓</Option>
          <Option value="ngayKetThuc_asc">Ngày Kết Thúc ↑</Option>
          <Option value="ngayKetThuc_desc">Ngày Kết Thúc ↓</Option>
        </Select>

        {isAdmin && (
          <Button type="primary" onClick={addVoucher}>
            + Tạo phiếu giảm giá
          </Button>
        )}
         <Button icon={<ReloadOutlined />} onClick={handleReset}>Làm mới</Button>
      </Space>

      <Table
        columns={columns}
        dataSource={vouchers}
        rowKey="idPhieugiamgia"
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: isFiltering ? allVouchers.length : (totalPages * pagination.pageSize),
          showSizeChanger: true,
          pageSizeOptions: ['5', '10', '20', '50'],
        }}
        onChange={(pag) => {
          const nextCurrent = pag.current || 1;
          const nextSize = pag.pageSize || pagination.pageSize;

          // ✅ đổi pageSize -> reset về trang 1
          const finalCurrent = nextSize !== pagination.pageSize ? 1 : nextCurrent;

          if (isFiltering) {
            applyClientPaging(allVouchers, finalCurrent, nextSize);
          } else {
            fetchPagedVouchers(finalCurrent - 1, nextSize);
          }
        }}
      />
    </div>
  );
};

export default ListPhieuGiamGiaComponent;
