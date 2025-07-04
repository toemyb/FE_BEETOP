import React, { useState, useEffect } from 'react';
import { listRam } from '../../service/RamService';
import { useNavigate } from 'react-router-dom';
import { Button, Table, Tag, Input, Select, Space, message } from 'antd';

const { Option } = Select;

const ListRamComponent = () => {
  const [ramList, setRamList] = useState([]);
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
      const response = await listRam();
      const list = response.data.content || [];
      setRamList(list);
      setFilteredList(list);
    } catch (error) {
      message.error('Lỗi khi tải dữ liệu RAM');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let temp = [...ramList];

    // Tìm kiếm
    if (searchText.trim()) {
      temp = temp.filter((item) =>
        item.dungLuongRam?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Lọc trạng thái
    if (filterTrangThai !== 'all') {
      temp = temp.filter((item) => item.trangThai === Number(filterTrangThai));
    }

    // Sắp xếp
    if (sortOption === 'az') {
      temp.sort((a, b) => a.dungLuongRam.localeCompare(b.dungLuongRam));
    } else if (sortOption === 'za') {
      temp.sort((a, b) => b.dungLuongRam.localeCompare(a.dungLuongRam));
    }

    setFilteredList(temp);
  }, [searchText, filterTrangThai, sortOption, ramList]);

  const handleAdd = () => {
    navigate('/admin/add-ram');
  };

  const handleUpdate = (id) => {
    navigate(`/admin/update-ram/${id}`);
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
        <Button type="link" onClick={() => handleUpdate(record.id)}>
          Sửa
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
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

        <Button type="primary" onClick={handleAdd}>
          + Thêm RAM
        </Button>
      </Space>

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

export default ListRamComponent;
