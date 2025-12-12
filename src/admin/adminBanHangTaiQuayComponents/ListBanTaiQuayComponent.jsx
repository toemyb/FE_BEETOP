// src/admin/adminBanHangTaiQuayComponents/ListBanTaiQuayComponent.jsx
import React, { useState, useEffect } from 'react';
import InvoiceWorkingArea from './InvoiceWorkingArea.jsx';
import {
  createDraftOrder,
  cancelOrder,
  unwrapApi,
} from '../../service/PosOrderService';

const MAX_INVOICES = 5;
const LOCAL_KEY = 'posOpenInvoices';

const NotificationToast = ({ type = 'info', message, onClose }) => {
  const colors = {
    success: '#12b886',
    error: '#fa5252',
    warning: '#f08c00',
    info: '#228be6',
  };

  return (
    <div style={{
      position: 'fixed',
      top: 20,
      right: 20,
      zIndex: 9999,
      minWidth: 300,
      backgroundColor: colors[type],
      color: '#fff',
      padding: '12px 16px',
      borderRadius: 12,
      boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      fontSize: '0.95rem',
      fontWeight: 600,
    }}>
      <span>{type === 'success' ? 'Thành công' : type === 'error' ? 'Lỗi' : type === 'warning' ? 'Cảnh báo' : 'Thông tin'}</span>
      <div style={{ flex: 1 }}>{message}</div>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.4rem', cursor: 'pointer' }}>
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
    setTimeout(() => setNotification(null), 4000);
  };

  // Load từ localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setInvoices(parsed);
          if (parsed.length > 0) setActiveInvoiceId(parsed[0].id);
        }
      }
    } catch (e) { console.error(e); }
  }, []);

  // Lưu vào localStorage
  useEffect(() => {
    try {
      if (invoices.length === 0) {
        localStorage.removeItem(LOCAL_KEY);
      } else {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(invoices));
      }
    } catch (e) { console.error(e); }
  }, [invoices]);

  // Đồng bộ giữa các tab
  useEffect(() => {
    const handler = (e) => {
      if (e.key !== LOCAL_KEY) return;
      try {
        const data = e.newValue ? JSON.parse(e.newValue) : [];
        setInvoices(data);
        if (data.length === 0) setActiveInvoiceId(null);
      } catch (e) {}
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // QUAN TRỌNG: LẮNG NGHE KẾT QUẢ THANH TOÁN TỪ VNPAY/MOMO (đã bổ sung lại)
  useEffect(() => {
    const handlePaymentResult = (e) => {
      if (e.key !== 'POS_PAYMENT_RESULT' || !e.newValue) return;

      let payload;
      try {
        payload = JSON.parse(e.newValue);
      } catch (err) {
        console.error('Invalid payment result:', err);
        return;
      }

      const { status, orderId, method } = payload;

      localStorage.removeItem('POS_PAYMENT_RESULT');

      const target = invoices.find(inv => inv.orderId === orderId);

      if (status === 'success' && target) {
        // Đóng tab đơn đã thanh toán
        setInvoices(prev => prev.filter(inv => inv.orderId !== orderId));
        if (target.id === activeInvoiceId && invoices.length > 1) {
          setActiveInvoiceId(invoices.find(i => i.orderId !== orderId).id);
        }
        showNotification('success', `Đơn ${target.maDonHang} đã thanh toán thành công qua ${method === 'momo' ? 'MoMo' : 'VNPay'}!`);
      }

      if (status === 'failed') {
        showNotification('error', 'Thanh toán thất bại, vui lòng thử lại');
      }
    };

    window.addEventListener('storage', handlePaymentResult);
    return () => window.removeEventListener('storage', handlePaymentResult);
  }, [invoices, activeInvoiceId]);

  // Tạo đơn mới
  const handleAddInvoice = async () => {
    if (invoices.length >= MAX_INVOICES) {
      showNotification('warning', `Chỉ được mở tối đa ${MAX_INVOICES} giỏ hàng!`);
      return;
    }

    setCreating(true);
    try {
      const res = await createDraftOrder({ loaiDon: 'TAI_QUAY' });
      const order = unwrapApi(res);

      const existed = invoices.find(i => i.orderId === order.id);
      if (existed) {
        setActiveInvoiceId(existed.id);
        showNotification('info', 'Đã chuyển sang giỏ hàng đang mở');
        return;
      }

      const newInv = {
        id: `TAB_${Date.now()}`,
        orderId: order.id,
        maDonHang: order.maDonHang || 'Đơn mới',
        customer: null,
        paymentMethod: 'Tiền mặt',
        customerCash: 0,
        itemCount: 0,
        orderStatus: order.trangThai,
      };

      setInvoices(prev => [...prev, newInv]);
      setActiveInvoiceId(newInv.id);
      showNotification('success', 'Tạo giỏ hàng mới thành công');
    } catch (err) {
      showNotification('error', 'Không thể tạo đơn hàng mới');
    } finally {
      setCreating(false);
    }
  };

  const handleCloseInvoice = async (idToClose) => {
    const inv = invoices.find(i => i.id === idToClose);
    if (inv?.orderId && inv.orderStatus === 1) {
      try { await cancelOrder(inv.orderId); } catch (e) {}
    }

    const updated = invoices.filter(i => i.id !== idToClose);
    setInvoices(updated);
    if (idToClose === activeInvoiceId) {
      setActiveInvoiceId(updated[0]?.id || null);
    }
  };

  const handleInvoiceDone = (id) => {
    setInvoices(prev => prev.filter(i => i.id !== id));
    if (id === activeInvoiceId && invoices.length > 1) {
      setActiveInvoiceId(invoices.find(i => i.id !== id).id);
    }
  };

  const updateActiveInvoice = (updates) => {
    setInvoices(prev =>
      prev.map(inv =>
        inv.id === activeInvoiceId ? { ...inv, ...updates } : inv
      )
    );
  };

  const activeInvoice = invoices.find(i => i.id === activeInvoiceId);

  return (
    <div style={{ padding: '12px', background: '#f5f7fa', minHeight: '100vh' }}>
      {notification && (
        <NotificationToast {...notification} onClose={() => setNotification(null)} />
      )}

      <h3 style={{ margin: '0 0 16px', color: '#212529', fontSize: '1.6rem', fontWeight: 700 }}>
        Bán hàng tại quầy
        <span style={{ fontSize: '1rem', color: '#6c757d', marginLeft: 12 }}>
          ({invoices.length}/{MAX_INVOICES} giỏ)
        </span>
      </h3>

      {/* Tabs */}
      <div style={{ display: 'flex', overflowX: 'auto', paddingBottom: 8, gap: 8, marginBottom: 12 }}>
        {invoices.map(inv => (
          <div
            key={inv.id}
            onClick={() => setActiveInvoiceId(inv.id)}
            style={{
              padding: '10px 16px',
              background: inv.id === activeInvoiceId ? '#fff' : '#f1f3f5',
              border: '1px solid #dee2e6',
              borderBottom: inv.id === activeInvoiceId ? 'none' : '1px solid #dee2e6',
              borderRadius: '12px 12px 0 0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              minWidth: 140,
              boxShadow: inv.id === activeInvoiceId ? '0 -4px 10px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            <strong style={{ color: inv.id === activeInvoiceId ? '#12b886' : '#495057' }}>
              {inv.maDonHang || 'Đơn mới'}
            </strong>
            {inv.itemCount > 0 && (
              <span style={{
                background: '#12b886',
                color: 'white',
                borderRadius: '50%',
                width: 22,
                height: 22,
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {inv.itemCount}
              </span>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); handleCloseInvoice(inv.id); }}
              style={{ background: 'none', border: 'none', color: '#e03131', fontSize: 18, cursor: 'pointer' }}
            >
              ×
            </button>
          </div>
        ))}

        <button
          onClick={handleAddInvoice}
          disabled={invoices.length >= MAX_INVOICES || creating}
          style={{
            padding: '10px 20px',
            background: invoices.length >= MAX_INVOICES ? '#ccc' : '#12b886',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            cursor: invoices.length >= MAX_INVOICES ? 'not-allowed' : 'pointer',
            fontWeight: 600,
          }}
        >
          + Giỏ mới
        </button>
      </div>

      {/* Nội dung */}
      {activeInvoice ? (
        <InvoiceWorkingArea
          invoice={activeInvoice}
          updateInvoice={updateActiveInvoice}
          onConfirmOrder={() => handleInvoiceDone(activeInvoiceId)}
          showNotification={showNotification}
        />
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '120px 20px',
          background: 'white',
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        }}>
          <p style={{ fontSize: '1.2rem', color: '#6c757d' }}>Chưa có giỏ hàng nào</p>
          <button
            onClick={handleAddInvoice}
            style={{
              background: '#12b886',
              color: 'white',
              padding: '14px 32px',
              border: 'none',
              borderRadius: 12,
              fontSize: '1.1rem',
              cursor: 'pointer',
            }}
          >
            + Tạo đơn hàng đầu tiên
          </button>
        </div>
      )}
    </div>
  );
};

export default ListBanTaiQuayComponent;