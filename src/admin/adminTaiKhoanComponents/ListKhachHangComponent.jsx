import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Select, message } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, PoweroffOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import api from '../../service/api';

const { Option } = Select;

const ListKhachHangComponent = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const navigate = useNavigate();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/users/by-role/R003', {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('accessToken')}` },
      });
      setUsers(res.data.data);
      setSearchText('');
      setStatusFilter(null);
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể tải danh sách khách hàng!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handleStatusFilter = (value) => {
    setStatusFilter(value);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.ten.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email.toLowerCase().includes(searchText.toLowerCase()) ||
      user.soDienThoai.includes(searchText);
    const matchesStatus = statusFilter === null || user.trangThai === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExportExcel = () => {
    const data = filteredUsers.map((user, index) => ({
      STT: index + 1,
      'Mã': user.idTaiKhoan,
      'Họ tên': user.ten,
      Email: user.email,
      'Số điện thoại': user.soDienThoai,
      'Giới tính': user.gioiTinh,
      'Ngày sinh': user.ngaySinh,
      'Trạng thái': user.trangThai === 1 ? 'Hoạt động' : user.trangThai === 0 ? 'Không hoạt động' : 'Chưa xác định',
      'Ngày tạo': new Date(user.createdAt).toLocaleString(),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Khách hàng');
    XLSX.writeFile(wb, 'DanhSachKhachHang.xlsx');
  };

  const handleToggleStatus = async (userId) => {
    try {
      const res = await api.patch(`/api/admin/users/${userId}/status`, null, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('accessToken')}` },
      });
      message.success('Chuyển trạng thái tài khoản thành công!');
      setUsers(users.map(user => user.id === userId ? res.data.data : user));
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể chuyển trạng thái!');
    }
  };

  const columns = [
    {
      title: 'STT',
      key: 'stt',
      width: 80,
      render: (_, __, index) => index + 1,
    },
    { title: 'Mã', dataIndex: 'idTaiKhoan', key: 'idTaiKhoan' },
    { title: 'Họ tên', dataIndex: 'ten', key: 'ten' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Số điện thoại', dataIndex: 'soDienThoai', key: 'soDienThoai' },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      key: 'trangThai',
      render: (trangThai) => (
        <span style={{ color: trangThai === 1 ? 'green' : 'red' }}>
          {trangThai === 1 ? 'Hoạt động' : 'Không hoạt động'}
        </span>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <div>
          <Button
            icon={<EditOutlined />}
            onClick={() => navigate(`/admin/khach-hang/edit/${record.id}`)}
            style={{ marginRight: 8 }}
          />
          <Button
            icon={<PoweroffOutlined />}
            onClick={() => handleToggleStatus(record.id)}
            danger={record.trangThai === 1}
          />
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2 className="text-center">Quản Lý Khách Hàng</h2>
      <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
        <Input
          value={searchText}
          placeholder="Tìm kiếm theo tên, email, số điện thoại"
          prefix={<SearchOutlined />}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ width: 300 }}
        />
        <Select
          value={statusFilter}
          placeholder="Lọc theo trạng thái"
          onChange={handleStatusFilter}
          allowClear
          style={{ width: 200 }}
        >
          <Option value={1}>Hoạt động</Option>
          <Option value={0}>Không hoạt động</Option>
        </Select>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/admin/khach-hang/add')}
        >
          Thêm khách hàng
        </Button>
        <Button onClick={handleExportExcel}>Xuất Excel</Button>
        <Button onClick={fetchUsers}>Làm mới</Button>
      </div>
      <Table
        columns={columns}
        dataSource={filteredUsers}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default ListKhachHangComponent;