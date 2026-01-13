// src/admin/adminDonHangComponents/invoiceTemplate.js
import beeTopLogo from "../../img/BeeTop2.png";

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

const extractAddressFromNote = (note) => {
  if (!note) return null;
  const txt = String(note).trim();
  if (!txt) return null;

  const lines = txt.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const line =
    lines.find((l) => /^địa\s*chỉ\s*:/i.test(l)) ||
    lines.find((l) => /^dia\s*chi\s*:/i.test(l)) || // ✅ không dấu
    lines.find((l) => /^đc\s*:/i.test(l)) ||
    lines.find((l) => /^\[ship_address\]/i.test(l));

  if (line) {
    return line
      .replace(/^(địa\s*chỉ|dia\s*chi|đc)\s*:\s*/i, "")
      .replace(/^\[ship_address\]\s*/i, "")
      .trim();
  }

  return txt; // ghi chú chỉ có địa chỉ
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

/** ✅ FULL ADDRESS: có field thì dùng, không có thì lấy từ ghi chú */
const buildFullAddress = (order) => {
  const detail = pick(order, ["diaChiChiTiet", "diaChiChiTietGiaoHang", "diaChiChiTietNhanHang", "diaChi"], "");
  const parts = [
    detail,
    pick(order, ["phuongXa", "xaPhuong", "ward"], ""),
    pick(order, ["quanHuyen", "huyenQuan", "district"], ""),
    pick(order, ["tinhThanh", "thanhPho", "province"], ""),
  ].filter(Boolean);

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

  if (uniq.length) return uniq.join(", ");

  // ✅ khách vãng lai -> lấy từ ghi chú
  return extractAddressFromNote(order?.ghiChu) || "-";
};

const buildPaymentMethodsText = (order) => {
  const payments = Array.isArray(order?.payments) ? order.payments : [];
  const namesFromPayments = payments
    .map((p) => p?.tenHinhThuc || p?.hinhThuc || p?.method || p?.paymentMethod)
    .filter(Boolean)
    .map((x) => String(x).trim())
    .filter(Boolean);

  const uniq = [...new Set(namesFromPayments)];
  if (uniq.length) return uniq.join(", ");

  const fallback =
    pick(order, ["tenHinhThuc", "phuongThucThanhToan", "hinhThucThanhToan", "paymentMethodName", "paymentMethod"], "") ||
    "-";
  return fallback;
};

const buildVoucherCodeText = (order) => {
  const list =
    (Array.isArray(order?.vouchers) && order.vouchers) ||
    (Array.isArray(order?.giamGiaHoaDons) && order.giamGiaHoaDons) ||
    (Array.isArray(order?.giamGiaHoaDon) && order.giamGiaHoaDon) ||
    (Array.isArray(order?.voucherUsages) && order.voucherUsages) ||
    [];

  const pickVoucherCodeFromItem = (v) => {
    if (!v) return "";

    const code =
      pick(
        v,
        [
          "idPhieuGiamGia",
          "maPhieuGiamGia",
          "maVoucher",
          "voucherCode",
          "codeVoucher",
          "code",
          "maPhieu",
          "ma",
        ],
        ""
      ) || pick(v?.phieuGiamGia, ["maPhieu", "ma", "code"], "");

    return code;
  };

  if (list.length) {
    const code = pickVoucherCodeFromItem(list[0]);
    if (code) return code;
  }

  const code =
    pick(
      order,
      ["idPhieuGiamGia", "maPhieuGiamGia", "maVoucher", "voucherCode", "codeVoucher"],
      ""
    ) ||
    pick(order?.phieuGiamGia, ["maPhieu", "ma", "code"], "") ||
    pick(order?.voucher, ["code", "ma"], "");

  return code || "-";
};

/** ✅ NEW: build cấu hình gọn kiểu: I5-1334U/24GB/512GB PCIE/14.0 FHD+/WIN11/ĐEN */
const cleanOneLine = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

const normalizeGB = (v) => {
  const s = cleanOneLine(v);
  if (!s) return "";
  const m = s.match(/(\d+(?:\.\d+)?)\s*(GB|TB)/i);
  if (!m) return "";
  return `${m[1]}${m[2].toUpperCase()}`;
};

const normalizeOS = (s) => {
  const t = cleanOneLine(s).toLowerCase();
  if (!t) return "";
  if (t.includes("windows 11") || t.includes("win 11") || t.includes("win11")) return "WIN11";
  if (t.includes("windows 10") || t.includes("win 10") || t.includes("win10")) return "WIN10";
  if (t.includes("macos")) return "MACOS";
  return "";
};

const normalizeColor = (s) => {
  const t = cleanOneLine(s).toLowerCase();
  if (!t) return "";
  if (t.includes("đen") || t.includes("black")) return "ĐEN";
  if (t.includes("trắng") || t.includes("white")) return "TRẮNG";
  if (t.includes("bạc") || t.includes("silver")) return "BẠC";
  if (t.includes("xám") || t.includes("gray") || t.includes("grey")) return "XÁM";
  if (t.includes("đỏ") || t.includes("red")) return "ĐỎ";
  if (t.includes("xanh") || t.includes("blue")) return "XANH";
  return cleanOneLine(s).toUpperCase();
};

const shortCPU = (cpuText) => {
  const t = cleanOneLine(cpuText);
  if (!t) return "";

  const mIntel = t.match(/i\s*([3579])\s*[- ]?\s*(\d{4,5}[a-z0-9]*)/i);
  if (mIntel) return `I${mIntel[1]}-${String(mIntel[2]).toUpperCase()}`;

  const mRyzen = t.match(/ryzen\s*([3579])\s*[- ]?\s*(\d{4,5}[a-z0-9]*)/i);
  if (mRyzen) return `R${mRyzen[1]}-${String(mRyzen[2]).toUpperCase()}`;

  return cleanOneLine(t).toUpperCase();
};

const extractFromPrebuilt = (prebuiltRaw) => {
  const text = cleanOneLine(prebuiltRaw);

  const cpu = shortCPU(text);

  const ramMatch =
    text.match(/ram\s*[:\-]?\s*(\d{1,3})\s*gb/i) ||
    text.match(/(\d{1,3})\s*gb\s*ram/i) ||
    text.match(/(\d{1,3})\s*gb/i);
  const ram = ramMatch ? `${ramMatch[1]}GB` : "";

  let rom = "";
  const romMatch =
    text.match(/(ssd|rom|storage|pcie|nvme)\s*[:\-]?\s*(\d{1,4})\s*gb/i) ||
    text.match(/(\d{1,4})\s*gb\s*(ssd|rom|storage|pcie|nvme)/i);
  if (romMatch) {
    const size = romMatch[2] || romMatch[1];
    rom = `${size}GB`;
  } else {
    const allGb = [...text.matchAll(/(\d{1,4})\s*gb/gi)].map((x) => x[1]);
    if (allGb.length >= 2) rom = `${allGb[1]}GB`;
  }

  const romType = /pcie/i.test(text) ? "PCIE" : /nvme/i.test(text) ? "NVME" : "";
  const romFull = rom ? (romType ? `${rom} ${romType}` : rom) : "";

  let screen = "";
  const sizeM = text.match(/(\d{1,2}(?:\.\d)?)\s*(?:inch|in|")/i);
  const resM = text.match(/\b(FHD\+?|QHD|UHD|2K|4K)\b/i);
  if (sizeM) screen = `${sizeM[1]}${resM ? ` ${resM[1].toUpperCase()}` : ""}`;
  else if (resM) screen = resM[1].toUpperCase();

  const os = normalizeOS(text);
  const color = normalizeColor(text);

  return { cpu, ram, romFull, screen, os, color };
};

const buildConfigText = (it) => {
  const cpuRaw = pick(it, ["cpu", "ten", "cpuName", "viXuLy"], "");
  const ramRaw = pick(it, ["ram", "dungLuongRam", "ramDungLuong", "ramSize"], "");
  const romRaw = pick(it, ["rom", "ssd", "dungLuongRom", "oCung", "storage", "ssdSize"], "");
  const kichThuocRaw = pick(it, ["kichThuoc", "size", "manHinh", "kichThuocMan", "screenSize"], "");
  const osRaw = pick(it, ["heDieuHanh", "os", "operatingSystem", "tenHeDieuHanh"], "");
  const mauRaw = pick(it, ["mauSac", "color", "tenMau", "mau"], "");

  const cpu = shortCPU(cpuRaw);
  const ram = normalizeGB(ramRaw);
  const rom = normalizeGB(romRaw);

  const romType = /pcie/i.test(String(romRaw)) ? "PCIE" : /nvme/i.test(String(romRaw)) ? "NVME" : "";
  const romFull = rom ? (romType ? `${rom} ${romType}` : rom) : "";

  const screenSize = cleanOneLine(kichThuocRaw);
  const resM = screenSize.match(/\b(FHD\+?|QHD|UHD|2K|4K)\b/i);
  const sizeM = screenSize.match(/(\d{1,2}(?:\.\d)?)/);
  const screen = sizeM && sizeM[1] ? `${sizeM[1]}${resM ? ` ${resM[1].toUpperCase()}` : ""}` : "";

  const os = normalizeOS(osRaw);
  const color = normalizeColor(mauRaw);

  const partsFromFields = [cpu, ram, romFull, screen, os, color].filter(Boolean);
  if (partsFromFields.length >= 3) return partsFromFields.join("/");

  const prebuilt = pick(it, ["cauHinh", "configText", "moTaCauHinh"], "");
  if (prebuilt) {
    const { cpu: c, ram: r, romFull: rf, screen: sc, os: o, color: col } = extractFromPrebuilt(prebuilt);
    const parts = [c, r, rf, sc, o, col].filter(Boolean);
    return parts.length ? parts.join("/") : cleanOneLine(prebuilt);
  }

  return "-";
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

/* ✅ FIX UI: table-layout fixed */
.inv-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.inv-table th { background:#f97316; color:#fff; font-size: 11px; padding: 8px; text-align:left; }
.inv-table td { font-size: 11px; padding: 8px; border: 1px solid #e5e7eb; vertical-align: top; word-break: break-word; }
.inv-table th.r, .inv-table td.r { text-align:right; }
.inv-table th.c, .inv-table td.c { text-align:center; }

/* ✅ Cấu hình: 1 dòng gọn như ảnh mẫu */
.inv-cfg{
  font-size: 10.5px;
  line-height: 1.35;
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
  word-break: break-word;
}

.inv-total { margin-top: 10px; width: 100%; }
.inv-total .row { display:flex; justify-content:flex-end; gap: 14px; font-size: 12px; margin: 6px 0; }
.inv-total .lbl { width: 180px; text-align:right; }
.inv-total .val { width: 160px; text-align:right; font-weight: 800; }
.inv-total .val.red { color:#ef4444; }
.inv-total .big { display:flex; justify-content:flex-end; gap: 14px; margin-top: 8px; }
.inv-total .big .lbl { width: 180px; text-align:right; font-weight: 900; }
.inv-total .big .val { width: 160px; text-align:right; font-weight: 1000; font-size: 18px; color:#16a34a; }
.inv-foot { text-align:center; margin-top: 10px; font-size: 10px; color:#6b7280; }
.inv-brand { display:flex; justify-content:center; margin-bottom: 6px; }
.inv-logo { height: 46px; width: auto; object-fit: contain; }
`;

export const buildInvoiceHtml = ({ order, shippingFee }) => {
  const maDonHang = pick(order, ["maDonHang", "ma", "code", "id"], "-");
  const ngayTao = formatDateOnly(pick(order, ["ngayTao", "createdAt", "created_time"], null));

  const tenKhach = pick(order, ["tenKhachHang"], "Khách vãng lai");
  const sdtKhach = pick(order, ["sdtKhachHang"], "-");
  const email = pick(order, ["emailKhachHang"], "Không có");

  // ✅ FIX: biến này giờ luôn có
  const diaChiFull = buildFullAddress(order);

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
            const ten = escapeHtml(pick(it, ["tenSanPham", "ten"], "-"));
            const cauHinh = escapeHtml(buildConfigText(it));
            const serial = escapeHtml(pick(it, ["maSeri", "serial"], "-"));
            const gia = Number(pick(it, ["giaBan", "donGia", "price"], 0)) || 0;

            return `
              <tr>
                <td class="c">${idx + 1}</td>
                <td>${ten}</td>
                <td class="inv-cfg">${cauHinh}</td>
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
      <div class="inv-brand">
        <img class="inv-logo" src="${escapeHtml(beeTopLogo)}" alt="BeeTop" />
      </div>
      <div class="h">HÓA ĐƠN BÁN HÀNG</div>
      <div class="sub"><b>Mã đơn hàng:</b> ${escapeHtml(maDonHang)} &nbsp; | &nbsp; <b>Ngày tạo:</b> ${escapeHtml(
        ngayTao
      )}</div>
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
          <th style="width:190px;">Tên sản phẩm</th>
          <th>Cấu hình</th>
          <th style="width:130px;">Serial</th>
          <th class="r" style="width:120px;">Đơn giá</th>
          <th class="r" style="width:130px;">Thành tiền</th>
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
