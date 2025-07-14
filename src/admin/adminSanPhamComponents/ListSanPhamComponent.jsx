import React, { useState, useEffect } from 'react';
import {
  Table,
  Input,
  Button,
  Select,
  Space,
  Tag,
  Image,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  ReloadOutlined,
  DownloadOutlined,
  UploadOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { listLaptop } from '../../service/LapTopService';
import {
  getAllDoHoa,
  getAllRam,
  getAllRom,
  getAllCpu,
  getAllManHinh,
  getAllPin,
} from '../../service/OptionService';

const { Option } = Select;

const ListSanPhamComponent = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({
    ram: '',
    rom: '',
    cpu: '',
    manHinh: '',
    pin: '',
    doHoa: '',
    status: '',
  });

  const [ramList, setRamList] = useState([]);
  const [romList, setRomList] = useState([]);
  const [cpuList, setCpuList] = useState([]);
  const [screenList, setScreenList] = useState([]);
  const [pinList, setPinList] = useState([]);
  const [doHoaList, setDoHoaList] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await listLaptop();
      const data = Array.isArray(response.data.content) ? response.data.content : [];

      const mapped = data.map((item, index) => ({
        stt: index + 1,
        id: item.idLaptop,
        ma: item.idLaptop,
        ten: item.tenSanPham,
        hang: item.hang || 'Chưa rõ',
        image: item.imageUrl || '',
        soLuong: item.soLuongTon,
        phienBan: 1,
        ramId: item.ramId,
        romId: item.romId,
        cpuId: item.cpuId,
        manHinhId: item.idManHinh,
        pinId: item.idPin,
        doHoaId: item.doHoaId,
        trangThai: item.soLuongTon > 0 ? 'active' : 'inactive',
      }));

      setProducts(mapped);
      setFilteredList(mapped);
    } catch (error) {
      console.error('❌ Lỗi khi tải danh sách laptop:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [ramRes, romRes, cpuRes, screenRes, pinRes, doHoaRes] = await Promise.all([
        getAllRam(),
        getAllRom(),
        getAllCpu(),
        getAllManHinh(),
        getAllPin(),
        getAllDoHoa(),
      ]);

      setRamList(ramRes.data.content || []);
      setRomList(romRes.data.content || []);
      setCpuList(cpuRes.data.content || []);
      setScreenList(screenRes.data.content || []);
      setPinList(pinRes.data.content || []);
      setDoHoaList(doHoaRes.data.content || []);
    } catch (error) {
      console.error('❌ Lỗi khi tải dữ liệu combobox:', error);
    }
  };

  useEffect(() => {
        const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user || user.role !== 'ADMIN') {
      message.error('Bạn không có quyền truy cập trang này!');
      navigator('/login');
      return;
    }
    fetchData();
    fetchOptions();
  }, []);

  useEffect(() => {
    const filtered = products.filter((item) => {
      const matchSearch =
        item.ma?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.ten?.toLowerCase().includes(searchText.toLowerCase());

      const matchStatus =
        !filters.status || filters.status === 'all' || item.trangThai === filters.status;

      const matchDoHoa = !filters.doHoa || item.doHoaId === filters.doHoa;
      const matchRam = !filters.ram || item.ramId === filters.ram;
      const matchRom = !filters.rom || item.romId === filters.rom;
      const matchCpu = !filters.cpu || item.cpuId === filters.cpu;
      const matchPin = !filters.pin || item.pinId === filters.pin;
      const matchScreen = !filters.manHinh || item.manHinhId === filters.manHinh;

      return (
        matchSearch &&
        matchStatus &&
        matchDoHoa &&
        matchRam &&
        matchRom &&
        matchCpu &&
        matchPin &&
        matchScreen
      );
    });

    setFilteredList(filtered);
  }, [searchText, filters, products]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const columns = [
    { title: 'STT', dataIndex: 'stt', width: 60 },
    {
      title: 'Ảnh',
      dataIndex: 'image',
      render: (src) =>
        src ? <Image src={src} width={50} /> : <span style={{ color: '#aaa' }}>(Trống)</span>,
    },
    { title: 'Mã Sản Phẩm', dataIndex: 'ma' },
    { title: 'Tên Sản Phẩm', dataIndex: 'ten' },
    { title: 'Hãng', dataIndex: 'hang' },
    {
      title: 'Số Lượng',
      dataIndex: 'soLuong',
      render: (s, record) => `${s} (${record.phienBan} phiên bản)`,
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'trangThai',
      render: (val) =>
        val === 'active' ? <Tag color="green">Kinh doanh</Tag> : <Tag color="red">Ngưng</Tag>,
    },
    {
      title: 'Thao Tác',
      render: (_, record) => (
        <Space>
          <Tooltip title="Sửa">
            <Button icon={<EditOutlined />} type="text" />
          </Tooltip>
          <Tooltip title="Xem">
            <Button icon={<EyeOutlined />} type="text" />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2>Danh sách sản phẩm laptop</h2>

      <Space style={{ marginBottom: 16, flexWrap: 'wrap', gap: 12 }} size="middle">
        <Input
          placeholder="Tìm kiếm theo mã, tên"
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 250 }}
        />

        <Button
          icon={<ReloadOutlined />}
          onClick={fetchData}
          style={{ background: '#FFD700', color: '#000' }}
        >
          Làm Mới
        </Button>

        <Button icon={<UploadOutlined />}>Import IMEI</Button>
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
        <Select placeholder="RAM" style={{ width: 150 }} onChange={(val) => handleFilterChange('ram', val)}>
          {ramList.map((item) => (
            <Option key={item.id} value={item.id}>{item.dungLuongRam}</Option>
          ))}
        </Select>

        <Select placeholder="ROM" style={{ width: 150 }} onChange={(val) => handleFilterChange('rom', val)}>
          {romList.map((item) => (
            <Option key={item.id} value={item.id}>{item.dungLuongSsd}</Option>
          ))}
        </Select>

        <Select placeholder="CPU" style={{ width: 150 }} onChange={(val) => handleFilterChange('cpu', val)}>
          {cpuList.map((item) => (
            <Option key={item.id} value={item.id}>{item.ten}</Option>
          ))}
        </Select>

        <Select placeholder="Màn Hình" style={{ width: 150 }} onChange={(val) => handleFilterChange('manHinh', val)}>
          {screenList.map((item) => (
            <Option key={item.id} value={item.id}>{item.doPhanGiai}</Option>
          ))}
        </Select>

        <Select placeholder="Pin" style={{ width: 150 }} onChange={(val) => handleFilterChange('pin', val)}>
          {pinList.map((item) => (
            <Option key={item.id} value={item.id}>{item.dungLuong}</Option>
          ))}
        </Select>

        <Select placeholder="Đồ Họa" style={{ width: 160 }} onChange={(val) => handleFilterChange('doHoa', val)}>
          {doHoaList.map((item) => (
            <Option key={item.id} value={item.id}>{item.tenDayDu}</Option>
          ))}
        </Select>

        <Select placeholder="Trạng Thái" style={{ width: 120 }} onChange={(val) => handleFilterChange('status', val)}>
          <Option value="all">Tất cả</Option>
          <Option value="active">Kinh doanh</Option>
          <Option value="inactive">Ngưng</Option>
        </Select>

        <Select placeholder="Sắp Xếp" style={{ width: 120 }}>
          <Option value="moi">Mới</Option>
          <Option value="cu">Cũ</Option>
        </Select>
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredList}
        loading={loading}
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: 'Chưa có dữ liệu sản phẩm' }}
        bordered
      />
    </div>
  );
};

export default ListSanPhamComponent;
