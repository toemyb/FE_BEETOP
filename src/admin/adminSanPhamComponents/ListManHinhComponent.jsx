import React, { useState, useEffect } from 'react';
import {
  Table,
  Input,
  Select,
  Button,
  Space,
  Tag,
  message,
  Row,
  Col,
  Typography,
} from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { listManHinh } from '../../service/ManHinhService';
import AddManHinhModal from './AddManHinhComponet';

const { Option } = Select;
const { Title } = Typography;

const statusMap = {
  1: { text: 'Hoạt động', color: 'green' },
  0: { text: 'Ngưng hoạt động', color: 'red' },
};

const ListManHinhComponent = () => {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [filterTanSo, setFilterTanSo] = useState('all');
  const [sortSize, setSortSize] = useState('default');
  const [filterTrangThai, setFilterTrangThai] = useState('all');

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [pagination, setPagination] = useState({ current: 1, pageSize: 5 });

  // ✅ role: NHÂN VIÊN ẩn nút thêm + ẩn cột hành động
  const [isEmployee, setIsEmployee] = useState(false);

  useEffect(() => {
    // ✅ lấy role từ sessionStorage
    try {
      const raw = sessionStorage.getItem('user');
      const user = raw ? JSON.parse(raw) : null;
      const role = user?.role || '';
      setIsEmployee(role === 'NHAN_VIEN' || role === 'ROLE_NHAN_VIEN');
    } catch {
      setIsEmployee(false);
    }

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await listManHinh();
      const list =
        res?.data?.data ??
        res?.data?.content ??
        (Array.isArray(res?.data) ? res.data : []) ??
        [];
      setData(list);
      setFiltered(list);
      setPagination((p) => ({ ...p, current: 1 }));
    } catch {
      message.error('Lỗi khi tải dữ liệu màn hình');
      setData([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let temp = [...data];

    if (search.trim()) {
      const s = search.toLowerCase();
      temp = temp.filter(
        (item) =>
          item.ma?.toLowerCase().includes(s) ||
          item.doPhanGiai?.toLowerCase().includes(s)
      );
    }

    if (filterTanSo !== 'all') {
      temp = temp.filter((item) => String(item.tanSoQuet) === filterTanSo);
    }

    if (filterTrangThai !== 'all') {
      const st = Number(filterTrangThai);
      temp = temp.filter((item) => Number(item.trangThai) === st);
    }

    if (sortSize === 'az') {
      temp.sort((a, b) =>
        String(a.kichThuoc ?? '').localeCompare(String(b.kichThuoc ?? ''))
      );
    } else if (sortSize === 'za') {
      temp.sort((a, b) =>
        String(b.kichThuoc ?? '').localeCompare(String(a.kichThuoc ?? ''))
      );
    }

    setFiltered(temp);
    setPagination((p) => ({ ...p, current: 1 }));
  }, [search, filterTanSo, sortSize, filterTrangThai, data]);

  const openModal = (id = null) => {
    setEditingId(id);
    setModalVisible(true);
  };

  const closeModal = () => {
    setEditingId(null);
    setModalVisible(false);
    fetchData();
  };

  const handleRefresh = () => {
    setSearch('');
    setFilterTanSo('all');
    setSortSize('default');
    setFilterTrangThai('all');
    fetchData();
  };

  // ✅ columns dạng let để ẩn cột hành động khi NHÂN VIÊN
  let columns = [
    {
      title: 'STT',
      width: 70,
      align: 'center',
      render: (_v, _r, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: 'Mã',
      dataIndex: 'ma',
      width: 140,
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Độ phân giải',
      dataIndex: 'doPhanGiai',
    },
    {
      title: 'Tần số quét',
      dataIndex: 'tanSoQuet',
      width: 130,
      align: 'center',
      render: (hz) => <Tag color="blue">{hz}Hz</Tag>,
    },
    {
      title: 'Kích thước',
      dataIndex: 'kichThuoc',
      width: 130,
      align: 'center',
      render: (kt) => <Tag color="purple">{kt}"</Tag>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      width: 150,
      align: 'center',
      render: (v) => {
        const cfg = statusMap[Number(v)] || statusMap[0];
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 90,
      align: 'center',
      render: (_v, record) => (
        <Button type="link" onClick={() => openModal(record.id)}>
          Sửa
        </Button>
      ),
    },
  ];

  // ✅ NHÂN VIÊN: ẩn cột hành động
  if (isEmployee) {
    columns = columns.filter((c) => c.key !== 'action' && c.title !== 'Hành động');
  }

  return (
    <div
      style={{
        padding: '24px',
      }}
    >
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            Danh sách màn hình
          </Title>
        </Col>
      </Row>

      {/* Thanh filter */}
      <Space style={{ marginBottom: 16, width: '100%' }} size="middle" wrap>
        <Input
          placeholder="Tìm mã hoặc độ phân giải"
          value={search}
          allowClear
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 160 }}
        />

        <span>Tần số:</span>
        <Select value={filterTanSo} onChange={setFilterTanSo} style={{ width: 160 }}>
          <Option value="all">Tất cả</Option>
          <Option value="60">60Hz</Option>
          <Option value="75">75Hz</Option>
          <Option value="120">120Hz</Option>
          <Option value="144">144Hz</Option>
        </Select>

        <span>Kích thước:</span>
        <Select value={sortSize} onChange={setSortSize} style={{ width: 160 }}>
          <Option value="default">Mặc định</Option>
          <Option value="az">Kích thước A-Z</Option>
          <Option value="za">Kích thước Z-A</Option>
        </Select>

        <span>Trạng thái:</span>
        <Select value={filterTrangThai} onChange={setFilterTrangThai} style={{ width: 160 }}>
          <Option value="all">Tất cả</Option>
          <Option value="1">Hoạt động</Option>
          <Option value="0">Ngưng hoạt động</Option>
        </Select>

        <Button
          icon={<ReloadOutlined />}
          onClick={handleRefresh}
          style={{ background: '#FFD700', color: '#000' }}
        >
          Làm mới
        </Button>

        {/* ✅ NHÂN VIÊN: ẩn nút thêm */}
        {!isEmployee && (
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
              Thêm Màn Hình
            </Button>
          </Col>
        )}
      </Space>

      {/* Bảng */}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={filtered}
        loading={loading}
        bordered
        pagination={{
          ...pagination,
          showSizeChanger: true,
          pageSizeOptions: ['5', '10', '20'],
          total: filtered.length,
        }}
        onChange={(pag) => setPagination({ current: pag.current, pageSize: pag.pageSize })}
      />

      {/* ✅ NHÂN VIÊN: không render modal */}
      {!isEmployee && modalVisible && (
        <AddManHinhModal
          open={modalVisible}
          id={editingId}
          onClose={closeModal}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
};

export default ListManHinhComponent;
