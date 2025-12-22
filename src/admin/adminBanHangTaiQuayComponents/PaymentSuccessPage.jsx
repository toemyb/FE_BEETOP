import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const CARD_SHADOW = '0 8px 24px rgba(15, 23, 42, 0.08)';

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const orderId = searchParams.get('orderId');
  const method = (searchParams.get('method') || '').toLowerCase();

  const paymentMethodLabel =
    method === 'momo'
      ? 'MoMo'
      : method === 'vnpay'
      ? 'VNPay'
      : 'cổng thanh toán';

  // 🔁 Gửi tín hiệu cho tab POS
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!orderId) return;

    try {
      // 1) Thông báo kết quả thanh toán cho các tab khác (POS)
      const payload = {
        status: 'success',
        orderId,
        method,
        ts: Date.now(),
      };
      window.localStorage.setItem(
        'POS_PAYMENT_RESULT',
        JSON.stringify(payload)
      );

      // 2) Dọn giỏ POS ở localStorage giống code cũ của bạn
      const raw = window.localStorage.getItem('posOpenInvoices');
      if (raw) {
        const list = JSON.parse(raw);
        const filtered = Array.isArray(list)
          ? list.filter((inv) => inv.orderId !== orderId)
          : [];
        if (filtered.length > 0) {
          window.localStorage.setItem(
            'posOpenInvoices',
            JSON.stringify(filtered)
          );
        } else {
          window.localStorage.removeItem('posOpenInvoices');
        }
      }

      // 3) Thử tự đóng tab (nếu browser cho phép)
      setTimeout(() => {
        try {
          window.close();
        } catch (e) {
          // nếu không đóng được thì thôi, user vẫn thấy trang này
          console.warn('Cannot close payment tab:', e);
        }
      }, 800);
    } catch (err) {
      console.error('PaymentSuccessPage effect error:', err);
    }
  }, [orderId, method]);

  const handleViewOrderDetail = () => {
    if (orderId) {
      navigate(`/admin/orders/${orderId}`);
    } else {
      navigate('/admin/don-hang');
    }
  };

  const handleBackToOrderList = () => {
    navigate('/admin/don-hang');
  };

  const handleBackToPos = () => {
    navigate('/admin/ban-hang-tai-quay');
  };

  return (
    <div
      style={{
        padding: '16px 24px 24px',
        backgroundColor: '#f5f7fb',
        minHeight: 'calc(100vh - 64px)',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* Header nhỏ: Kết quả thanh toán */}
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              backgroundColor: '#e7f5ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1c7ed6',
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            ℹ
          </div>
          <div>
            <div
              style={{
                fontSize: '0.95rem',
                fontWeight: 600,
                color: '#212529',
              }}
            >
              Kết quả thanh toán
            </div>
            <div
              style={{
                fontSize: '0.8rem',
                color: '#868e96',
                marginTop: 2,
              }}
            >
              Thông tin kết quả thanh toán từ {paymentMethodLabel}
            </div>
          </div>
        </div>

        <button
          onClick={handleBackToPos}
          style={{
            border: 'none',
            background: 'none',
            color: '#1971c2',
            cursor: 'pointer',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          ← Quay lại bán hàng tại quầy
        </button>
      </div>

      {/* Thân trang */}
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: 12,
          padding: 20,
          boxShadow: CARD_SHADOW,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1.2fr)',
          gap: 24,
        }}
      >
        {/* Cột trái: Thông tin giao dịch */}
        <div
          style={{
            borderRight: '1px solid #e9ecef',
            paddingRight: 20,
          }}
        >
          <div
            style={{
              textAlign: 'center',
              marginBottom: 18,
            }}
          >
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                backgroundColor: '#e6fcf5',
                margin: '0 auto 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#12b886',
                fontSize: 30,
              }}
            >
              ✓
            </div>
            <h2
              style={{
                margin: 0,
                color: '#2b8a3e',
                fontSize: '1.3rem',
              }}
            >
              Thanh toán thành công!
            </h2>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: '0.9rem',
                color: '#495057',
              }}
            >
              Giao dịch của bạn đã được xử lý thành công.
            </p>
          </div>

          <div
            style={{
              borderRadius: 10,
              border: '1px solid #e9ecef',
              padding: 14,
              backgroundColor: '#f8f9fa',
            }}
          >
            <div
              style={{
                marginBottom: 8,
                fontWeight: 600,
                color: '#495057',
                fontSize: '0.9rem',
              }}
            >
              Thông tin giao dịch
            </div>

            <div
              style={{
                fontSize: '0.86rem',
                color: '#495057',
                lineHeight: 1.6,
              }}
            >
              <div>
                <span style={{ color: '#868e96' }}>Mã đơn hàng:&nbsp;</span>
                <strong>{orderId || '—'}</strong>
              </div>
              <div>
                <span style={{ color: '#868e96' }}>
                  Phương thức thanh toán:&nbsp;
                </span>
                <strong>
                  {paymentMethodLabel === 'cổng thanh toán'
                    ? 'Không xác định'
                    : paymentMethodLabel}
                </strong>
              </div>
              <div>
                <span style={{ color: '#868e96' }}>Trạng thái:&nbsp;</span>
                <strong style={{ color: '#2b8a3e' }}>Thành công</strong>
              </div>
              <div>
                <span style={{ color: '#868e96' }}>Thời gian:&nbsp;</span>
                <span>{new Date().toLocaleString('vi-VN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cột phải: Bước tiếp theo */}
        <div>
          <div
            style={{
              marginBottom: 10,
              fontWeight: 600,
              color: '#495057',
              fontSize: '0.9rem',
            }}
          >
            Bước tiếp theo
          </div>

          <p
            style={{
              fontSize: '0.86rem',
              color: '#495057',
              marginTop: 0,
              marginBottom: 12,
            }}
          >
            Thanh toán đã được xử lý thành công. Bạn có thể:
          </p>

          <button
            onClick={handleViewOrderDetail}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: '#12b886',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.9rem',
              marginBottom: 8,
            }}
          >
            Xem chi tiết đơn hàng
          </button>

          <button
            onClick={handleBackToOrderList}
            style={{
              width: '100%',
              padding: '9px 14px',
              borderRadius: 8,
              border: '1px solid #ced4da',
              backgroundColor: '#fff',
              color: '#495057',
              fontWeight: 500,
              cursor: 'pointer',
              fontSize: '0.9rem',
              marginBottom: 16,
            }}
          >
            Về danh sách đơn hàng
          </button>

          <div
            style={{
              marginTop: 8,
              padding: '8px 10px',
              borderRadius: 6,
              backgroundColor: '#e7f5ff',
              border: '1px dashed #a5d8ff',
              fontSize: '0.8rem',
              color: '#495057',
            }}
          >
            Gợi ý: Sau khi kiểm tra đơn hàng, bạn có thể quay lại màn{' '}
            <strong>“Bán hàng tại quầy”</strong> để tiếp tục tạo đơn mới.
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
