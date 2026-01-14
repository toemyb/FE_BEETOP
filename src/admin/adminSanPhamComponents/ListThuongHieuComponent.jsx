import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Input,
  Space,
  Row,
  Col,
  Typography,
  Card,
  Empty,
  Tag,
  Select,
} from 'antd';
import { listThuongHieu } from '../../service/ThuongHieuService';
import AddThuongHieuModal from './AddThuongHieuComponent';

const { Title } = Typography;
const { Option } = Select;

const statusMap = {
  1: { text: 'Hoạt động', color: 'green' },
  0: { text: 'Ngưng hoạt động', color: 'red' },
};

const ListThuongHieuComponent = () => {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [sortOption, setSortOption] = useState('default');
  const [filterTrangThai, setFilterTrangThai] = useState('all');

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
  });

  // ✅ Phân quyền: NHÂN VIÊN ẩn nút thêm + ẩn cột hành động
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
      const res = await listThuongHieu();
      const list =
        res?.data?.data ??
        res?.data?.content ??
        (Array.isArray(res?.data) ? res.data : res?.data) ??
        [];
      setData(list);
      setFiltered(list);
      setPagination((p) => ({ ...p, current: 1 }));
    } catch (err) {
      console.error('Không thể tải dữ liệu thương hiệu', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let temp = [...data];

    const q = searchText.trim().toLowerCase();
    if (q) {
      temp = temp.filter((i) => i.ten?.toLowerCase().includes(q));
    }

    // lọc trạng thái
    if (filterTrangThai !== 'all') {
      const st = Number(filterTrangThai);
      temp = temp.filter((i) => Number(i.trangThai) === st);
    }

    // sort tên
    if (sortOption === 'az') {
      temp.sort((a, b) => (a.ten || '').localeCompare(b.ten || ''));
    } else if (sortOption === 'za') {
      temp.sort((a, b) => (b.ten || '').localeCompare(a.ten || ''));
    }

    setFiltered(temp);
  }, [searchText, sortOption, filterTrangThai, data]);

  const handleRefresh = () => {
    setSearchText('');
    setSortOption('default');
    setFilterTrangThai('all');
    fetchData();
  };

  const openModal = (id = null) => {
    setEditingId(id);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingId(null);
    fetchData();
  };

  // ✅ columns dạng let để ẩn cột hành động khi NHÂN VIÊN
  let columns = [
    {
      title: 'STT',
      width: 80,
      align: 'center',
      render: (_v, _r, i) =>
        (pagination.current - 1) * pagination.pageSize + i + 1,
    },
    {
      title: 'Tên Thương Hiệu',
      dataIndex: 'ten',
      align: 'center',
      render: (text) => <strong>{text || '—'}</strong>,
    },
    {
      title: 'Mô tả',
      dataIndex: 'moTa',
      align: 'center',
      render: (val) => val || '—',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      width: 140,
      align: 'center',
      render: (v) => {
        const cfg = statusMap[Number(v)] || statusMap[0];
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      align: 'center',
      width: 120,
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
    <div style={{ padding: 24 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            Danh sách thương hiệu
          </Title>
        </Col>
      </Row>

      <Space
        style={{
          marginBottom: 16,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          justifyContent: 'space-between',
        }}
        size="middle"
      >
        <Input
          placeholder="Tìm kiếm tên thương hiệu..."
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 250 }}
        />

        <Space size="middle">
          <Select
            value={filterTrangThai}
            onChange={setFilterTrangThai}
            style={{ width: 180 }}
          >
            <Option value="all">Tất cả trạng thái</Option>
            <Option value="1">Hoạt động</Option>
            <Option value="0">Ngưng hoạt động</Option>
          </Select>

          <Button
            onClick={handleRefresh}
            style={{ background: '#FFD700', color: '#000' }}
          >
            Làm Mới
          </Button>

          {/* ✅ NHÂN VIÊN: ẩn nút thêm */}
          {!isEmployee && (
            <Col>
              <Button
                type="primary"
                onClick={() => openModal()}
                style={{ fontWeight: 500 }}
              >
                + Thêm Thương Hiệu
              </Button>
            </Col>
          )}
        </Space>
      </Space>

      <Table
        rowKey={(r) => r.id}
        columns={columns}
        dataSource={filtered}
        loading={loading}
        bordered
        locale={{
          emptyText: (
            <Empty
              description="Không có dữ liệu"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ),
        }}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: filtered.length,
          showSizeChanger: true,
          pageSizeOptions: ['5', '10', '20', '50'],
          style: { textAlign: 'center', marginTop: 16 },
        }}
        onChange={(pag) =>
          setPagination({ current: pag.current, pageSize: pag.pageSize })
        }
      />

      {/* ✅ NHÂN VIÊN: không render modal */}
      {!isEmployee && modalVisible && (
        <AddThuongHieuModal
          open={modalVisible}
          id={editingId}
          onClose={closeModal}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
};

export default ListThuongHieuComponent;
