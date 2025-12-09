import React, { useMemo } from 'react';

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.45)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 2000,
  fontFamily: 'Arial, sans-serif',
};

const modalStyle = {
  backgroundColor: '#fff',
  borderRadius: '12px',
  width: '780px',
  maxWidth: '95%',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 12px 28px rgba(0,0,0,0.25)',
  padding: '18px 20px 16px',
};

const sectionCard = {
  borderRadius: '8px',
  border: '1px solid #e9ecef',
  padding: '10px 12px',
  marginBottom: '10px',
  backgroundColor: '#f8f9fa',
};

const rowBetween = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const ConfirmationModal = ({
  orderSummary,
  cartItems,
  customer,
  paymentMethod,
  customerCash,
  formatCurrency,
  onClose,
  onConfirm,
}) => {
  const fmt = (v) =>
    typeof formatCurrency === 'function'
      ? formatCurrency(v)
      : `${(v || 0).toLocaleString('vi-VN')} ₫`;

  const totalItems = useMemo(
    () => cartItems.reduce((sum, i) => sum + (i.quantity || 1), 0),
    [cartItems]
  );

  const canConfirm =
    orderSummary.total > 0 &&
    (paymentMethod !== 'Tiền mặt' || (customerCash || 0) >= orderSummary.total);

  const change =
    paymentMethod === 'Tiền mặt' && customerCash
      ? Math.max(0, customerCash - orderSummary.total)
      : 0;

  const deliveryMethod = 'Lấy tại cửa hàng';

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {/* HEADER */}
        <div style={{ ...rowBetween, marginBottom: 8 }}>
          <h3
            style={{
              margin: 0,
              fontSize: '1.05rem',
              color: '#212529',
            }}
          >
            Xác nhận đơn hàng
          </h3>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '1.4rem',
              cursor: 'pointer',
              color: '#adb5bd',
            }}
          >
            ×
          </button>
        </div>

        {/* THÔNG TIN KHÁCH HÀNG */}
        <div style={sectionCard}>
          <div
            style={{
              marginBottom: 4,
              fontWeight: 600,
              color: '#495057',
              fontSize: '0.9rem',
            }}
          >
            Thông tin khách hàng
          </div>
          {customer ? (
            <>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                {customer.ten || customer.name}
              </div>
              <div
                style={{
                  fontSize: '0.88rem',
                  color: '#495057',
                  marginTop: 2,
                }}
              >
                <span>SĐT: {customer.soDienThoai || customer.phone}</span>
                {customer.email && (
                  <span style={{ marginLeft: 10 }}>• {customer.email}</span>
                )}
              </div>
            </>
          ) : (
            <div style={{ fontSize: '0.9rem', color: '#868e96' }}>
              Khách hàng vãng lai
            </div>
          )}
        </div>

        {/* SẢN PHẨM */}
        <div style={sectionCard}>
          <div style={{ ...rowBetween, marginBottom: 6 }}>
            <span
              style={{ fontWeight: 600, color: '#495057', fontSize: '0.9rem' }}
            >
              Sản phẩm ({totalItems} sản phẩm)
            </span>
            <span style={{ fontSize: '0.86rem', color: '#868e96' }}>
              Tạm tính: <strong>{fmt(orderSummary.subtotal)}</strong>
            </span>
          </div>
          <div
            style={{
              maxHeight: 220,
              overflowY: 'auto',
              borderRadius: 6,
              border: '1px solid #e9ecef',
              backgroundColor: '#fff',
            }}
          >
            {cartItems.map((item) => {
              // chuẩn hóa serial hiển thị
              let serialText = '';
              if (Array.isArray(item.serials) && item.serials.length > 0) {
                if (typeof item.serials[0] === 'string') {
                  serialText = item.serials.join(', ');
                } else {
                  serialText = item.serials
                    .map(
                      (s) =>
                        s.code || s.maSeri || s.idSeri || s.id || ''
                    )
                    .filter(Boolean)
                    .join(', ');
                }
              }

              return (
                <div
                  key={item.idLaptopCt}
                  style={{
                    padding: '8px 10px',
                    borderBottom: '1px solid #f1f3f5',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.86rem',
                  }}
                >
                  <div style={{ maxWidth: '65%' }}>
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
                          fontSize: '0.8rem',
                          color: '#495057',
                          marginBottom: 2,
                        }}
                      >
                        {item.version}
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: '0.8rem',
                        color: '#868e96',
                        marginTop: 2,
                      }}
                    >
                      SL: {item.quantity || 1}
                      {serialText && (
                        <span> • Seri: {serialText}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: 130 }}>
                    {item.originalPrice &&
                      item.originalPrice !== item.currentPrice && (
                        <div
                          style={{
                            textDecoration: 'line-through',
                            color: '#adb5bd',
                            fontSize: '0.78rem',
                          }}
                        >
                          {fmt(
                            (item.originalPrice || 0) *
                              (item.quantity || 1)
                          )}
                        </div>
                      )}
                    <div
                      style={{
                        color: '#e03131',
                        fontWeight: 600,
                        fontSize: '0.93rem',
                      }}
                    >
                      {fmt(
                        (item.currentPrice || 0) *
                          (item.quantity || 1)
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* THANH TOÁN & GIAO HÀNG */}
        <div style={sectionCard}>
          <div
            style={{
              marginBottom: 4,
              fontWeight: 600,
              color: '#495057',
              fontSize: '0.9rem',
            }}
          >
            Thanh toán &amp; Giao hàng
          </div>
          <div style={{ fontSize: '0.88rem', color: '#495057' }}>
            <div style={{ marginBottom: 3 }}>
              <strong>Phương thức thanh toán: </strong>
              <span>{paymentMethod}</span>
            </div>
            <div>
              <strong>Hình thức: </strong>
              <span>{deliveryMethod}</span>
            </div>
          </div>
        </div>

        {/* TỔNG KẾT ĐƠN HÀNG */}
        <div
          style={{
            ...sectionCard,
            backgroundColor: '#e6fcf5',
            borderColor: '#c3fae8',
          }}
        >
          <div style={{ ...rowBetween, marginBottom: 6 }}>
            <span
              style={{
                fontWeight: 600,
                color: '#2b8a3e',
                fontSize: '0.9rem',
              }}
            >
              Tổng kết đơn hàng
            </span>
          </div>
          <div
            style={{
              borderRadius: 6,
              padding: '8px 10px',
              backgroundColor: '#f8fffb',
              border: '1px dashed #b2f2bb',
              marginBottom: 6,
              fontSize: '0.86rem',
            }}
          >
            <div style={rowBetween}>
              <span>Tạm tính:</span>
              <strong>{fmt(orderSummary.subtotal)}</strong>
            </div>
            <div style={{ ...rowBetween, marginTop: 4 }}>
              <span style={{ color: '#e03131' }}>Giảm giá voucher:</span>
              <strong style={{ color: '#e03131' }}>
                - {fmt(orderSummary.totalDiscount)}
              </strong>
            </div>
          </div>

          <div
            style={{
              ...rowBetween,
              marginTop: 4,
              paddingTop: 4,
              borderTop: '1px solid #d3f9d8',
            }}
          >
            <span style={{ fontWeight: 700 }}>Tổng cộng:</span>
            <span
              style={{
                fontWeight: 700,
                color: '#2b8a3e',
                fontSize: '1.05rem',
              }}
            >
              {fmt(orderSummary.total)}
            </span>
          </div>

          {paymentMethod === 'Tiền mặt' && (
            <>
              <div
                style={{
                  ...rowBetween,
                  marginTop: 6,
                  fontSize: '0.86rem',
                  color: '#495057',
                }}
              >
                <span>Khách hàng đưa:</span>
                <strong>{fmt(customerCash || 0)}</strong>
              </div>
              <div
                style={{
                  ...rowBetween,
                  marginTop: 4,
                  fontSize: '0.86rem',
                  color: '#495057',
                }}
              >
                <span>Tiền trả lại:</span>
                <strong style={{ color: '#2b8a3e' }}>{fmt(change)}</strong>
              </div>
            </>
          )}
        </div>

        {/* FOOTER BUTTONS */}
        <div
          style={{
            ...rowBetween,
            marginTop: 10,
            paddingTop: 8,
            borderTop: '1px solid #e9ecef',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '7px 14px',
              borderRadius: 6,
              border: '1px solid #ced4da',
              backgroundColor: '#fff',
              cursor: 'pointer',
              color: '#495057',
              fontWeight: 600,
              fontSize: '0.86rem',
            }}
          >
            Hủy
          </button>
          <button
            onClick={canConfirm ? onConfirm : undefined}
            disabled={!canConfirm}
            style={{
              padding: '8px 18px',
              borderRadius: 6,
              border: 'none',
              backgroundColor: canConfirm ? '#12b886' : '#94d3ac',
              color: '#fff',
              cursor: canConfirm ? 'pointer' : 'not-allowed',
              fontWeight: 600,
              fontSize: '0.88rem',
            }}
          >
            ✓ Xác nhận thanh toán
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
