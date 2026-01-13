import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Modal } from "antd";

import ProductSelector from '../../components/ProductSelector.jsx';
import CustomerSelector from '../../components/CustomerSelector.jsx';
import ConfirmationModal from '../../components/ConfirmationModal.jsx';
import VoucherSelector from '../../components/VoucherSelector.jsx';
import userService from '../../service/userService';
import QrScannerModal from '../../components/QrScannerModal.jsx';
import {
  getOrderDetail,
  addItemsToOrder,
  removeItemFromOrder,
  selectCustomerForOrder,
  applyVoucherForOrder,
  addPaymentToOrder,
  completeOrder,
  cancelOrder,
  unwrapApi,
  startVnpayPayment,
  startMomoPayment,
  addItemsBySeriCode,
  clearVoucherForOrder,
  updateShipping,
  ghnGetProvinces,
  ghnGetDistricts,
  ghnGetWards,
} from '../../service/PosOrderService';
import { listPaymentMethods } from '../../service/HinhThucThanhToanService';
// THÊM import này nếu chưa có (cho getSeriByIdSeri)




const formatCurrencyDefault = (amount) => {
  if (typeof amount !== 'number') return '0 ₫';
  return amount.toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
  });
};
const PAYMENT = {
  CASH: 'CASH',
  VNPAY: 'VNPAY',
  MOMO: 'MOMO',
};
const paymentOptions = [
  { value: PAYMENT.CASH, title: 'Tiền mặt', desc: 'Thanh toán bằng tiền mặt tại quầy' },
  { value: PAYMENT.VNPAY, title: 'VNPay', desc: 'Thanh toán qua ví và QR VNPay' },
  { value: PAYMENT.MOMO, title: 'MoMo', desc: 'Thanh toán qua ví điện tử MoMo' },
];

// ✅ Modal nhắc nhở / confirm ở giữa màn hình


const InvoiceWorkingArea = ({
  invoice,
  updateInvoice,
  onConfirmOrder,
  showNotification,
  formatCurrency: formatCurrencyProp,
}) => {
  const orderId = invoice?.orderId;

  const notify = showNotification || (() => { });
  const confirmAction = ({
  title,
  content,
  okText = "Xác nhận",
  cancelText = "Hủy",
  danger = false,
  onOk,
}) => {
  Modal.confirm({
    title,
    content,
    centered: true,
    okText,
    cancelText,
    okButtonProps: danger ? { danger: true } : undefined,
    onOk,
  });
};
  const formatCurrency = formatCurrencyProp || formatCurrencyDefault;

  // Giỏ hàng hiển thị trên FE
  const [cartItems, setCartItems] = useState([]);
  // Voucher đang áp dụng (theo đơn)
  const [appliedVouchers, setAppliedVouchers] = useState([]);

  // Modals
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showVoucherSelector, setShowVoucherSelector] = useState(false);
  const [useInsurance, setUseInsurance] = useState(false); // default = false đúng builder const GHN_USE_INSURANCE_VALUE=false
  // Modal nhắc nhở chung


  // Khách hàng
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  //GHN
  const [giaoHang, setGiaoHang] = useState(false);

  // ✅ THÊM: state lưu địa chỉ (chỉ lưu khi user bấm nút)
  const [saveAddress, setSaveAddress] = useState(false);
  const [setAsDefault, setSetAsDefault] = useState(false);

  // ✅ FIX: ref để tránh reset district/ward ngay sau khi sync từ BE
  const skipResetProvinceRef = useRef(false);
  const skipResetDistrictRef = useRef(false);

  const [shipForm, setShipForm] = useState({
    hoTen: '',
    soDienThoai: '',
    diaChiChiTiet: '',
    quocGia: 'Việt Nam',
    tinhThanh: '',
    quanHuyen: '',
    phuongXa: '',
    provinceId: null,
    districtId: null,
    wardCode: '',
  });

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  const [shippingFee, setShippingFee] = useState(0);
  const [shippingLoading, setShippingLoading] = useState(false);

  // ✅ FIX: chống spam call + spam notify khi tính phí ship
  const shipTimerRef = useRef(null);
  const lastFeeRef = useRef(null);
  const lastShipCalcKeyRef = useRef(null);
  // POS Order
  const [orderDetail, setOrderDetail] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(false);

  // ✅ FIX: Tổng tiền từ BE (dùng null để phân biệt "chưa có" vs "0")
  const [posTotals, setPosTotals] = useState({
    giaTriChuaGiam: null,
    giaTriGiamGia: null,
    tongTienThuHo: null,
  });

  // Hình thức thanh toán
  const [paymentMethods, setPaymentMethods] = useState([]);

  // ===== LOAD KHÁCH HÀNG =====
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoadingCustomers(true);
        const data = await userService.getUsersByRole('R003'); // khách hàng
        setCustomers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Lỗi load danh sách khách hàng:', err);
        notify('error', 'Lỗi tải danh sách khách hàng.');
      } finally {
        setLoadingCustomers(false);
      }
    };
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== LOAD HÌNH THỨC THANH TOÁN =====
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const res = await listPaymentMethods();
        const raw = unwrapApi(res);
        setPaymentMethods(Array.isArray(raw) ? raw : []);
      } catch (err) {
        console.error('Lỗi load hình thức thanh toán:', err);
        notify('error', 'Lỗi tải danh sách hình thức thanh toán.');
      }
    };
    fetchPaymentMethods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== SYNC PosOrderDetailDTO -> FE =====
  const syncFromOrder = (data) => {
    if (!data) {
      setOrderDetail(null);
      setCartItems([]);
      setPosTotals({
        giaTriChuaGiam: null,
        giaTriGiamGia: null,
        tongTienThuHo: null,
      });
      return;
    }

    setOrderDetail(data);
    setShippingFee(Number(data.phiVanChuyen || 0));
    lastFeeRef.current = Number(data?.phiVanChuyen || 0); // ✅ THÊM
    // ✅ FIX: đánh dấu để các effect province/district KHÔNG reset ngay sau khi sync
    skipResetProvinceRef.current = true;
    skipResetDistrictRef.current = true;

    setShipForm((prev) => ({
      ...prev,
      hoTen: data.hoTen || data.tenNguoiNhan || data.tenKhachHang || prev.hoTen,
      soDienThoai: data.soDienThoai || data.sdtNguoiNhan || data.sdtKhachHang || prev.soDienThoai,

      diaChiChiTiet: data.diaChiChiTiet || prev.diaChiChiTiet,
      quocGia: data.quocGia || prev.quocGia,
      tinhThanh: data.tinhThanh || prev.tinhThanh,
      quanHuyen: data.quanHuyen || prev.quanHuyen,
      phuongXa: data.phuongXa || prev.phuongXa,

      provinceId: data.provinceId ?? prev.provinceId,
      districtId: data.districtId ?? prev.districtId,
      wardCode: data.wardCode ?? prev.wardCode,
    }));

    // nếu order đang là giao hàng thì bật toggle
    setGiaoHang(data.loaiDon === 'GIAO_HANG');

    // ✅ FIX: giữ null nếu BE không trả, tránh falsy 0 làm sai logic tổng kết
    setPosTotals({
      giaTriChuaGiam: data.giaTriChuaGiam ?? null,
      giaTriGiamGia: data.giaTriGiamGia ?? null,
      tongTienThuHo: data.tongTienThuHo ?? null,
    });

    // Build giỏ hàng từ items (List<PosOrderItemDTO>)
    if (Array.isArray(data.items)) {
      const groups = {};
      console.log("POS items:", data.items);
      data.items.forEach((it) => {
        const key = it.laptopCtId || it.laptopId || it.seriId || it.orderCtId;

        if (!groups[key]) {
          groups[key] = {
            idLaptopCt: key,
            name: it.tenSanPham || 'Sản phẩm',
            version: it.cauHinh || '',
            imageUrl:
              it.anhUrl ||
              it.anh ||
              it.hinhAnh ||
              it.imageUrl ||
              it.image ||
              null,
            serials: [], // mảng string
            orderCtIds: [], // mảng UUID tương ứng từng seri
            quantity: 0,
            currentPrice: Number(it.giaBan || 0),
            originalPrice: Number(it.giaBan || 0),
          };
        } else {
          // ✅ nếu group đang chưa có ảnh mà item mới có ảnh thì cập nhật
          if (!groups[key].imageUrl && it.anhUrl) {
            groups[key].imageUrl = it.anhUrl;
          }
        }

        const seriCode = it.maSeri || '';
        groups[key].serials.push(seriCode);
        groups[key].orderCtIds.push(it.orderCtId);
        groups[key].quantity += 1;
      });

      const newCart = Object.values(groups);
      setCartItems(newCart);

      const totalQty = newCart.reduce(
        (sum, item) => sum + (item.quantity || 1),
        0
      );

      updateInvoice({
        itemCount: totalQty,
        maDonHang: data.maDonHang,
        orderStatus: data.trangThai,
      });
    } else {
      setCartItems([]);
      updateInvoice({
        itemCount: 0,
        maDonHang: data.maDonHang,
        orderStatus: data.trangThai,
      });
    }

    // 🔧 Sync voucher đang áp dụng trên đơn (List<PosVoucherDTO>)
    if (Array.isArray(data.vouchers)) {
      const vList = data.vouchers.map((v) => {
        // BE PosVoucherDTO: idPhieuGiamGia là mã voucher (PGG001...)
        const codeFromDto =
          v.idPhieuGiamGia ||
          v.idPhieugiamgia ||
          v.idPhieugiamgia;

        const uuid =
          codeFromDto ||
          v.id ||
          v.uuid ||
          v.idVoucher;

        const code =
          codeFromDto ||
          v.ma ||
          v.maPhieu ||
          v.maPhieuGiamGia ||
          v.maVoucher ||
          v.code ||
          uuid;

        return {
          id: uuid,
          code,
          name: v.ten || v.name || code,
          kieuGiamGia: v.kieuGiamGia,
          discount: Number(v.giaTriGiam || 0),
          giaTriMin: Number(v.giaTriMin || 0),
          trangThai: v.trangThai,
        };
      });
      setAppliedVouchers(vList);
    } else {
      setAppliedVouchers([]);
    }

    // Nếu invoice hiện chưa có customer nhưng OrderDetail có tên/sđt thì hiển thị
    if (!invoice.customer && (data.tenKhachHang || data.sdtKhachHang)) {
      const normalized = {
        id: null,
        idTaiKhoan: null,
        ten: data.tenKhachHang,
        name: data.tenKhachHang,
        soDienThoai: data.sdtKhachHang,
        phone: data.sdtKhachHang,
      };
      updateInvoice({ customer: normalized });
    }
  };

  const refreshOrderFromServer = async () => {
    if (!orderId) return;
    try {
      setLoadingOrder(true);
      const res = await getOrderDetail(orderId);
      const data = unwrapApi(res); // PosOrderDetailDTO
      syncFromOrder(data);
    } catch (err) {
      console.error('Lỗi load chi tiết đơn hàng:', err);
      notify('error', 'Không thể tải chi tiết đơn hàng.');
    } finally {
      setLoadingOrder(false);
    }
  };

  useEffect(() => {
    refreshOrderFromServer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // ✅ FIX: luôn lấy tổng tiền MỚI NHẤT từ BE trước khi thu tiền / complete (chặn lệch ship/voucher)
  const getLatestOrderFromServer = async () => {
    if (!orderId) return null;
    const res = await getOrderDetail(orderId);
    return unwrapApi(res);
  };

  // ===== GỢI Ý KHÁCH HÀNG =====
  const customerSuggestions = useMemo(() => {
    const keyword = customerSearch.trim().toLowerCase();
    if (!keyword) return [];
    return customers
      .filter((c) => {
        const name = (c.ten || '').toLowerCase();
        const phone = c.soDienThoai || '';
        return (
          name.includes(keyword) || phone.includes(customerSearch.trim())
        );
      })
      .slice(0, 5);
  }, [customers, customerSearch]);

  // Tổng số lượng SP
  const totalCartQuantity = useMemo(
    () => cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0),
    [cartItems]
  );

  //GHN
  useEffect(() => {
    if (!giaoHang) return;

    (async () => {
      try {
        const res = await ghnGetProvinces();
        const raw = unwrapApi(res) || res?.data?.data || res?.data;
        // GHN thường trả: {data:[...]}
        const list = raw?.data || raw || [];
        setProvinces(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error(e);
        notify('error', 'Không tải được danh sách tỉnh/thành (GHN).');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [giaoHang]);

  useEffect(() => {
    if (!giaoHang) return;
    if (!shipForm.provinceId) {
      setDistricts([]);
      setWards([]);
      return;
    }

    (async () => {
      try {
        const res = await ghnGetDistricts(shipForm.provinceId);
        const raw = unwrapApi(res) || res?.data?.data || res?.data;
        const list = raw?.data || raw || [];
        setDistricts(Array.isArray(list) ? list : []);
        setWards([]);

        // ✅ FIX: chỉ reset khi USER đổi tỉnh, không reset ngay sau syncFromOrder
        if (skipResetProvinceRef.current) {
          skipResetProvinceRef.current = false;
        } else {
          setShipForm((p) => ({ ...p, districtId: null, wardCode: '', quanHuyen: '', phuongXa: '' }));
        }
      } catch (e) {
        console.error(e);
        notify('error', 'Không tải được danh sách quận/huyện (GHN).');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [giaoHang, shipForm.provinceId]);

  useEffect(() => {
    if (!giaoHang) return;
    if (!shipForm.districtId) {
      setWards([]);
      return;
    }

    (async () => {
      try {
        const res = await ghnGetWards(shipForm.districtId);
        const raw = unwrapApi(res) || res?.data?.data || res?.data;
        const list = raw?.data || raw || [];
        setWards(Array.isArray(list) ? list : []);

        // ✅ FIX: chỉ reset khi USER đổi huyện, không reset ngay sau syncFromOrder
        if (skipResetDistrictRef.current) {
          skipResetDistrictRef.current = false;
        } else {
          setShipForm((p) => ({ ...p, wardCode: '', phuongXa: '' }));
        }
      } catch (e) {
        console.error(e);
        notify('error', 'Không tải được danh sách phường/xã (GHN).');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [giaoHang, shipForm.districtId]);

  // ✅ FIX: debounce + chống spam notify khi tính phí
  const shipCalcKey = useMemo(() => {
    if (!giaoHang || !orderId) return null;
    if (!shipForm.districtId || !shipForm.wardCode) return null;

    const subtotal = posTotals.giaTriChuaGiam ?? orderDetail?.giaTriChuaGiam ?? null;
    const addrKey = `${shipForm.provinceId || ""}|${shipForm.districtId || ""}|${shipForm.wardCode || ""}|${(shipForm.diaChiChiTiet || "").trim()}`;


    return `${orderId}|${addrKey}|sub=${subtotal ?? "na"}|ins=${useInsurance ? 1 : 0}`;
  }, [
    giaoHang,
    orderId,
    shipForm.provinceId,
    shipForm.districtId,
    shipForm.wardCode,
    shipForm.diaChiChiTiet,
    posTotals.giaTriChuaGiam,
    orderDetail?.giaTriChuaGiam,
    useInsurance,
  ]);

  useEffect(() => {
    if (!shipCalcKey) return;

    // ✅ chống lặp vô hạn: key không đổi thì không call lại
    if (lastShipCalcKeyRef.current === shipCalcKey) return;

    if (shipTimerRef.current) clearTimeout(shipTimerRef.current);

    shipTimerRef.current = setTimeout(async () => {
      try {
        setShippingLoading(true);

        const payload = {
          giaoHang: true,
          hoTen: shipForm.hoTen,
          soDienThoai: shipForm.soDienThoai,
          diaChiChiTiet: shipForm.diaChiChiTiet,
          quocGia: shipForm.quocGia || "Việt Nam",
          tinhThanh: shipForm.tinhThanh,
          quanHuyen: shipForm.quanHuyen,
          phuongXa: shipForm.phuongXa,
          provinceId: shipForm.provinceId,
          districtId: shipForm.districtId,
          wardCode: shipForm.wardCode,

          saveAddress: false,
          setAsDefault: false,
          useInsurance: !!useInsurance,
        };


        const res = await updateShipping(orderId, payload);
        const data = unwrapApi(res);
        syncFromOrder(data);

        // ✅ đánh dấu đã tính cho key này
        lastShipCalcKeyRef.current = shipCalcKey;

        const feeNow = Number(data?.phiVanChuyen || 0);
        if (lastFeeRef.current !== feeNow) {
          lastFeeRef.current = feeNow;
          notify("success", `Phí vận chuyển (GHN): ${feeNow.toLocaleString("vi-VN")} ₫`);
        }
      } catch (e) {
        // ✅ tránh spam call nếu BE lỗi liên tục
        lastShipCalcKeyRef.current = shipCalcKey;
        console.error(e);
        const msg = e?.response?.data?.message || "Tính phí vận chuyển thất bại.";
        if (msg.toLowerCase().includes("thêm sản phẩm")) {
          notify("warning", msg);
        } else {
          notify("error", msg);
        }
      } finally {
        setShippingLoading(false);
      }
    }, 350);

    return () => {
      if (shipTimerRef.current) clearTimeout(shipTimerRef.current);
    };
  }, [shipCalcKey]);

  // ===== TỔNG KẾT ĐƠN HÀNG (ưu tiên số từ BE) =====
  const orderSummary = useMemo(() => {
    // ✅ FIX: không dùng "||" vì 0 là falsy -> dễ sai tổng
    const hasGiaTriChuaGiam =
      posTotals.giaTriChuaGiam !== null && posTotals.giaTriChuaGiam !== undefined;

    const hasGiaTriGiamGia =
      posTotals.giaTriGiamGia !== null && posTotals.giaTriGiamGia !== undefined;

    const subtotal = hasGiaTriChuaGiam
      ? Number(posTotals.giaTriChuaGiam || 0)
      : cartItems.reduce(
        (sum, item) => sum + (item.currentPrice || 0) * (item.quantity || 1),
        0
      );

    const totalDiscount = hasGiaTriGiamGia
      ? Number(posTotals.giaTriGiamGia || 0)
      : appliedVouchers.reduce(
        (sum, voucher) => sum + (voucher.discount || 0),
        0
      );

    const hasTongTienThuHo =
      posTotals.tongTienThuHo !== null && posTotals.tongTienThuHo !== undefined;

    const total = hasTongTienThuHo
      ? Number(posTotals.tongTienThuHo || 0)
      : Math.max(
        0,
        (Number(subtotal) || 0) -
        (Number(totalDiscount) || 0) +
        Number(orderDetail?.phiVanChuyen || 0)
      );

    const totalNum = Number(total) || 0;
    const change =
      (invoice.customerCash || 0) > totalNum
        ? (invoice.customerCash || 0) - totalNum
        : 0;

    return {
      subtotal: Number(subtotal) || 0,
      totalDiscount: Number(totalDiscount) || 0,
      total: totalNum,
      change,
    };
  }, [cartItems, appliedVouchers, invoice.customerCash, posTotals, orderDetail?.phiVanChuyen]);

  // ===== SẢN PHẨM (seri) =====
  const handleAddProducts = async (selectedSerialItems) => {
    if (!orderId) {
      notify('warning', 'Chưa có đơn hàng, vui lòng tạo đơn trước.');
      return;
    }

    const seriIds =
      (selectedSerialItems || [])
        .map((item) => item.seriId || item.idSeri || item.id)
        .filter(Boolean);

    if (!seriIds.length) return;

    try {
      await addItemsToOrder(orderId, seriIds);
      await refreshOrderFromServer();
      setShowProductSelector(false);
      notify('success', 'Đã thêm sản phẩm vào đơn hàng.');
    } catch (err) {
      console.error('Lỗi thêm seri vào đơn hàng:', err);
      notify(
        'error',
        err?.response?.data?.message ||
        'Không thể thêm sản phẩm vào đơn, vui lòng thử lại!'
      );
    }
  };

  const [showQrScanner, setShowQrScanner] = useState(false);
  const handleScanQr = async (decodedText) => {
    if (!orderId) {
      notify('warning', 'Chưa có đơn hàng, vui lòng tạo đơn trước.');
      return;
    }

    const seriCode = decodedText?.trim().toUpperCase();
    if (!seriCode) {
      notify('error', 'Mã QR không hợp lệ.');
      return;
    }

    try {
      await addItemsBySeriCode(orderId, [seriCode]);
      await refreshOrderFromServer();
      notify('success', `Đã thêm seri: ${seriCode}`);

      // TỰ ĐỘNG ĐÓNG MODAL SAU KHI THÀNH CÔNG (QrScannerModal cũng tự đóng)
      setShowQrScanner(false);

    } catch (err) {
      const msg = err?.response?.data?.message || 'Seri không hợp lệ hoặc đã bán!';
      notify('error', msg);
      // Không đóng modal → cho phép quét lại nếu sai
    }
  };

  // Xóa toàn bộ seri của một phiên bản sản phẩm
  const handleRemoveItem = (idLaptopCt) => {
    if (!orderId) return;
    const group = cartItems.find((item) => item.idLaptopCt === idLaptopCt);
    if (!group || !group.orderCtIds?.length) return;

    confirmAction({
  title: "Xóa sản phẩm khỏi đơn",
  content: "Bạn có chắc muốn xóa toàn bộ phiên bản sản phẩm này khỏi đơn hàng?",
  okText: "Xóa",
  danger: true,
  onOk: async () => {
        try {
          const uniqueIds = Array.from(new Set(group.orderCtIds.filter(Boolean)));

          await Promise.all(
            uniqueIds.map((orderCtId) => removeItemFromOrder(orderId, orderCtId))
          );

          await refreshOrderFromServer();
          notify('success', 'Đã xóa sản phẩm khỏi đơn hàng.');
        } catch (err) {
          console.error('Lỗi xóa sản phẩm khỏi đơn hàng:', err);
          notify('error', err?.response?.data?.message || 'Không thể xóa sản phẩm khỏi đơn, vui lòng thử lại!');
        }
      },
    });
  };

  // Xóa từng seri
  const handleRemoveSerial = (orderCtId, seriCode) => {
    if (!orderId || !orderCtId) return;

    confirmAction({
  title: "Xóa seri khỏi đơn",
  content: `Xóa seri ${seriCode} khỏi đơn hàng?`,
  okText: "Xóa",
  danger: true,
  onOk: async () => {
        try {
          await removeItemFromOrder(orderId, orderCtId);
          await refreshOrderFromServer();
          notify('success', `Đã xóa seri ${seriCode} khỏi đơn hàng.`);
        } catch (err) {
          const msg = err?.response?.data?.message || '';
          console.error('Lỗi xóa seri khỏi đơn hàng:', err);

          // ✅ nếu BE báo không tìm thấy, coi như đã xoá rồi
          if (msg.includes('Không tìm thấy OrderCT')) {
            await refreshOrderFromServer();
            notify('success', `Seri ${seriCode} đã được xoá (cập nhật lại).`);
            return;
          }

          notify('error', msg || 'Không thể xóa seri khỏi đơn, vui lòng thử lại!');
        }
      },
    });
  };

  // ===== HỦY ĐƠN =====
  const handleCancelInvoice = () => {
    if (!orderId) return;

    confirmAction({
  title: "Huỷ đơn hàng",
  content: "Huỷ toàn bộ đơn hàng này?",
  okText: "Huỷ đơn",
  danger: true,
  onOk: async () => {
        try {
          await cancelOrder(orderId);
          notify('success', 'Đã huỷ đơn hàng.');
          onConfirmOrder();
        } catch (err) {
          console.error('Lỗi huỷ đơn hàng:', err);
          notify(
            'error',
            err?.response?.data?.message ||
            'Không thể huỷ đơn hàng, vui lòng thử lại!'
          );
        }
      },
    });
  };

  // ===== CHỌN KHÁCH HÀNG CHO ĐƠN =====
  const attachCustomerToOrder = async (customerObjOrNull) => {
    if (!orderId) return;
    try {
      await selectCustomerForOrder(orderId, {
        idTaiKhoan:
          customerObjOrNull?.idTaiKhoan || customerObjOrNull?.id || null,
        idDiaChi: null,
        tenKhachHang:
          customerObjOrNull?.ten || customerObjOrNull?.name || null,
        sdtKhachHang:
          customerObjOrNull?.soDienThoai ||
          customerObjOrNull?.phone ||
          null,
      });
      await refreshOrderFromServer();
      notify('success', 'Đã cập nhật khách hàng cho đơn.');
    } catch (err) {
      console.error('Lỗi cập nhật khách hàng cho đơn hàng:', err);
      notify('error', 'Không thể cập nhật khách hàng cho đơn.');
    }
  };

  // ===== VOUCHER =====
  const handleApplyVouchers = async (list) => {
    const chosen = Array.isArray(list) ? list[0] : null;
    const voucherId = chosen?.id ? String(chosen.id) : "";

    // Update UI trước
    setAppliedVouchers(chosen ? [chosen] : []);
    updateInvoice({ voucherId: voucherId || null });

    if (!orderId) {
      setShowVoucherSelector(false);
      return;
    }

    try {
      // ✅ Nếu bỏ voucher => clear trên BE
      if (!voucherId) {
        await clearVoucherForOrder(orderId);
        await refreshOrderFromServer();
        notify("success", "Đã bỏ voucher.");
        return;
      }

      // ✅ Apply voucher
      await applyVoucherForOrder(orderId, voucherId);
      await refreshOrderFromServer();
      notify("success", "Đã áp dụng voucher cho đơn hàng.");
    } catch (err) {
      console.error("Lỗi áp dụng/clear voucher:", err);
      notify(
        "error",
        err?.response?.data?.message || "Không thể áp dụng voucher, vui lòng thử lại!"
      );

      // (tuỳ chọn) nếu muốn rollback UI khi lỗi:
      // await refreshOrderFromServer();
    } finally {
      setShowVoucherSelector(false);
    }
  };


  // ===== THANH TOÁN =====
  const getCurrentPaymentMethodEntity = () => {
    if (!paymentMethods.length || !invoice.paymentMethod) return null;

    const code = String(invoice.paymentMethod).toUpperCase().trim(); // CASH/VNPAY/MOMO

    // Ưu tiên match theo code nếu BE có field code/maHinhThuc
    let method =
      paymentMethods.find((m) => {
        const mCode = String(m.maHinhThuc || m.code || '').toUpperCase().trim();
        return mCode && mCode === code;
      }) || null;

    // Fallback: match theo tên hình thức (nhiều dự án lưu tenHinhThuc = CASH/VNPAY/MOMO)
    if (!method) {
      method =
        paymentMethods.find((m) => {
          const name = String(m.tenHinhThuc || m.ten || m.name || '')
            .toUpperCase()
            .trim();
          return name === code;
        }) || null;
    }

    // Fallback cuối: contains
    if (!method) {
      method =
        paymentMethods.find((m) => {
          const name = String(m.tenHinhThuc || m.ten || m.name || '')
            .toUpperCase()
            .trim();
          return name.includes(code);
        }) || null;
    }

    return method;
  };

  const handleCheckout = () => {
    if (!cartItems.length) {
      notify('warning', 'Vui lòng chọn ít nhất một sản phẩm.');
      return;
    }

    // ✅ FIX: đang tính ship thì không cho thanh toán để tránh lệch tổng
    if (shippingLoading) {
      notify('info', 'Đang tính phí vận chuyển, vui lòng chờ xong rồi thanh toán.');
      return;
    }

    // ✅ FIX: nếu giao hàng mà chưa đủ district/ward thì chặn (tránh tổng ship chưa đúng)
    if (giaoHang && (!shipForm.districtId || !shipForm.wardCode)) {
      notify('warning', 'Vui lòng chọn Quận/Huyện và Phường/Xã để tính phí vận chuyển trước khi thanh toán.');
      return;
    }

    if (orderSummary.total <= 0) {
      notify('warning', 'Tổng tiền phải lớn hơn 0.');
      return;
    }
    if (
      invoice.paymentMethod === PAYMENT.CASH &&
      (invoice.customerCash || 0) < orderSummary.total
    ) {
      notify('warning', 'Số tiền khách đưa chưa đủ để thanh toán.');
      return;
    }
    setShowConfirmation(true);
  };

  const isPayDisabled =
    shippingLoading ||
    orderSummary.total === 0 ||
    (giaoHang && (!shipForm.districtId || !shipForm.wardCode)) ||
    (invoice.paymentMethod === PAYMENT.CASH && (invoice.customerCash || 0) < orderSummary.total)

  const handleConfirmPayment = async () => {
    if (!orderId) return;

    try {
      // ✅ FIX: dừng debounce ship để tránh update ship sau khi bấm thanh toán
      if (shipTimerRef.current) {
        clearTimeout(shipTimerRef.current);
        shipTimerRef.current = null;
      }

      // ✅ FIX: LẤY ORDER MỚI NHẤT từ BE để dùng "tongTienThuHo" chính xác
      const latest = await getLatestOrderFromServer();
      if (latest) {
        syncFromOrder(latest);
      }

      const mustPay = Number(latest?.tongTienThuHo ?? orderSummary.total ?? 0);
      if (mustPay <= 0) {
        notify("error", "Tổng tiền không hợp lệ. Vui lòng kiểm tra lại đơn hàng.");
        return;
      }

      // Nếu tiền mặt mà khách đưa < tổng mới nhất thì chặn
      if (invoice.paymentMethod === PAYMENT.CASH && (invoice.customerCash || 0) < mustPay) {
        notify("error","Số tiền khách đưa chưa đủ theo tổng mới nhất (có thể do phí vận chuyển vừa cập nhật).");
        return;
      }

      // 👉 Nếu chọn VNPay
      // VNPAY – MỞ TRONG CÙNG TAB (khách quét QR ngon lành)
      if (invoice.paymentMethod === PAYMENT.VNPAY) {
        const res = await startVnpayPayment(orderId);
        const data = unwrapApi ? unwrapApi(res) : (res?.data || res);

        const payUrl =
          data?.payUrl ||
          data?.paymentUrl ||
          data?.url ||
          res?.data?.data?.payUrl ||
          res?.data?.payUrl ||
          res?.payUrl;

        if (!payUrl || typeof payUrl !== 'string') {
          message.error('Không tạo được link VNPay. Vui lòng thử lại!');
          setShowConfirmation(false);
          return;
        }

        // MỞ TRONG CÙNG TAB → KHÁCH DỄ QUÉT QR TRÊN ĐIỆN THOẠI
        window.location.href = payUrl;
        return;
      }

      // MOMO – MỞ TRONG CÙNG TAB (tuyệt vời trên mobile)
      if (invoice.paymentMethod === PAYMENT.MOMO) {
        const res = await startMomoPayment(orderId);
        const data = unwrapApi ? unwrapApi(res) : (res?.data || res);

        const payUrl =
          data?.payUrl ||
          data?.paymentUrl ||
          data?.url ||
          res?.data?.data?.payUrl ||
          res?.data?.payUrl ||
          res?.payUrl;

        if (!payUrl || typeof payUrl !== 'string') {
          message.error('Không tạo được link MoMo. Vui lòng thử lại!');
          setShowConfirmation(false);
          return;
        }

        // MỞ TRONG CÙNG TAB → KHÁCH QUÉT QR SIÊU DỄ
        window.location.href = payUrl;
        return;
      }

      // 🧾 Các phương thức còn lại (Tiền mặt, etc...)
      const methodEntity = getCurrentPaymentMethodEntity();
      if (!methodEntity) {
        message.error(
          'Không tìm thấy hình thức thanh toán tương ứng. Vui lòng kiểm tra lại danh mục hình thức thanh toán.'
        );
        return;
      }

      const khachDua =
        invoice.paymentMethod === PAYMENT.CASH
          ? (invoice.customerCash || mustPay)
          : mustPay;

      await addPaymentToOrder(orderId, {
        idHinhThucThanhToan: methodEntity.id,
        soTien: mustPay,     // ✅ bắt buộc để BE sum paid đúng
        khachDua,            // tiền khách đưa (đặc biệt tiền mặt)
      });

      // ✅ FIX: refresh lại trước khi complete để chắc chắn paid >= mustPay mới nhất
      await refreshOrderFromServer();

      await completeOrder(orderId);
      await refreshOrderFromServer();

      onConfirmOrder();
      setShowConfirmation(false);
      notify("success",'Thanh toán đơn hàng thành công.');
    } catch (err) {
      console.error('Lỗi xác nhận thanh toán POS:', err);
      message.error(
        err?.response?.data?.message ||
        'Không thể hoàn tất thanh toán, vui lòng thử lại!'
      );
    }
  };

  // ===== STYLE =====
  const primaryColor = '#0b7285';
  const secondaryColor = '#12b886';
  const cardBgColor = '#ffffff';
  const cardShadow = '0 4px 10px rgba(0,0,0,0.04)';
  const headerBorderColor = '#e9ecef';

  const contentWrapperStyle = {
    display: 'flex',
    minHeight: '75vh',
    borderRadius: '10px',
    boxShadow: cardShadow,
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    overflow: 'hidden',
  };
  const colLeftStyle = {
    flex: 3,
    padding: '20px',
    borderRight: `1px solid ${headerBorderColor}`,
    backgroundColor: '#ffffff',
  };
  const colRightStyle = {
    flex: 1.6,
    padding: '20px',
    backgroundColor: '#f5f7fb',
  };
  const cardStyle = {
    marginBottom: '16px',
    border: '1px solid #edf2ff',
    padding: '14px',
    borderRadius: '9px',
    backgroundColor: cardBgColor,
    boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
  };
  const buttonPrimary = {
    backgroundColor: secondaryColor,
    color: 'white',
    padding: '9px 16px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.9rem',
  };
  const buttonDangerOutline = {
    background: 'none',
    border: '1px solid #fa5252',
    color: '#fa5252',
    padding: '8px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '0.85rem',
  };

  // ===== RENDER =====
  return (
    <div style={contentWrapperStyle}>
      {/* Cột trái: sản phẩm */}
      <div style={colLeftStyle}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px',
            borderBottom: `1px solid ${headerBorderColor}`,
            paddingBottom: '10px',
          }}
        >
          <div>
            <h4 style={{ margin: 0, color: '#343a40', fontSize: '1.05rem' }}>
              Sản phẩm trong đơn hàng
            </h4>
            <small style={{ color: '#868e96' }}>
              Tổng: {totalCartQuantity} sản phẩm
            </small>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              style={buttonDangerOutline}
              onClick={handleCancelInvoice}
            >
              Hủy giỏ hàng
            </button>
            <button
              onClick={() => setShowQrScanner(true)}
              style={{
                ...buttonPrimary,
                backgroundColor: '#e67e22',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ fontSize: '18px' }}>QR Code</span>
            </button>
            <button
              onClick={() => setShowProductSelector(true)}  // Giữ nguyên cho chọn sản phẩm
              style={buttonPrimary}
            >
              + Chọn sản phẩm
            </button>
          </div>
        </div>

        <div style={{ maxHeight: 'calc(100vh - 260px)', overflowY: 'auto' }}>
          {loadingOrder ? (
            <div
              style={{
                padding: '32px',
                textAlign: 'center',
                color: '#868e96',
                fontSize: '0.95rem',
              }}
            >
              Đang tải chi tiết đơn hàng...
            </div>
          ) : cartItems.length > 0 ? (
            cartItems.map((item) => (
              <div
                key={item.idLaptopCt}
                style={{
                  display: 'flex',
                  padding: '10px 4px',
                  borderBottom: `1px solid ${headerBorderColor}`,
                }}
              >
                {/* Thông tin sản phẩm */}
                {/* Ảnh thumbnail */}
                <div style={{ width: 64, marginRight: 10 }}>
                  <img
                    src={item.imageUrl || '/placeholder.png'}
                    alt={item.name}
                    style={{
                      width: 64,
                      height: 64,
                      objectFit: 'cover',
                      borderRadius: 8,
                      border: '1px solid #e9ecef',
                      background: '#fff',
                    }}
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.png';
                    }}
                  />
                </div>
                <div style={{ flex: 1, paddingRight: 10 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      marginBottom: 2,
                      color: '#212529',
                    }}
                  >
                    {item.name}
                  </div>
                  {item.version && (
                    <div
                      style={{
                        fontSize: '0.82rem',
                        color: '#868e96',
                        marginBottom: 4,
                      }}
                    >
                      {item.version}
                    </div>
                  )}

                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: '#495057',
                      marginBottom: 4,
                    }}
                  >
                    Số lượng:{' '}
                    <strong>{item.quantity || 1}</strong>
                  </div>

                  {/* Seri chips */}
                  {item.serials && item.serials.length > 0 && (
                    <div
                      style={{
                        marginTop: 4,
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 6,
                      }}
                    >
                      {item.serials.map((code, idx) => {
                        const orderCtId =
                          item.orderCtIds && item.orderCtIds[idx];
                        return (
                          <span
                            key={orderCtId || `${code}-${idx}`}
                            style={{
                              fontSize: '0.78rem',
                              background: '#f1f3f5',
                              borderRadius: 20,
                              padding: '2px 8px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              border: '1px solid #dee2e6',
                            }}
                          >
                            {code}
                            {orderCtId && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveSerial(orderCtId, code);
                                }}
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  cursor: 'pointer',
                                  color: '#fa5252',
                                  fontSize: '0.9rem',
                                  lineHeight: 1,
                                  padding: 0,
                                }}
                                title="Xóa seri khỏi đơn"
                              >
                                ×
                              </button>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Giá */}
                <div
                  style={{
                    width: 130,
                    textAlign: 'right',
                    paddingRight: 8,
                  }}
                >
                  <div
                    style={{
                      color: '#e03131',
                      fontWeight: 600,
                      fontSize: '0.98rem',
                    }}
                  >
                    {formatCurrency(
                      (item.currentPrice || 0) * (item.quantity || 1)
                    )}
                  </div>
                  {item.quantity > 1 && (
                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: '#868e96',
                        marginTop: 2,
                      }}
                    >
                      {formatCurrency(item.currentPrice)} x {item.quantity}
                    </div>
                  )}
                </div>

                {/* Action */}
                <div
                  style={{
                    width: 70,
                    textAlign: 'right',
                  }}
                >
                  <button
                    onClick={() => handleRemoveItem(item.idLaptopCt)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: '#fa5252',
                      fontSize: '0.82rem',
                      padding: 0,
                    }}
                    title="Xóa toàn bộ sản phẩm này"
                  >
                    Xóa hết
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div
              style={{
                padding: '48px',
                textAlign: 'center',
                color: '#868e96',
                borderRadius: '8px',
                border: '1px dashed #ced4da',
                backgroundColor: '#fcfcff',
                fontSize: '0.95rem',
              }}
            >
              <p style={{ margin: 0 }}>Giỏ hàng đang trống.</p>
              <p style={{ margin: 0, marginTop: 4 }}>
                Bấm <strong>"Chọn sản phẩm"</strong> để bắt đầu tạo đơn hàng.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Cột phải: Khách + Voucher + Thanh toán */}
      <div style={colRightStyle}>
        {/* KHÁCH HÀNG */}
        <div style={cardStyle}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <h5
              style={{
                margin: 0,
                color: '#0b7285',
                fontSize: '0.95rem',
                fontWeight: 600,
              }}
            >
              Khách hàng
            </h5>
            <button
              onClick={() => setShowCustomerForm(true)}
              style={{
                background: 'none',
                border: '1px solid #20c997',
                borderRadius: '20px',
                color: '#20c997',
                padding: '4px 10px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.8rem',
              }}
            >
              Thêm nhanh
            </button>
          </div>

          {(() => {
            const hasCustomer = !!invoice.customer;
            const displayValue = hasCustomer
              ? `${invoice.customer.name || invoice.customer.ten || ''} - ${invoice.customer.phone ||
              invoice.customer.soDienThoai ||
              ''
              }`
              : customerSearch;

            return (
              <>
                <div style={{ position: 'relative', marginBottom: '6px' }}>
                  <input
                    type="text"
                    value={displayValue}
                    onChange={(e) => {
                      if (hasCustomer) return;
                      setCustomerSearch(e.target.value);
                    }}
                    placeholder="Tìm kiếm khách hàng (tên hoặc số điện thoại)"
                    style={{
                      width: '100%',
                      padding: hasCustomer ? '8px 26px 8px 9px' : '8px 9px',
                      border: '1px solid #ced4da',
                      borderRadius: '5px',
                      fontSize: '0.85rem',
                      backgroundColor: hasCustomer ? '#f8f9fa' : 'white',
                    }}
                    readOnly={hasCustomer}
                  />

                  {hasCustomer && (
                    <button
                      onClick={async () => {
                        // 1) clear customer UI
                        updateInvoice({ customer: null });
                        setCustomerSearch('');

                        // 2) ✅ clear giao hàng UI ngay lập tức
                        setSaveAddress(false);
                        setSetAsDefault(false);

                        setDistricts([]);
                        setWards([]);

                        setShipForm({
                          hoTen: '',
                          soDienThoai: '',
                          diaChiChiTiet: '',
                          quocGia: 'Việt Nam',
                          tinhThanh: '',
                          quanHuyen: '',
                          phuongXa: '',
                          provinceId: null,
                          districtId: null,
                          wardCode: '',
                        });

                        setShippingFee(0);
                        lastFeeRef.current = null;
                        lastShipCalcKeyRef.current = null;

                        // 3) clear BE customer + ship-note/fee
                        await selectCustomerForOrder(orderId, {
                          idTaiKhoan: null,
                          idDiaChi: null,
                          tenKhachHang: "",   // ✅ bắt buộc để clear
                          sdtKhachHang: "",   // ✅ bắt buộc để clear
                        });

                        // 4) reload
                        await refreshOrderFromServer();
                      }}
                      style={{
                        position: 'absolute',
                        right: 6,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        color: '#adb5bd',
                        fontSize: '1rem',
                        lineHeight: 1,
                        padding: 0,
                      }}
                      title="Bỏ khách hàng"
                    >
                      ×
                    </button>
                  )}

                </div>

                {!hasCustomer && customerSearch && (
                  <div
                    style={{
                      maxHeight: 150,
                      overflowY: 'auto',
                      border: '1px solid #e9ecef',
                      borderRadius: '5px',
                      background: '#fff',
                      marginBottom: '6px',
                    }}
                  >
                    {loadingCustomers ? (
                      <p
                        style={{
                          padding: '7px',
                          margin: 0,
                          fontSize: '0.8rem',
                        }}
                      >
                        Đang tải danh sách khách hàng...
                      </p>
                    ) : customerSuggestions.length === 0 ? (
                      <p
                        style={{
                          padding: '7px',
                          margin: 0,
                          fontSize: '0.8rem',
                          color: '#adb5bd',
                        }}
                      >
                        Không tìm thấy khách phù hợp.
                      </p>
                    ) : (
                      customerSuggestions.map((cus) => {
                        const idCus = cus.id || cus.idTaiKhoan;

                        return (
                          <div
                            key={idCus}
                            onClick={async () => {
                              const normalized = {
                                id: idCus,
                                idTaiKhoan: idCus,
                                ten: cus.ten,
                                name: cus.ten,
                                soDienThoai: cus.soDienThoai,
                                phone: cus.soDienThoai,
                                email: cus.email,
                                gioiTinh: cus.gioiTinh,
                                ngaySinh: cus.ngaySinh,
                              };
                              updateInvoice({ customer: normalized });
                              setCustomerSearch('');
                              await attachCustomerToOrder(normalized);
                            }}
                            style={{
                              padding: '7px 9px',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              borderBottom: '1px solid #f1f3f5',
                              fontSize: '0.82rem',
                            }}
                          >
                            <span>
                              {cus.ten}{' '}
                              <span style={{ color: '#868e96', marginLeft: 4 }}>
                                - {cus.soDienThoai}
                              </span>
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {hasCustomer ? (
                  <div
                    style={{
                      backgroundColor: '#e7f5ff',
                      padding: '8px',
                      borderRadius: '6px',
                      border: `1px solid #0b7285`,
                      fontSize: '0.85rem',
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 600,
                        color: '#212529',
                      }}
                    >
                      {invoice.customer.name || invoice.customer.ten}
                    </p>
                    <p style={{ margin: '2px 0 0 0', color: '#495057' }}>
                      <small>
                        SĐT:{' '}
                        {invoice.customer.phone || invoice.customer.soDienThoai}
                      </small>
                    </p>
                  </div>
                ) : (
                  <p style={{ margin: 0, color: '#adb5bd', fontSize: '0.85rem' }}>
                    Khách hàng vãng lai
                  </p>
                )}
              </>
            );
          })()}
        </div>

        {/* GIAO HÀNG NHANH (GHN) */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h5 style={{ margin: 0, color: '#0b7285', fontSize: '0.95rem', fontWeight: 600 }}>
              Giao hàng
            </h5>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#495057' }}>
                {giaoHang ? 'Giao hàng tận nơi' : 'Tại quầy'}
              </span>
              <input
                type="checkbox"
                checked={giaoHang}
                onChange={async (e) => {
                  const val = e.target.checked;

                  if (val && totalCartQuantity === 0) {
                    notify("warning", "Vui lòng thêm sản phẩm trước khi bật giao hàng.");
                    return; // không setGiaoHang(true)
                  }

                  setGiaoHang(val);

                  if (!orderId) return;

                  // ✅ reset checkbox lưu địa chỉ khi đổi trạng thái giao hàng
                  setSaveAddress(false);
                  setSetAsDefault(false);

                  // tắt giao hàng => gọi BE reset phí
                  if (!val) {
                    try {
                      setShippingLoading(true);
                      const res = await updateShipping(orderId, { giaoHang: false, ghiChu: "" });
                      const data = unwrapApi(res);
                      syncFromOrder(data);
                      notify('success', 'Đã tắt giao hàng và reset phí vận chuyển.');
                    } catch (err) {
                      notify('error', err?.response?.data?.message || 'Không thể tắt giao hàng.');
                    } finally {
                      setShippingLoading(false);
                    }
                    return;
                  }

                  // ✅ bật giao hàng => gọi BE để lấy địa chỉ mặc định (KHÔNG LƯU)
                  try {
                    setShippingLoading(true);

                    const hasAccount = !!(invoice?.customer?.idTaiKhoan || invoice?.customer?.id);

                    // 1) Khách có tài khoản -> gọi BE để lấy địa chỉ mặc định (và tính phí nếu đủ ward/district)
                    if (hasAccount) {
                      const res = await updateShipping(orderId, {
                        giaoHang: true,
                        saveAddress: false,
                        setAsDefault: false,
                        useInsurance: !!useInsurance,
                      });
                      const data = unwrapApi(res);
                      syncFromOrder(data);
                    } else {
                      // 2) Khách vãng lai -> KHÔNG gọi BE ngay (vì chưa có district/ward sẽ lỗi)
                      // Fee sẽ được tính tự động bởi useEffect khi user chọn Quận/Huyện + Phường/Xã
                      notify('info', 'Vui lòng chọn Tỉnh/Thành, Quận/Huyện và Phường/Xã để tính phí vận chuyển.');
                    }
                  } catch (err) {
                    const msg = err?.response?.data?.message || 'Không thể bật giao hàng.';
                    // ✅ FIX: nếu BE báo thiếu district/ward thì chỉ nhắc user chọn, không báo lỗi đỏ
                    if (msg.includes('Thiếu districtId') || msg.includes('wardCode')) {
                      notify('info', 'Khách chưa có địa chỉ đủ thông tin. Vui lòng chọn Quận/Huyện và Phường/Xã để tính phí.');
                    } else {
                      notify('error', msg);
                    }
                  } finally {
                    setShippingLoading(false);
                  }
                }}
              />
            </label>
          </div>

          {giaoHang && (
            <>
              <div style={{ marginTop: 10 }}>
                <input
                  value={shipForm.hoTen}
                  onChange={(e) => setShipForm(p => ({ ...p, hoTen: e.target.value }))}
                  placeholder="Họ tên người nhận"
                  style={{ width: '100%', padding: 8, border: '1px solid #ced4da', borderRadius: 6, marginBottom: 8 }}
                />
                <input
                  value={shipForm.soDienThoai}
                  onChange={(e) => setShipForm(p => ({ ...p, soDienThoai: e.target.value }))}
                  placeholder="Số điện thoại người nhận"
                  style={{ width: '100%', padding: 8, border: '1px solid #ced4da', borderRadius: 6, marginBottom: 8 }}
                />
                <input
                  value={shipForm.diaChiChiTiet}
                  onChange={(e) => setShipForm(p => ({ ...p, diaChiChiTiet: e.target.value }))}
                  placeholder="Địa chỉ chi tiết (số nhà, đường...)"
                  style={{ width: '100%', padding: 8, border: '1px solid #ced4da', borderRadius: 6, marginBottom: 8 }}
                />

                {/* Province */}
                <select
                  value={shipForm.provinceId || ''}
                  onChange={(e) => {
                    const provinceId = e.target.value ? Number(e.target.value) : null;
                    const provinceObj = provinces.find(x => Number(x.ProvinceID || x.province_id) === provinceId);
                    setShipForm(p => ({
                      ...p,
                      provinceId,
                      tinhThanh: provinceObj?.ProvinceName || provinceObj?.province_name || '',
                    }));
                  }}
                  style={{ width: '100%', padding: 8, border: '1px solid #ced4da', borderRadius: 6, marginBottom: 8 }}
                >
                  <option value="">Tỉnh/Thành phố *</option>
                  {provinces.map((p) => {
                    const id = p.ProvinceID ?? p.province_id;
                    const name = p.ProvinceName ?? p.province_name;
                    return <option key={id} value={id}>{name}</option>;
                  })}
                </select>

                {/* District */}
                <select
                  value={shipForm.districtId || ''}
                  onChange={(e) => {
                    const districtId = e.target.value ? Number(e.target.value) : null;
                    const dObj = districts.find(x => Number(x.DistrictID || x.district_id) === districtId);
                    setShipForm(p => ({
                      ...p,
                      districtId,
                      quanHuyen: dObj?.DistrictName || dObj?.district_name || '',
                    }));
                  }}
                  style={{ width: '100%', padding: 8, border: '1px solid #ced4da', borderRadius: 6, marginBottom: 8 }}
                  disabled={!shipForm.provinceId}
                >
                  <option value="">Quận/Huyện *</option>
                  {districts.map((d) => {
                    const id = d.DistrictID ?? d.district_id;
                    const name = d.DistrictName ?? d.district_name;
                    return <option key={id} value={id}>{name}</option>;
                  })}
                </select>

                {/* Ward */}
                <select
                  value={shipForm.wardCode || ''}
                  onChange={(e) => {
                    const wardCode = e.target.value || '';
                    const wObj = wards.find(x => String(x.WardCode || x.ward_code) === wardCode);
                    setShipForm(p => ({
                      ...p,
                      wardCode,
                      phuongXa: wObj?.WardName || wObj?.ward_name || '',
                    }));
                  }}
                  style={{ width: '100%', padding: 8, border: '1px solid #ced4da', borderRadius: 6 }}
                  disabled={!shipForm.districtId}
                >
                  <option value="">Phường/Xã *</option>
                  {wards.map((w) => {
                    const code = w.WardCode ?? w.ward_code;
                    const name = w.WardName ?? w.ward_name;
                    return <option key={code} value={code}>{name}</option>;
                  })}
                </select>
              </div>

              {/* ✅ UI Lưu địa chỉ (chỉ cho khách có tài khoản) */}
              {!!(invoice?.customer?.idTaiKhoan || invoice?.customer?.id) && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
                    <input
                      type="checkbox"
                      checked={saveAddress}
                      onChange={(e) => {
                        const v = e.target.checked;
                        setSaveAddress(v);
                        if (!v) setSetAsDefault(false);
                      }}
                    />
                    Lưu địa chỉ này vào sổ địa chỉ khách hàng
                  </label>

                  {saveAddress && (
                    <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
                      <input
                        type="checkbox"
                        checked={setAsDefault}
                        onChange={(e) => setSetAsDefault(e.target.checked)}
                      />
                      Đặt làm địa chỉ mặc định
                    </label>
                  )}

                  {saveAddress && (
                    <button
                      type="button"
                      style={{
                        padding: '8px 10px',
                        borderRadius: 6,
                        border: 'none',
                        background: '#0b7285',
                        color: '#fff',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                      onClick={async () => {
                        if (!orderId) return;
                        try {
                          setShippingLoading(true);

                          const res = await updateShipping(orderId, {
                            giaoHang: true,
                            hoTen: shipForm.hoTen,
                            soDienThoai: shipForm.soDienThoai,
                            diaChiChiTiet: shipForm.diaChiChiTiet,
                            quocGia: shipForm.quocGia || "Việt Nam",
                            tinhThanh: shipForm.tinhThanh,
                            quanHuyen: shipForm.quanHuyen,
                            phuongXa: shipForm.phuongXa,
                            provinceId: shipForm.provinceId,
                            districtId: shipForm.districtId,
                            wardCode: shipForm.wardCode,

                            // ✅ chỉ lúc bấm nút mới lưu DB
                            saveAddress: true,
                            setAsDefault: !!setAsDefault,
                            useInsurance: !!useInsurance,
                          });

                          const data = unwrapApi(res);
                          syncFromOrder(data);

                          setSaveAddress(false);
                          setSetAsDefault(false);

                          notify('success', 'Đã lưu địa chỉ mới cho khách hàng.');
                        } catch (err) {
                          notify('error', err?.response?.data?.message || 'Lưu địa chỉ thất bại.');
                        } finally {
                          setShippingLoading(false);
                        }
                      }}
                    >
                      Lưu địa chỉ mới
                    </button>
                  )}
                </div>
              )}
              <div style={{paddingTop: 15}}>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={useInsurance}
                  onChange={(e) => {
                    setUseInsurance(e.target.checked);
                    lastShipCalcKeyRef.current = null; // force recalc nếu cần
    }}
  />
                Bảo hiểm hàng hóa 
              </label>
</div>

              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #e9ecef' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span>Phí vận chuyển:</span>
                  <strong>{shippingLoading ? 'Đang tính...' : formatCurrency(Number(orderDetail?.phiVanChuyen || 0))}</strong>
                </div>
              </div>
            </>
          )}
        </div>

        {/* VOUCHER */}
        <div style={cardStyle}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <h5
              style={{
                margin: 0,
                color: '#12b886',
                fontSize: '0.95rem',
                fontWeight: 600,
              }}
            >
              Voucher giảm giá
            </h5>
            <button
              onClick={() => setShowVoucherSelector(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#12b886',
                padding: '3px 8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.8rem',
              }}
            >
              {appliedVouchers.length > 0
                ? `Chỉnh sửa (${appliedVouchers.length})`
                : '+ Áp dụng'}
            </button>
          </div>

          {appliedVouchers.length > 0 ? (
            appliedVouchers.map((v) => (
              <div
                key={v.id}
                style={{
                  padding: '7px 9px',
                  backgroundColor: '#e6f7ea',
                  borderRadius: '6px',
                  border: `1px solid #12b886`,
                  marginBottom: '6px',
                  fontSize: '0.85rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{v.name}</span>
                  <span style={{ color: '#e03131', fontWeight: 600 }}>
                    - {formatCurrency(v.discount)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: '#adb5bd', margin: 0, fontSize: '0.85rem' }}>
              Chưa có voucher.
            </p>
          )}
        </div>

        {/* PHƯƠNG THỨC THANH TOÁN */}
        <div style={cardStyle}>
          <h5
            style={{
              margin: '0 0 8px 0',
              color: '#495057',
              fontSize: '0.95rem',
            }}
          >
            Phương thức thanh toán
          </h5>
          {paymentOptions.map((opt) => {
            const active = invoice.paymentMethod === opt.value;
            return (
              <div
                key={opt.value}
                onClick={() => updateInvoice({ paymentMethod: opt.value })}
                style={{
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: active
                    ? `1px solid #12b886`
                    : '1px solid #e9ecef',
                  backgroundColor: active ? '#e6fcf5' : '#fff',
                  marginBottom: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.85rem',
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      marginBottom: 1,
                      color: '#212529',
                    }}
                  >
                    {opt.title}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#868e96' }}>
                    {opt.desc}
                  </div>
                </div>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    border: active
                      ? 'none'
                      : '1px solid rgba(0,0,0,0.15)',
                    backgroundColor: active ? '#12b886' : '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                  }}
                >
                  {active ? '✓' : ''}
                </div>
              </div>
            );
          })}
        </div>

        {/* TỔNG KẾT ĐƠN HÀNG */}
        <div
          style={{
            ...cardStyle,
            borderColor: '#d0ebff',
            backgroundColor: '#f8fbff',
          }}
        >
          <h5
            style={{
              margin: '0 0 8px 0',
              color: '#0b7285',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.96rem',
            }}
          >
            <span>Tổng kết đơn hàng</span>
          </h5>

          <div
            style={{
              borderBottom: '1px solid #e9ecef',
              paddingBottom: '6px',
              marginBottom: '6px',
              fontSize: '0.86rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '2px 0',
              }}
            >
              <span>Tạm tính:</span>
              <strong>{formatCurrency(orderSummary.subtotal)}</strong>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '2px 0',
              }}
            >
              <span style={{ color: '#e03131' }}>Giảm giá voucher:</span>
              <strong style={{ color: '#e03131' }}>
                - {formatCurrency(orderSummary.totalDiscount)}
              </strong>
            </div>

            {/* ✅ HIỂN THỊ PHÍ VẬN CHUYỂN */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '2px 0',
              }}
            >
              <span>Phí vận chuyển:</span>
              <strong>{formatCurrency(Number(orderDetail?.phiVanChuyen || 0))}</strong>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '2px 0 6px',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>
              Tổng cộng:
            </span>
            <strong
              style={{
                color: '#0b7285',
                fontSize: '1.25rem',
              }}
            >
              {formatCurrency(orderSummary.total)}
            </strong>
          </div>

          {invoice.paymentMethod === PAYMENT.CASH && (
            <div
              style={{
                borderTop: '1px solid #e9ecef',
                paddingTop: 8,
                marginTop: 2,
              }}
            >
              <label
                style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                }}
              >
                Khách hàng đưa:
              </label>
              <input
                type="number"
                value={invoice.customerCash || ''}
                onChange={(e) =>
                  updateInvoice({
                    customerCash: parseInt(e.target.value, 10) || 0,
                  })
                }
                placeholder="Nhập số tiền khách đưa..."
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '5px',
                  marginBottom: '6px',
                  fontSize: '0.85rem',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '4px',
                  fontSize: '0.85rem',
                }}
              >
                <span>Tiền trả lại:</span>
                <strong style={{ color: '#12b886' }}>
                  {formatCurrency(orderSummary.change)}
                </strong>
              </div>
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={isPayDisabled}
            style={{
              ...buttonPrimary,
              width: '100%',
              padding: '10px',
              fontSize: '0.95rem',
              marginTop: 8,
              backgroundColor: isPayDisabled ? '#a5d8a5' : '#12b886',
              cursor: isPayDisabled ? 'not-allowed' : 'pointer',
            }}
          >
            Thanh toán
          </button>
        </div>
      </div>

      {/* MODALS */}
      {showQrScanner && (
        <QrScannerModal
          onScan={handleScanQr}
          onClose={() => setShowQrScanner(false)}
        />
      )}
      {showProductSelector && (
        <ProductSelector
          idLaptop={null}
          onClose={() => setShowProductSelector(false)}
          onAddProducts={handleAddProducts}
          formatCurrency={formatCurrency}
        />
      )}

      {showVoucherSelector && (
        <VoucherSelector
          appliedVouchers={appliedVouchers}
          onClose={() => setShowVoucherSelector(false)}
          onApplyVouchers={handleApplyVouchers}
          orderSummary={orderSummary}
          formatCurrency={formatCurrency}
        />
      )}

      {showCustomerForm && (
        <CustomerSelector
          initialCustomer={null}
          onClose={() => setShowCustomerForm(false)}
          walkInOnly={true}              // ✅ khách vãng lai, không tạo tài khoản
          onSaveCustomer={async (data) => {
            // data: { id: null, idTaiKhoan: null, ten, name, soDienThoai, phone }
            updateInvoice({ customer: data });

            // Không push vào danh sách khách có tài khoản nếu không có id
            setCustomers((prev) => {
              if (!data?.id && !data?.idTaiKhoan) return prev;
              const idCus = data.id || data.idTaiKhoan;
              const mapped = {
                id: idCus,
                idTaiKhoan: idCus,
                ten: data.ten || data.name,
                soDienThoai: data.soDienThoai || data.phone,
              };
              const idx = prev.findIndex(
                (c) => (c.id || c.idTaiKhoan) === idCus
              );
              if (idx !== -1) {
                const clone = [...prev];
                clone[idx] = { ...clone[idx], ...mapped };
                return clone;
              }
              return [mapped, ...prev];
            });

            setShowCustomerForm(false);
            await attachCustomerToOrder(data); // idTaiKhoan = null → khách vãng lai
          }}
        />
      )}

      {showConfirmation && (
        <ConfirmationModal
          orderSummary={orderSummary}
          cartItems={cartItems}
          customer={invoice.customer}
          paymentMethod={invoice.paymentMethod}
          customerCash={invoice.customerCash}
          formatCurrency={formatCurrency}

          // ✅ truyền phí vận chuyển để modal hiển thị
          shippingFee={Number(orderDetail?.phiVanChuyen || 0)}

          // ✅ FIX: truyền flag giao hàng để modal hiển thị đúng
          isDelivery={giaoHang}

          onClose={() => setShowConfirmation(false)}
          onConfirm={handleConfirmPayment}
        />
      )}

      {/* ✅ Modal nhắc nhở ở giữa */}
      
    </div>
  );
};

export default InvoiceWorkingArea;
