// src/admin/adminBanHangTaiQuayComponents/ListBanTaiQuayComponent.jsx
import React, { useState, useEffect } from 'react';
import InvoiceWorkingArea from './InvoiceWorkingArea.jsx';
import {
  createDraftOrder,
  cancelOrder,
  unwrapApi,
} from '../../service/PosOrderService';

// Hàm tiện ích định dạng tiền tệ (truyền xuống nếu cần)
const formatCurrency = (amount) => {
  if (typeof amount !== 'number') return '0 ₫';
  return amount.toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
  });
};

const LOCAL_KEY = 'posOpenInvoices';

// Đồng bộ với BE:
// ORDER_STATUS_DRAFT = 1;
// ORDER_STATUS_COMPLETED = 2;
// ORDER_STATUS_CANCELLED = 3;
const ORDER_STATUS = {
  DRAFT: 1,
  COMPLETED: 2,
  CANCELLED: 3,
};

// ✅ Toast thông báo góc trên bên phải
const NotificationToast = ({ type = 'info', message, onClose }) => {
  const backgroundByType = {
    success: '#12b886',
    error: '#fa5252',
    warning: '#f08c00',
    info: '#228be6',
  };

  const bg = backgroundByType[type] || backgroundByType.info;

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 9999,
        minWidth: 260,
        maxWidth: 360,
        backgroundColor: bg,
        color: '#fff',
        padding: '10px 14px',
        borderRadius: 8,
        boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        fontSize: '0.9rem',
      }}
    >
      <div style={{ fontWeight: 600 }}>
        {type === 'success' && 'Thành công'}
        {type === 'error' && 'Lỗi'}
        {type === 'warning' && 'Nhắc nhở'}
        {type === 'info' && 'Thông báo'}
      </div>
      <div style={{ flex: 1 }}>{message}</div>
      <button
        onClick={onClose}
        style={{
          border: 'none',
          background: 'transparent',
          color: '#fff',
          cursor: 'pointer',
          fontSize: '1rem',
          padding: 0,
          marginLeft: 4,
        }}
      >
        ×
      </button>
    </div>
  );
};

const ListBanTaiQuayComponent = () => {
  const [invoices, setInvoices] = useState([]);
  const [activeInvoiceId, setActiveInvoiceId] = useState(null);
  const [creating, setCreating] = useState(false);

  const [notification, setNotification] = useState(null);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // 🔄 Load lại danh sách tab POS từ localStorage khi mở màn
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const raw = window.localStorage.getItem(LOCAL_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setInvoices(parsed);
        setActiveInvoiceId(parsed[0].id);
      }
    } catch (err) {
      console.error('Lỗi load POS draft từ localStorage:', err);
    }
  }, []);

  // 💾 Mỗi khi invoices thay đổi thì lưu lại vào localStorage
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      if (!invoices || invoices.length === 0) {
        window.localStorage.removeItem(LOCAL_KEY);
      } else {
        window.localStorage.setItem(LOCAL_KEY, JSON.stringify(invoices));
      }
    } catch (err) {
      console.error('Lỗi lưu POS draft vào localStorage:', err);
    }
  }, [invoices]);

  // 🔄 Đồng bộ invoices giữa nhiều tab qua localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageInvoices = (e) => {
      if (e.key !== LOCAL_KEY) return;

      try {
        const raw = e.newValue;
        if (!raw) {
          // Tab khác đã xoá hết draft
          setInvoices([]);
          setActiveInvoiceId(null);
          return;
        }

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return;

        setInvoices(parsed);

        // Nếu tab active hiện tại không còn trong danh sách mới → chuyển sang tab đầu
        if (!parsed.find((inv) => inv.id === activeInvoiceId)) {
          setActiveInvoiceId(parsed[0]?.id || null);
        }
      } catch (err) {
        console.error('Lỗi sync invoices từ localStorage:', err);
      }
    };

    window.addEventListener('storage', handleStorageInvoices);
    return () => window.removeEventListener('storage', handleStorageInvoices);
  }, [activeInvoiceId]);

  // ✅ LẮNG NGHE KẾT QUẢ THANH TOÁN TỪ TAB PAYMENT (VNPay/MoMo)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorage = (e) => {
      if (e.key !== 'POS_PAYMENT_RESULT' || !e.newValue) return;

      let payload;
      try {
        payload = JSON.parse(e.newValue);
      } catch (err) {
        console.error('Invalid POS_PAYMENT_RESULT payload:', err);
        return;
      }

      const { status, orderId, method, reason } = payload || {};
      if (!status) return;

      // Dọn key để không xử lý lại
      try {
        window.localStorage.removeItem('POS_PAYMENT_RESULT');
      } catch (err) {
        console.error('Cannot clear POS_PAYMENT_RESULT:', err);
      }

      // 🔍 Tìm invoice trong POS theo orderId
      const targetInvoice = invoices.find((inv) => inv.orderId === orderId);

      if (status === 'success') {
        // Xoá invoice khỏi POS
        if (targetInvoice) {
          const idToRemove = targetInvoice.id;
          const updated = invoices.filter((inv) => inv.id !== idToRemove);

          if (!updated.length) {
            setInvoices([]);
            setActiveInvoiceId(null);
          } else {
            if (idToRemove === activeInvoiceId) {
              setActiveInvoiceId(updated[0].id);
            }
            setInvoices(updated);
          }
        }

        showNotification(
          'success',
          `Đơn hàng đã thanh toán thành công qua ${
            method === 'momo'
              ? 'MoMo'
              : method === 'vnpay'
              ? 'VNPay'
              : 'cổng thanh toán'
          }.`
        );

        // ❌ Không điều hướng sang trang payment, giữ nguyên màn POS
      }

      if (status === 'failed') {
        showNotification(
          'error',
          'Thanh toán thất bại, vui lòng thử lại hoặc chọn phương thức khác.'
        );
        // ❌ Không điều hướng sang trang payment-failed
        console.warn(
          'POS payment failed:',
          reason || 'Thanh toán thất bại',
          method
        );
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [invoices, activeInvoiceId]);

  // Tạo đơn nháp -> gọi PosOrderController.createDraftOrder
  const handleAddInvoice = async () => {
    try {
      setCreating(true);

      const payload = {
        idTaiKhoan: null, // khách vãng lai
        idDiaChi: null,
        tenKhachHang: null,
        sdtKhachHang: null,
        loaiDon: 'TAI_QUAY',
        ghiChu: null,
      };

      const res = await createDraftOrder(payload);
      const order = unwrapApi(res); // PosOrderDetailDTO

      if (!order || !order.id) {
        showNotification(
          'error',
          'Không tạo được đơn POS, vui lòng kiểm tra API.'
        );
        return;
      }

      // ❗ Nếu BE trả về lại cùng một order (cùng order.id) -> chỉ focus tab cũ, không tạo tab mới
      const existed = invoices.find((inv) => inv.orderId === order.id);
      if (existed) {
        setActiveInvoiceId(existed.id);
        showNotification('info', 'Đã mở lại đơn POS đang có.');
        return;
      }

      const newIndex = invoices.length + 1;
      const tabId = `TAB_${newIndex}_${order.id}`; // luôn unique vì kèm cả UUID

      const newInvoice = {
        id: tabId, // id tab FE
        orderId: order.id, // UUID đơn
        maDonHang: order.maDonHang, // mã đơn từ BE (1 mã ↔ 1 orderId)
        customer: null,
        paymentMethod: 'Tiền mặt',
        customerCash: 0,
        itemCount: 0,
        orderStatus: order.trangThai,
      };

      setInvoices((prev) => [...prev, newInvoice]);
      setActiveInvoiceId(tabId);
      showNotification('success', 'Tạo đơn hàng POS mới thành công.');
    } catch (err) {
      console.error(err);
      showNotification(
        'error',
        'Không tạo được đơn hàng POS, vui lòng thử lại!'
      );
    } finally {
      setCreating(false);
    }
  };

  // Đóng tab (icon ×) -> nếu đơn còn nháp thì huỷ luôn trên BE
  const handleCloseInvoice = async (idToRemove) => {
    const invToRemove = invoices.find((inv) => inv.id === idToRemove);

    // ❗Chỉ huỷ trên BE nếu đơn đang ở trạng thái NHÁP
    if (
      invToRemove?.orderId &&
      invToRemove.orderStatus === ORDER_STATUS.DRAFT
    ) {
      try {
        await cancelOrder(invToRemove.orderId);
        showNotification('success', 'Đã huỷ đơn hàng');
      } catch (err) {
        console.error('Lỗi huỷ đơn POS khi đóng tab:', err);
        showNotification(
          'error',
          'Không thể huỷ đơn POS khi đóng tab, vui lòng thử lại.'
        );
      }
    } else {
      showNotification('info', 'Đã đóng tab đơn hàng.');
    }

    const updated = invoices.filter((inv) => inv.id !== idToRemove);

    if (!updated.length) {
      setInvoices([]);
      setActiveInvoiceId(null);
    } else {
      if (idToRemove === activeInvoiceId) {
        setActiveInvoiceId(updated[0].id);
      }
      setInvoices(updated);
    }
  };

  // Đơn đã hoàn tất thanh toán / huỷ từ trong InvoiceWorkingArea -> chỉ đóng tab FE
  const handleInvoiceDone = (idToRemove) => {
    const updated = invoices.filter((inv) => inv.id !== idToRemove);

    if (!updated.length) {
      setInvoices([]);
      setActiveInvoiceId(null);
    } else {
      if (idToRemove === activeInvoiceId) {
        setActiveInvoiceId(updated[0].id);
      }
      setInvoices(updated);
    }

    showNotification('success', 'Đã hoàn tất xử lý đơn POS.');
  };

  // Cập nhật info hiển thị trên tab (số lượng SP, mã đơn, trạng thái, khách hàng…)
  const updateActiveInvoice = (updates) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === activeInvoiceId ? { ...inv, ...updates } : inv
      )
    );
  };

  const activeInvoice = invoices.find((inv) => inv.id === activeInvoiceId);

  const tabStyle = (id) => ({
    padding: '10px 15px',
    border: '1px solid #e1e4e8',
    cursor: 'pointer',
    borderBottom: id === activeInvoiceId ? 'none' : '1px solid #e1e4e8',
    backgroundColor: id === activeInvoiceId ? 'white' : '#f0f0f0',
    borderRadius: '8px 8px 0 0',
    display: 'flex',
    alignItems: 'center',
    marginRight: '5px',
    color: id === activeInvoiceId ? '#007bff' : 'black',
    fontWeight: id === activeInvoiceId ? 'bold' : 'normal',
  });

  // --- MÀN HÌNH KHÔNG CÓ ĐƠN ---
  if (invoices.length === 0) {
    return (
      <div
        style={{
          padding: '20px',
          backgroundColor: '#f5f7fa',
          minHeight: '100vh',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        {/* Toast */}
        {notification && (
          <NotificationToast
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}

        <h3 style={{ margin: 0, paddingBottom: '20px' }}>
          <span style={{ color: '#28a745' }}>Bán hàng tại quầy</span>{' '}
          <small style={{ color: '#6c757d', fontWeight: 'normal' }}>
            Tạo đơn hàng
          </small>
          <button
            style={{
              float: 'right',
              background: 'none',
              border: 'none',
              color: '#007bff',
              cursor: 'pointer',
            }}
          ></button>
        </h3>
        <div
          style={{
            textAlign: 'center',
            padding: '100px',
            border: '1px solid',
            backgroundColor: 'white',
            borderRadius: '8px',
          }}
        >
          <p style={{ color: '#6c757d', marginBottom: '20px' }}>
            Chưa có đơn hàng nào
          </p>
          <button
            onClick={handleAddInvoice}
            disabled={creating}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              padding: '12px 25px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1.1em',
              opacity: creating ? 0.7 : 1,
            }}
          >
            + Tạo đơn hàng đầu tiên
          </button>
        </div>
      </div>
    );
  }

  // --- MÀN HÌNH CÓ ĐƠN ---
  return (
    <div
      style={{
        padding: '10px',
        backgroundColor: '#f5f7fa',
        minHeight: '100vh',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* Toast */}
      {notification && (
        <NotificationToast
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <h3 style={{ margin: 0, paddingBottom: '10px' }}>
        <span style={{ color: '#28a745' }}>Bán hàng tại quầy</span>{' '}
        <small style={{ color: '#6c757d', fontWeight: 'normal' }}>
          Tạo đơn hàng
        </small>
        <button
          style={{
            float: 'right',
            background: 'none',
            border: 'none',
            color: '#007bff',
            cursor: 'pointer',
          }}
        ></button>
      </h3>

      {/* Tabs */}
      <div style={{ display: 'flex', overflowX: 'auto', marginBottom: '-1px' }}>
        {invoices.map((inv) => (
          <div
            key={inv.id}
            style={tabStyle(inv.id)}
            onClick={() => setActiveInvoiceId(inv.id)}
          >
            <strong
              style={{
                color: inv.id === activeInvoiceId ? '#28a745' : 'black',
              }}
            >
              {inv.maDonHang || inv.id}
            </strong>
            {inv.itemCount > 0 && (
              <span
                style={{
                  marginLeft: '8px',
                  padding: '2px 6px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  borderRadius: '50%',
                  fontSize: '0.8em',
                }}
              >
                {inv.itemCount}
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCloseInvoice(inv.id);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#dc3545',
                marginLeft: '8px',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              &times;
            </button>
          </div>
        ))}
        <button
          onClick={handleAddInvoice}
          disabled={creating}
          style={{
            background: 'none',
            border: '1px solid #e1e4e8',
            color: '#6c757d',
            padding: '10px 15px',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            marginLeft: '5px',
            opacity: creating ? 0.7 : 1,
          }}
        >
          +
        </button>
      </div>

      {/* Nội dung đơn active */}
      {activeInvoice && (
        <InvoiceWorkingArea
          invoice={activeInvoice}
          updateInvoice={updateActiveInvoice}
          onConfirmOrder={() => handleInvoiceDone(activeInvoiceId)}
          formatCurrency={formatCurrency}
          showNotification={showNotification} // ✅ truyền xuống
        />
      )}
    </div>
  );
};

export default ListBanTaiQuayComponent;
