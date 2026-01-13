// src/admin/adminDonHangComponents/ListDonHangComponent.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  Input,
  Button,
  Tag,
  Select,
  Space,
  Row,
  Col,
  Card,
  Badge,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  
  FilterOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { searchOrders } from "../../service/OrderManagementService";

const { Option } = Select;

// ===== helpers =====
const formatCurrency = (amount) => {
  const n = Number(amount || 0);
  return n.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const time = d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const date = d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return `${time} ${date}`;
};

// normalize loaiDon từ DB (VD: "Đơn hàng Online", "GIAO_HANG", "Bán tại quầy"...)
const normalizeLoaiDon = (loaiDon) => {
  const raw = (loaiDon || "").toString().toLowerCase();
  if (raw.includes("giao_hang") || raw.includes("giao hàng") || raw.includes("delivery"))
    return "GIAO_HANG";
  if (raw.includes("online")) return "ONLINE";
  if (raw.includes("quầy") || raw.includes("tai_quay") || raw.includes("pos"))
    return "TAI_QUAY";
  return (loaiDon || "").toString().toUpperCase();
};

// ===== Loại đơn map =====
const LOAI_DON_MAP = {
  ONLINE: { text: "Đơn hàng online", color: "#228be6", bg: "#e7f5ff" },
  TAI_QUAY: { text: "Bán tại quầy", color: "#12b886", bg: "#e6fcf5" },
  GIAO_HANG: { text: "Bán giao hàng", color: "#364fc7", bg: "#edf2ff" },
};

// ===== Status map =====
// ONLINE / GIAO_HANG (1..7) theo enum BE
const STATUS_ONLINE_MAP = {
  0: { text: "Tạo đơn", color: "#f08c00", bg: "#fff4e6" },
  1: { text: "Chờ xác nhận", color: "#f08c00", bg: "#fff4e6" },
  2: { text: "Đã xác nhận", color: "#15aabf", bg: "#e3fafc" },
  3: { text: "Đang chuẩn bị hàng", color: "#1c7ed6", bg: "#e7f5ff" },
  4: { text: "Đang giao", color: "#364fc7", bg: "#edf2ff" },
  5: { text: "Đã giao hàng", color: "#ae3ec9", bg: "#f3f0ff" },
  6: { text: "Hoàn thành", color: "#2f9e44", bg: "#ebfbee" },
  7: { text: "Đã hủy", color: "#e03131", bg: "#fff5f5" },
};

// TẠI QUẦY theo enum BE mới: 0/6/7
const STATUS_POS_MAP = {
  0: { text: "Tạo đơn", color: "#f08c00", bg: "#fff4e6" },
  6: { text: "Hoàn thành", color: "#2f9e44", bg: "#ebfbee" },
  7: { text: "Đã hủy", color: "#e03131", bg: "#fff5f5" },
};

// ===== thanh toán =====
const PAYMENT_MAP = {
  0: { text: "Chưa thanh toán", color: "#f76707", bg: "#fff4e6" },
  1: { text: "Đã thanh toán", color: "#2f9e44", bg: "#ebfbee" },
};

// ✅ Tabs trạng thái
const ORDER_TABS = [
  { key: "ALL", label: "Tất cả" },
  { key: "CHO_XAC_NHAN", label: "Chờ xác nhận" },
  { key: "DA_XAC_NHAN", label: "Đã xác nhận" },
  { key: "DANG_CHUAN_BI", label: "Đang chuẩn bị hàng" },
  { key: "DANG_GIAO", label: "Đang giao" },
  { key: "DA_GIAO_HANG", label: "Đã giao hàng" },
  { key: "HOAN_THANH", label: "Hoàn thành" },
  { key: "DA_HUY", label: "Đã hủy" },
];

const ListDonHangComponent = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1); // antd: 1-based
  const [size, setSize] = useState(5);
  const [totalElements, setTotalElements] = useState(0);

  // ✅ counts theo tab
  const [tabCounts, setTabCounts] = useState({});

  // ===== Bộ lọc =====
  const [maDonHang, setMaDonHang] = useState("");
  const [khachHang, setKhachHang] = useState("");
  const [activeTabKey, setActiveTabKey] = useState("ALL");
  const [orderType, setOrderType] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");

  // toolbar dưới bảng
  const [searchText, setSearchText] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");

  // trigger manual refresh
  const [refreshKey, setRefreshKey] = useState(0);

  // ===== styles (để UI đều) =====
  const controlStyle = { width: "100%" };
  const labelStyle = { fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 };

  const pillBtnBase = {
    height: 34,
    borderRadius: 999,
    padding: "0 14px",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontWeight: 700,
    cursor: "pointer",
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#334155",
    whiteSpace: "nowrap",
  };

  const pillCountBase = {
    minWidth: 22,
    height: 18,
    padding: "0 7px",
    borderRadius: 999,
    fontSize: 12,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
  };

  // ===== đếm số filter đang dùng (đã bỏ ngày tạo) =====
  const filterCount = useMemo(() => {
    let c = 0;
    if (maDonHang?.trim()) c++;
    if (khachHang?.trim()) c++;
    if (activeTabKey !== "ALL") c++;
    if (orderType !== "ALL") c++;
    if (searchText?.trim()) c++;
    if (paymentFilter !== "ALL") c++;
    return c;
  }, [maDonHang, khachHang, activeTabKey, orderType, searchText, paymentFilter]);

  // ✅ Map tab -> status theo loại đơn
  const mapTabToStatus = (tabKey, loaiDonNorm) => {
    if (tabKey === "ALL") return null;

    if (loaiDonNorm === "TAI_QUAY") {
      if (tabKey === "HOAN_THANH") return 6;
      if (tabKey === "DA_HUY") return 7;
      return null;
    }

    if (loaiDonNorm === "ONLINE" || loaiDonNorm === "GIAO_HANG") {
      if (tabKey === "CHO_XAC_NHAN") return 1;
      if (tabKey === "DA_XAC_NHAN") return 2;
      if (tabKey === "DANG_CHUAN_BI") return 3;
      if (tabKey === "DANG_GIAO") return 4;
      if (tabKey === "DA_GIAO_HANG") return 5;
      if (tabKey === "HOAN_THANH") return 6;
      if (tabKey === "DA_HUY") return 7;
      return null;
    }

    return null;
  };

  // ===== build keyword =====
  const buildKeyword = () => {
    const mdh = (maDonHang || "").trim();
    const st = (searchText || "").trim();
    const kh = (khachHang || "").trim();

    if (mdh) return mdh;
    if (st) return st;
    if (kh) return kh;
    return undefined;
  };

  const pickStatus = (o) =>
    Number(o?.trangThaiDon ?? o?.trangThai ?? o?.trangThaiDonHang ?? 0);

  const isDraft = (o) => pickStatus(o) === 0;

  // ✅ build base params cho count nhanh (đã bỏ fromDate/toDate)
  const buildBaseParams = () => {
    const loaiDonNorm = orderType === "ALL" ? undefined : orderType;

    return {
      keyword: buildKeyword(),
      loaiDon: loaiDonNorm,
      trangThaiThanhToan: paymentFilter === "ALL" ? undefined : Number(paymentFilter),
      page: 0,
      size: 1,
      sort: `ngayTao,${sortOrder}`,
    };
  };

  // ✅ build status params theo tab
  const buildStatusParamsByTab = (tabKey) => {
    const base = buildBaseParams();

    let trangThaiDon = undefined;
    let trangThaiDonForTaiQuay = undefined;

    if (orderType === "TAI_QUAY") {
      if (tabKey === "ALL") {
        trangThaiDonForTaiQuay = [6, 7];
      } else {
        const stPos = mapTabToStatus(tabKey, "TAI_QUAY");
        trangThaiDonForTaiQuay = stPos !== null ? [stPos] : undefined;
      }
    } else if (orderType === "ONLINE" || orderType === "GIAO_HANG") {
      trangThaiDon = mapTabToStatus(tabKey, orderType) ?? undefined;
    } else {
      switch (tabKey) {
        case "CHO_XAC_NHAN":
          trangThaiDon = 1;
          break;
        case "DA_XAC_NHAN":
          trangThaiDon = 2;
          break;
        case "DANG_CHUAN_BI":
          trangThaiDon = 3;
          break;
        case "DANG_GIAO":
          trangThaiDon = 4;
          break;
        case "DA_GIAO_HANG":
          trangThaiDon = 5;
          break;
        case "HOAN_THANH":
          trangThaiDon = 6;
          trangThaiDonForTaiQuay = [6];
          break;
        case "DA_HUY":
          trangThaiDon = 7;
          trangThaiDonForTaiQuay = [7];
          break;
        default:
          trangThaiDonForTaiQuay = [6, 7];
      }
    }

    return { ...base, trangThaiDon, trangThaiDonForTaiQuay };
  };

  // ✅ fetch count cho tab
  const fetchTabCounts = async () => {
    try {
      const pairs = await Promise.all(
        ORDER_TABS.map(async (t) => {
          const params = buildStatusParamsByTab(t.key);
          const res = await searchOrders(params);
          return [t.key, res?.totalElements || 0];
        })
      );
      const obj = {};
      pairs.forEach(([k, v]) => (obj[k] = v));
      setTabCounts(obj);
    } catch (e) {
      console.error("Lỗi tải số lượng tab:", e);
    }
  };

  // ✅ fetch orders
  const fetchOrders = async () => {
    try {
      setLoading(true);

      const loaiDonNorm = orderType === "ALL" ? undefined : orderType;

      let trangThaiDon = undefined;
      let trangThaiDonForTaiQuay = undefined;

      if (orderType === "TAI_QUAY") {
        if (activeTabKey === "ALL") {
          trangThaiDonForTaiQuay = [6, 7];
        } else {
          const stPos = mapTabToStatus(activeTabKey, "TAI_QUAY");
          trangThaiDonForTaiQuay = stPos !== null ? [stPos] : undefined;
        }
        trangThaiDon = undefined;
      } else if (orderType === "ONLINE" || orderType === "GIAO_HANG") {
        trangThaiDon = mapTabToStatus(activeTabKey, orderType) ?? undefined;
        trangThaiDonForTaiQuay = undefined;
      } else {
        switch (activeTabKey) {
          case "CHO_XAC_NHAN":
            trangThaiDon = 1;
            trangThaiDonForTaiQuay = undefined;
            break;
          case "DA_XAC_NHAN":
            trangThaiDon = 2;
            trangThaiDonForTaiQuay = undefined;
            break;
          case "DANG_CHUAN_BI":
            trangThaiDon = 3;
            trangThaiDonForTaiQuay = undefined;
            break;
          case "DANG_GIAO":
            trangThaiDon = 4;
            trangThaiDonForTaiQuay = undefined;
            break;
          case "DA_GIAO_HANG":
            trangThaiDon = 5;
            trangThaiDonForTaiQuay = undefined;
            break;
          case "HOAN_THANH":
            trangThaiDon = 6;
            trangThaiDonForTaiQuay = [6];
            break;
          case "DA_HUY":
            trangThaiDon = 7;
            trangThaiDonForTaiQuay = [7];
            break;
          default:
            trangThaiDon = undefined;
            trangThaiDonForTaiQuay = [6, 7];
        }
      }

      const params = {
        keyword: buildKeyword(),
        loaiDon: loaiDonNorm,
        trangThaiDon,
        trangThaiDonForTaiQuay,
        trangThaiThanhToan: paymentFilter === "ALL" ? undefined : Number(paymentFilter),
        // ✅ ĐÃ BỎ fromDate/toDate
        page: page - 1,
        size,
        sort: `ngayTao,${sortOrder}`,
      };

      const pageResult = await searchOrders(params);

      const raw = pageResult?.content || [];
      const filtered = raw.filter((o) => !isDraft(o));

      // ✅ đẩy đơn hủy xuống dưới (trang hiện tại)
      filtered.sort((a, b) => {
        const sa = pickStatus(a);
        const sb = pickStatus(b);
        const ca = sa === 7 ? 1 : 0;
        const cb = sb === 7 ? 1 : 0;
        return ca - cb;
      });

      setOrders(filtered);
      setTotalElements(pageResult?.totalElements || 0);
    } catch (err) {
      console.error("Lỗi tải danh sách đơn hàng:", err);
    } finally {
      setLoading(false);
    }
  };

  // auto fetch
  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size, sortOrder, activeTabKey, orderType, refreshKey, paymentFilter]);

  // fetch counts theo filter
  useEffect(() => {
    fetchTabCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderType, paymentFilter, maDonHang, khachHang, searchText, sortOrder, refreshKey]);

  // debounce input
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setRefreshKey((k) => k + 1);
    }, 450);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maDonHang, khachHang, searchText]);

  const resetFilter = () => {
    setMaDonHang("");
    setKhachHang("");
    setActiveTabKey("ALL");
    setOrderType("ALL");
    setPaymentFilter("ALL");
    setSearchText("");
    setSortOrder("desc");
    setPage(1);
    setRefreshKey((k) => k + 1);
  };

  const renderLoaiDonTag = (value) => {
    const type = normalizeLoaiDon(value);
    const conf =
      LOAI_DON_MAP[type] || { text: value || "Không xác định", color: "#495057", bg: "#f1f3f5" };
    return (
      <Tag style={{ borderRadius: 16, padding: "2px 10px", border: "none" }} color={conf.bg}>
        <span style={{ color: conf.color, fontWeight: 600 }}>{conf.text}</span>
      </Tag>
    );
  };

  const renderOrderStatusTag = (record) => {
    const type = normalizeLoaiDon(record?.loaiDon);
    const status = Number(record?.trangThaiDon ?? record?.trangThai ?? record?.trangThaiDonHang ?? 0);
    const conf = type === "TAI_QUAY" ? STATUS_POS_MAP[status] : STATUS_ONLINE_MAP[status];
    const view = conf || { text: "Không xác định", color: "#495057", bg: "#f1f3f5" };

    return (
      <Tag style={{ borderRadius: 16, padding: "2px 10px", border: "none" }} color={view.bg}>
        <span style={{ color: view.color, fontWeight: 600 }}>{view.text}</span>
      </Tag>
    );
  };

  const renderPaymentTag = (value) => {
    const conf = PAYMENT_MAP[value] || { text: "Không xác định", color: "#495057", bg: "#f1f3f5" };
    return (
      <Tag style={{ borderRadius: 16, padding: "2px 10px", border: "none" }} color={conf.bg}>
        <span style={{ color: conf.color, fontWeight: 600 }}>{conf.text}</span>
      </Tag>
    );
  };

  const columns = [
    {
      title: "STT",
      dataIndex: "index",
      width: 70,
      fixed: "left",
      render: (_text, _record, index) => (page - 1) * size + index + 1,
    },
    {
      title: "Mã đơn hàng",
      dataIndex: "maDonHang",
      render: (value, record) => (
        <span
          style={{ color: "#1c7ed6", cursor: "pointer", fontWeight: 700 }}
          onClick={() => navigate(`/admin/orders/${record.id}`)}
        >
          {value}
        </span>
      ),
    },
    {
      title: "Mã nhân viên",
      dataIndex: "maNhanVien",
      render: (value) => value || "N/A",
    },
    {
      title: "Tên khách hàng",
      dataIndex: "tenKhachHang",
      render: (value) => value || "Khách vãng lai",
    },
    {
      title: "Số điện thoại",
      dataIndex: "sdtKhachHang",
      render: (v, r) => v || r?.soDienThoai || "-",
    },
    {
      title: "Tổng tiền",
      dataIndex: "tongTien",
      align: "right",
      render: (v, r) => {
        const total = v ?? r?.tongTienThuHo ?? r?.tongThanhToan ?? r?.tongTienThanhToan ?? 0;
        return (
          <Tag
            color="#ebfbee"
            style={{ borderRadius: 16, border: "none", padding: "2px 10px", fontWeight: 700 }}
          >
            <span style={{ color: "#2f9e44" }}>{formatCurrency(total)}</span>
          </Tag>
        );
      },
    },
    {
      title: "Loại đơn hàng",
      dataIndex: "loaiDon",
      render: (value) => renderLoaiDonTag(value),
    },
    {
      title: "Trạng thái đơn hàng",
      dataIndex: "trangThaiDon",
      render: (_v, record) => renderOrderStatusTag(record),
    },
    {
      title: "Trạng thái thanh toán",
      dataIndex: "trangThaiThanhToan",
      render: (value) => renderPaymentTag(value),
    },
    {
      title: "Ngày tạo",
      dataIndex: "ngayTao",
      render: (value) => <span style={{ whiteSpace: "nowrap" }}>{formatDateTime(value)}</span>,
    },
    {
      title: "Ngày cập nhật",
      dataIndex: "ngayCapNhat",
      render: (value) => <span style={{ whiteSpace: "nowrap" }}>{formatDateTime(value)}</span>,
    },
    {
      title: "Hành động",
      fixed: "right",
      width: 50,
      render: (_text, record) => (
       
          <Button type="text" icon={<EyeOutlined />} onClick={() => navigate(`/admin/orders/${record.id}`)} />
          
       
      ),
    },
  ];

  return (
    <div style={{ padding: 16, minHeight: "100vh", fontFamily: "Arial, sans-serif" }}>
      {/* ✅ Header */}

            <h2 className="text-center">Quản Lý Đơn Hàng</h2>
          


      {/* ===== Bộ lọc (đã bỏ ngày tạo + nhanh) ===== */}
      <Card
        style={{
          borderRadius: 12,
          marginBottom: 12,
          boxShadow: "0 2px 6px rgba(15, 23, 42, 0.04)",
          border: "1px solid #edf2ff",
        }}
        styles={{ body: { padding: 14 } }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FilterOutlined style={{ color: "#0ca678" }} />
            <span style={{ fontWeight: 800 }}>Bộ lọc</span>
            <Badge count={filterCount} size="small" style={{ backgroundColor: "#228be6" }} />
          </div>

          <Button type="link" onClick={resetFilter} style={{ padding: 0, fontWeight: 600 }}>
            Xóa bộ lọc
          </Button>
        </div>

        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>
          Sử dụng các bộ lọc dưới đây để tìm kiếm đơn hàng
        </div>

        <Row gutter={[16, 14]}>
          {/* 4 cột đều */}
          <Col xs={24} sm={12} lg={6}>
            <div style={labelStyle}>Mã đơn hàng</div>
            <Input
              value={maDonHang}
              onChange={(e) => setMaDonHang(e.target.value)}
              placeholder="Lọc mã đơn..."
              allowClear
              style={controlStyle}
            />
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <div style={labelStyle}>Khách hàng</div>
            <Input
              value={khachHang}
              onChange={(e) => setKhachHang(e.target.value)}
              placeholder="Lọc tên khách..."
              allowClear
              style={controlStyle}
            />
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <div style={labelStyle}>Trạng thái đơn hàng</div>
            <Select
              value={activeTabKey}
              style={controlStyle}
              onChange={(val) => {
                setActiveTabKey(val);
                setPage(1);
              }}
            >
              {ORDER_TABS.map((t) => (
                <Option key={t.key} value={t.key}>
                  {t.label}
                </Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <div style={labelStyle}>Loại đơn hàng</div>
            <Select
              value={orderType}
              style={controlStyle}
              onChange={(val) => {
                setOrderType(val);
                setPage(1);
              }}
            >
              <Option value="ALL">Tất cả loại đơn</Option>
              <Option value="ONLINE">Đơn hàng online</Option>
              <Option value="GIAO_HANG">Bán giao hàng</Option>
              <Option value="TAI_QUAY">Bán tại quầy</Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <div style={labelStyle}>Trạng thái thanh toán</div>
            <Select
              value={paymentFilter}
              style={controlStyle}
              onChange={(val) => {
                setPaymentFilter(val);
                setPage(1);
              }}
            >
              <Option value="ALL">Tất cả</Option>
              <Option value="0">Chưa thanh toán</Option>
              <Option value="1">Đã thanh toán</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* ✅ Thanh tổng số */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #edf2ff",
          borderRadius: 12,
          padding: "10px 12px",
          marginBottom: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          boxShadow: "0 2px 6px rgba(15, 23, 42, 0.04)",
        }}
      >
        <div style={{ fontWeight: 900, color: "#0f172a" }}>
          Tổng số đơn:{" "}
          <span style={{ color: "#228be6" }}>
            {tabCounts?.[activeTabKey] ?? totalElements}
          </span>
        </div>
        <div style={{ color: "#64748b", fontSize: 13 }}>(Theo bộ lọc hiện tại)</div>
      </div>

      {/* ✅ Tabs dạng pill có số */}
      <div style={{ marginBottom: 12, display: "flex", flexWrap: "wrap", gap: 10 }}>
        {ORDER_TABS.map((tab) => {
          const isActive = tab.key === activeTabKey;
          const count = tabCounts?.[tab.key] ?? 0;

          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTabKey(tab.key);
                setPage(1);
              }}
              style={{
                ...pillBtnBase,
                border: isActive ? "none" : pillBtnBase.border,
                background: isActive ? "#12b886" : "#fff",
                color: isActive ? "#fff" : "#334155",
                boxShadow: isActive ? "0 6px 16px rgba(18,184,134,0.25)" : "none",
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  ...pillCountBase,
                  background: isActive ? "rgba(255,255,255,0.25)" : "#e7f5ff",
                  color: isActive ? "#fff" : "#1c7ed6",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ===== Table ===== */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 12,
          padding: 16,
          border: "1px solid #edf2ff",
          boxShadow: "0 2px 6px rgba(15, 23, 42, 0.04)",
        }}
      >
        {/* Toolbar: search + sort */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, gap: 12, flexWrap: "wrap" }}>
          <Input
            allowClear
            placeholder="Tìm kiếm..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ maxWidth: 320 }}
          />

          <Space>
            <Select
              value={sortOrder}
              style={{ width: 160 }}
              onChange={(val) => {
                setSortOrder(val);
                setPage(1);
              }}
            >
              <Option value="desc">Mới nhất trước</Option>
              <Option value="asc">Cũ nhất trước</Option>
            </Select>
          </Space>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={orders}
          size="middle"
          scroll={{ x: 1300 }}
          pagination={{
            current: page,
            pageSize: size,
            total: totalElements,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50],
            onChange: (current, pageSize) => {
              setPage(current);
              setSize(pageSize);
            },
            showTotal: (total, [start, end]) => `${start}–${end} / ${total} đơn`,
          }}
        />
      </div>
    </div>
  );
};

export default ListDonHangComponent;
