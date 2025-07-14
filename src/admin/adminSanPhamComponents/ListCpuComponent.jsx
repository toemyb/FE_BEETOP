import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, Input, Select, Space } from 'antd';
import { listCpu } from '../../service/CpuService';
import AdminBreadcrumb from '../components/Breadcrumb';
import AddCpuModal from './AddCpuComponent'; // ✅ modal thêm/sửa
import useToast from '../../hooks/useNotify';

const { Option } = Select;

const ListCpuComponent = () => {
  const [cpuList, setCpuList] = useState([]);
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

  const { error } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await listCpu();
      const data = res.data.content || res.data;
      setCpuList(data);
      setFilteredList(data);
    } catch {
      error('Lỗi khi tải dữ liệu CPU');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let temp = [...cpuList];

    if (searchText.trim()) {
      temp = temp.filter((item) =>
        item.ten?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (filterTrangThai !== 'all') {
      temp = temp.filter((item) => item.trangThai === Number(filterTrangThai));
    }

    if (sortOption === 'az') {
      temp.sort((a, b) => a.ten.localeCompare(b.ten));
    } else if (sortOption === 'za') {
      temp.sort((a, b) => b.ten.localeCompare(a.ten));
    }

    setFilteredList(temp);
  }, [searchText, filterTrangThai, sortOption, cpuList]);

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
      title: 'Mã CPU',
      dataIndex: 'idCpu',
    },
    {
      title: 'Tên',
      dataIndex: 'ten',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Mô tả',
      dataIndex: 'moTa',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      render: (val) =>
        val === 1 ? <Tag color="green">Hoạt động</Tag> : <Tag color="red">Ngừng</Tag>,
    },
    {
      title: 'Thao tác',
      render: (_, record) => (
        <Button type="link" onClick={() => openModal(record.id)}>
          Sửa
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <AdminBreadcrumb items={[{ label: 'CPU' }]} />
      <h2>Danh sách CPU</h2>

      <Space style={{ marginBottom: 16, flexWrap: 'wrap', gap: 12 }} size="middle">
        <Input
          placeholder="Tìm kiếm tên CPU"
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 200 }}
        />

        <Button
          onClick={handleRefresh}
          style={{ background: '#FFD700', color: '#000' }}
        >
          Làm mới
        </Button>

        <span>Trạng Thái:</span>
        <Select
          value={filterTrangThai}
          onChange={setFilterTrangThai}
          style={{ width: 120 }}
        >
          <Option value="all">Tất cả</Option>
          <Option value="1">Hoạt động</Option>
          <Option value="0">Ngừng</Option>
        </Select>

        <span>Sắp xếp:</span>
        <Select
          value={sortOption}
          onChange={setSortOption}
          style={{ width: 120 }}
        >
          <Option value="default">Mặc định</Option>
          <Option value="az">Tên A-Z</Option>
          <Option value="za">Tên Z-A</Option>
        </Select>

        <Button type="primary" onClick={() => openModal()}>
          + Thêm CPU
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
        <AddCpuModal
          open={modalVisible}
          id={editingId}
          onClose={closeModal}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
};

export default ListCpuComponent;
