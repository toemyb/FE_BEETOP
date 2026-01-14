import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Select, Space, Tag } from 'antd';
import { listPin } from '../../service/PinService';
import AddPinModal from './AddPinComponent';

const { Option } = Select;

const s = (v) => String(v ?? '');
const lower = (v) => s(v).toLowerCase();

const ListPinComponent = () => {
  const [pinList, setPinList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [sortOption, setSortOption] = useState('default');

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // ✅ Phân quyền: NHÂN VIÊN ẩn nút thêm + ẩn cột hành động
  const [isEmployee, setIsEmployee] = useState(false);

  // ✅ Phân trang
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
  });

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
      const res = await listPin();

      // 🔁 Call giống DoHoa: ưu tiên data.content, không có thì lấy data
      const data = res.data.content || res.data;

      setPinList(data);
      setFilteredList(data);
      setPagination((p) => ({ ...p, current: 1 }));
    } catch {
      console.error('Không thể tải dữ liệu Pin');
      setPinList([]);
      setFilteredList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let temp = [...pinList];

    // 🔎 Tìm theo idPin hoặc dungLuong
    if (searchText.trim()) {
      const q = lower(searchText);
      temp = temp.filter(
        (item) => lower(item?.idPin).includes(q) || lower(item?.dungLuong).includes(q)
      );
    }

    // ↕️ Sắp xếp
    const by = (k, dir = 'asc') => (a, b) =>
      s(a?.[k]).localeCompare(s(b?.[k])) * (dir === 'asc' ? 1 : -1);

    if (sortOption === 'id_az') temp.sort(by('idPin', 'asc'));
    else if (sortOption === 'id_za') temp.sort(by('idPin', 'desc'));
    else if (sortOption === 'dl_az') temp.sort(by('dungLuong', 'asc'));
    else if (sortOption === 'dl_za') temp.sort(by('dungLuong', 'desc'));

    setFilteredList(temp);
    setPagination((p) => ({ ...p, current: 1 }));
  }, [searchText, sortOption, pinList]);

  const handleRefresh = () => {
    setSearchText('');
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

  // ✅ columns dạng let để ẩn cột hành động khi NHÂN VIÊN
  let columns = [
    {
      title: 'STT',
      render: (_v, _r, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: 'Mã Pin',
      dataIndex: 'idPin',
    },
    {
      title: 'Dung lượng',
      dataIndex: 'dungLuong',
      render: (text) => <strong>{s(text) || '—'}</strong>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      render: (val) => {
        if (val === 1) return <Tag color="green">Hoạt động</Tag>;
        if (val === 0) return <Tag color="red">Ngưng</Tag>;
        return <Tag>Chưa thiết lập</Tag>;
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_v, record) => (
        <Button type="link" onClick={() => openModal(record?.id)}>
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
      <h2>Danh sách Pin</h2>

      <Space style={{ marginBottom: 16, flexWrap: 'wrap', gap: 12 }} size="middle">
        <Input
          placeholder="Tìm theo Mã Pin hoặc Dung lượng"
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 220 }}
        />

        <span>Sắp xếp:</span>
        <Select value={sortOption} onChange={setSortOption} style={{ width: 160 }}>
          <Option value="default">Mặc định</Option>
          <Option value="id_az">Mã Pin A-Z</Option>
          <Option value="id_za">Mã Pin Z-A</Option>
          <Option value="dl_az">Dung lượng A-Z</Option>
          <Option value="dl_za">Dung lượng Z-A</Option>
        </Select>

        <Button onClick={handleRefresh} style={{ background: '#FFD700', color: '#000' }}>
          Làm Mới
        </Button>

        {/* ✅ NHÂN VIÊN: ẩn nút thêm */}
        {!isEmployee && (
          <Button type="primary" onClick={() => openModal()}>
            + Thêm Pin
          </Button>
        )}
      </Space>

      <Table
        rowKey={(r) => r?.id ?? r?.idPin}
        columns={columns}
        dataSource={filteredList}
        loading={loading}
        bordered
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: filteredList.length,
          showSizeChanger: true,
          pageSizeOptions: [5, 10, 20, 50],
        }}
        onChange={(pag) => {
          setPagination({
            current: pag.current,
            pageSize: pag.pageSize,
          });
        }}
      />

      {/* ✅ NHÂN VIÊN: không render modal */}
      {!isEmployee && modalVisible && (
        <AddPinModal
          open={modalVisible}
          id={editingId}
          onClose={closeModal}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
};

export default ListPinComponent;
