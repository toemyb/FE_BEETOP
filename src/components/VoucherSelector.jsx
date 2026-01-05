// src/components/VoucherSelector.jsx
import React, { useEffect, useMemo, useState } from "react";
import { listVouchers } from "../service/PhieuGiamGiaService";

const ModalLayout = ({ title, onClose, children, width = 420 }) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0,0,0,0.45)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
      fontFamily: "Arial, sans-serif",
      padding: 12,
    }}
  >
    <div
      style={{
        width,
        maxWidth: "100%",
        backgroundColor: "#fff",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 12px",
          borderBottom: "1px solid #f1f3f5",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ fontWeight: 800, color: "#212529", fontSize: 15 }}>
          {title}
        </div>
        <button
          onClick={onClose}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "#868e96",
            fontSize: 22,
            lineHeight: 1,
          }}
          aria-label="close"
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: 12, overflowY: "auto" }}>{children}</div>
    </div>
  </div>
);

const SectionTitle = ({ icon, title }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      margin: "10px 0 8px",
      color: "#495057",
      fontWeight: 800,
      fontSize: 13,
    }}
  >
    <span style={{ fontSize: 14 }}>{icon}</span>
    <span>{title}</span>
  </div>
);

const Pill = ({ text }) => (
  <span
    style={{
      fontSize: 11,
      fontWeight: 800,
      padding: "3px 8px",
      borderRadius: 999,
      background: "#d3f9d8",
      color: "#2f9e44",
      whiteSpace: "nowrap",
    }}
  >
    {text}
  </span>
);

// Row giống ảnh: gọn, border mỏng, nút + bên phải
const VoucherRow = ({
  v,
  selected,
  onPick,
  formatCurrency,
  labelGiaTriGiam,
  subtitle,
  rightActionType = "plus", // "plus" | "x"
  disabled = false, // dùng cho gợi ý tiết kiệm chưa đủ điều kiện
  badgeRight, // pill bên phải (vd: lựa chọn tối ưu nhất)
  extraRedLine, // dòng đỏ (mua thêm...)
}) => {
  const primary = "#20c997";

  return (
    <div
      onClick={() => {
        if (disabled) return;
        onPick?.();
      }}
      style={{
        borderRadius: 10,
        padding: "9px 10px",
        border: selected ? `1px solid ${primary}` : "1px solid #e9ecef",
        background: selected ? "#e6fcf5" : "#fff",
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 10,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* line 1: code + pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <div
            style={{
              fontWeight: 900,
              fontSize: 13,
              color: "#212529",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={v.code}
          >
            {v.code}
          </div>

          {badgeRight ? <Pill text={badgeRight} /> : null}
        </div>

        {/* line 2: giảm */}
        <div style={{ marginTop: 4, fontSize: 12, fontWeight: 800, color: "#12b886" }}>
          Giảm {labelGiaTriGiam(v)}
          <span style={{ color: "#868e96", fontWeight: 700 }}>
            {" "}
            ({formatCurrency(v.discount || 0)})
          </span>
        </div>

        {/* red hint line (ảnh có) */}
        {extraRedLine ? (
          <div style={{ marginTop: 4, fontSize: 12, fontWeight: 800, color: "#e03131" }}>
            {extraRedLine}
          </div>
        ) : null}

        {/* subtitle */}
        {subtitle ? (
          <div style={{ marginTop: 4, fontSize: 12, color: "#868e96", fontWeight: 600 }}>
            {subtitle}
          </div>
        ) : null}
      </div>

      {/* right action */}
      {rightActionType === "x" ? (
        selected ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPick?.(true); // allow clear
            }}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "#fa5252",
              fontSize: 20,
              lineHeight: 1,
              padding: 0,
            }}
            title="Bỏ voucher"
            disabled={disabled}
          >
            ×
          </button>
        ) : (
          <div style={{ width: 18 }} />
        )
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (disabled) return;
            onPick?.();
          }}
          style={{
            borderRadius: 999,
            border: "1px solid #dee2e6",
            width: 28,
            height: 28,
            padding: 0,
            background: selected ? "#20c997" : "#fff",
            color: selected ? "#fff" : "#343a40",
            fontWeight: 900,
            fontSize: 16,
            cursor: disabled ? "not-allowed" : "pointer",
          }}
          title={disabled ? "Chưa đủ điều kiện" : selected ? "Đã chọn" : "Chọn voucher"}
          disabled={disabled}
        >
          {selected ? "✓" : "+"}
        </button>
      )}
    </div>
  );
};

const VoucherSelector = ({
  appliedVouchers = [],
  onClose,
  onApplyVouchers,
  orderSummary,
  formatCurrency,
}) => {
  const primaryColor = "#20c997";
  const [rawVouchers, setRawVouchers] = useState([]);
  const [loading, setLoading] = useState(false);

  // chỉ 1 voucher
  const [selectedId, setSelectedId] = useState(appliedVouchers?.[0]?.id || null);

  const subtotal = orderSummary?.subtotal || 0;

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await listVouchers();
        const raw = res?.data?.data ?? res?.data;
        const data = Array.isArray(raw) ? raw : [];
        setRawVouchers(data);
      } catch (e) {
        console.error("Lỗi load danh sách voucher:", e);
        setRawVouchers([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const isDateActive = (v) => {
    const today = new Date();
    const startOk = v.ngayBatDau ? new Date(v.ngayBatDau) <= today : true;
    const endOk = v.ngayKetThuc ? new Date(v.ngayKetThuc) >= today : true;
    return startOk && endOk;
  };

  // tính giảm tạm cho UI (BE vẫn là source of truth khi apply)
  const calcDiscount = (v) => {
    const value = Number(v.giaTriGiam ?? 0) || 0;
    if (!subtotal || subtotal <= 0 || value <= 0) return 0;

    if (v.kieuGiamGia === "GIAM_PHAN_TRAM") {
      const d = (subtotal * value) / 100;
      return d > subtotal ? subtotal : d;
    }
    return value > subtotal ? subtotal : value;
  };

  const labelGiaTriGiam = (v) => {
    const value = Number(v.giaTriGiam ?? 0) || 0;
    if (v.kieuGiamGia === "GIAM_PHAN_TRAM") return `${value}%`;
    return formatCurrency(value);
  };

  // normalize: id = mã voucher string để gửi BE
  const vouchers = useMemo(() => {
    return (rawVouchers || []).map((v) => {
      const codeFromApi =
        v.idPhieugiamgia ||
        v.idPhieuGiamGia ||
        v.maPhieuGiamGia ||
        v.maVoucher ||
        v.code ||
        v.ma;

      const id = String(codeFromApi || v.id || v.uuid || "");
      const code = String(codeFromApi || id || "");

      return {
        ...v,
        id,
        code,
        discount: calcDiscount(v),
      };
    });
  }, [rawVouchers, subtotal]);

  const activeByStatusAndDate = useMemo(
    () => vouchers.filter((v) => v.trangThai === 1 && isDateActive(v)),
    [vouchers]
  );

  const applicable = useMemo(() => {
    return activeByStatusAndDate.filter((v) => {
      const minOrder = Number(v.giaTriMin || 0);
      return minOrder ? subtotal >= minOrder : true;
    });
  }, [activeByStatusAndDate, subtotal]);

  const savingSuggestions = useMemo(() => {
    return activeByStatusAndDate.filter((v) => {
      const minOrder = Number(v.giaTriMin || 0);
      return minOrder && subtotal > 0 && subtotal < minOrder;
    });
  }, [activeByStatusAndDate, subtotal]);

  const bestVoucher = useMemo(() => {
    if (!applicable.length) return null;
    let best = applicable[0];
    applicable.forEach((v) => {
      if ((v.discount || 0) > (best.discount || 0)) best = v;
    });
    return (best.discount || 0) > 0 ? best : null;
  }, [applicable]);

  // auto chọn best nếu chưa chọn
  useEffect(() => {
    if (!bestVoucher) return;
    if (selectedId) return;
    setSelectedId(bestVoucher.id);
  }, [bestVoucher, selectedId]);

  const otherApplicable = bestVoucher
    ? applicable.filter((v) => v.id !== bestVoucher.id)
    : applicable;

  const extraToReachMin = (v) => {
    const minOrder = Number(v.giaTriMin || 0);
    if (!minOrder || subtotal >= minOrder) return 0;
    return minOrder - subtotal;
  };

  const handlePick = (id, allowClear = false) => {
    setSelectedId((prev) => {
      if (prev === id) return allowClear ? null : id;
      return id;
    });
  };

  const handleApply = () => {
    const chosen = vouchers.find((v) => v.id === selectedId);
    onApplyVouchers(chosen ? [chosen] : []);
  };

  const selectedVoucher = vouchers.find((v) => v.id === selectedId);
  const tempTotalDiscount = selectedVoucher?.discount || 0;

  const formatDateVi = (d) => {
    if (!d) return "";
    try {
      return new Date(d).toLocaleDateString("vi-VN");
    } catch {
      return "";
    }
  };

  return (
    <ModalLayout title="Voucher giảm giá" onClose={onClose} width={420}>
      {/* header small like image */}
      <div
        style={{
          padding: "10px 10px",
          borderRadius: 10,
          background: "#f8f9fa",
          border: "1px solid #edf2ff",
          marginBottom: 10,
          fontSize: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ color: "#495057", fontWeight: 700 }}>
          Tạm tính
        </span>
        <span style={{ fontWeight: 900, color: "#212529" }}>
          {formatCurrency(subtotal)}
        </span>
      </div>

      {/* Voucher tự động áp dụng */}
      <SectionTitle icon="✨" title="Voucher tự động áp dụng" />
      {loading ? (
        <div style={{ padding: 10, borderRadius: 10, background: "#f8f9fa", color: "#868e96", fontSize: 12 }}>
          Đang tải voucher...
        </div>
      ) : bestVoucher ? (
        <VoucherRow
          v={bestVoucher}
          selected={selectedId === bestVoucher.id}
          onPick={(allowClear) => handlePick(bestVoucher.id, allowClear)}
          rightActionType="x"
          formatCurrency={formatCurrency}
          labelGiaTriGiam={labelGiaTriGiam}
          badgeRight="Lựa chọn tối ưu nhất"
          subtitle={
            <>
              {bestVoucher.giaTriMin ? <>Đơn tối thiểu: {formatCurrency(Number(bestVoucher.giaTriMin))}</> : <>Đơn tối thiểu: 0 ₫</>}
              {bestVoucher.ngayKetThuc ? <> • Hết hạn: {formatDateVi(bestVoucher.ngayKetThuc)}</> : null}
            </>
          }
        />
      ) : (
        <div style={{ padding: 10, borderRadius: 10, background: "#f8f9fa", color: "#868e96", fontSize: 12 }}>
          Không có voucher phù hợp để tự động áp dụng.
        </div>
      )}

      {/* Voucher khả dụng */}
      <SectionTitle icon="🧾" title="Voucher khả dụng" />
      {loading ? (
        <div style={{ padding: 10, borderRadius: 10, background: "#f8f9fa", color: "#868e96", fontSize: 12 }}>
          Đang tải voucher...
        </div>
      ) : !otherApplicable.length ? (
        <div style={{ padding: 10, borderRadius: 10, background: "#f8f9fa", color: "#868e96", fontSize: 12 }}>
          Không có voucher khả dụng.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {otherApplicable.map((v) => (
            <VoucherRow
              key={v.id}
              v={v}
              selected={selectedId === v.id}
              onPick={() => handlePick(v.id)}
              rightActionType="plus"
              formatCurrency={formatCurrency}
              labelGiaTriGiam={labelGiaTriGiam}
              subtitle={
                <>
                  {v.giaTriMin ? <>Đơn tối thiểu: {formatCurrency(Number(v.giaTriMin))}</> : <>Đơn tối thiểu: 0 ₫</>}
                  {v.ngayKetThuc ? <> • Hết hạn: {formatDateVi(v.ngayKetThuc)}</> : null}
                </>
              }
            />
          ))}
        </div>
      )}

      {/* Gợi ý tiết kiệm */}
      <SectionTitle icon="💡" title="Gợi ý tiết kiệm" />
      {loading ? (
        <div style={{ padding: 10, borderRadius: 10, background: "#f8f9fa", color: "#868e96", fontSize: 12 }}>
          Đang tải voucher...
        </div>
      ) : !savingSuggestions.length ? (
        <div style={{ padding: 10, borderRadius: 10, background: "#f8f9fa", color: "#868e96", fontSize: 12 }}>
          Chưa có gợi ý tiết kiệm phù hợp.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {savingSuggestions.map((v) => {
            const extra = extraToReachMin(v);
            return (
              <VoucherRow
                key={v.id}
                v={v}
                selected={false}
                onPick={() => {}}
                rightActionType="plus"
                disabled={true} // giống ảnh: gợi ý -> không pick được khi chưa đủ min
                formatCurrency={formatCurrency}
                labelGiaTriGiam={labelGiaTriGiam}
                extraRedLine={
                  extra > 0
                    ? `Mua thêm ${formatCurrency(extra)} để được giảm ${labelGiaTriGiam(v)}`
                    : null
                }
                subtitle={
                  <>
                    Đơn tối thiểu: {formatCurrency(Number(v.giaTriMin || 0))}
                    {v.ngayKetThuc ? <> • Hết hạn: {formatDateVi(v.ngayKetThuc)}</> : null}
                  </>
                }
              />
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop: "1px solid #f1f3f5", marginTop: 12, paddingTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 13 }}>
          <span style={{ fontWeight: 900, color: "#212529" }}>Tổng giảm tạm tính</span>
          <span style={{ fontWeight: 900, color: "#e03131" }}>
            {formatCurrency(tempTotalDiscount)}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 14px",
              borderRadius: 10,
              border: "1px solid #dee2e6",
              background: "#fff",
              cursor: "pointer",
              color: "#495057",
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            Hủy
          </button>
          <button
            onClick={handleApply}
            disabled={!selectedId}
            style={{
              padding: "9px 16px",
              borderRadius: 10,
              border: "none",
              backgroundColor: primaryColor,
              color: "#fff",
              cursor: selectedId ? "pointer" : "not-allowed",
              fontWeight: 900,
              fontSize: 13,
              opacity: selectedId ? 1 : 0.6,
              minWidth: 120,
            }}
          >
            Áp dụng
          </button>
        </div>
      </div>
    </ModalLayout>
  );
};

export default VoucherSelector;
