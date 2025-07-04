import React, { useState, useEffect } from 'react';
import { listMauSac } from '../../service/MauSacService';
import { useNavigate } from 'react-router-dom';
import { Button, Table, Tag, Input, Select, Space, message } from 'antd';

const { Option } = Select;

const ListMauSacComponent = () => {
  const [mauSacList, setMauSacList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [filterTrangThai, setFilterTrangThai] = useState('all');
  const [sortOption, setSortOption] = useState('default');

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await listMauSac();
      const list = response.data.content || response.data;
      setMauSacList(list);
      setFilteredList(list);
    } catch (error) {
      message.error('Lỗi khi tải dữ liệu màu sắc');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let temp = [...mauSacList];

    // Tìm kiếm
    if (searchText.trim()) {
      temp = temp.filter((item) =>
        item.ten?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Lọc trạng thái
    if (filterTrangThai !== 'all') {
      temp = temp.filter((item) => item.trangThai === Number(filterTrangThai));
    }

    // Sắp xếp tên
    if (sortOption === 'az') {
      temp.sort((a, b) => a.ten.localeCompare(b.ten));
    } else if (sortOption === 'za') {
      temp.sort((a, b) => b.ten.localeCompare(a.ten));
    }

    setFilteredList(temp);
  }, [searchText, filterTrangThai, sortOption, mauSacList]);

  const handleAdd = () => {
    navigate('/admin/add-mausac');
  };

  const handleUpdate = (id) => {
    navigate(`/admin/update-mausac/${id}`);
  };

  const handleRefresh = () => {
    setSearchText('');
    setFilterTrangThai('all');
    setSortOption('default');
    fetchData();
  };

  const columns = [
    {
      title: 'STT',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'ID Màu Sắc',
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
        val === 1 ? <Tag color="green">Hoạt động</Tag> : <Tag color="red">Ngưng</Tag>,
    },
    {
      title: 'Hành động',
      render: (_, record) => (
        <Button type="link" onClick={() => handleUpdate(record.id)}>
          Sửa
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* Bộ lọc & tìm kiếm */}
      <Space style={{ marginBottom: 16, flexWrap: 'wrap', gap: 12 }} size="middle">
        <Input
          placeholder="Tìm tên màu sắc"
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
          style={{ width: 130 }}
        >
          <Option value="all">Tất cả</Option>
          <Option value="1">Hoạt động</Option>
          <Option value="0">Ngưng</Option>
        </Select>

        <span>Sắp xếp:</span>
        <Select
          value={sortOption}
          onChange={setSortOption}
          style={{ width: 130 }}
        >
          <Option value="default">Mặc định</Option>
          <Option value="az">Tên A-Z</Option>
          <Option value="za">Tên Z-A</Option>
        </Select>

        <Button type="primary" onClick={handleAdd}>
          + Thêm màu sắc
        </Button>
      </Space>

      {/* Bảng */}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredList}
        loading={loading}
        pagination={{ pageSize: 5 }}
        bordered
      />
    </div>
  );
};

export default ListMauSacComponent;
