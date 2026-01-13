import React, { useState, useEffect } from 'react';

import { Table, Button, Input, Select, Avatar, Tag, Modal } from "antd";
import { SearchOutlined, PlusOutlined, EditOutlined, PoweroffOutlined, UserOutlined } from "@ant-design/icons";
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import api from '../../service/api';
// ✅ FIX: dùng toastify
import { toast } from 'react-toastify';

const { Option } = Select;

const ListNhanVienComponent = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);

  // ✅ ADD: lọc theo chức vụ + giới tính
  const [roleFilter, setRoleFilter] = useState(null);     // "ADMIN" | "NHAN_VIEN" | null
  const [genderFilter, setGenderFilter] = useState(null); // "Nam" | "Nữ" | null

  const navigate = useNavigate();
  const [isOwner, setIsOwner] = useState(false);

  // ✅ ADD: phân trang giống ListSanPham
  const [pagination, setPagination] = useState({ current: 1, pageSize: 5 });

  const me = JSON.parse(sessionStorage.getItem("user") || "null");
  const myEmail = (me?.email || "").toLowerCase();

  const isOwnerAccount = (u) => (u?.idTaiKhoan || "").toUpperCase() === "AD000";
  const isAdminAccount = (u) =>
    u?.idRole?.idRole === "R001" ||
    ((u?.tenChucVu || "").toString().toUpperCase().includes("ADMIN"));

  const roleLabel = (u) => {
    const raw = (u?.tenChucVu || "").toString().toUpperCase();
    if (raw.includes("ADMIN")) return { text: "ADMIN", color: "red" };
    if (raw.includes("NHAN_VIEN") || raw.includes("STAFF")) return { text: "NHAN_VIEN", color: "blue" };
    return { text: raw || "—", color: "default" };
  };

  // ✅ START FIX: sort để user mới / vừa cập nhật lên đầu (ưu tiên updatedAt/ngayCapNhat rồi tới createdAt)
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
  // ✅ END FIX

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem("accessToken");

      const [empRes, adminRes] = await Promise.all([
        api.get("/api/admin/users/by-role/R002", { headers: { Authorization: `Bearer ${token}` } }),
        api.get("/api/admin/users/by-role/R001", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const merged = [...(adminRes.data.data || []), ...(empRes.data.data || [])];

      // ✅ START FIX: dùng sortUsers
      setUsers(sortUsers(merged));
      // ✅ END FIX

      // ✅ owner detection từ list (match email)
      const meInList = merged.find(u => (u?.email || "").toLowerCase() === myEmail);
      setIsOwner(((meInList?.idTaiKhoan || "")).toUpperCase() === "AD000");

      setSearchText("");
      setStatusFilter(null);
      setRoleFilter(null);
      setGenderFilter(null);

      // ✅ FIX: reset phân trang
      setPagination((prev) => ({ ...prev, current: 1 }));
    } catch (error) {
      // ✅ FIX: toast
      toast.error(error.response?.data?.message || "Không thể tải danh sách!");
      setIsOwner(false);
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

  // ✅ ADD: handlers filter mới
  const handleRoleFilter = (value) => setRoleFilter(value ?? null);
  const handleGenderFilter = (value) => setGenderFilter(value ?? null);

  // ✅ FIX: đổi filter thì về trang 1 (giống ListSanPham)
  useEffect(() => {
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, [searchText, statusFilter, roleFilter, genderFilter]);

  const normalizeGender = (g) => String(g || "").trim().toLowerCase();

  const filteredUsers = users.filter(user => {
    const ten = String(user?.ten || "").toLowerCase();
    const email = String(user?.email || "").toLowerCase();
    const sdt = String(user?.soDienThoai || "");

    const matchesSearch =
      ten.includes(searchText.toLowerCase()) ||
      email.includes(searchText.toLowerCase()) ||
      sdt.includes(searchText);

    const matchesStatus = statusFilter === null || user.trangThai === statusFilter;

    // ✅ lọc chức vụ
    const r = roleLabel(user).text;
    const matchesRole =
      roleFilter === null ||
      (roleFilter === "ADMIN" && r === "ADMIN") ||
      (roleFilter === "NHAN_VIEN" && r === "NHAN_VIEN");

    // ✅ lọc giới tính
    const g = normalizeGender(user?.gioiTinh);
    const matchesGender =
      genderFilter === null ||
      (genderFilter === "Nam" && (g === "nam" || g === "male")) ||
      (genderFilter === "Nữ" && (g === "nữ" || g === "nu" || g === "female"));

    return matchesSearch && matchesStatus && matchesRole && matchesGender;
  });

  const handleExportExcel = () => {
    const data = filteredUsers.map((user, index) => {
      const r = roleLabel(user);
      return {
        STT: index + 1,
        "Mã": user.idTaiKhoan,
        "Họ tên": user.ten,
        Email: user.email,
        "Số điện thoại": user.soDienThoai,
        "Chức vụ": r.text,
        "Ảnh": user.anh || "",
        "Trạng thái": user.trangThai === 1 ? "Hoạt động" : "Không hoạt động",
        "Ngày tạo": new Date(user.createdAt).toLocaleString(),
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Nhân viên');
    XLSX.writeFile(wb, 'DanhSachNhanVien.xlsx');
  };

  const handleToggleStatus = async (userId) => {
    try {
      const res = await api.patch(`/api/admin/users/${userId}/status`, null, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('accessToken')}` },
      });

      // ✅ FIX: toast
      toast.success('Chuyển trạng thái tài khoản thành công!');

      // ✅ START FIX: update xong sort lại
      setUsers(prev => sortUsers(prev.map(u => (u.id === userId ? (res.data.data ?? u) : u))));
      // ✅ END FIX
    } catch (error) {
      // ✅ FIX: toast
      toast.error(error.response?.data?.message || 'Không thể chuyển trạng thái!');
    }
  };
  const confirmToggleStatus = (record, disabledToggle) => {
    if (disabledToggle) return;

    const isDeactivating = record.trangThai === 1;

    Modal.confirm({
      title: "Xác nhận đổi trạng thái",
      content: `Bạn có chắc muốn ${isDeactivating ? "ngưng" : "kích hoạt"} tài khoản này không?`,
      okText: "Xác nhận",
      cancelText: "Hủy",
      centered: true, // ✅ nằm giữa màn hình
      okButtonProps: { danger: isDeactivating },
      onOk: () => handleToggleStatus(record.id),
    });
  };
  const columns = [
    {
      title: 'STT',
      key: 'stt',
      width: 80,
      // ✅ FIX: STT theo trang
      render: (_, __, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    { title: 'Mã', dataIndex: 'idTaiKhoan', key: 'idTaiKhoan' },
    {
      title: "Ảnh",
      key: "anh",
      width: 80,
      render: (_, record) => (
        <Avatar src={record.anh} icon={<UserOutlined />} size={40} />
      ),
    },
    { title: 'Họ tên', dataIndex: 'ten', key: 'ten' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Số điện thoại', dataIndex: 'soDienThoai', key: 'soDienThoai' },
    {
      title: "Chức vụ",
      key: "chucVu",
      width: 120,
      render: (_, record) => {
        const r = roleLabel(record);
        const textShow = r.text === "NHAN_VIEN" ? "Nhân viên" : r.text;
        return <Tag color={r.color}>{textShow}</Tag>;
      },
    },
    {
      title: "Giới tính",
      dataIndex: "gioiTinh",
      key: "gioiTinh",
      width: 100,
      render: (g) => g || "—",
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      key: 'trangThai',
      render: (trangThai) => (
        <span style={{ color: trangThai === 1 ? 'green' : 'red' }}>
          {trangThai === 1 ? 'Hoạt động' : trangThai === 0 ? 'Không hoạt động' : 'Chưa xác định'}
        </span>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => {
        const disabledEdit = isOwnerAccount(record) || (isAdminAccount(record) && !isOwner);
        const disabledToggle = isOwnerAccount(record) || (isAdminAccount(record) && !isOwner);

        return (
          <div>
            <Button
              icon={<EditOutlined />}
              disabled={disabledEdit}
              onClick={() => navigate(`/admin/nhan-vien/edit/${record.id}`)}
              style={{ marginRight: 8 }}
            />

            <Button
              icon={<PoweroffOutlined />}
              disabled={disabledToggle}
              danger={record.trangThai === 1}
              onClick={() => confirmToggleStatus(record, disabledToggle)}
            />
          </div>
        );
      }
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2 className="text-center">Quản Lý Nhân Viên</h2>

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
          value={roleFilter}
          placeholder="Lọc theo chức vụ"
          onChange={handleRoleFilter}
          allowClear
          style={{ width: 200 }}
        >
          <Option value="ADMIN">Admin</Option>
          <Option value="NHAN_VIEN">Nhân viên</Option>
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

        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/admin/nhan-vien/add')}>
          Thêm nhân viên
        </Button>
        <Button onClick={handleExportExcel}>Xuất Excel</Button>
        <Button onClick={fetchUsers}>Làm mới</Button>
      </div>

      <Table
        columns={columns}
        dataSource={filteredUsers}
        rowKey="id"
        loading={loading}
        // ✅ FIX: phân trang kiểu dropdown "x / page"
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

export default ListNhanVienComponent;
