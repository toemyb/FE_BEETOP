import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, message, Input, Select, Space } from 'antd';
import { listCpu } from '../../service/CpuService';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;

const ListCpuComponent = () => {
  const [cpuList, setCpuList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [filterTrangThai, setFilterTrangThai] = useState('all');
  const [sortOption, setSortOption] = useState('default');

  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await listCpu();
      const data = res.data;
      const list = data.content || data;
      setCpuList(list);
      setFilteredList(list);
    } catch {
      message.error('Lỗi khi tải dữ liệu CPU');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let temp = [...cpuList];

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

    // Sắp xếp
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

  const columns = [
    {
      title: 'STT',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'IdCpu',
      dataIndex: 'idCpu',
    },
    {
      title: 'Tên',
      dataIndex: 'ten',
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
        <Button type="link" onClick={() => navigate(`/admin/update-cpu/${record.id}`)}>
          Sửa
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* Bộ lọc và tìm kiếm */}
      <Space style={{ marginBottom: 16, flexWrap: 'wrap' }} size="middle">
        <Input
          placeholder="Tìm Chip"
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 200 }}
        />
        <Button onClick={handleRefresh} style={{ background: '#FFD700', color: '#000' }}>
          Làm Mới
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

        <span>Hiển Thị:</span>
        <Select
          value={sortOption}
          onChange={setSortOption}
          style={{ width: 120 }}
        >
          <Option value="default">Mặc định</Option>
          <Option value="az">Tên A-Z</Option>
          <Option value="za">Tên Z-A</Option>
        </Select>

        <Button type="primary" onClick={() => navigate('/admin/add-cpu')}>
          + Tạo Chip
        </Button>
      </Space>

      {/* Bảng với phân trang FE, nhưng không xử lý gì trong logic */}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredList}
        loading={loading}
        pagination={{ pageSize: 5 }}
      />
    </div>
  );
};

export default ListCpuComponent;
