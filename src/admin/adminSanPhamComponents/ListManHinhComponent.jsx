import React, { useState, useEffect } from 'react';
import { Table, Input, Select, Button, Space, Tag, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { listManHinh } from '../../service/ManHinhService'; // bạn cần tạo service này

const { Option } = Select;

const ListManHinhComponent = () => {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [filterTanSo, setFilterTanSo] = useState('all');
  const [sortSize, setSortSize] = useState('default');

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await listManHinh();
      const list = res.data.content || res.data;
      setData(list);
      setFiltered(list);
    } catch {
      message.error('Lỗi khi tải dữ liệu màn hình');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let temp = [...data];

    if (search.trim()) {
      const s = search.toLowerCase();
      temp = temp.filter(
        item =>
          item.ma?.toLowerCase().includes(s) ||
          item.do_phan_giai?.toLowerCase().includes(s)
      );
    }

    if (filterTanSo !== 'all') {
      temp = temp.filter(item => String(item.tan_so_quet) === filterTanSo);
    }

    if (sortSize === 'az') {
      temp.sort((a, b) => String(a.kich_thuoc).localeCompare(String(b.kich_thuoc)));
    } else if (sortSize === 'za') {
      temp.sort((a, b) => String(b.kich_thuoc).localeCompare(String(a.kich_thuoc)));
    }

    setFiltered(temp);
  }, [search, filterTanSo, sortSize, data]);

  const handleAdd = () => {
    navigate('/admin/add-manhinh');
  };

  const handleUpdate = (id) => {
    navigate(`/admin/update-manhinh/${id}`);
  };

  const handleRefresh = () => {
    setSearch('');
    setFilterTanSo('all');
    setSortSize('default');
    fetchData();
  };

  const columns = [
    {
      title: 'STT',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Mã',
      dataIndex: 'ma',
      render: text => <strong>{text}</strong>,
    },
    {
      title: 'Độ phân giải',
      dataIndex: 'doPhanGiai',
    },
    {
      title: 'Tần số quét',
      dataIndex: 'tanSoQuet',
      render: hz => <Tag color="blue">{hz}Hz</Tag>,
    },
    {
      title: 'Kích thước',
      dataIndex: 'kichThuoc',
      render: kt => <Tag color="purple">{kt}"</Tag>,
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
      <Space style={{ marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <Input
          placeholder="Tìm mã hoặc độ phân giải"
          value={search}
          allowClear
          onChange={e => setSearch(e.target.value)}
          style={{ width: 200 }}
        />
        <Button onClick={handleRefresh} style={{ background: '#FFD700', color: '#000' }}>
          Làm mới
        </Button>

        <span>Tần số:</span>
        <Select value={filterTanSo} onChange={setFilterTanSo} style={{ width: 140 }}>
          <Option value="all">Tất cả</Option>
          <Option value="60">60Hz</Option>
          <Option value="75">75Hz</Option>
          <Option value="120">120Hz</Option>
          <Option value="144">144Hz</Option>
        </Select>

        <span>Kích thước:</span>
        <Select value={sortSize} onChange={setSortSize} style={{ width: 160 }}>
          <Option value="default">Mặc định</Option>
          <Option value="az">Kích thước A-Z</Option>
          <Option value="za">Kích thước Z-A</Option>
        </Select>

        <Button type="primary" onClick={handleAdd}>
          + Thêm Màn Hình
        </Button>
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={filtered}
        loading={loading}
        pagination={{ pageSize: 5 }}
        bordered
      />
    </div>
  );
};

export default ListManHinhComponent;
