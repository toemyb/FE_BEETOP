// src/pages/PaymentFailedPage.jsx
import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const CARD_SHADOW = '0 8px 24px rgba(15, 23, 42, 0.08)';

const PaymentFailedPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const reason = searchParams.get('reason') || 'unknown';
  const method = (searchParams.get('method') || '').toLowerCase();

  const paymentMethodLabel =
    method === 'momo'
      ? 'MoMo'
      : method === 'vnpay'
      ? 'VNPay'
      : 'cổng thanh toán';

  // 🔁 Gửi tín hiệu thanh toán thất bại cho tab POS
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const payload = {
        status: 'failed',
        reason,
        method,
        ts: Date.now(),
      };
      window.localStorage.setItem(
        'POS_PAYMENT_RESULT',
        JSON.stringify(payload)
      );
    } catch (err) {
      console.error('PaymentFailedPage effect error:', err);
    }
  }, [reason, method]);

  const handleBackToPos = () => {
    navigate('/admin/ban-hang-tai-quay');
  };

  const handleBackToOrderList = () => {
    navigate('/admin/don-hang');
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
      {/* Header: Kết quả thanh toán */}
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
              backgroundColor: '#fff5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f03e3e',
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            !
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
        {/* Cột trái: Thông tin lỗi */}
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
                backgroundColor: '#fff5f5',
                margin: '0 auto 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f03e3e',
                fontSize: 30,
              }}
            >
              ×
            </div>
            <h2
              style={{
                margin: 0,
                color: '#c92a2a',
                fontSize: '1.3rem',
              }}
            >
              Thanh toán thất bại
            </h2>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: '0.9rem',
                color: '#495057',
              }}
            >
              Giao dịch chưa được hoàn tất. Vui lòng thử lại hoặc chọn phương
              thức khác.
            </p>
          </div>

          <div
            style={{
              borderRadius: 10,
              border: '1px solid #ffe3e3',
              padding: 14,
              backgroundColor: '#fff5f5',
            }}
          >
            <div
              style={{
                marginBottom: 8,
                fontWeight: 600,
                color: '#c92a2a',
                fontSize: '0.9rem',
              }}
            >
              Thông tin lỗi
            </div>

            <div
              style={{
                fontSize: '0.86rem',
                color: '#495057',
                lineHeight: 1.6,
              }}
            >
              <div>
                <span style={{ color: '#868e96' }}>Lý do:&nbsp;</span>
                <strong>{decodeURIComponent(reason)}</strong>
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
            Bạn có thể quay lại màn POS để chọn phương thức thanh toán khác
            hoặc thử lại giao dịch.
          </p>

          <button
            onClick={handleBackToPos}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: '#f03e3e',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.9rem',
              marginBottom: 8,
            }}
          >
            Quay lại bán hàng tại quầy
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
              backgroundColor: '#fff9db',
              border: '1px dashed #ffe066',
              fontSize: '0.8rem',
              color: '#495057',
            }}
          >
            Lưu ý: Nếu lỗi xảy ra liên tục, hãy kiểm tra lại cấu hình cổng
            thanh toán hoặc liên hệ bộ phận kỹ thuật.
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailedPage;
