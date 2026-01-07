// src/admin/adminDonHangComponents/invoiceTemplate.js

const formatVND = (amount) => {
  const n = Number(amount || 0);
  return `${n.toLocaleString("vi-VN")} đ`;
};

const formatDateOnly = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const escapeHtml = (s) =>
  String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const pick = (obj, keys, fallback = "") => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return fallback;
};

const normalizeLoaiDon = (loaiDon) => {
  const raw = (loaiDon || "").toString().toLowerCase();
  if (raw.includes("giao_hang") || raw.includes("giao hàng") || raw.includes("delivery")) return "GIAO_HANG";
  if (raw.includes("online")) return "ONLINE";
  if (raw.includes("quầy") || raw.includes("tai_quay") || raw.includes("pos")) return "TAI_QUAY";
  return loaiDon || "";
};

const getLoaiDonText = (loaiDon) => {
  const t = normalizeLoaiDon(loaiDon);
  if (t === "ONLINE") return "Đơn hàng online";
  if (t === "GIAO_HANG") return "Bán giao hàng";
  if (t === "TAI_QUAY") return "Bán tại quầy";
  return loaiDon || "-";
};

const buildFullAddress = (order) => {
  const detail = pick(order, ["diaChiChiTiet", "diaChiChiTietGiaoHang", "diaChiChiTietNhanHang", "diaChi"], "");
  const parts = [
    detail,
    pick(order, ["phuongXa", "xaPhuong", "ward"], ""),
    pick(order, ["quanHuyen", "huyenQuan", "district"], ""),
    pick(order, ["tinhThanh", "thanhPho", "province"], ""),
  ].filter(Boolean);

  // remove duplicates while keeping order
  const seen = new Set();
  const uniq = [];
  for (const p of parts) {
    const key = String(p).trim();
    if (!key) continue;
    if (!seen.has(key)) {
      seen.add(key);
      uniq.push(key);
    }
  }

  return uniq.length ? uniq.join(", ") : "-";
};

const buildPaymentMethodsText = (order) => {
  // Ưu tiên payments[]
  const payments = Array.isArray(order?.payments) ? order.payments : [];
  const namesFromPayments = payments
    .map((p) => p?.tenHinhThuc || p?.hinhThuc || p?.method || p?.paymentMethod)
    .filter(Boolean)
    .map((x) => String(x).trim())
    .filter(Boolean);

  const uniq = [...new Set(namesFromPayments)];
  if (uniq.length) return uniq.join(", ");

  // Fallback theo field tổng
  const fallback =
    pick(order, ["tenHinhThuc", "phuongThucThanhToan", "hinhThucThanhToan", "paymentMethodName", "paymentMethod"], "") || "-";
  return fallback;
};

const buildVoucherCodeText = (order) => {
  const code =
    pick(order, ["maPhieuGiamGia", "maVoucher", "voucherCode", "codeVoucher"], "") ||
    pick(order?.phieuGiamGia, ["maPhieu", "ma", "code"], "") ||
    pick(order?.voucher, ["code", "ma"], "") ||
    "-";
  return code;
};

const INVOICE_CSS = `
@page { size: A4; margin: 10mm; }
html, body { padding:0; margin:0; }
* { box-sizing: border-box; }
body { font-family: Arial, Helvetica, sans-serif; color:#111827; background:#fff; }
.inv-wrap { width: 210mm; margin: 0 auto; }
.inv-title { text-align:center; margin-bottom: 10px; }
.inv-title .h { font-size: 18px; font-weight: 900; color:#f97316; }
.inv-title .sub { font-size: 11px; color:#374151; margin-top: 4px; }
.inv-top { display:flex; justify-content: space-between; gap: 10px; }
.inv-box { border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px; flex: 1; }
.inv-box .ttl { font-size: 12px; font-weight: 900; margin-bottom: 6px; }
.inv-line { font-size: 11.5px; line-height: 1.55; }
.inv-line b { font-weight: 800; }
.inv-divider { margin: 10px 0; height: 2px; background: #f97316; border-radius: 2px; opacity:.85; }
.inv-table { width: 100%; border-collapse: collapse; }
.inv-table th { background:#f97316; color:#fff; font-size: 11px; padding: 8px; text-align:left; }
.inv-table td { font-size: 11px; padding: 8px; border: 1px solid #e5e7eb; vertical-align: top; }
.inv-table th.r, .inv-table td.r { text-align:right; }
.inv-table th.c, .inv-table td.c { text-align:center; }
.inv-total { margin-top: 10px; width: 100%; }
.inv-total .row { display:flex; justify-content:flex-end; gap: 14px; font-size: 12px; margin: 6px 0; }
.inv-total .lbl { width: 180px; text-align:right; }
.inv-total .val { width: 160px; text-align:right; font-weight: 800; }
.inv-total .val.red { color:#ef4444; }
.inv-total .big { display:flex; justify-content:flex-end; gap: 14px; margin-top: 8px; }
.inv-total .big .lbl { width: 180px; text-align:right; font-weight: 900; }
.inv-total .big .val { width: 160px; text-align:right; font-weight: 1000; font-size: 18px; color:#16a34a; }
.inv-foot { text-align:center; margin-top: 10px; font-size: 10px; color:#6b7280; }
`;

export const buildInvoiceHtml = ({ order, shippingFee }) => {
  const maDonHang = pick(order, ["maDonHang", "ma", "code", "id"], "-");
  const ngayTao = formatDateOnly(pick(order, ["ngayTao", "createdAt", "created_time"], null));

  const tenKhach = pick(order, ["tenKhachHang"], "Khách vãng lai");
  const sdtKhach = pick(order, ["sdtKhachHang"], "-");
  const email = pick(order, ["emailKhachHang"], "Không có");

  // ✅ FULL: địa chỉ chi tiết + phường/xã + quận/huyện + tỉnh/thành
  const diaChiFull = buildFullAddress(order);

  // ✅ NEW: thông tin đơn hàng bổ sung
  const loaiDonText = getLoaiDonText(pick(order, ["loaiDon"], "-"));
  const paymentMethodsText = buildPaymentMethodsText(order);
  const voucherCodeText = buildVoucherCodeText(order);

  const nhanVien = pick(order, ["tenNhanVien"], "ADMIN");
  const items = Array.isArray(order?.items) ? order.items : [];

  const subtotal = Number(order?.giaTriChuaGiam ?? 0) || 0;
  const discount = Number(order?.giaTriGiamGia ?? 0) || 0;
  const ship = Number(shippingFee ?? 0) || 0;
  const total = Number(order?.tongTienThuHo ?? Math.max(0, subtotal - discount + ship)) || 0;

  const rowsHtml =
    items.length > 0
      ? items
          .map((it, idx) => {
            const maCtsp = escapeHtml(pick(it, ["maCtsp", "maChiTietSanPham", "ctspId", "orderCtId", "id"], "-"));
            const ten = escapeHtml(pick(it, ["tenSanPham", "ten"], "-"));
            const serial = escapeHtml(pick(it, ["maSeri", "serial", "imei"], "-"));
            const gia = Number(pick(it, ["giaBan", "donGia", "price"], 0)) || 0;

            return `
              <tr>
                <td class="c">${idx + 1}</td>
                <td>${maCtsp}</td>
                <td>${ten}</td>
                <td>${serial}</td>
                <td class="r">${escapeHtml(formatVND(gia))}</td>
                <td class="r"><b>${escapeHtml(formatVND(gia))}</b></td>
              </tr>
            `;
          })
          .join("")
      : `<tr><td colspan="6" class="c" style="color:#6b7280;">Không có sản phẩm</td></tr>`;

  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>HoaDon_${escapeHtml(maDonHang)}</title>
  <style>${INVOICE_CSS}</style>
</head>
<body>
  <div class="inv-wrap">
    <div class="inv-title">
      <div class="h">HÓA ĐƠN BÁN HÀNG</div>
      <div class="sub"><b>Mã đơn hàng:</b> ${escapeHtml(maDonHang)} &nbsp; | &nbsp; <b>Ngày tạo:</b> ${escapeHtml(ngayTao)}</div>
    </div>

    <div class="inv-top">
      <div class="inv-box">
        <div class="ttl">Thông tin khách hàng</div>
        <div class="inv-line"><b>Tên:</b> ${escapeHtml(tenKhach)}</div>
        <div class="inv-line"><b>SĐT:</b> ${escapeHtml(sdtKhach)}</div>
        <div class="inv-line"><b>Email:</b> ${escapeHtml(email)}</div>
        <div class="inv-line"><b>Địa chỉ:</b> ${escapeHtml(diaChiFull)}</div>
      </div>

      <div class="inv-box">
        <div class="ttl">Thông tin đơn hàng</div>
        <div class="inv-line"><b>Nhân viên:</b> ${escapeHtml(nhanVien)}</div>
        <div class="inv-line"><b>Loại đơn:</b> ${escapeHtml(loaiDonText)}</div>
        <div class="inv-line"><b>PTTT:</b> ${escapeHtml(paymentMethodsText)}</div>
        <div class="inv-line"><b>Mã PGG:</b> ${escapeHtml(voucherCodeText)}</div>
        <div class="inv-line"><b>Số SP:</b> ${escapeHtml(items.length)}</div>
      </div>
    </div>

    <div class="inv-divider"></div>

    <table class="inv-table">
      <thead>
        <tr>
          <th class="c" style="width:44px;">STT</th>
          <th style="width:140px;">Mã CTSP</th>
          <th>Tên sản phẩm</th>
          <th style="width:150px;">Serial/IMEI</th>
          <th class="r" style="width:140px;">Đơn giá</th>
          <th class="r" style="width:160px;">Thành tiền</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>

    <div class="inv-total">
      <div class="row">
        <div class="lbl">Tổng tiền hàng:</div>
        <div class="val">${escapeHtml(formatVND(subtotal))}</div>
      </div>
      <div class="row">
        <div class="lbl">Giảm giá:</div>
        <div class="val red">- ${escapeHtml(formatVND(discount))}</div>
      </div>
      <div class="row">
        <div class="lbl">Phí vận chuyển:</div>
        <div class="val">${escapeHtml(formatVND(ship))}</div>
      </div>
      <div class="big">
        <div class="lbl">Thành tiền:</div>
        <div class="val">${escapeHtml(formatVND(total))}</div>
      </div>
    </div>

    <div class="inv-foot">Cảm ơn quý khách đã mua hàng!</div>
  </div>
</body>
</html>
`;
};
