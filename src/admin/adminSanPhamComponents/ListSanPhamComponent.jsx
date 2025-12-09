import React, { useState, useEffect } from 'react';
import {
  Table,
  Input,
  Button,
  Select,
  Space,
  Tag,
  Tooltip,
  message,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  ReloadOutlined,
  DownloadOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { listLaptop } from '../../service/LapTopService';
import {
  getAllManHinh,
  getAllPin,
  getAllHeDieuHanh,
  getAllThuongHieu,
} from '../../service/OptionService';

const { Option } = Select;

const statusMap = {
  1: { text: 'Hoạt động', color: 'green' },
  0: { text: 'Ngưng hoạt động', color: 'red' },
};

const ListSanPhamComponent = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  // filters: Pin, Màn hình, HĐH, Thương hiệu, Trạng thái
  const [filters, setFilters] = useState({
    pin: '',
    manHinh: '',
    heDieuHanh: '',
    thuongHieu: '',
    status: 'all',
  });

  const [screenList, setScreenList] = useState([]);
  const [pinList, setPinList] = useState([]);
  const [heDieuHanhList, setHeDieuHanhList] = useState([]);
  const [thuongHieuList, setThuongHieuList] = useState([]);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await listLaptop();

      const raw =
        Array.isArray(response?.data?.data?.content)
          ? response.data.data.content
          : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.records)
          ? response.data.records
          : [];

      const mapped = raw.map((item) => {
        const tongSoLuongSeri =
          typeof item.tongSoLuongSeri === 'number'
            ? item.tongSoLuongSeri
            : typeof item.soLuongTon === 'number'
            ? item.soLuongTon
            : 0;

        const soLuongBienThe =
          typeof item.soLuongBienThe === 'number'
            ? item.soLuongBienThe
            : typeof item.phienBan === 'number'
            ? item.phienBan
            : 0;

        const trangThaiInt =
          item.trangThai != null
            ? Number(item.trangThai)
            : tongSoLuongSeri > 0
            ? 1
            : 0;

        return {
          id: item.id || item.idLaptop,
          ma: item.idLaptop,
          ten: item.tenSanPham,

          thuongHieu: item.tenThuongHieu || item.thuongHieu || 'Chưa rõ',
          thuongHieuId: item.idThuongHieu ?? item.thuongHieuId ?? null,

          tongSoLuongSeri,
          soLuongBienThe,

          manHinhName:
            item.manHinhName || item.tenManHinh || item.doPhanGiaiManHinh,
          pinName: item.pinName || item.tenPin || item.dungLuongPin,
          heDieuHanhName:
            item.heDieuHanhName || item.tenHeDieuHanh || item.heDieuHanh,

          manHinhId: item.idManHinh ?? null,
          pinId: item.idPin ?? null,
          heDieuHanhId: item.heDieuHanhId ?? null,

          trangThai: trangThaiInt,
          ngayTao: item.ngayTao,
          ngaySua: item.ngaySua,
        };
      });

      setProducts(mapped);
      setFilteredList(mapped);
      setPagination((prev) => ({ ...prev, current: 1 }));
    } catch (error) {
      console.error('❌ Lỗi khi tải danh sách laptop:', error);
      message.error('Không tải được danh sách sản phẩm.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [screenRes, heDieuHanhRes, pinRes, thuongHieuRes] =
        await Promise.all([
          getAllManHinh(),
          getAllHeDieuHanh(),
          getAllPin(),
          getAllThuongHieu(),
        ]);

      setScreenList(screenRes?.data?.content || screenRes?.data || []);
      setHeDieuHanhList(
        heDieuHanhRes?.data?.content || heDieuHanhRes?.data || [],
      );
      setPinList(pinRes?.data?.content || pinRes?.data || []);
      setThuongHieuList(
        thuongHieuRes?.data?.content || thuongHieuRes?.data || [],
      );
    } catch (error) {
      console.error('❌ Lỗi khi tải dữ liệu combobox:', error);
    }
  };

  useEffect(() => {
    let user = null;
    try {
      const raw = sessionStorage.getItem('user');
      user = raw ? JSON.parse(raw) : null;
    } catch {
      user = null;
    }

    if (!user || user.role !== 'ADMIN') {
      message.error('Bạn không có quyền truy cập trang này!');
      navigate('/login');
      return;
    }

    fetchData();
    fetchOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const text = searchText.trim().toLowerCase();

    const filtered = products.filter((item) => {
      const matchSearch =
        !text ||
        item.ma?.toLowerCase().includes(text) ||
        item.ten?.toLowerCase().includes(text) ||
        item.thuongHieu?.toLowerCase().includes(text);

      const eq = (a, b) =>
        a == null || b == null ? false : String(a) === String(b);

      // lọc trạng thái
      let matchStatus = true;
      if (filters.status && filters.status !== 'all') {
        const stFilter = Number(filters.status);
        matchStatus = Number(item.trangThai ?? -1) === stFilter;
      }

      const matchPin = !filters.pin || eq(item.pinId, filters.pin);
      const matchScreen =
        !filters.manHinh || eq(item.manHinhId, filters.manHinh);
      const matchHDH =
        !filters.heDieuHanh || eq(item.heDieuHanhId, filters.heDieuHanh);
      const matchBrand =
        !filters.thuongHieu || eq(item.thuongHieuId, filters.thuongHieu);

      return (
        matchSearch &&
        matchStatus &&
        matchPin &&
        matchScreen &&
        matchHDH &&
        matchBrand
      );
    });

    setFilteredList(filtered);
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, [searchText, filters, products]);

  // ✅ sửa lại hàm này
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: key === 'status' ? (value ?? 'all') : (value ?? ''), // status dùng 'all', cái khác dùng ''
    }));
  };

  const columns = [
    {
      title: 'STT',
      width: 60,
      render: (_, __, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    { title: 'Mã Sản Phẩm', dataIndex: 'ma', width: 140 },
    { title: 'Tên Sản Phẩm', dataIndex: 'ten', width: 220 },
    {
      title: 'Thương Hiệu',
      dataIndex: 'thuongHieu',
      width: 150,
      render: (val) =>
        val ? (
          <Tag color="blue">{val}</Tag>
        ) : (
          <span style={{ color: '#aaa' }}>(Chưa rõ)</span>
        ),
    },
    { title: 'Màn Hình', dataIndex: 'manHinhName', width: 130 },
    { title: 'Pin', dataIndex: 'pinName', width: 110 },
    { title: 'Hệ Điều Hành', dataIndex: 'heDieuHanhName', width: 140 },
    {
      title: 'Số Lượng',
      dataIndex: 'tongSoLuongSeri',
      width: 160,
      render: (total, record) =>
        `${total ?? 0} (${record.soLuongBienThe ?? 0} phiên bản)`,
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'trangThai',
      width: 140,
      align: 'center',
      render: (val) => {
        const cfg = statusMap[Number(val)] || statusMap[0];
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: 'Thao Tác',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="Sửa">
            <Button
              icon={<EditOutlined />}
              type="text"
              onClick={() => navigate(`/admin/sua-lap-top/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="Xem biến thể">
            <Button
              icon={<EyeOutlined />}
              type="text"
              onClick={() => navigate(`/admin/lap-top-ct/${record.id}`)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2>Danh sách sản phẩm laptop</h2>

      <Space
        style={{ marginBottom: 16, flexWrap: 'wrap', gap: 12 }}
        size="middle"
      >
        <Input
          placeholder="Tìm kiếm theo mã, tên, thương hiệu"
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 320 }}
        />

        <Button
          icon={<ReloadOutlined />}
          onClick={fetchData}
          style={{ background: '#FFD700', color: '#000' }}
        >
          Làm Mới
        </Button>

        <Button icon={<DownloadOutlined />}>Tải Mẫu</Button>
        <Button icon={<FileExcelOutlined />}>Export Excel</Button>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/admin/add-lap-top')}
        >
          Tạo sản phẩm
        </Button>
      </Space>

      {/* Filter row */}
      <Space
        style={{ marginBottom: 16, flexWrap: 'wrap', gap: 12 }}
        size="middle"
      >
        {/* Thương hiệu */}
        <Select
          placeholder="Thương Hiệu"
          style={{ width: 160 }}
          onChange={(val) => handleFilterChange('thuongHieu', val)}
          allowClear
        >
          {thuongHieuList.map((item) => (
            <Option key={String(item.id)} value={String(item.id)}>
              {item.ten}
            </Option>
          ))}
        </Select>

        {/* Pin */}
        <Select
          placeholder="Pin"
          style={{ width: 150 }}
          onChange={(val) => handleFilterChange('pin', val)}
          allowClear
        >
          {pinList.map((item) => (
            <Option key={String(item.id)} value={String(item.id)}>
              {item.dungLuong || item.ten}
            </Option>
          ))}
        </Select>

        {/* Màn hình */}
        <Select
          placeholder="Màn Hình"
          style={{ width: 150 }}
          onChange={(val) => handleFilterChange('manHinh', val)}
          allowClear
        >
          {screenList.map((item) => (
            <Option key={String(item.id)} value={String(item.id)}>
              {item.doPhanGiai || item.ten}
            </Option>
          ))}
        </Select>

        {/* Hệ điều hành */}
        <Select
          placeholder="Hệ Điều Hành"
          style={{ width: 160 }}
          onChange={(val) => handleFilterChange('heDieuHanh', val)}
          allowClear
        >
          {heDieuHanhList.map((item) => (
            <Option key={String(item.id)} value={String(item.id)}>
              {item.ten}
            </Option>
          ))}
        </Select>

        {/* Trạng thái */}
        <Select
          placeholder="Trạng Thái"
          style={{ width: 140 }}
          value={filters.status === 'all' ? undefined : filters.status}
          onChange={(val) => handleFilterChange('status', val)}
          allowClear
        >
          <Option value="all">Tất cả</Option>
          <Option value="1">Hoạt động</Option>
          <Option value="0">Ngưng hoạt động</Option>
        </Select>
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredList}
        loading={loading}
        bordered
        scroll={{ x: 1200 }}
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
    </div>
  );
};

export default ListSanPhamComponent;
