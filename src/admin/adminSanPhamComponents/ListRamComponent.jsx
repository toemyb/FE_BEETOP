import React, { useState, useEffect } from 'react';
import { listRam } from '../../service/RamService';
import { Button, Table, Tag, Input, Select, Space, message } from 'antd';
import AdminBreadcrumb from '../components/Breadcrumb';
import AddRamModal from './AddRamComponent'; // đảm bảo file modal đã tồn tại

const { Option } = Select;

const ListRamComponent = () => {
  const [ramList, setRamList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [filterTrangThai, setFilterTrangThai] = useState('all');
  const [sortOption, setSortOption] = useState('default');

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await listRam();
      const list = response.data.content || response.data || [];
      setRamList(list);
      setFilteredList(list);
    } catch (error) {
      message.error('Lỗi khi tải dữ liệu RAM');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let temp = [...ramList];

    if (searchText.trim()) {
      temp = temp.filter(item =>
        item.dungLuongRam?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (filterTrangThai !== 'all') {
      temp = temp.filter(item => item.trangThai === Number(filterTrangThai));
    }

    if (sortOption === 'az') {
      temp.sort((a, b) => a.dungLuongRam.localeCompare(b.dungLuongRam));
    } else if (sortOption === 'za') {
      temp.sort((a, b) => b.dungLuongRam.localeCompare(a.dungLuongRam));
    }

    setFilteredList(temp);
  }, [searchText, filterTrangThai, sortOption, ramList]);

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

  const columns = [
    {
      title: 'STT',
      render: (_, __, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: 'Mã RAM',
      dataIndex: 'idLoaiRam',
    },
    {
      title: 'Dung lượng RAM',
      dataIndex: 'dungLuongRam',
      render: text => <strong>{text}</strong>,
    },
    {
      title: 'Bus',
      dataIndex: 'bus',
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
      render: (_, record) => (
        <Button type="link" onClick={() => openModal(record.id)}>
          Sửa
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <AdminBreadcrumb items={[{ label: 'RAM' }]} />
      <h2>Danh sách RAM</h2>

      <Space style={{ marginBottom: 16, flexWrap: 'wrap', gap: 12 }} size="middle">
        <Input
          placeholder="Tìm dung lượng RAM"
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 200 }}
        />

        <Button onClick={handleRefresh} style={{ background: '#FFD700', color: '#000' }}>
          Làm mới
        </Button>

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

        <span>Sắp xếp:</span>
        <Select
          value={sortOption}
          onChange={setSortOption}
          style={{ width: 140 }}
        >
          <Option value="default">Mặc định</Option>
          <Option value="az">Dung lượng A-Z</Option>
          <Option value="za">Dung lượng Z-A</Option>
        </Select>

        <Button type="primary" onClick={() => openModal()}>
          + Thêm RAM
        </Button>
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
          setPagination({
            current: pag.current,
            pageSize: pag.pageSize,
          });
        }}
      />

      {modalVisible && (
        <AddRamModal
          open={modalVisible}
          id={editingId}
          onClose={closeModal}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
};

export default ListRamComponent;
