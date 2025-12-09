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
    doHoa: '',
    heDieuHanh: '',
    status: '',
  });

  const [screenList, setScreenList] = useState([]);
  const [pinList, setPinList] = useState([]);
  const [doHoaList, setDoHoaList] = useState([]);
  const [heDieuHanhList, setHeDieuHanhList] = useState([]);

  const formatDate = (iso) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

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

      const mapped = raw.map((item, index) => ({
        stt: index + 1,
        id: item.id || item.idLaptop,
        ma: item.idLaptop,
        ten: item.tenSanPham,
        // thương hiệu
        thuongHieu: item.tenThuongHieu || item.thuongHieu || 'Chưa rõ',
        image: item.imageUrl || '',

        soLuong: item.soLuongTon ?? 0,
        phienBan: item.phienBan ?? 1,

        // tên hiển thị cho các cột thông số
        ramName: item.ramName || item.tenRam || item.ram,
        romName: item.romName || item.tenRom || item.rom || item.tenSsd,
        cpuName: item.cpuName || item.tenCpu || item.cpu,
        manHinhName:
          item.manHinhName || item.tenManHinh || item.doPhanGiaiManHinh,
        pinName: item.pinName || item.tenPin || item.dungLuongPin,
        doHoaName: item.doHoaName || item.tenDoHoa || item.cardDoHoa,
        heDieuHanhName:
          item.heDieuHanhName || item.tenHeDieuHanh || item.heDieuHanh,

        ramId: item.ramId ?? null,
        romId: item.romId ?? null,
        cpuId: item.cpuId ?? null,
        manHinhId: item.idManHinh ?? null,
        pinId: item.idPin ?? null,
        doHoaId: item.doHoaId ?? null,
        heDieuHanhId: item.heDieuHanhId ?? null,

        trangThai:
          typeof item.soLuongTon === 'number'
            ? item.soLuongTon > 0
              ? 'active'
              : 'inactive'
            : 'active',
        ngayTao: item.ngayTao,
        ngaySua: item.ngaySua,
      }));

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
      const [
        ramRes,
        romRes,
        cpuRes,
        screenRes,
        heDieuHanhRes,
        pinRes,
        doHoaRes,
      ] = await Promise.all([
        getAllRam(),
        getAllRom(),
        getAllCpu(),
        getAllManHinh(),
        getAllHeDieuHanh(),
        getAllPin(),
        getAllDoHoa(),
      ]);

      setRamList(ramRes?.data?.content || ramRes?.data || []);
      setRomList(romRes?.data?.content || romRes?.data || []);
      setCpuList(cpuRes?.data?.content || cpuRes?.data || []);
      setScreenList(screenRes?.data?.content || screenRes?.data || []);
      setHeDieuHanhList(
        heDieuHanhRes?.data?.content || heDieuHanhRes?.data || []
      );
      setPinList(pinRes?.data?.content || pinRes?.data || []);
      setDoHoaList(doHoaRes?.data?.content || doHoaRes?.data || []);
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

      const matchStatus =
        !filters.status ||
        filters.status === 'all' ||
        item.trangThai === filters.status;

      const matchDoHoa = !filters.doHoa || eq(item.doHoaId, filters.doHoa);
      const matchRam = !filters.ram || eq(item.ramId, filters.ram);
      const matchRom = !filters.rom || eq(item.romId, filters.rom);
      const matchCpu = !filters.cpu || eq(item.cpuId, filters.cpu);
      const matchPin = !filters.pin || eq(item.pinId, filters.pin);
      const matchScreen =
        !filters.manHinh || eq(item.manHinhId, filters.manHinh);
      const matchHDH =
        !filters.heDieuHanh || eq(item.heDieuHanhId, filters.heDieuHanh);

      return (
        matchSearch &&
        matchStatus &&
        matchPin &&
        matchScreen &&
        matchHDH
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
  { title: 'STT', dataIndex: 'stt', width: 60 },

  {
    title: 'Ảnh',
    dataIndex: 'image',
    width: 80,
    render: (src) =>
      src ? (
        <Image src={src} width={50} />
      ) : (
        <span style={{ color: '#aaa' }}>(Trống)</span>
      ),
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

  // Giữ lại Màn Hình – Pin – Hệ Điều Hành
  { title: 'Màn Hình', dataIndex: 'manHinhName', width: 130 },

  { title: 'Pin', dataIndex: 'pinName', width: 110 },

  { title: 'Hệ Điều Hành', dataIndex: 'heDieuHanhName', width: 140 },

  {
    title: 'Số Lượng',
    dataIndex: 'soLuong',
    width: 120,
    render: (s, record) => `${s ?? 0} (${record.phienBan ?? 1} phiên bản)`,
  },

  {
    title: 'Trạng Thái',
    dataIndex: 'trangThai',
    width: 120,
    render: (val) =>
      val === 'active' ? (
        <Tag color="green">Kinh doanh</Tag>
      ) : (
        <Tag color="red">Ngưng</Tag>
      ),
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
        <Tooltip title="Xem">
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

      {/* phần filter giữ nguyên, chỉ thêm combobox Hệ điều hành */}
      <Space style={{ marginBottom: 16, flexWrap: 'wrap', gap: 12 }} size="middle">
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

      <Space style={{ marginBottom: 16, flexWrap: 'wrap', gap: 12 }} size="middle">
        <Select
          placeholder="RAM"
          style={{ width: 150 }}
          onChange={(val) => handleFilterChange('ram', val)}
          allowClear
        >
          {ramList.map((item) => (
            <Option key={String(item.id)} value={String(item.id)}>
              {item.dungLuongRam || item.ten || item.name}
            </Option>
          ))}
        </Select>

        <Select
          placeholder="ROM"
          style={{ width: 150 }}
          onChange={(val) => handleFilterChange('rom', val)}
          allowClear
        >
          {romList.map((item) => (
            <Option key={String(item.id)} value={String(item.id)}>
              {item.dungLuongSsd || item.ten || item.name}
            </Option>
          ))}
        </Select>

        <Select
          placeholder="CPU"
          style={{ width: 150 }}
          onChange={(val) => handleFilterChange('cpu', val)}
          allowClear
        >
          {cpuList.map((item) => (
            <Option key={String(item.id)} value={String(item.id)}>
              {item.ten}
            </Option>
          ))}
        </Select>

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

        <Select
          placeholder="Đồ Họa"
          style={{ width: 160 }}
          onChange={(val) => handleFilterChange('doHoa', val)}
          allowClear
        >
          {doHoaList.map((item) => (
            <Option key={String(item.id)} value={String(item.id)}>
              {item.tenDayDu || item.ten}
            </Option>
          ))}
        </Select>

        <Select
          placeholder="Trạng Thái"
          style={{ width: 140 }}
          onChange={(val) => handleFilterChange('status', val)}
          allowClear
        >
          <Option value="all">Tất cả</Option>
          <Option value="active">Kinh doanh</Option>
          <Option value="inactive">Ngưng</Option>
        </Select>
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredList}
        loading={loading}
        pagination={{ pageSize: 5 }}
        locale={{ emptyText: 'Chưa có dữ liệu sản phẩm' }}
        bordered
        scroll={{ x: 1500 }}
      />
    </div>
  );
};

export default ListSanPhamComponent;
