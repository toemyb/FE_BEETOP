import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Select, Avatar, Modal } from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  PoweroffOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import api from '../../service/api';
import { toast } from 'react-toastify';

const { Option } = Select;

const ListKhachHangComponent = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);

  // ✅ ADD: lọc giới tính
  const [genderFilter, setGenderFilter] = useState(null); // "Nam" | "Nữ" | null

  const navigate = useNavigate();

  // ✅ ADD: phân trang kiểu Antd (5/page, 10/page...)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 5 });

  // ✅ NEW: lấy timestamp để sort (ưu tiên updatedAt/ngayCapNhat rồi tới createdAt)
  const getTimeValue = (u) => {
    const raw =
      u?.updatedAt ||
      u?.ngayCapNhat ||
      u?.lastUpdatedAt ||
      u?.createdAt ||
      u?.ngayTao ||
      u?.createdDate ||
      null;

    const t = raw ? new Date(raw).getTime() : 0;
    return Number.isFinite(t) ? t : 0;
  };

  // ✅ NEW: fallback sort theo số trong idTaiKhoan (VD: KH0012)
  const getIdNumber = (u) => {
    const s = String(u?.idTaiKhoan || "");
    const m = s.match(/\d+/);
    return m ? Number(m[0]) : 0;
  };

  const sortUsers = (arr) => {
    return [...arr].sort((a, b) => {
      const tb = getTimeValue(b);
      const ta = getTimeValue(a);
      if (tb !== ta) return tb - ta;

      const nb = getIdNumber(b);
      const na = getIdNumber(a);
      if (nb !== na) return nb - na;

      return String(b?.idTaiKhoan || "").localeCompare(String(a?.idTaiKhoan || ""));
    });
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/users/by-role/R003', {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('accessToken')}` },
      });

      const list = res.data?.data || [];
      setUsers(sortUsers(list));
      setSearchText('');
      setStatusFilter(null);
      setGenderFilter(null);

      // ✅ reset phân trang
      setPagination((prev) => ({ ...prev, current: 1 }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể tải danh sách khách hàng!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (value) => setSearchText(value);
  const handleStatusFilter = (value) => setStatusFilter(value);
  const handleGenderFilter = (value) => setGenderFilter(value ?? null);

  // ✅ đổi filter/search thì về trang 1
  useEffect(() => {
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, [searchText, statusFilter, genderFilter]);

  const normalizeGender = (g) => String(g || "").trim().toLowerCase();

  const filteredUsers = users.filter(user => {
    const name = (user.ten || "").toLowerCase();
    const email = (user.email || "").toLowerCase();
    const phone = String(user.soDienThoai || "");
    const key = (searchText || "").toLowerCase();

    const matchesSearch =
      name.includes(key) ||
      email.includes(key) ||
      phone.includes(searchText || "");

    const matchesStatus = statusFilter === null || user.trangThai === statusFilter;

    // ✅ lọc giới tính
    const g = normalizeGender(user?.gioiTinh);
    const matchesGender =
      genderFilter === null ||
      (genderFilter === "Nam" && (g === "nam" || g === "male")) ||
      (genderFilter === "Nữ" && (g === "nữ" || g === "nu" || g === "female"));

    return matchesSearch && matchesStatus && matchesGender;
  });

  const handleExportExcel = () => {
    try {
      const data = filteredUsers.map((user, index) => ({
        STT: index + 1,
        "Mã": user.idTaiKhoan,
        "Họ tên": user.ten,
        Email: user.email,
        "Số điện thoại": user.soDienThoai,
        "Ảnh": user.anh || "",
        "Giới tính": user.gioiTinh || "",
        "Trạng thái": user.trangThai === 1 ? "Hoạt động" : "Không hoạt động",
        "Ngày tạo": user.createdAt
          ? new Date(user.createdAt).toLocaleString()
          : (user.ngayTao ? new Date(user.ngayTao).toLocaleString() : ""),
        "Ngày cập nhật": (user.updatedAt || user.ngayCapNhat)
          ? new Date(user.updatedAt || user.ngayCapNhat).toLocaleString()
          : "",
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Khách hàng');
      XLSX.writeFile(wb, 'DanhSachKhachHang.xlsx');
    } catch (e) {
      console.error("Export Excel error:", e);
      toast.error("Xuất Excel thất bại! Kiểm tra console để xem lỗi.");
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      const res = await api.patch(`/api/admin/users/${userId}/status`, null, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('accessToken')}` },
      });

      toast.success('Chuyển trạng thái tài khoản thành công!');

      setUsers((prev) => {
        const next = prev.map(user => (user.id === userId ? (res.data.data ?? user) : user));
        return sortUsers(next);
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể chuyển trạng thái!');
    }
  };

  // ✅ CONFIRM Ở GIỮA MÀN HÌNH (Modal.confirm)
  const confirmToggleStatus = (record) => {
    const isDeactivating = Number(record.trangThai) === 1;

    Modal.confirm({
      title: "Xác nhận đổi trạng thái",
      content: `Bạn có chắc muốn ${isDeactivating ? "ngưng" : "kích hoạt"} tài khoản này không?`,
      okText: "Xác nhận",
      cancelText: "Hủy",
      centered: true,              // ✅ nằm giữa màn hình
      okButtonProps: { danger: isDeactivating },
      onOk: () => handleToggleStatus(record.id),
    });
  };

  const columns = [
    {
      title: 'STT',
      key: 'stt',
      width: 80,
      render: (_, __, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    { title: 'Mã', dataIndex: 'idTaiKhoan', key: 'idTaiKhoan' },
    {
      title: "Ảnh",
      key: "anh",
      width: 80,
      render: (_, record) => <Avatar src={record.anh} icon={<UserOutlined />} size={40} />,
    },
    { title: 'Họ tên', dataIndex: 'ten', key: 'ten' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Số điện thoại', dataIndex: 'soDienThoai', key: 'soDienThoai' },
    { title: "Giới tính", dataIndex: "gioiTinh", key: "gioiTinh", width: 100, render: (g) => g || "—" },
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

          {/* ✅ CONFIRM CENTER */}
          <Button
            icon={<PoweroffOutlined />}
            danger={record.trangThai === 1}
            onClick={() => confirmToggleStatus(record)}
          />
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2 className="text-center">Quản Lý Khách Hàng</h2>

      <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: "wrap" }}>
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

        <Select
          value={genderFilter}
          placeholder="Lọc theo giới tính"
          onChange={handleGenderFilter}
          allowClear
          style={{ width: 200 }}
        >
          <Option value="Nam">Nam</Option>
          <Option value="Nữ">Nữ</Option>
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
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: filteredUsers.length,
          showSizeChanger: true,
          pageSizeOptions: ['5', '10', '20', '50'],
          showTotal: (t) => `Tổng ${t} bản ghi`,
        }}
        onChange={(pag) => {
          setPagination({
            current: pag.current,
            pageSize: pag.pageSize,
          });
        }}
      />
    </div>
  );
};

export default ListKhachHangComponent;
