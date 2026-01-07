// src/admin/adminDonHangComponents/ListDonHangComponent.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  Input,
  Button,
  Tag,
  Select,
  DatePicker,
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
  EditOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
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
  if (
    raw.includes("giao_hang") ||
    raw.includes("giao hàng") ||
    raw.includes("delivery")
  )
    return "GIAO_HANG";
  if (raw.includes("online")) return "ONLINE";
  if (raw.includes("quầy") || raw.includes("tai_quay") || raw.includes("pos"))
    return "TAI_QUAY";
  return loaiDon || "";
};

// ===== Loại đơn map =====
const LOAI_DON_MAP = {
  ONLINE: { text: "Đơn hàng online", color: "#228be6", bg: "#e7f5ff" },
  TAI_QUAY: { text: "Bán tại quầy", color: "#12b886", bg: "#e6fcf5" },
  GIAO_HANG: { text: "Bán giao hàng", color: "#364fc7", bg: "#edf2ff" },
};

// ===== Status map =====
// ONLINE / GIAO_HANG (1..7)
const STATUS_ONLINE_MAP = {
  1: { text: "Chờ xác nhận", color: "#f08c00", bg: "#fff4e6" },
  2: { text: "Đã xác nhận", color: "#15aabf", bg: "#e3fafc" },
  3: { text: "Đang chuẩn bị hàng", color: "#1c7ed6", bg: "#e7f5ff" },
  4: { text: "Chuẩn bị giao hàng", color: "#364fc7", bg: "#edf2ff" },
  5: { text: "Đang giao hàng", color: "#ae3ec9", bg: "#f3f0ff" },
  6: { text: "Hoàn thành", color: "#2f9e44", bg: "#ebfbee" },
  7: { text: "Đã hủy", color: "#e03131", bg: "#fff5f5" },
};

// TẠI QUẦY (1..3)
const STATUS_POS_MAP = {
  1: { text: "Đang xử lý", color: "#1c7ed6", bg: "#e7f5ff" },
  2: { text: "Hoàn thành", color: "#2f9e44", bg: "#ebfbee" },
  3: { text: "Đã hủy", color: "#e03131", bg: "#fff5f5" },
};

// ===== thanh toán =====
const PAYMENT_MAP = {
  0: { text: "Chưa thanh toán", color: "#f76707", bg: "#fff4e6" },
  1: { text: "Đã thanh toán", color: "#2f9e44", bg: "#ebfbee" },
};

// ===== Tabs trạng thái (giống ảnh) =====
const ORDER_TABS = [
  { key: "ALL", label: "Tất cả" },
  { key: "CHO_XAC_NHAN", label: "Chờ xác nhận" },
  { key: "DANG_XU_LY", label: "Đang xử lý" },
  { key: "DANG_GIAO", label: "Đang giao" },
  { key: "HOAN_THANH", label: "Hoàn thành" },
  { key: "DA_HUY", label: "Đã hủy" },
];

const ListDonHangComponent = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1); // antd: 1-based
  const [size, setSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  // ===== Bộ lọc giống ảnh =====
  const [maDonHang, setMaDonHang] = useState("");
  const [khachHang, setKhachHang] = useState("");
  const [activeTabKey, setActiveTabKey] = useState("ALL"); // trạng thái đơn hàng
  const [orderType, setOrderType] = useState("ALL"); // ALL | ONLINE | TAI_QUAY | GIAO_HANG
  const [dateRange, setDateRange] = useState([null, null]); // [from, to]

  // toolbar dưới bảng
  const [searchText, setSearchText] = useState("");
  const [sortOrder, setSortOrder] = useState("desc"); // desc = mới nhất trước

  // trigger manual refresh (để tránh setState xong gọi fetch bị sai page)
  const [refreshKey, setRefreshKey] = useState(0);

  // ===== đếm số filter đang dùng =====
  const filterCount = useMemo(() => {
    let c = 0;
    if (maDonHang?.trim()) c++;
    if (khachHang?.trim()) c++;
    if (activeTabKey !== "ALL") c++;
    if (orderType !== "ALL") c++;
    if (dateRange?.[0] || dateRange?.[1]) c++;
    if (searchText?.trim()) c++;
    return c;
  }, [maDonHang, khachHang, activeTabKey, orderType, dateRange, searchText]);

  // ===== Map tab -> status theo loại đơn =====
  const mapTabToStatus = (tabKey, loaiDonNorm) => {
    if (tabKey === "ALL") return null;

    if (loaiDonNorm === "TAI_QUAY") {
      if (tabKey === "DANG_XU_LY") return 1;
      if (tabKey === "HOAN_THANH") return 2;
      if (tabKey === "DA_HUY") return 3;
      return null;
    }

    if (loaiDonNorm === "ONLINE" || loaiDonNorm === "GIAO_HANG") {
      if (tabKey === "CHO_XAC_NHAN") return 1;
      if (tabKey === "DANG_XU_LY") return 3;
      if (tabKey === "DANG_GIAO") return 5;
      if (tabKey === "HOAN_THANH") return 6;
      if (tabKey === "DA_HUY") return 7;
      return null;
    }

    return null;
  };

  // ===== build keyword (BE của bạn đang nhận keyword) =====
  const buildKeyword = () => {
    const parts = [maDonHang, khachHang, searchText]
      .map((x) => (x || "").trim())
      .filter(Boolean);
    return parts.length ? parts.join(" ") : undefined;
  };

  // ✅ FIX LỖI BỘ LỌC: gửi đúng trangThaiDon & trangThaiDonForTaiQuay
  const fetchOrders = async () => {
    try {
      setLoading(true);

      const loaiDonNorm = orderType === "ALL" ? undefined : orderType;

      let trangThaiDon = undefined; // ONLINE/GIAO_HANG
      let trangThaiDonForTaiQuay = undefined; // POS (array)

      if (orderType === "TAI_QUAY") {
        const stPos = mapTabToStatus(activeTabKey, "TAI_QUAY");
        trangThaiDonForTaiQuay = stPos ? [stPos] : undefined;
        trangThaiDon = undefined;
      } else if (orderType === "ONLINE" || orderType === "GIAO_HANG") {
        trangThaiDon = mapTabToStatus(activeTabKey, orderType) ?? undefined;
        trangThaiDonForTaiQuay = undefined;
      } else {
        // orderType === "ALL" -> lọc mix cả online-like & tại quầy theo tab
        switch (activeTabKey) {
          case "CHO_XAC_NHAN":
            trangThaiDon = 1;
            trangThaiDonForTaiQuay = undefined; // POS không có
            break;
          case "DANG_XU_LY":
            trangThaiDon = 3;
            trangThaiDonForTaiQuay = [1];
            break;
          case "DANG_GIAO":
            trangThaiDon = 5;
            trangThaiDonForTaiQuay = undefined; // POS không có
            break;
          case "HOAN_THANH":
            trangThaiDon = 6;
            trangThaiDonForTaiQuay = [2];
            break;
          case "DA_HUY":
            trangThaiDon = 7;
            trangThaiDonForTaiQuay = [3];
            break;
          default:
            trangThaiDon = undefined;
            trangThaiDonForTaiQuay = undefined;
        }
      }

      const from = dateRange?.[0]
        ? dateRange[0].format("YYYY-MM-DD")
        : undefined;
      const to = dateRange?.[1]
        ? dateRange[1].format("YYYY-MM-DD")
        : undefined;

      const params = {
        keyword: buildKeyword(),
        loaiDon: loaiDonNorm,
        trangThaiDon,
        trangThaiDonForTaiQuay,
        fromDate: from,
        toDate: to,
        page: page - 1,
        size,
        sort: `ngayTao,${sortOrder}`,
      };

      const pageResult = await searchOrders(params);

      setOrders(pageResult?.content || []);
      setTotalElements(pageResult?.totalElements || 0);
    } catch (err) {
      console.error("Lỗi tải danh sách đơn hàng:", err);
    } finally {
      setLoading(false);
    }
  };

  // auto fetch khi đổi paging/sort/tab/type/date hoặc refreshKey
  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size, sortOrder, activeTabKey, orderType, dateRange, refreshKey]);

  // debounce cho input text (mã đơn, khách, search dưới bảng) để giống ảnh
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
    setDateRange([null, null]);
    setSearchText("");
    setSortOrder("desc");
    setPage(1);
    setRefreshKey((k) => k + 1);
  };

  const setQuickRange = (mode) => {
    const now = dayjs();
    if (mode === "today") {
      setDateRange([now.startOf("day"), now.endOf("day")]);
    } else if (mode === "7days") {
      setDateRange([now.subtract(6, "day").startOf("day"), now.endOf("day")]);
    } else if (mode === "30days") {
      setDateRange([now.subtract(29, "day").startOf("day"), now.endOf("day")]);
    } else if (mode === "month") {
      setDateRange([now.startOf("month"), now.endOf("month")]);
    }
    setPage(1);
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
    const status = Number(
      record?.trangThaiDon ??
        record?.trangThai ??
        record?.trangThaiDonHang ??
        0
    );

    const conf =
      type === "TAI_QUAY"
        ? STATUS_POS_MAP[status]
        : STATUS_ONLINE_MAP[status];

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
        const total =
          v ??
          r?.tongTienThuHo ??
          r?.tongThanhToan ??
          r?.tongTienThanhToan ??
          0;
        return (
          <Tag
            color="#ebfbee"
            style={{
              borderRadius: 16,
              border: "none",
              padding: "2px 10px",
              fontWeight: 700,
            }}
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
      width: 100,
      render: (_text, record) => (
        <Space>
          <Button type="text" icon={<EyeOutlined />} onClick={() => navigate(`/admin/orders/${record.id}`)} />
          <Button type="text" icon={<EditOutlined />} onClick={() => console.log("Edit:", record.id)} />
        </Space>
      ),
    },
  ];

  const renderTab = (tab) => {
    const isActive = tab.key === activeTabKey;
    return (
      <button
        key={tab.key}
        onClick={() => {
          setActiveTabKey(tab.key);
          setPage(1);
        }}
        style={{
          borderRadius: 999,
          border: isActive ? "none" : "1px solid #dee2e6",
          padding: "6px 14px",
          marginRight: 8,
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 8,
          backgroundColor: isActive ? "#12b886" : "#ffffff",
          color: isActive ? "#ffffff" : "#495057",
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: isActive ? "0 2px 6px rgba(0,0,0,0.12)" : "none",
          whiteSpace: "nowrap",
        }}
      >
        {tab.label}
      </button>
    );
  };

  return (
    <div style={{ padding: 16, backgroundColor: "#f5f7fa", minHeight: "100vh", fontFamily: "Arial, sans-serif" }}>
      {/* ✅ Header đẹp hơn giống ảnh */}
      <div
        style={{
          marginBottom: 12,
          background: "#ffffff",
          borderRadius: 12,
          padding: "12px 14px",
          border: "1px solid #edf2ff",
          boxShadow: "0 2px 6px rgba(15, 23, 42, 0.04)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: "#12b886" }} />
            <span style={{ fontSize: 18, fontWeight: 900, color: "#0ca678" }}>
              Quản lý đơn hàng
            </span>
          </div>
          <div style={{ marginTop: 4, color: "#64748b", fontSize: 13 }}>
            Danh sách &amp; trạng thái
          </div>
        </div>

        <Button icon={<ReloadOutlined />} onClick={() => setRefreshKey((k) => k + 1)}>
          Làm mới
        </Button>
      </div>

      {/* ===== Bộ lọc giống ảnh ===== */}
      <Card
        style={{
          borderRadius: 12,
          marginBottom: 12,
          boxShadow: "0 2px 6px rgba(15, 23, 42, 0.04)",
          border: "1px solid #edf2ff",
        }}
        bodyStyle={{ padding: 14 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FilterOutlined style={{ color: "#0ca678" }} />
            <span style={{ fontWeight: 800 }}>Bộ lọc</span>
            <Badge count={filterCount} size="small" style={{ backgroundColor: "#228be6" }} />
          </div>

          <Button type="link" onClick={resetFilter} style={{ padding: 0 }}>
            Xóa toàn bộ bộ lọc
          </Button>
        </div>

        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>
          Sử dụng các bộ lọc dưới đây để tìm kiếm đơn hàng
        </div>

        <Row gutter={[12, 12]}>
          <Col xs={24} sm={12} md={6}>
            <div style={{ fontSize: 12, marginBottom: 6, color: "#334155" }}>Mã đơn hàng</div>
            <Input
              value={maDonHang}
              onChange={(e) => setMaDonHang(e.target.value)}
              placeholder="Lọc mã đơn hàng"
              allowClear
            />
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div style={{ fontSize: 12, marginBottom: 6, color: "#334155" }}>Khách hàng</div>
            <Input
              value={khachHang}
              onChange={(e) => setKhachHang(e.target.value)}
              placeholder="Lọc tên khách hàng"
              allowClear
            />
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div style={{ fontSize: 12, marginBottom: 6, color: "#334155" }}>Trạng thái đơn hàng</div>
            <Select
              value={activeTabKey}
              style={{ width: "100%" }}
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

          <Col xs={24} sm={12} md={6}>
            <div style={{ fontSize: 12, marginBottom: 6, color: "#334155" }}>Loại đơn hàng</div>
            <Select
              value={orderType}
              style={{ width: "100%" }}
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

          <Col xs={24} sm={12} md={6}>
            <div style={{ fontSize: 12, marginBottom: 6, color: "#334155" }}>Ngày tạo từ</div>
            <DatePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              value={dateRange?.[0]}
              onChange={(v) => {
                setDateRange([v, dateRange?.[1] || null]);
                setPage(1);
              }}
              allowClear
            />
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div style={{ fontSize: 12, marginBottom: 6, color: "#334155" }}>Ngày tạo đến</div>
            <DatePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              value={dateRange?.[1]}
              onChange={(v) => {
                setDateRange([dateRange?.[0] || null, v]);
                setPage(1);
              }}
              allowClear
            />
          </Col>

          <Col xs={24} md={12} style={{ display: "flex", alignItems: "end", justifyContent: "flex-end" }}>
            <Space wrap>
              <Button onClick={() => setQuickRange("today")}>Hôm nay</Button>
              <Button onClick={() => setQuickRange("7days")}>7 ngày qua</Button>
              <Button onClick={() => setQuickRange("30days")}>30 ngày qua</Button>
              <Button onClick={() => setQuickRange("month")}>Tháng này</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Tabs dạng pill giống ảnh */}
      <div style={{ marginBottom: 12, display: "flex", flexWrap: "wrap" }}>
        {ORDER_TABS.map(renderTab)}
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

            <Button icon={<ReloadOutlined />} onClick={resetFilter}>
              Reset
            </Button>
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
