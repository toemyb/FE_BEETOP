// src/admin/adminBanHangTaiQuayComponents/InvoiceWorkingArea.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { message } from 'antd'; 
import ProductSelector from '../../components/ProductSelector.jsx';
import CustomerSelector from '../../components/CustomerSelector.jsx';
import ConfirmationModal from '../../components/ConfirmationModal.jsx';
import VoucherSelector from '../../components/VoucherSelector.jsx';
import userService from '../../service/userService';
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
} from '../../service/PosOrderService';
import { listPaymentMethods } from '../../service/HinhThucThanhToanService';

const formatCurrencyDefault = (amount) => {
  if (typeof amount !== 'number') return '0 ₫';
  return amount.toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
  });
};

// ✅ Modal nhắc nhở / confirm ở giữa màn hình
const ReminderModal = ({ title, message, onConfirm, onCancel }) => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9998,
      }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: 10,
          padding: '18px 20px 14px',
          minWidth: 320,
          maxWidth: 420,
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <h4
          style={{
            margin: 0,
            marginBottom: 8,
            fontSize: '1rem',
            color: '#212529',
          }}
        >
          {title || 'Xác nhận thao tác'}
        </h4>
        <p
          style={{
            margin: 0,
            marginBottom: 14,
            fontSize: '0.9rem',
            color: '#495057',
          }}
        >
          {message}
        </p>
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            marginTop: 4,
          }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: '7px 14px',
              borderRadius: 6,
              border: '1px solid #ced4da',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '7px 16px',
              borderRadius: 6,
              border: 'none',
              backgroundColor: '#fa5252',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
};

const InvoiceWorkingArea = ({
  invoice,
  updateInvoice,
  onConfirmOrder,
  showNotification,
  formatCurrency: formatCurrencyProp,
}) => {
  const orderId = invoice?.orderId;

  const notify = showNotification || (() => {});
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

  // Modal nhắc nhở chung
  const [reminderConfig, setReminderConfig] = useState(null);

  const openReminder = (config) => setReminderConfig(config);

  // Khách hàng
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // POS Order
  const [orderDetail, setOrderDetail] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(false);

  // Tổng tiền từ BE
  const [posTotals, setPosTotals] = useState({
    giaTriChuaGiam: 0,
    giaTriGiamGia: 0,
    tongTienThuHo: 0,
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
        const raw = res?.data?.data ?? res?.data;
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
        giaTriChuaGiam: 0,
        giaTriGiamGia: 0,
        tongTienThuHo: 0,
      });
      return;
    }

    setOrderDetail(data);

    setPosTotals({
      giaTriChuaGiam: Number(data.giaTriChuaGiam || 0),
      giaTriGiamGia: Number(data.giaTriGiamGia || 0),
      tongTienThuHo: Number(data.tongTienThuHo || 0),
    });

    // Build giỏ hàng từ items (List<PosOrderItemDTO>)
    if (Array.isArray(data.items)) {
      const groups = {};

      data.items.forEach((it) => {
        const key = it.laptopCtId || it.laptopId || it.seriId || it.orderCtId;

        if (!groups[key]) {
          groups[key] = {
            idLaptopCt: key,
            name: it.tenSanPham || 'Sản phẩm',
            version: it.cauHinh || '',
            serials: [], // mảng string
            orderCtIds: [], // mảng UUID tương ứng từng seri
            quantity: 0,
            currentPrice: Number(it.giaBan || 0),
            originalPrice: Number(it.giaBan || 0),
          };
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
        const uuid =
          v.id ||
          v.uuid ||
          v.idVoucher ||
          v.idPhieuGiamGia;

        const code =
          v.ma ||
          v.maPhieu ||
          v.maPhieuGiamGia ||
          v.maVoucher ||
          v.code ||
          v.idPhieuGiamGia ||
          uuid;

        return {
          id: uuid,
          code,
          name: v.ten || v.name || code,
          kieuGiamGia: v.kieuGiamGia,
          discount: Number(v.giaTriGiam || 0),
          giaTriMin: Number(v.giaTriMin || 0),
          giaTriMax: Number(v.giaTriMax || 0),
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

  // ===== TỔNG KẾT ĐƠN HÀNG (ưu tiên số từ BE) =====
  const orderSummary = useMemo(() => {
    const subtotal =
      posTotals.giaTriChuaGiam ||
      cartItems.reduce(
        (sum, item) =>
          sum + (item.currentPrice || 0) * (item.quantity || 1),
        0
      );
    const totalDiscount =
      posTotals.giaTriGiamGia ||
      appliedVouchers.reduce(
        (sum, voucher) => sum + (voucher.discount || 0),
        0
      );
    const total =
      posTotals.tongTienThuHo || Math.max(0, subtotal - totalDiscount);

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
  }, [cartItems, appliedVouchers, invoice.customerCash, posTotals]);

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

  // Xóa toàn bộ seri của một phiên bản sản phẩm
  const handleRemoveItem = (idLaptopCt) => {
    if (!orderId) return;
    const group = cartItems.find((item) => item.idLaptopCt === idLaptopCt);
    if (!group || !group.orderCtIds?.length) return;

    openReminder({
      title: 'Xóa sản phẩm khỏi đơn',
      message: 'Bạn có chắc muốn xóa toàn bộ phiên bản sản phẩm này khỏi đơn hàng?',
      onConfirm: async () => {
        try {
          await Promise.all(
            group.orderCtIds
              .filter(Boolean)
              .map((orderCtId) => removeItemFromOrder(orderId, orderCtId))
          );
          await refreshOrderFromServer();
          notify('success', 'Đã xóa sản phẩm khỏi đơn hàng.');
        } catch (err) {
          console.error('Lỗi xóa sản phẩm khỏi đơn hàng:', err);
          notify(
            'error',
            'Không thể xóa sản phẩm khỏi đơn, vui lòng thử lại!'
          );
        }
      },
    });
  };

  // Xóa từng seri
  const handleRemoveSerial = (orderCtId, seriCode) => {
    if (!orderId || !orderCtId) return;

    openReminder({
      title: 'Xóa seri khỏi đơn',
      message: `Xóa seri ${seriCode} khỏi đơn hàng?`,
      onConfirm: async () => {
        try {
          await removeItemFromOrder(orderId, orderCtId);
          await refreshOrderFromServer();
          notify('success', `Đã xóa seri ${seriCode} khỏi đơn hàng.`);
        } catch (err) {
          console.error('Lỗi xóa seri khỏi đơn hàng:', err);
          notify(
            'error',
            'Không thể xóa seri khỏi đơn, vui lòng thử lại!'
          );
        }
      },
    });
  };

  // ===== HỦY ĐƠN =====
  const handleCancelInvoice = () => {
    if (!orderId) return;

    openReminder({
      title: 'Huỷ đơn hàng',
      message: 'Huỷ toàn bộ đơn hàng này?',
      onConfirm: async () => {
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
    const normalized = Array.isArray(list) ? list : [];
    setAppliedVouchers(normalized);

    const voucherIds = normalized
      .map((v) => v.id)
      .filter(Boolean);

    updateInvoice({ voucherIds });

    if (!orderId || !voucherIds.length) {
      setShowVoucherSelector(false);
      return;
    }

    try {
      await applyVoucherForOrder(orderId, voucherIds);
      await refreshOrderFromServer();
      notify('success', 'Đã áp dụng voucher cho đơn hàng.');
    } catch (err) {
      console.error('Lỗi áp dụng voucher hàng:', err);
      notify(
        'error',
        err?.response?.data?.message ||
          'Không thể áp dụng voucher, vui lòng thử lại!'
      );
    } finally {
      setShowVoucherSelector(false);
    }
  };

  // ===== THANH TOÁN =====
  const getCurrentPaymentMethodEntity = () => {
    if (!paymentMethods.length || !invoice.paymentMethod) return null;
    const lowerName = invoice.paymentMethod.toLowerCase();

    let method =
      paymentMethods.find(
        (m) =>
          (m.tenHinhThuc || m.ten || m.name || '')
            .toLowerCase()
            .trim() === lowerName
      ) || null;

    if (!method) {
      method =
        paymentMethods.find((m) =>
          (m.tenHinhThuc || m.ten || m.name || '')
            .toLowerCase()
            .includes(lowerName)
        ) || null;
    }
    return method;
  };

  const handleCheckout = () => {
    if (!cartItems.length) {
      notify('warning', 'Vui lòng chọn ít nhất một sản phẩm.');
      return;
    }
    if (orderSummary.total <= 0) {
      notify('warning', 'Tổng tiền phải lớn hơn 0.');
      return;
    }
    if (
      invoice.paymentMethod === 'Tiền mặt' &&
      (invoice.customerCash || 0) < orderSummary.total
    ) {
      notify('warning', 'Số tiền khách đưa chưa đủ để thanh toán.');
      return;
    }
    setShowConfirmation(true);
  };

  const isPayDisabled =
    orderSummary.total === 0 ||
    (invoice.paymentMethod === 'Tiền mặt' &&
      (invoice.customerCash || 0) < orderSummary.total);

  const handleConfirmPayment = async () => {
  if (!orderId) return;

  try {
    // 👉 Nếu chọn VNPay
    if (invoice.paymentMethod === 'VNPay') {
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

      window.open(payUrl, '_blank', 'noopener,noreferrer');

      setShowConfirmation(false);
      return;
    }

    // 👉 Nếu chọn MoMo
    if (invoice.paymentMethod === 'MoMo') {
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

      window.open(payUrl, '_blank', 'noopener,noreferrer');

      setShowConfirmation(false);
      // ⛔ Không complete/ghi thanh toán ở FE.
      // BE xử lý trong /api/pos/payment/momo-ipn
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

    const total = orderSummary.total;
    const khachDua =
      invoice.paymentMethod === 'Tiền mặt'
        ? invoice.customerCash || total
        : total;

    await addPaymentToOrder(orderId, {
      idHinhThucThanhToan: methodEntity.id,
      khachDua,
    });

    await completeOrder(orderId);
    await refreshOrderFromServer();

    onConfirmOrder();
    setShowConfirmation(false);
    message.success('Thanh toán đơn hàng thành công.');
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

  const paymentOptions = [
    {
      value: 'Tiền mặt',
      title: 'Tiền mặt',
      desc: 'Thanh toán bằng tiền mặt tại quầy',
    },
    {
      value: 'VNPay',
      title: 'VNPay',
      desc: 'Thanh toán qua ví và QR VNPay',
    },
    {
      value: 'MoMo',
      title: 'MoMo',
      desc: 'Thanh toán qua ví điện tử MoMo',
    },
  ];

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
              onClick={() => setShowProductSelector(true)}
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
                color: primaryColor,
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
              ? `${invoice.customer.name || invoice.customer.ten || ''} - ${
                  invoice.customer.phone ||
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
                        updateInvoice({ customer: null });
                        setCustomerSearch('');
                        await attachCustomerToOrder(null);
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
                      border: `1px solid ${primaryColor}`,
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
                color: secondaryColor,
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
                color: secondaryColor,
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
                  border: `1px solid ${secondaryColor}`,
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
                    ? `1px solid ${secondaryColor}`
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
                    backgroundColor: active ? secondaryColor : '#fff',
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
              color: primaryColor,
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
                color: primaryColor,
                fontSize: '1.25rem',
              }}
            >
              {formatCurrency(orderSummary.total)}
            </strong>
          </div>

          {invoice.paymentMethod === 'Tiền mặt' && (
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
                <strong style={{ color: secondaryColor }}>
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
              backgroundColor: isPayDisabled ? '#a5d8a5' : secondaryColor,
              cursor: isPayDisabled ? 'not-allowed' : 'pointer',
            }}
          >
            Thanh toán
          </button>
        </div>
      </div>

      {/* MODALS */}
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
          onClose={() => setShowConfirmation(false)}
          onConfirm={handleConfirmPayment}
        />
      )}

      {/* ✅ Modal nhắc nhở ở giữa */}
      {reminderConfig && (
        <ReminderModal
          title={reminderConfig.title}
          message={reminderConfig.message}
          onCancel={() => setReminderConfig(null)}
          onConfirm={async () => {
            try {
              if (reminderConfig.onConfirm) {
                await reminderConfig.onConfirm();
              }
            } finally {
              setReminderConfig(null);
            }
          }}
        />
      )}
    </div>
  );
};

export default InvoiceWorkingArea;
