import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Tag,
  Input,
  Select,
  Space,
  Row,
  Col,
  Typography,
  Card,
} from 'antd';
import { listHeDieuHanh } from '../../service/HeDieuHanhService';
import AddHeDieuHanhModal from './AddHeDieuHanhComponent';

const { Option } = Select;
const { Title } = Typography;

const ListHeDieuHanhComponent = () => {
  const [hdhList, setHdhList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [filterTrangThai, setFilterTrangThai] = useState('all');
  const [sortOption, setSortOption] = useState('default');

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
  });

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
      const res = await listHeDieuHanh();
      const data =
        res?.data?.data?.content ||
        res?.data?.content ||
        (Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data)
          ? res.data
          : []) ||
        [];
      setHdhList(data);
      setFilteredList(data);
      setPagination((p) => ({ ...p, current: 1 }));
    } catch (e) {
      console.error('Không thể tải dữ liệu Hệ điều hành', e);
      setHdhList([]);
      setFilteredList([]);
    } finally {
      setLoading(false);
    }
  };

  const pickName = (item) =>
    item?.tenDayDu ??
    item?.ten ??
    item?.name ??
    `${item?.hang ?? ''} ${item?.phienBan ?? item?.version ?? ''}`.trim();

  useEffect(() => {
    let temp = [...hdhList];

    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      temp = temp.filter((item) => pickName(item)?.toLowerCase().includes(q));
    }

    if (filterTrangThai !== 'all') {
      temp = temp.filter(
        (item) => Number(item?.trangThai) === Number(filterTrangThai)
      );
    }

    if (sortOption === 'az') {
      temp.sort((a, b) => (pickName(a) || '').localeCompare(pickName(b) || ''));
    } else if (sortOption === 'za') {
      temp.sort((a, b) => (pickName(b) || '').localeCompare(pickName(a) || ''));
    }

    setFilteredList(temp);
    setPagination((p) => ({ ...p, current: 1 }));
  }, [searchText, filterTrangThai, sortOption, hdhList]);

  const handleRefresh = () => {
    setSearchText('');
    setFilterTrangThai('all');
    setSortOption('default');
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

  // ✅ columns để dạng let để filter cột hành động khi NHÂN VIÊN
  let columns = [
    {
      title: 'STT',
      render: (_val, _record, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
      width: 80,
      align: 'center',
    },
    {
      title: 'Mã HĐH',
      dataIndex: 'ma',
      render: (_val, record) => record?.ma ?? record?.idHedieuhanh ?? record?.ma,
      width: 150,
      align: 'center',
    },
    {
      title: 'Tên HĐH',
      dataIndex: 'ten',
      render: (_val, record) => <strong>{pickName(record) || '—'}</strong>,
      align: 'center',
    },
  
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      width: 130,
      align: 'center',
      render: (val) => {
        if (val === 1) return <Tag color="green">Hoạt động</Tag>;
        if (val === 0) return <Tag color="red">Ngưng</Tag>;
        return <Tag>Chưa thiết lập</Tag>;
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 120,
      align: 'center',
      render: (_val, record) => (
        <Button
          type="link"
          onClick={() => openModal(record?.id ?? record?.idHedieuhanh)}
        >
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
            Danh sách hệ điều hành
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
          placeholder="Tìm kiếm tên hệ điều hành..."
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 250 }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>Trạng thái:</span>
          <Select
            value={filterTrangThai}
            onChange={setFilterTrangThai}
            style={{ width: 140 }}
          >
            <Option value="all">Tất cả</Option>
            <Option value="1">Hoạt động</Option>
            <Option value="0">Ngưng</Option>
          </Select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>Sắp xếp:</span>
          <Select value={sortOption} onChange={setSortOption} style={{ width: 140 }}>
            <Option value="default">Mặc định</Option>
            <Option value="az">Tên A-Z</Option>
            <Option value="za">Tên Z-A</Option>
          </Select>
        </div>

        <Button onClick={handleRefresh} style={{ background: '#FFD700', color: '#000' }}>
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
              + Thêm Hệ điều hành
            </Button>
          </Col>
        )}
      </Space>

      <Table
        rowKey={(r) => r?.id ?? r?.idHedieuhanh}
        columns={columns}
        dataSource={filteredList}
        loading={loading}
        bordered
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: filteredList.length,
          showSizeChanger: true,
          pageSizeOptions: ['5', '10', '20', '50'],
          style: { textAlign: 'center', marginTop: 16 },
        }}
        onChange={(pag) => {
          setPagination({
            current: pag.current,
            pageSize: pag.pageSize,
          });
        }}
      />

      {modalVisible && (
        <AddHeDieuHanhModal
          open={modalVisible}
          id={editingId}
          onClose={closeModal}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
};

export default ListHeDieuHanhComponent;
