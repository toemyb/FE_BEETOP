import React, { useEffect, useMemo, useState } from 'react';
import { Table, Input, Button, Tag, Select, DatePicker, Space } from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { searchOrders } from '../../service/OrderManagementService';

const { RangePicker } = DatePicker;
const { Option } = Select;

// Định dạng tiền
const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '0 ₫';
  const num = Number(amount) || 0;
  return num.toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
  });
};

// Map loại đơn
const LOAI_DON_MAP = {
  ONLINE: {
    text: 'Đơn hàng online',
    color: '#228be6',
    bg: '#e7f5ff',
  },
  TAI_QUAY: {
    text: 'Bán tại quầy',
    color: '#12b886',
    bg: '#e6fcf5',
  },
};

// Map trạng thái đơn (tuỳ enum bên BE)
const TRANG_THAI_DON_MAP = {
  0: {
    text: 'Chờ xác nhận',
    color: '#f08c00',
    bg: '#fff4e6',
  },
  1: {
    text: 'Đang chuẩn bị hàng',
    color: '#1c7ed6',
    bg: '#e7f5ff',
  },
  2: {
    text: 'Hoàn thành',
    color: '#2f9e44',
    bg: '#ebfbee',
  },
  3: {
    text: 'Đã hủy',
    color: '#e03131',
    bg: '#fff5f5',
  },
  4: {
    text: 'Đang giao',
    color: '#0c8599',
    bg: '#e3fafc',
  },
};

// Map trạng thái thanh toán
const TRANG_THAI_TT_MAP = {
  0: {
    text: 'Chưa thanh toán',
    color: '#f76707',
    bg: '#fff4e6',
  },
  1: {
    text: 'Đã thanh toán',
    color: '#2f9e44',
    bg: '#ebfbee',
  },
};

// Tabs phía trên
const ORDER_TABS = [
  { key: 'ALL', label: 'Tất cả', trangThaiDon: null },
  { key: 'CHO_XAC_NHAN', label: 'Chờ xác nhận', trangThaiDon: 0 },
  { key: 'DANG_XU_LY', label: 'Đang xử lý', trangThaiDon: 1 },
  { key: 'DANG_GIAO', label: 'Đang giao', trangThaiDon: 4 },
  { key: 'HOAN_THANH', label: 'Hoàn thành', trangThaiDon: 2 },
  { key: 'DA_HUY', label: 'Đã hủy', trangThaiDon: 3 },
];

const ListDonHangComponent = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1); // antd 1-based
  const [size, setSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  const [searchText, setSearchText] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // desc = mới nhất trước
  const [dateRange, setDateRange] = useState(null);

  const [activeTabKey, setActiveTabKey] = useState('ALL');

  const navigate = useNavigate();

  // Đếm số đơn theo trạng thái trong DS hiện tại (chỉ để hiển thị badge)
  const statusCounts = useMemo(() => {
    const counts = {};
    orders.forEach((o) => {
      const s = o.trangThaiDon;
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [orders]);

  const activeTab =
    ORDER_TABS.find((t) => t.key === activeTabKey) || ORDER_TABS[0];

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const params = {
        keyword: searchText || undefined,
        loaiDon: undefined, // nếu cần lọc ONLINE / TAI_QUAY thì set ở đây
        trangThaiDon: activeTab.trangThaiDon,
        trangThaiThanhToan: undefined,
        fromDate:
          dateRange && dateRange[0]
            ? dateRange[0].format('YYYY-MM-DD')
            : undefined,
        toDate:
          dateRange && dateRange[1]
            ? dateRange[1].format('YYYY-MM-DD')
            : undefined,
        page: page - 1, // BE 0-based
        size,
        sort: `ngayTao,${sortOrder}`, // để service map sang sortType newest/oldest
      };

      const pageResult = await searchOrders(params); // PageResult<OrderListDTO>

      if (!pageResult) {
        setOrders([]);
        setTotalElements(0);
        return;
      }

      setOrders(pageResult.content || []);
      setTotalElements(pageResult.totalElements || 0);
    } catch (err) {
      console.error('Lỗi tải danh sách đơn hàng:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size, sortOrder, activeTabKey, dateRange]);

  const resetFilter = () => {
    setSearchText('');
    setDateRange(null);
    setSortOrder('desc');
    setActiveTabKey('ALL');
    setPage(1);
  };

  const handleSearch = () => {
    setPage(1);
    fetchOrders();
  };

  // format giống ảnh: 22:30 26/08/2025
  const formatDateTime = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const time = d.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const date = d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    return `${time} ${date}`;
  };

  const columns = [
    {
      title: 'STT',
      dataIndex: 'index',
      width: 70,
      fixed: 'left',
      render: (_text, _record, index) => (page - 1) * size + index + 1,
    },
    {
      title: 'Mã đơn hàng',
      dataIndex: 'maDonHang',
      render: (value, record) => (
        <span
          style={{ color: '#1c7ed6', cursor: 'pointer', fontWeight: 500 }}
          onClick={() => navigate(`/admin/orders/${record.id}`)} // 🔥 điều hướng chi tiết
        >
          {value}
        </span>
      ),
    },
    {
      title: 'Mã nhân viên',
      dataIndex: 'maNhanVien',
      render: (value) => value || 'N/A',
    },
    {
      title: 'Tên khách hàng',
      dataIndex: 'tenKhachHang',
      render: (value) => {
        const name = value || 'Khách vãng lai';
        const firstChar = name?.charAt(0)?.toUpperCase() || 'K';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: '#e9ecef',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 600,
                color: '#495057',
              }}
            >
              {firstChar}
            </div>
            <span>{name}</span>
          </div>
        );
      },
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'sdtKhachHang',
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'tongTien',
      align: 'right',
      render: (value) => (
        <Tag
          color="#ebfbee"
          style={{
            borderRadius: 16,
            border: 'none',
            padding: '2px 10px',
            fontWeight: 600,
          }}
        >
          <span style={{ color: '#2f9e44' }}>{formatCurrency(value)}</span>
        </Tag>
      ),
    },
    {
      title: 'Loại đơn hàng',
      dataIndex: 'loaiDon',
      render: (value) => {
        const conf = LOAI_DON_MAP[value] || {
          text: value || 'Không xác định',
          color: '#495057',
          bg: '#f1f3f5',
        };
        return (
          <Tag
            style={{
              borderRadius: 16,
              padding: '2px 10px',
              border: 'none',
            }}
            color={conf.bg}
          >
            <span style={{ color: conf.color, fontWeight: 500 }}>
              {conf.text}
            </span>
          </Tag>
        );
      },
    },
    {
      title: 'Trạng thái đơn hàng',
      dataIndex: 'trangThaiDon',
      render: (value) => {
        const conf = TRANG_THAI_DON_MAP[value] || {
          text: 'Không xác định',
          color: '#495057',
          bg: '#f1f3f5',
        };
        return (
          <Tag
            style={{
              borderRadius: 16,
              padding: '2px 10px',
              border: 'none',
            }}
            color={conf.bg}
          >
            <span style={{ color: conf.color, fontWeight: 500 }}>
              {conf.text}
            </span>
          </Tag>
        );
      },
    },
    {
      title: 'Trạng thái thanh toán',
      dataIndex: 'trangThaiThanhToan',
      render: (value) => {
        const conf = TRANG_THAI_TT_MAP[value] || {
          text: 'Không xác định',
          color: '#495057',
          bg: '#f1f3f5',
        };
        return (
          <Tag
            style={{
              borderRadius: 16,
              padding: '2px 10px',
              border: 'none',
            }}
            color={conf.bg}
          >
            <span style={{ color: conf.color, fontWeight: 500 }}>
              {conf.text}
            </span>
          </Tag>
        );
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'ngayTao',
      render: (value) => (
        <div
          style={{
            backgroundColor: '#e6fcf5',
            borderRadius: 6,
            padding: '2px 6px',
            display: 'inline-block',
          }}
        >
          <span style={{ whiteSpace: 'nowrap', color: '#0ca678' }}>
            {formatDateTime(value)}
          </span>
        </div>
      ),
    },
    {
      title: 'Ngày cập nhật',
      dataIndex: 'ngayCapNhat',
      render: (value) => (
        <span style={{ whiteSpace: 'nowrap' }}>
          {formatDateTime(value)}
        </span>
      ),
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      fixed: 'right',
      width: 90,
      render: (_text, record) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/admin/orders/${record.id}`)} // 🔥 xem chi tiết
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => {
              console.log('Sửa đơn', record.id);
            }}
          />
        </Space>
      ),
    },
  ];

  const renderTab = (tab) => {
    const isActive = tab.key === activeTabKey;
    const count =
      tab.trangThaiDon == null
        ? totalElements
        : statusCounts[tab.trangThaiDon] || 0;

    return (
      <button
        key={tab.key}
        onClick={() => {
          setActiveTabKey(tab.key);
          setPage(1);
        }}
        style={{
          borderRadius: '999px',
          border: isActive ? 'none' : '1px solid #dee2e6',
          padding: '6px 14px',
          marginRight: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          backgroundColor: isActive ? '#12b886' : '#ffffff',
          color: isActive ? '#ffffff' : '#495057',
          fontWeight: 500,
          cursor: 'pointer',
          boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.12)' : 'none',
          whiteSpace: 'nowrap',
        }}
      >
        <span>{tab.label}</span>
        <span
          style={{
            borderRadius: '999px',
            padding: '0 8px',
            backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : '#f1f3f5',
            color: isActive ? '#fff' : '#495057',
            fontSize: 12,
          }}
        >
          {count}
        </span>
      </button>
    );
  };

  return (
    <div
      style={{
        padding: 16,
        backgroundColor: '#f5f7fa',
        minHeight: '100vh',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <h3 style={{ marginBottom: 16 }}>
        <span style={{ color: '#28a745' }}>Quản lý đơn hàng</span>{' '}
        <small style={{ color: '#6c757d', fontWeight: 'normal' }}>
          Danh sách &amp; trạng thái
        </small>
      </h3>

      {/* Tabs trạng thái */}
      <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap' }}>
        {ORDER_TABS.map(renderTab)}
      </div>

      {/* Khung search + table */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 8,
          padding: 16,
          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
        }}
      >
        {/* Thanh search + filter */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 12,
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <Input
            allowClear
            placeholder="Tìm kiếm..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={handleSearch}
            style={{ maxWidth: 280 }}
          />

          <Space>
            <RangePicker
              format="DD/MM/YYYY"
              value={dateRange}
              onChange={(values) => {
                setDateRange(values);
                setPage(1);
              }}
            />

            <Select
              value={sortOrder}
              style={{ width: 140 }}
              onChange={(val) => {
                setSortOrder(val);
                setPage(1);
              }}
            >
              <Option value="asc">Cũ nhất trước</Option>
              <Option value="desc">Mới nhất trước</Option>
            </Select>

            <Button icon={<ReloadOutlined />} onClick={resetFilter}>
              Làm mới
            </Button>
          </Space>
        </div>

        {/* Bảng */}
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={orders}
          size="middle"
          scroll={{ x: 1300 }}
          pagination={{
            current: page,
            pageSize: size,
            total: totalElements,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50],
            onChange: (current, pageSize) => {
              setPage(current);
              setSize(pageSize);
            },
            showTotal: (total, [start, end]) =>
              `${start}–${end} / ${total} đơn`,
          }}
        />
      </div>
    </div>
  );
};

export default ListDonHangComponent;
