import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Input, Select, Space, message } from 'antd';
import { listRom } from '../../service/RomService';
import AddRomModal from './AddRomComponent'; // modal dạng form

const { Option } = Select;

const ListRomComponent = () => {
  const [romList, setRomList] = useState([]);
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

  // ✅ Phân quyền: NHÂN VIÊN ẩn nút thêm + ẩn cột hành động
  const [isEmployee, setIsEmployee] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await listRom();
      const data = res.data.content || res.data;
      setRomList(data);
      setFilteredList(data);
    } catch (err) {
      message.error('Không thể tải dữ liệu ROM');
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    let temp = [...romList];

    if (searchText.trim()) {
      temp = temp.filter((item) =>
        item.dungLuongSsd?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (filterTrangThai !== 'all') {
      temp = temp.filter((item) => item.trangThai === Number(filterTrangThai));
    }

    if (sortOption === 'az') {
      temp.sort((a, b) => a.dungLuongSsd.localeCompare(b.dungLuongSsd));
    } else if (sortOption === 'za') {
      temp.sort((a, b) => b.dungLuongSsd.localeCompare(a.dungLuongSsd));
    }

    setFilteredList(temp);
  }, [searchText, filterTrangThai, sortOption, romList]);

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
    setEditingId(null);
    setModalVisible(false);
    fetchData();
  };

  // ✅ columns dạng let để ẩn cột hành động khi NHÂN VIÊN
  let columns = [
    {
      title: 'STT',
      render: (_, __, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: 'Mã ROM',
      dataIndex: 'idSsd',
    },
    {
      title: 'Dung lượng SSD',
      dataIndex: 'dungLuongSsd',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Loại SSD',
      dataIndex: 'loaiSsd',
    },
    {
      title: 'Tốc độ đọc',
      dataIndex: 'tocDoDoc',
    },
    {
      title: 'Tốc độ ghi',
      dataIndex: 'tocDoGhi',
    },
    {
      title: 'Mô tả',
      dataIndex: 'moTa',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      render: (val) =>
        val === 1 ? <Tag color="green">Hoạt động</Tag> : <Tag color="red">Ngưng</Tag>,
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
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
      <h2>Danh sách ROM</h2>

      <Space style={{ marginBottom: 16, flexWrap: 'wrap', gap: 12 }} size="middle">
        <Input
          placeholder="Tìm dung lượng SSD"
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 200 }}
        />

        <span>Trạng thái:</span>
        <Select value={filterTrangThai} onChange={setFilterTrangThai} style={{ width: 140 }}>
          <Option value="all">Tất cả</Option>
          <Option value="1">Hoạt động</Option>
          <Option value="0">Ngưng</Option>
        </Select>

        <span>Sắp xếp:</span>
        <Select value={sortOption} onChange={setSortOption} style={{ width: 140 }}>
          <Option value="default">Mặc định</Option>
          <Option value="az">Dung lượng A-Z</Option>
          <Option value="za">Dung lượng Z-A</Option>
        </Select>

        <Button onClick={handleRefresh} style={{ background: '#FFD700', color: '#000' }}>
          Làm mới
        </Button>

        {/* ✅ NHÂN VIÊN: ẩn nút thêm */}
        {!isEmployee && (
          <Button type="primary" onClick={() => openModal()}>
            + Thêm ROM
          </Button>
        )}
      </Space>

      <Table
        rowKey="id"
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
        }}
        onChange={(pag) => {
          setPagination({ current: pag.current, pageSize: pag.pageSize });
        }}
      />

      {/* ✅ NHÂN VIÊN: không render modal */}
      {!isEmployee && modalVisible && (
        <AddRomModal
          open={modalVisible}
          id={editingId}
          onClose={closeModal}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
};

export default ListRomComponent;
