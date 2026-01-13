import React, { useState, useEffect } from 'react';
import { Table, Input, Button, Select, Space, Tag, Tooltip, message } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { listLaptop } from '../../service/LapTopService';
import {
  getAllManHinh,
  getAllPin,
  getAllHeDieuHanh,
  getAllThuongHieu,
  getAllKichThuoc,
} from '../../service/OptionService';

const { Option } = Select;

const statusMap = {
  1: { text: 'Hoạt động', color: 'green' },
  0: { text: 'Ngưng hoạt động', color: 'red' },
};

// ✅ helper lấy label an toàn
const pickLabel = (obj, keys = []) => {
  if (!obj) return '';
  for (const k of keys) {
    const v = obj?.[k];
    if (v != null && String(v).trim() !== '') return String(v);
  }
  return '';
};

// ✅ format kích thước theo JSON: chieuDai/chieuRong/chieuCao (và optional khoiLuong)
const formatKichThuoc = (kt) => {
  if (!kt) return '';
  const d = kt.chieuDai ?? kt.dai ?? kt.length;
  const r = kt.chieuRong ?? kt.rong ?? kt.width;
  const c = kt.chieuCao ?? kt.cao ?? kt.height;

  if (d == null || r == null || c == null) return '';

  // ép về number/string gọn
  const dd = Number(d);
  const rr = Number(r);
  const cc = Number(c);
  if (Number.isNaN(dd) || Number.isNaN(rr) || Number.isNaN(cc)) return '';

  return `${dd} x ${rr} x ${cc}`;
};

const ListSanPhamComponent = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  // filters: Pin, Màn hình, Kích thước, HĐH, Thương hiệu, Trạng thái
  const [filters, setFilters] = useState({
    pin: '',
    manHinh: '',
    kichThuoc: '',
    heDieuHanh: '',
    thuongHieu: '',
    status: 'all',
  });

  const [screenList, setScreenList] = useState([]);
  const [pinList, setPinList] = useState([]);
  const [kichThuocList, setKichThuocList] = useState([]);
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

      const raw = Array.isArray(response?.data?.data?.content)
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

        // ✅ HDH: hỗ trợ nhiều kiểu backend trả về
        const hdhObj =
          item.heDieuHanh && typeof item.heDieuHanh === 'object'
            ? item.heDieuHanh
            : null;

        const heDieuHanhId =
          item.idHeDieuHanh ??
          item.heDieuHanhId ??
          item.idHDH ??
          item.hdhId ??
          hdhObj?.id ??
          null;

        const heDieuHanhName =
          item.tenHeDieuHanh ||
          item.heDieuHanhName ||
          hdhObj?.ten ||
          (typeof item.heDieuHanh === 'string' ? item.heDieuHanh : '');

        // ✅ Kích thước: JSON của bạn có chieuDai/chieuRong/chieuCao
        const ktObj =
          item.kichThuoc && typeof item.kichThuoc === 'object'
            ? item.kichThuoc
            : null;

        const kichThuocId =
          item.idKichThuoc ??
          item.kichThuocId ??
          item.idKT ??
          item.ktId ??
          ktObj?.id ??
          null;

        // ✅ ƯU TIÊN format từ object kích thước, fallback nếu backend đã trả string
        const kichThuocName =
          formatKichThuoc(ktObj) ||
          item.kichThuocName ||
          item.tenKichThuoc ||
          (typeof item.kichThuoc === 'string' ? item.kichThuoc : '');

        // ✅ Pin: hỗ trợ nhiều kiểu backend trả về
        const pinObj = item.pin && typeof item.pin === 'object' ? item.pin : null;

        const pinId =
          item.idPin ??
          item.pinId ??
          item.idPIN ??
          item.id_pin ??
          pinObj?.id ??
          null;

        const pinName =
          item.pinName ||
          item.tenPin ||
          item.dungLuongPin ||
          item.dungLuongPinName ||
          pinObj?.dungLuongPin ||
          pinObj?.dungLuong ||
          pinObj?.ten ||
          (typeof item.pin === 'string' ? item.pin : '') ||
          item.dungLuongPin ||
          item.dungLuong ||
          '';

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

          pinName,
          pinId,

          kichThuocName,
          kichThuocId,

          heDieuHanhName,
          heDieuHanhId,

          manHinhId: item.idManHinh ?? null,

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
      const [screenRes, heDieuHanhRes, pinRes, thuongHieuRes, kichThuocRes] =
        await Promise.all([
          getAllManHinh(),
          getAllHeDieuHanh(),
          getAllPin(),
          getAllThuongHieu(),
          getAllKichThuoc(),
        ]);

      setScreenList(screenRes?.data?.content || screenRes?.data || []);
      setThuongHieuList(thuongHieuRes?.data?.content || thuongHieuRes?.data || []);

      // ✅ Pin
      const rawPin = pinRes?.data?.content || pinRes?.data || [];
      setPinList(Array.isArray(rawPin) ? rawPin : []);

      // ✅ Kích thước + lọc trangThai=1 (nếu backend có trả)
      const rawKT = kichThuocRes?.data?.content || kichThuocRes?.data || [];
      const activeKT = Array.isArray(rawKT)
        ? rawKT.filter((x) => (x?.trangThai == null ? true : Number(x.trangThai) === 1))
        : [];
      setKichThuocList(activeKT);

      // ✅ HDH theo JSON bạn gửi + lọc trangThai=1
      const rawHDH =
        heDieuHanhRes?.data?.content ||
        heDieuHanhRes?.data?.data?.content ||
        heDieuHanhRes?.data ||
        [];

      const activeHDH = Array.isArray(rawHDH)
        ? rawHDH.filter((x) => Number(x?.trangThai) === 1)
        : [];

      setHeDieuHanhList(activeHDH);
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

    const allowed = ["ADMIN", "NHAN_VIEN", "ROLE_ADMIN", "ROLE_NHAN_VIEN"];
    if (!user || !allowed.includes(user.role)) {
      message.error("Bạn không có quyền truy cập trang này!");
      navigate("/admin/thong-ke");
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

      let matchStatus = true;
      if (filters.status && filters.status !== 'all') {
        const stFilter = Number(filters.status);
        matchStatus = Number(item.trangThai ?? -1) === stFilter;
      }

      const matchPin = !filters.pin || eq(item.pinId, filters.pin);
      const matchScreen = !filters.manHinh || eq(item.manHinhId, filters.manHinh);
      const matchKichThuoc =
        !filters.kichThuoc || eq(item.kichThuocId, filters.kichThuoc);
      const matchHDH =
        !filters.heDieuHanh || eq(item.heDieuHanhId, filters.heDieuHanh);
      const matchBrand =
        !filters.thuongHieu || eq(item.thuongHieuId, filters.thuongHieu);

      return (
        matchSearch &&
        matchStatus &&
        matchPin &&
        matchScreen &&
        matchKichThuoc &&
        matchHDH &&
        matchBrand
      );
    });

    setFilteredList(filtered);
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, [searchText, filters, products]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: key === 'status' ? value ?? 'all' : value ?? '',
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
    { title: 'Kích Thước', dataIndex: 'kichThuocName', width: 140 },
    { title: 'Pin', dataIndex: 'pinName', width: 110 },
    { title: 'Hệ Điều Hành', dataIndex: 'heDieuHanhName', width: 160 },
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
      title: 'Hành động',
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
      <h2>Danh sách sản phẩm</h2>

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

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/admin/add-lap-top')}
        >
          Tạo sản phẩm
        </Button>
      </Space>

      {/* Filter row */}
      <Space style={{ marginBottom: 16, flexWrap: 'wrap', gap: 12 }} size="middle">
        {/* Thương hiệu */}
        <Select
          placeholder="Thương Hiệu"
          style={{ width: 160 }}
          value={filters.thuongHieu || undefined}
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
          value={filters.pin || undefined}
          onChange={(val) => handleFilterChange('pin', val)}
          allowClear
        >
          {pinList.map((item) => {
            const id = item.id ?? item.idPin ?? item.pinId;
            const label = pickLabel(item, [
              'dungLuongPin',
              'dungLuong',
              'tenPin',
              'ten',
              'name',
            ]);
            return (
              <Option key={String(id)} value={String(id)}>
                {label || '(Chưa rõ)'}
              </Option>
            );
          })}
        </Select>

        {/* Màn hình */}
        <Select
          placeholder="Màn Hình"
          style={{ width: 150 }}
          value={filters.manHinh || undefined}
          onChange={(val) => handleFilterChange('manHinh', val)}
          allowClear
        >
          {screenList.map((item) => (
            <Option key={String(item.id)} value={String(item.id)}>
              {item.doPhanGiai || item.ten}
            </Option>
          ))}
        </Select>

        {/* ✅ Kích thước: hiển thị đúng theo JSON chieuDai/chieuRong/chieuCao */}
        <Select
          placeholder="Kích Thước"
          style={{ width: 180 }}
          value={filters.kichThuoc || undefined}
          onChange={(val) => handleFilterChange('kichThuoc', val)}
          allowClear
        >
          {kichThuocList.map((item) => {
            const id = item.id ?? item.idKichThuoc ?? item.idKT ?? item.kichThuocId;
            const label = formatKichThuoc(item); // ✅ quan trọng
            return (
              <Option key={String(id)} value={String(id)}>
                {label || '(Chưa rõ)'}
              </Option>
            );
          })}
        </Select>

        {/* Hệ điều hành */}
        <Select
          placeholder="Hệ Điều Hành"
          style={{ width: 180 }}
          value={filters.heDieuHanh || undefined}
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
        scroll={{ x: 1400 }}
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
