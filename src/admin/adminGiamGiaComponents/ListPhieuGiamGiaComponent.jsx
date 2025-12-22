import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteVoucher, listVouchers, searchVoucher, filterVouchers, getPagedVouchers, deactivateVoucher } from '../../service/PhieuGiamGiaService';
import { EditOutlined, StopOutlined, ReloadOutlined } from '@ant-design/icons';
import { Table, Input, Button, Select, Tag, DatePicker, Space, message, Pagination } from 'antd';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

const ListPhieuGiamGiaComponent = () => {
  const [vouchers, setVouchers] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [trangThai, setTrangThai] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const size = 5;

  const navigator = useNavigate();

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
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(value);
  };

  const formatGiaTriGiam = (giaTriGiam, kieuGiamGia) => {
    return kieuGiamGia === 'GIAM_PHAN_TRAM' ? `${giaTriGiam}%` : formatCurrency(giaTriGiam);
  };

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user || user.role !== 'ADMIN') {
      message.error('Bạn không có quyền truy cập trang này!');
      navigator('/login');
      return;
    }
    fetchPagedVouchers(0);
  }, [navigator]);

  useEffect(() => {
    handleFilter();
  }, [trangThai, startDate, endDate, sortBy]);

  const fetchPagedVouchers = (page) => {
    getPagedVouchers(page, size)
      .then((res) => {
        setVouchers(res.data.vouchers);
        setCurrentPage(res.data.currentPage);
        setTotalPages(res.data.totalPages);
      })
      .catch((err) => console.error(err));
  };

  const handleSearch = () => {
    if (!keyword.trim()) {
      fetchPagedVouchers(0);
      return;
    }
    searchVoucher(keyword)
      .then((res) => setVouchers(res.data))
      .catch((err) => {
        message.error('Tìm kiếm thất bại');
        console.error(err);
      });
  };

  const handleFilter = () => {
    const params = {
      keyword: keyword || null,
      startDate: startDate || null,
      endDate: endDate || null,
      trangThai: trangThai === "" ? null : Number(trangThai),
      sortBy: sortBy || null,
    };

    console.log("🟢 Params gửi:", params);

    filterVouchers(params)
      .then((res) => setVouchers(res.data))
      .catch((err) => {
        console.error(err);
        message.error('Lọc thất bại');
      });
  };

  const handleDeactivate = async (id) => {
    const isConfirmed = window.confirm("Bạn có muốn chuyển trạng thái sang 'Ngưng hoạt động' không?");
    if (!isConfirmed) return;
    try {
      await deactivateVoucher(id);
      message.success("Đã chuyển trạng thái sang 'Ngưng hoạt động'");
      fetchPagedVouchers(currentPage);
    } catch (error) {
      message.error("Lỗi khi đổi trạng thái");
    }
  };

  const addVoucher = () => navigator('/admin/add-phieu-giam-gia');
  const updateVoucher = (id) => navigator(`/admin/edit-phieu-giam-gia/${id}`);

  const columns = [
    { title: 'STT', render: (_, __, index) => index + 1 },
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
      title: 'Hành động',
      render: (_, record) => (
        <Space size="middle">
          <EditOutlined style={{ color: 'orange', cursor: 'pointer' }} onClick={() => updateVoucher(record.idPhieugiamgia)} />
          <StopOutlined
            style={{
              color: 'red',
              cursor: record.trangThai === 3 ? 'not-allowed' : 'pointer',
              opacity: record.trangThai === 3 ? 0.3 : 1
            }}
            onClick={() => { if (record.trangThai !== 3) handleDeactivate(record.idPhieugiamgia); }}
          />
        </Space>
      )
    }
  ];

  return (
    <div className='container mt-4'>
      <h1 style={{ textAlign: 'center' }}>Phiếu Giảm Giá</h1>

      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Tìm Phiếu Giảm Giá"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onSearch={handleSearch}
          enterButton
          style={{ width: 200 }}
        />

        <Button icon={<ReloadOutlined />} onClick={() => { setKeyword(''); fetchPagedVouchers(0); }}>Làm mới</Button>

        <RangePicker
          onChange={(dates) => {
            if (!dates) {
              setStartDate(''); setEndDate('');
            } else {
              setStartDate(dates[0].format('YYYY-MM-DD'));
              setEndDate(dates[1].format('YYYY-MM-DD'));
            }
            handleFilter();
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




        <Select placeholder="Sắp Xếp" style={{ width: 180 }} value={sortBy} onChange={(val) => { setSortBy(val); handleFilter(); }}>
          <Option value="">Mặc định</Option>
          <Option value="ten_asc">Tên (A-Z)</Option>
          <Option value="ten_desc">Tên (Z-A)</Option>
          <Option value="ngayBatDau_asc">Ngày Bắt Đầu ↑</Option>
          <Option value="ngayBatDau_desc">Ngày Bắt Đầu ↓</Option>
          <Option value="ngayKetThuc_asc">Ngày Kết Thúc ↑</Option>
          <Option value="ngayKetThuc_desc">Ngày Kết Thúc ↓</Option>
        </Select>

        <Button type="primary" onClick={addVoucher}>+ Tạo phiếu giảm giá</Button>
      </Space>

      <Table
        columns={columns}
        dataSource={vouchers}
        rowKey="idPhieugiamgia"
        pagination={false}
      />

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
        <Pagination
          current={currentPage + 1}
          pageSize={size}
          total={totalPages * size}
          onChange={(page) => fetchPagedVouchers(page - 1)}
          showSizeChanger={false}
        />
      </div>
    </div>
  );
};

export default ListPhieuGiamGiaComponent;
