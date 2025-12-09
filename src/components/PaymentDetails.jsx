// src/components/PaymentDetails.jsx

import React from 'react';

const PaymentDetails = ({
  paymentMethod, setPaymentMethod, orderSummary, customerCash, setCustomerCash, formatCurrency, handleCheckout
}) => {
    
  // Style
  const summaryRowStyle = { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dotted #eee' };
  const paymentOptionStyle = (method) => ({ 
      border: paymentMethod === method ? '2px solid #007bff' : '1px solid #ccc', 
      backgroundColor: paymentMethod === method ? '#e9f7ff' : 'white',
      padding: '12px', borderRadius: '4px', marginBottom: '8px', cursor: 'pointer' 
  });
  const inputStyle = { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '5px', fontSize: '1em' };

  return (
    <>
      {/* Phương thức thanh toán */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Chọn phương thức:</p>
        <div onClick={() => setPaymentMethod('Tiền mặt')} style={paymentOptionStyle('Tiền mặt')}>
          <strong>💰 Tiền mặt</strong>
        </div>
        <div onClick={() => setPaymentMethod('Chuyển khoản')} style={paymentOptionStyle('Chuyển khoản')}>
          <strong>💳 Chuyển khoản (VNPay/QR Code)</strong>
        </div>
        <div onClick={() => setPaymentMethod('Thẻ')} style={paymentOptionStyle('Thẻ')}>
          <strong>💳 Thẻ Tín dụng/Ghi nợ</strong>
        </div>
      </div>

      {/* Tổng kết đơn hàng */}
      <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '4px', marginBottom: '20px', backgroundColor: '#f8f9fa' }}>
        <h4 style={{ borderBottom: '1px solid #ddd', paddingBottom: '10px', marginBottom: '10px' }}>📊 Tổng tiền</h4>
        
        {/* Tạm tính */}
        <div style={summaryRowStyle}>
          <span>Tạm tính:</span>
          <strong>{formatCurrency(orderSummary.subtotal)}</strong>
        </div>
        
        {/* Giảm giá */}
         <div style={summaryRowStyle}>
          <span style={{ color: 'red' }}>Giảm giá (Voucher):</span>
          <strong style={{ color: 'red' }}>
            - {formatCurrency(orderSummary.totalDiscount ?? orderSummary.discount ?? 0)}
          </strong>
        </div>
        {/* Tổng cộng */}
        <div style={{ ...summaryRowStyle, border: 'none', paddingTop: '10px' }}>
          <span>**TỔNG CỘNG KHÁCH CẦN TRẢ:**</span>
          <strong style={{ color: '#007bff', fontSize: '1.4em' }}>{formatCurrency(orderSummary.total)}</strong>
        </div>

        {/* Tiền khách đưa (Chỉ cho Tiền mặt) */}
        {paymentMethod === 'Tiền mặt' && (
            <>
                <div style={{ marginTop: '15px' }}>
                    <p style={{ margin: '0 0 5px 0' }}>Khách hàng đưa:</p>
                    <input
                        type="number"
                        value={customerCash}
                        onChange={(e) => setCustomerCash(parseInt(e.target.value) || 0)}
                        placeholder="Nhập số tiền khách đưa..."
                        min={orderSummary.total}
                        style={inputStyle}
                    />
                </div>
                <div style={{ ...summaryRowStyle, border: 'none', marginTop: '10px' }}>
                    <span>TIỀN TRẢ LẠI:</span>
                    <strong style={{ color: '#28a745', fontSize: '1.2em' }}>{formatCurrency(orderSummary.change)}</strong>
                </div>
            </>
        )}
      </div>

      <button
        onClick={handleCheckout}
        disabled={paymentMethod === 'Tiền mặt' && customerCash < orderSummary.total}
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
            opacity: (paymentMethod === 'Tiền mặt' && customerCash < orderSummary.total) ? 0.6 : 1 
        }}
      >
        ✅ XÁC NHẬN THANH TOÁN
      </button>
    </>
  );
};

export default PaymentDetails;