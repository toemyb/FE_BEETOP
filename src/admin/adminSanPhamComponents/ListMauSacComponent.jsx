import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Input, Select, Space } from 'antd';
import { listMauSac } from '../../service/MauSacService';
import AddMauSacModal from './AddMauSacComponent';
import AdminBreadcrumb from '../components/Breadcrumb';
import useToast from '../../hooks/useNotify';

const { Option } = Select;

const ListMauSacComponent = () => {
  const [mauSacList, setMauSacList] = useState([]);
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

  const { error } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await listMauSac();
      const data = res.data.content || res.data;
      setMauSacList(data);
      setFilteredList(data);
    } catch (err) {
      error('Không thể tải dữ liệu màu sắc');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let temp = [...mauSacList];

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
  }, [searchText, filterTrangThai, sortOption, mauSacList]);

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

  const columns = [
    {
      title: 'STT',
      render: (_, __, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: 'Mã Màu Sắc',
      dataIndex: 'idMauSac',
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
        val === 1 ? (
          <Tag color="green">Hoạt động</Tag>
        ) : (
          <Tag color="red">Ngưng</Tag>
        ),
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
      <AdminBreadcrumb
        items={[
          { label: 'Màu sắc' },
        ]}
      />

      <h2>Danh sách Màu Sắc</h2>

      <Space
        style={{ marginBottom: 16, flexWrap: 'wrap', gap: 12 }}
        size="middle"
      >
        <Input
          placeholder="Tìm tên màu sắc"
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

        <span>Trạng thái:</span>
        <Select
          value={filterTrangThai}
          onChange={setFilterTrangThai}
          style={{ width: 120 }}
        >
          <Option value="all">Tất cả</Option>
          <Option value="1">Hoạt động</Option>
          <Option value="0">Ngưng</Option>
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
          + Thêm Màu Sắc
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
        <AddMauSacModal
          open={modalVisible}
          id={editingId}
          onClose={closeModal}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
};

export default ListMauSacComponent;
