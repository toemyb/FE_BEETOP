// src/components/PaymentDetails.jsx

import React, { useMemo } from 'react';

const PaymentDetails = ({
  paymentMethod,
  setPaymentMethod,
  orderSummary,
  customerCash,
  setCustomerCash,
  formatCurrency,
  handleCheckout,
  // ✅ thêm prop (không bắt buộc truyền, default = 0)
  shippingFee = 0,
}) => {
  // Style
  const summaryRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px dotted #eee',
  };
  const paymentOptionStyle = (method) => ({
    border: paymentMethod === method ? '2px solid #007bff' : '1px solid #ccc',
    backgroundColor: paymentMethod === method ? '#e9f7ff' : 'white',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '8px',
    cursor: 'pointer',
  });
  const inputStyle = {
    width: '100%',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    marginTop: '5px',
    fontSize: '1em',
  };

  // ✅ FIX: tổng hiển thị nên luôn khớp với shipFee (phòng trường hợp orderSummary.total chưa include ship)
  const computed = useMemo(() => {
    const subtotal = Number(orderSummary?.subtotal || 0);
    const discount = Number(orderSummary?.totalDiscount ?? orderSummary?.discount ?? 0);
    const ship = Number(shippingFee || 0);

    const baseTotal = Number(orderSummary?.total || 0);
    const totalNoShip = Math.max(0, subtotal - discount);

    // Nếu baseTotal ~ (subtotal - discount) mà ship > 0 => cộng ship vào để hiển thị/validate đúng
    const eps = 1; // 1đ
    const displayTotal =
      ship > 0 && Math.abs(baseTotal - totalNoShip) <= eps
        ? Math.max(0, totalNoShip + ship)
        : baseTotal;

    const cash = Number(customerCash || 0);
    const change = cash > displayTotal ? cash - displayTotal : 0;

    return { subtotal, discount, ship, displayTotal, change };
  }, [orderSummary, shippingFee, customerCash]);

  return (
    <>
      {/* Phương thức thanh toán */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>
          Chọn phương thức:
        </p>
        <div
          onClick={() => setPaymentMethod('Tiền mặt')}
          style={paymentOptionStyle('Tiền mặt')}
        >
          <strong>💰 Tiền mặt</strong>
        </div>
        <div
          onClick={() => setPaymentMethod('Chuyển khoản')}
          style={paymentOptionStyle('Chuyển khoản')}
        >
          <strong>💳 Chuyển khoản (VNPay/QR Code)</strong>
        </div>
        <div onClick={() => setPaymentMethod('Thẻ')} style={paymentOptionStyle('Thẻ')}>
          <strong>💳 Thẻ Tín dụng/Ghi nợ</strong>
        </div>
      </div>

      {/* Tổng kết đơn hàng */}
      <div
        style={{
          border: '1px solid #ddd',
          padding: '15px',
          borderRadius: '4px',
          marginBottom: '20px',
          backgroundColor: '#f8f9fa',
        }}
      >
        <h4
          style={{
            borderBottom: '1px solid #ddd',
            paddingBottom: '10px',
            marginBottom: '10px',
          }}
        >
          📊 Tổng tiền
        </h4>

        {/* Tạm tính */}
        <div style={summaryRowStyle}>
          <span>Tạm tính:</span>
          <strong>{formatCurrency(computed.subtotal)}</strong>
        </div>

        {/* Giảm giá */}
        <div style={summaryRowStyle}>
          <span style={{ color: 'red' }}>Giảm giá (Voucher):</span>
          <strong style={{ color: 'red' }}>
            - {formatCurrency(computed.discount)}
          </strong>
        </div>

        {/* ✅ Phí vận chuyển */}
        <div style={summaryRowStyle}>
          <span>Phí vận chuyển:</span>
          <strong>{formatCurrency(computed.ship)}</strong>
        </div>

        {/* Tổng cộng */}
        <div style={{ ...summaryRowStyle, border: 'none', paddingTop: '10px' }}>
          <span>**TỔNG CỘNG KHÁCH CẦN TRẢ:**</span>
          <strong style={{ color: '#007bff', fontSize: '1.4em' }}>
            {formatCurrency(computed.displayTotal)}
          </strong>
        </div>

        {/* Tiền khách đưa (Chỉ cho Tiền mặt) */}
        {paymentMethod === 'Tiền mặt' && (
          <>
            <div style={{ marginTop: '15px' }}>
              <p style={{ margin: '0 0 5px 0' }}>Khách hàng đưa:</p>
              <input
                type="number"
                value={customerCash}
                onChange={(e) => setCustomerCash(parseInt(e.target.value, 10) || 0)}
                placeholder="Nhập số tiền khách đưa..."
                min={computed.displayTotal}
                style={inputStyle}
              />
            </div>
            <div style={{ ...summaryRowStyle, border: 'none', marginTop: '10px' }}>
              <span>TIỀN TRẢ LẠI:</span>
              <strong style={{ color: '#28a745', fontSize: '1.2em' }}>
                {formatCurrency(computed.change)}
              </strong>
            </div>
          </>
        )}
      </div>

      <button
        onClick={handleCheckout}
        disabled={paymentMethod === 'Tiền mặt' && Number(customerCash || 0) < computed.displayTotal}
        style={{
          width: '100%',
          backgroundColor: '#28a745',
          color: 'white',
          padding: '15px',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '1.2em',
          fontWeight: 'bold',
          opacity:
            paymentMethod === 'Tiền mặt' && Number(customerCash || 0) < computed.displayTotal
              ? 0.6
              : 1,
        }}
      >
        ✅ XÁC NHẬN THANH TOÁN
      </button>
    </>
  );
};

export default PaymentDetails;
