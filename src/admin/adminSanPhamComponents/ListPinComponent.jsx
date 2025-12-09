import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Select, Space } from 'antd';
import { listPin } from '../../service/PinService';
import AddPinModal from './AddPinComponent';
import AdminBreadcrumb from '../components/Breadcrumb';

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

  // ✅ Phân trang
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await listPin();
      const data =
        res?.data?.data ??
        res?.data?.content ??
        (Array.isArray(res?.data) ? res.data : []) ??
        [];
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
        (item) =>
          lower(item?.idPin).includes(q) ||
          lower(item?.dungLuong).includes(q)
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
    setPagination((p) => ({ ...p, current: 1 })); // tránh trang rỗng sau khi lọc/sort
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

  const columns = [
    {
      title: 'STT',
      render: (_v, _r, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
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
      title: 'Hành động',
      render: (_v, record) => (
        <Button
          type="link"
          // ✅ nếu BE dùng id làm khóa chính: để record.id
          // nếu BE nhận idPin cho API detail, đổi thành record.idPin
          onClick={() => openModal(record?.id)}
        >
          Sửa
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <AdminBreadcrumb items={[{ label: 'Pin' }]} />
      <h2>Danh sách Pin</h2>

      <Space style={{ marginBottom: 16, flexWrap: 'wrap', gap: 12 }} size="middle">
        <Input
          placeholder="Tìm theo Mã Pin hoặc Dung lượng"
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 220 }}
        />

        <Button onClick={handleRefresh} style={{ background: '#FFD700', color: '#000' }}>
          Làm Mới
        </Button>

        <span>Sắp xếp:</span>
        <Select value={sortOption} onChange={setSortOption} style={{ width: 160 }}>
          <Option value="default">Mặc định</Option>
          <Option value="id_az">Mã Pin A-Z</Option>
          <Option value="id_za">Mã Pin Z-A</Option>
          <Option value="dl_az">Dung lượng A-Z</Option>
          <Option value="dl_za">Dung lượng Z-A</Option>
        </Select>

        <Button type="primary" onClick={() => openModal()}>
          + Thêm Pin
        </Button>
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

      {modalVisible && (
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
