import React, { useEffect, useMemo, useState } from "react";
import { Table, Input, Button, Tag, Select, DatePicker, Space } from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { searchOrders } from "../../service/OrderManagementService";

const { RangePicker } = DatePicker;
const { Option } = Select;

// ===== helpers =====
const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return "0 ₫";
  const num = Number(amount) || 0;
  return num.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
};

const formatDateTime = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
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

// normalize loaiDon (tránh DB lưu kiểu "Đơn hàng Online" / "bán tại quầy" ...)
const normalizeLoaiDon = (loaiDon) => {
  const raw = (loaiDon || "").toString().toLowerCase();
  if (raw.includes("online")) return "ONLINE";
  if (raw.includes("quầy") || raw.includes("tai_quay") || raw.includes("pos"))
    return "TAI_QUAY";
  return loaiDon || "";
};

// ===== Map loại đơn =====
const LOAI_DON_MAP = {
  ONLINE: { text: "Đơn hàng online", color: "#228be6", bg: "#e7f5ff" },
  TAI_QUAY: { text: "Bán tại quầy", color: "#12b886", bg: "#e6fcf5" },
};

// ===== Map trạng thái theo loại đơn =====
// ONLINE (1..7) theo convertTrangThaiToTen trong OrderCustomerServiceImpl
const STATUS_ONLINE_MAP = {
  1: { text: "Chờ xác nhận", color: "#f08c00", bg: "#fff4e6" },
  2: { text: "Đã xác nhận", color: "#15aabf", bg: "#e3fafc" },
  3: { text: "Đang chuẩn bị hàng", color: "#1c7ed6", bg: "#e7f5ff" },
  4: { text: "Chuẩn bị giao hàng", color: "#364fc7", bg: "#edf2ff" },
  5: { text: "Đang giao hàng", color: "#ae3ec9", bg: "#f3f0ff" },
  6: { text: "Hoàn thành", color: "#2f9e44", bg: "#ebfbee" },
  7: { text: "Hủy đơn", color: "#e03131", bg: "#fff5f5" },
};

// TẠI QUẦY (1..3) theo OrderDetailComponent map POS của bạn
const STATUS_POS_MAP = {
  1: { text: "Đang chuẩn bị hàng", color: "#1c7ed6", bg: "#e7f5ff" },
  2: { text: "Hoàn thành", color: "#2f9e44", bg: "#ebfbee" },
  3: { text: "Đã hủy", color: "#e03131", bg: "#fff5f5" },
};

// ===== trạng thái thanh toán (giữ nguyên logic bạn đang dùng) =====
const TRANG_THAI_TT_MAP = {
  0: { text: "Chưa thanh toán", color: "#f76707", bg: "#fff4e6" },
  1: { text: "Đã thanh toán", color: "#2f9e44", bg: "#ebfbee" },
};

// ===== Tabs trạng thái (key chung) =====
const ORDER_TABS = [
  { key: "ALL", label: "Tất cả" },
  { key: "CHO_XAC_NHAN", label: "Chờ xác nhận" }, // online chủ yếu
  { key: "DANG_XU_LY", label: "Đang xử lý" },     // online(3/4) + pos(1)
  { key: "DANG_GIAO", label: "Đang giao" },       // online(5)
  { key: "HOAN_THANH", label: "Hoàn thành" },     // online(6) + pos(2)
  { key: "DA_HUY", label: "Đã hủy" },             // online(7) + pos(3)
];

const ListDonHangComponent = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1); // antd 1-based
  const [size, setSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  const [searchText, setSearchText] = useState("");
  const [sortOrder, setSortOrder] = useState("desc"); // desc = mới nhất trước
  const [dateRange, setDateRange] = useState(null);

  const [activeTabKey, setActiveTabKey] = useState("ALL");

  // ✅ thêm filter loại đơn
  const [orderType, setOrderType] = useState("ALL"); // ALL | ONLINE | TAI_QUAY

  const navigate = useNavigate();

  // ===== map tab -> trangThaiDon theo từng loại đơn =====
  const mapTabToStatus = (tabKey, loaiDonNorm) => {
    // ALL tab => không filter trạng thái
    if (tabKey === "ALL") return null;

    // nếu đang chọn TAI_QUAY
    if (loaiDonNorm === "TAI_QUAY") {
      if (tabKey === "DANG_XU_LY") return 1;
      if (tabKey === "HOAN_THANH") return 2;
      if (tabKey === "DA_HUY") return 3;
      // các tab không áp dụng cho POS -> null
      return null;
    }

    // ONLINE
    if (loaiDonNorm === "ONLINE") {
      if (tabKey === "CHO_XAC_NHAN") return 1;
      if (tabKey === "DANG_XU_LY") return 3; // bạn có thể chọn 3 (chuẩn bị) là “đang xử lý”
      if (tabKey === "DANG_GIAO") return 5;
      if (tabKey === "HOAN_THANH") return 6;
      if (tabKey === "DA_HUY") return 7;
      return null;
    }

    // nếu orderType = ALL => không gửi trangThaiDon lên BE (vì ONLINE/POS khác thang số)
    return null;
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const loaiDonNorm = orderType === "ALL" ? null : orderType;
      const trangThaiDon =
        loaiDonNorm ? mapTabToStatus(activeTabKey, loaiDonNorm) : null;

      const params = {
        keyword: searchText || undefined,
        loaiDon: loaiDonNorm || undefined, // ✅ filter loại đơn ở BE
        trangThaiDon: trangThaiDon ?? undefined, // ✅ chỉ gửi khi đã xác định đúng theo loại
        trangThaiThanhToan: undefined,
        fromDate:
          dateRange && dateRange[0]
            ? dateRange[0].format("YYYY-MM-DD")
            : undefined,
        toDate:
          dateRange && dateRange[1]
            ? dateRange[1].format("YYYY-MM-DD")
            : undefined,
        page: page - 1, // BE 0-based
        size,
        sort: `ngayTao,${sortOrder}`,
      };

      const pageResult = await searchOrders(params);

      if (!pageResult) {
        setOrders([]);
        setTotalElements(0);
        return;
      }

      setOrders(pageResult.content || []);
      setTotalElements(pageResult.totalElements || 0);
    } catch (err) {
      console.error("Lỗi tải danh sách đơn hàng:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size, sortOrder, activeTabKey, dateRange, orderType]);

  const resetFilter = () => {
    setSearchText("");
    setDateRange(null);
    setSortOrder("desc");
    setActiveTabKey("ALL");
    setOrderType("ALL");
    setPage(1);
  };

  const handleSearch = () => {
    setPage(1);
    fetchOrders();
  };

  // ===== hiển thị trạng thái theo loại đơn =====
  const renderOrderStatusTag = (record) => {
    const type = normalizeLoaiDon(record?.loaiDon);
    const status = Number(record?.trangThaiDon ?? record?.trangThai ?? 0);

    const conf =
      type === "TAI_QUAY"
        ? STATUS_POS_MAP[status]
        : STATUS_ONLINE_MAP[status];

    const view = conf || {
      text: "Không xác định",
      color: "#495057",
      bg: "#f1f3f5",
    };

    return (
      <Tag
        style={{
          borderRadius: 16,
          padding: "2px 10px",
          border: "none",
        }}
        color={view.bg}
      >
        <span style={{ color: view.color, fontWeight: 500 }}>{view.text}</span>
      </Tag>
    );
  };

  const renderLoaiDonTag = (value) => {
    const type = normalizeLoaiDon(value);
    const conf = LOAI_DON_MAP[type] || {
      text: value || "Không xác định",
      color: "#495057",
      bg: "#f1f3f5",
    };
    return (
      <Tag
        style={{
          borderRadius: 16,
          padding: "2px 10px",
          border: "none",
        }}
        color={conf.bg}
      >
        <span style={{ color: conf.color, fontWeight: 500 }}>{conf.text}</span>
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
          style={{ color: "#1c7ed6", cursor: "pointer", fontWeight: 500 }}
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
      render: (value) => {
        const name = value || "Khách vãng lai";
        const firstChar = name?.charAt(0)?.toUpperCase() || "K";
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                backgroundColor: "#e9ecef",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 600,
                color: "#495057",
              }}
            >
              {firstChar}
            </div>
            <span>{name}</span>
          </div>
        );
      },
    },
    { title: "Số điện thoại", dataIndex: "sdtKhachHang" },
    {
      title: "Tổng tiền",
      dataIndex: "tongTien",
      align: "right",
      render: (value) => (
        <Tag
          color="#ebfbee"
          style={{
            borderRadius: 16,
            border: "none",
            padding: "2px 10px",
            fontWeight: 600,
          }}
        >
          <span style={{ color: "#2f9e44" }}>{formatCurrency(value)}</span>
        </Tag>
      ),
    },
    {
      title: "Loại đơn hàng",
      dataIndex: "loaiDon",
      render: (value) => renderLoaiDonTag(value),
    },
    {
      title: "Trạng thái đơn hàng",
      dataIndex: "trangThaiDon",
      render: (_value, record) => renderOrderStatusTag(record),
    },
    {
      title: "Trạng thái thanh toán",
      dataIndex: "trangThaiThanhToan",
      render: (value) => {
        const conf = TRANG_THAI_TT_MAP[value] || {
          text: "Không xác định",
          color: "#495057",
          bg: "#f1f3f5",
        };
        return (
          <Tag
            style={{
              borderRadius: 16,
              padding: "2px 10px",
              border: "none",
            }}
            color={conf.bg}
          >
            <span style={{ color: conf.color, fontWeight: 500 }}>
              {conf.text}
            </span>
          </Tag>
        );
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "ngayTao",
      render: (value) => (
        <div
          style={{
            backgroundColor: "#e6fcf5",
            borderRadius: 6,
            padding: "2px 6px",
            display: "inline-block",
          }}
        >
          <span style={{ whiteSpace: "nowrap", color: "#0ca678" }}>
            {formatDateTime(value)}
          </span>
        </div>
      ),
    },
    {
      title: "Ngày cập nhật",
      dataIndex: "ngayCapNhat",
      render: (value) => (
        <span style={{ whiteSpace: "nowrap" }}>{formatDateTime(value)}</span>
      ),
    },
    {
      title: "Hành động",
      dataIndex: "action",
      fixed: "right",
      width: 90,
      render: (_text, record) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/admin/orders/${record.id}`)}
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => console.log("Sửa đơn", record.id)}
          />
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
          borderRadius: "999px",
          border: isActive ? "none" : "1px solid #dee2e6",
          padding: "6px 14px",
          marginRight: 8,
          display: "flex",
          alignItems: "center",
          gap: 8,
          backgroundColor: isActive ? "#12b886" : "#ffffff",
          color: isActive ? "#ffffff" : "#495057",
          fontWeight: 500,
          cursor: "pointer",
          boxShadow: isActive ? "0 2px 6px rgba(0,0,0,0.12)" : "none",
          whiteSpace: "nowrap",
        }}
      >
        <span>{tab.label}</span>
      </button>
    );
  };

  return (
    <div
      style={{
        padding: 16,
        backgroundColor: "#f5f7fa",
        minHeight: "100vh",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h3 style={{ marginBottom: 16 }}>
        <span style={{ color: "#28a745" }}>Quản lý đơn hàng</span>{" "}
        <small style={{ color: "#6c757d", fontWeight: "normal" }}>
          Danh sách &amp; trạng thái
        </small>
      </h3>

      {/* Tabs trạng thái */}
      <div style={{ marginBottom: 16, display: "flex", flexWrap: "wrap" }}>
        {ORDER_TABS.map(renderTab)}
      </div>

      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 8,
          padding: 16,
          boxShadow: "0 2px 6px rgba(15, 23, 42, 0.04)",
        }}
      >
        {/* Search + filter */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 12,
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <Input
            allowClear
            placeholder="Tìm kiếm..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={handleSearch}
            style={{ maxWidth: 280 }}
          />

          <Space>
            {/* ✅ Filter loại đơn */}
            <Select
              value={orderType}
              style={{ width: 160 }}
              onChange={(val) => {
                setOrderType(val);
                setPage(1);
              }}
            >
              <Option value="ALL">Tất cả loại đơn</Option>
              <Option value="ONLINE">Đơn hàng online</Option>
              <Option value="TAI_QUAY">Bán tại quầy</Option>
            </Select>

            <RangePicker
              format="DD/MM/YYYY"
              value={dateRange}
              onChange={(values) => {
                setDateRange(values);
                setPage(1);
              }}
            />

            <Select
              value={sortOrder}
              style={{ width: 140 }}
              onChange={(val) => {
                setSortOrder(val);
                setPage(1);
              }}
            >
              <Option value="asc">Cũ nhất trước</Option>
              <Option value="desc">Mới nhất trước</Option>
            </Select>

            <Button icon={<ReloadOutlined />} onClick={resetFilter}>
              Làm mới
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
