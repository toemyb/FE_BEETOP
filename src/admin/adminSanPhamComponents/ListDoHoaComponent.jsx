import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, message, Input, Select, Space } from 'antd';
import { listDoHoa } from '../../service/DoHoaService';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;

const ListDoHoaComponent = () => {
  const [dohoaList, setDohoaList] = useState([]);
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
      const res = await listDoHoa();
      const data = res.data.content || res.data;
      setDohoaList(data);
      setFilteredList(data);
    } catch {
      message.error('Lỗi khi tải dữ liệu Đồ Họa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let temp = [...dohoaList];

    // Tìm kiếm
    if (searchText.trim()) {
      temp = temp.filter((item) =>
        item.tenDayDu?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Lọc theo trạng thái
    if (filterTrangThai !== 'all') {
      temp = temp.filter((item) => item.trangThai === Number(filterTrangThai));
    }

    // Sắp xếp tên
    if (sortOption === 'az') {
      temp.sort((a, b) => a.tenDayDu.localeCompare(b.tenDayDu));
    } else if (sortOption === 'za') {
      temp.sort((a, b) => b.tenDayDu.localeCompare(a.tenDayDu));
    }

    setFilteredList(temp);
  }, [searchText, filterTrangThai, sortOption, dohoaList]);

  const handleRefresh = () => {
    setSearchText('');
    setFilterTrangThai('all');
    setSortOption('default');
    fetchData();
  };

  const handleAdd = () => {
    navigate('/admin/add-do-hoa');
  };

  const handleUpdate = (id) => {
    navigate(`/admin/update-do-hoa/${id}`);
  };

  const columns = [
    {
      title: 'STT',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Mã Đồ Họa',
      dataIndex: 'idDohoa',
    },
    {
      title: 'Hãng card onboard',
      dataIndex: 'hangcardOboard',
    },
    {
      title: 'Model card onboard',
      dataIndex: 'modelcardOboard',
    },
    {
      title: 'Tên đầy đủ',
      dataIndex: 'tenDayDu',
      render: text => <strong>{text}</strong>,
    },
    {
      title: 'Loại card',
      dataIndex: 'loaiCard',
    },
    {
      title: 'Bộ nhớ RAM',
      dataIndex: 'boNhoRam',
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
      <h2>Danh sách đồ họa</h2>
      <Space style={{ marginBottom: 16, flexWrap: 'wrap', gap: 12 }} size="middle">
        <Input
          placeholder="Tìm kiếm tên đồ họa"
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

        <Button type="primary" onClick={handleAdd}>
          + Thêm Đồ Họa
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

export default ListDoHoaComponent;
