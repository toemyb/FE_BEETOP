// src/components/VoucherSelector.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { listVouchers } from '../service/PhieuGiamGiaService';

// Layout Modal dùng chung
const ModalLayout = ({ title, onClose, children, width = '550px' }) => (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.45)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      fontFamily: 'Arial, sans-serif',
    }}
  >
    <div
      style={{
        backgroundColor: '#ffffff',
        padding: '24px 26px 22px',
        borderRadius: '12px',
        width,
        maxWidth: '95%',
        boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}
    >
      <h3
        style={{
          borderBottom: '1px solid #f0f0f0',
          paddingBottom: '10px',
          margin: '0 0 16px 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#333',
          fontSize: '1.15rem',
        }}
      >
        {title}
        <button
          onClick={onClose}
          style={{
            border: 'none',
            background: 'none',
            fontSize: '1.5em',
            cursor: 'pointer',
            color: '#999',
          }}
        >
          &times;
        </button>
      </h3>
      {children}
    </div>
  </div>
);

/**
 * props:
 *  - appliedVouchers: mảng voucher đang áp dụng ở hóa đơn
 *  - onApplyVouchers(listVoucherMoi)
 *  - onClose
 *  - orderSummary: { subtotal, ... }
 *  - formatCurrency: function
 */
const VoucherSelector = ({
  appliedVouchers = [],
  onClose,
  onApplyVouchers,
  orderSummary,
  formatCurrency,
}) => {
  const primaryColor = '#12b886';
  const secondaryColor = '#0070f3';

  const [rawVouchers, setRawVouchers] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ selectedIds giờ là LIST UUID (string) của voucher
  const [selectedIds, setSelectedIds] = useState(() =>
    appliedVouchers.map((v) => v.id) // id = UUID
  );

  const subtotal = orderSummary?.subtotal || 0;

  // ====== LẤY LIST VOUCHER TỪ API /api/phieu-giam-gia ======
  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await listVouchers();
        const data = Array.isArray(res.data) ? res.data : [];
        setRawVouchers(data);
      } catch (e) {
        console.error('Lỗi load danh sách voucher:', e);
        setRawVouchers([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // ====== Helper ======
  const isDateActive = (v) => {
    const today = new Date();
    const startOk = v.ngayBatDau ? new Date(v.ngayBatDau) <= today : true;
    const endOk = v.ngayKetThuc ? new Date(v.ngayKetThuc) >= today : true;
    return startOk && endOk;
  };

  const calcDiscount = (v) => {
    const value = Number(v.giaTriGiam ?? 0) || 0;
    if (!subtotal || subtotal <= 0 || value <= 0) return 0;

    if (v.kieuGiamGia === 'GIAM_PHAN_TRAM') {
      const d = (subtotal * value) / 100;
      return d > subtotal ? subtotal : d;
    }
    // GIAM_CO_DINH
    return value > subtotal ? subtotal : value;
  };

  const labelGiaTriGiam = (v) => {
    const value = Number(v.giaTriGiam ?? 0) || 0;
    if (v.kieuGiamGia === 'GIAM_PHAN_TRAM') return `${value}%`;
    return formatCurrency(value);
  };

  // ✅ Chuẩn hóa & tính giảm
  //    - id: UUID dùng cho BE
  //    - code: mã hiển thị kiểu "PGG0022"
  const vouchers = useMemo(
  () =>
    (rawVouchers || []).map((v) => {
      // 💡 Với API /phieu-giam-gia hiện tại, mã voucher là idPhieugiamgia (PGG001...)
      const codeFromApi =
        v.idPhieugiamgia ||   // từ ListPhieuGiamGiaComponent
        v.idPhieuGiamGia ||   // phòng trường hợp BE trả camel-case
        v.ma ||
        v.maPhieu ||
        v.maPhieuGiamGia ||
        v.maVoucher ||
        v.code;

      const uuid =
        codeFromApi ||        // dùng chính mã này làm id
        v.id ||
        v.uuid ||
        v.idVoucher;

      const code = codeFromApi || uuid;

      return {
        ...v,
        id: uuid,              // 🚩 id FE & gửi lên BE (string mã voucher)
        uuid,
        code,                  // hiển thị
        name: v.ten || v.name || v.moTa || code,
        discount: calcDiscount(v),
      };
    }),
  [rawVouchers, subtotal]
);

  // voucher đang hoạt động & trong thời gian
  const activeByStatusAndDate = useMemo(
    () => vouchers.filter((v) => v.trangThai === 1 && isDateActive(v)),
    [vouchers]
  );

  // voucher đủ điều kiện theo đơn hiện tại
  const applicable = useMemo(() => {
    return activeByStatusAndDate.filter((v) => {
      const minOrder = Number(v.giaTriMin || 0);
      const minOk = minOrder ? subtotal >= minOrder : true;

      return minOk;
    });
  }, [activeByStatusAndDate, subtotal]);

  // voucher “gợi ý tiết kiệm” (chưa đủ min)
  const savingSuggestions = useMemo(() => {
    return activeByStatusAndDate.filter((v) => {
      const minOrder = Number(v.giaTriMin || 0);
      if (!minOrder) return false;
      return subtotal > 0 && subtotal < minOrder;
    });
  }, [activeByStatusAndDate, subtotal]);

  // voucher “tự động tốt nhất”
  const bestVoucher = useMemo(() => {
    if (!applicable.length) return null;
    let best = applicable[0];
    applicable.forEach((v) => {
      if (v.discount > best.discount) best = v;
    });
    return best.discount > 0 ? best : null;
  }, [applicable]);

  // Nếu chưa có gì chọn thì auto chọn best
  useEffect(() => {
    if (!bestVoucher) return;
    if (selectedIds.length) return;
    if (!bestVoucher.id) return;
    setSelectedIds([bestVoucher.id]); // id = UUID
  }, [bestVoucher, selectedIds.length]);

  const otherApplicable = bestVoucher
    ? applicable.filter((v) => v.id !== bestVoucher.id)
    : applicable;

  const isSelected = (id) => selectedIds.includes(id);

  const toggleVoucher = (v) => {
    if (!v.id) return; // không có UUID thì bỏ qua
    setSelectedIds((prev) =>
      prev.includes(v.id) ? prev.filter((x) => x !== v.id) : [...prev, v.id]
    );
  };

  // ✅ Khi bấm "Áp dụng" → trả về list voucher đã được normalize:
  //   - v.id  = UUID
  //   - v.code = mã hiển thị
  const handleApply = () => {
    const selected = vouchers.filter((v) => selectedIds.includes(v.id));
    onApplyVouchers(selected);
  };

  const tempTotalDiscount = vouchers
    .filter((v) => selectedIds.includes(v.id))
    .reduce((sum, v) => sum + (v.discount || 0), 0);

  const extraToReachMin = (v) => {
    const minOrder = Number(v.giaTriMin || 0);
    if (!minOrder || subtotal >= minOrder) return 0;
    return minOrder - subtotal;
  };

  return (
    <ModalLayout title="Voucher giảm giá" onClose={onClose}>
      {/* Tổng đơn */}
      <div
        style={{
          padding: '10px 12px',
          background: '#e7f5ff',
          borderRadius: 8,
          borderLeft: `4px solid ${secondaryColor}`,
          marginBottom: 14,
          fontSize: '0.9rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Tổng đơn hàng (chưa giảm)</span>
          <strong style={{ color: secondaryColor }}>
            {formatCurrency(subtotal)}
          </strong>
        </div>
      </div>

      {/* VOUCHER TỰ ĐỘNG ÁP DỤNG */}
      <div style={{ marginBottom: 14 }}>
        <p
          style={{
            margin: '0 0 6px',
            fontWeight: 600,
            fontSize: '0.9rem',
            color: '#495057',
          }}
        >
          Voucher tự động áp dụng
        </p>

        {loading ? (
          <div
            style={{
              padding: 10,
              borderRadius: 8,
              background: '#f8f9fa',
              fontSize: '0.85rem',
            }}
          >
            Đang tải voucher...
          </div>
        ) : bestVoucher ? (
          <div
            onClick={() => toggleVoucher(bestVoucher)}
            style={{
              borderRadius: 10,
              padding: '10px 12px',
              border: isSelected(bestVoucher.id)
                ? `1px solid ${primaryColor}`
                : '1px solid #e9ecef',
              backgroundColor: isSelected(bestVoucher.id)
                ? '#e6fcf5'
                : '#f4fdf7',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                checked={isSelected(bestVoucher.id)}
                readOnly
                style={{ accentColor: primaryColor }}
              />
              <div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    marginBottom: 2,
                  }}
                >
                  {bestVoucher.code}
                </div>
                <div
                  style={{
                    fontSize: '0.8rem',
                    color: '#20c997',
                    fontWeight: 600,
                  }}
                >
                  Giảm {labelGiaTriGiam(bestVoucher)}{' '}
                  <span style={{ color: '#868e96' }}>
                    ({formatCurrency(bestVoucher.discount || 0)} thực tế)
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  padding: '2px 8px',
                  fontSize: '0.7rem',
                  borderRadius: 999,
                  backgroundColor: '#d8f5a2',
                  color: '#5c940d',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                Lựa chọn tối ưu nhất
              </div>
              {isSelected(bestVoucher.id) && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIds((prev) =>
                      prev.filter((x) => x !== bestVoucher.id)
                    );
                  }}
                  style={{
                    cursor: 'pointer',
                    color: '#f03e3e',
                    fontSize: '1.1rem',
                  }}
                >
                  ×
                </span>
              )}
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: 10,
              borderRadius: 8,
              background: '#f8f9fa',
              fontSize: '0.85rem',
              color: '#868e96',
            }}
          >
            Không có voucher nào phù hợp để tự động áp dụng.
          </div>
        )}
      </div>

      {/* VOUCHER KHẢ DỤNG */}
      <div style={{ marginBottom: 10 }}>
        <p
          style={{
            margin: '0 0 6px',
            fontWeight: 600,
            fontSize: '0.9rem',
            color: '#495057',
          }}
        >
          Voucher khả dụng
        </p>

        <div
          style={{
            maxHeight: 220,
            overflowY: 'auto',
            borderRadius: 8,
            border: otherApplicable.length ? '1px solid #e9ecef' : 'none',
          }}
        >
          {loading ? (
            <div
              style={{
                padding: 10,
                fontSize: '0.85rem',
                background: '#f8f9fa',
              }}
            >
              Đang tải voucher...
            </div>
          ) : !otherApplicable.length ? (
            <div
              style={{
                padding: 10,
                fontSize: '0.85rem',
                background: '#f8f9fa',
                color: '#868e96',
              }}
            >
              Không còn voucher khả dụng khác.
            </div>
          ) : (
            otherApplicable.map((v) => (
              <div
                key={v.id}
                onClick={() => toggleVoucher(v)}
                style={{
                  padding: '9px 11px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f1f3f5',
                  backgroundColor: isSelected(v.id) ? '#f1fdf5' : 'white',
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      marginBottom: 2,
                    }}
                  >
                    {v.name}
                  </div>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: '#20c997',
                      fontWeight: 600,
                    }}
                  >
                    Giảm {labelGiaTriGiam(v)}{' '}
                    {v.discount ? (
                      <span style={{ color: '#868e96' }}>
                        ({formatCurrency(v.discount)} thực tế)
                      </span>
                    ) : null}
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: '#868e96',
                      marginTop: 2,
                    }}
                  >
                    Đơn tối thiểu:{' '}
                    {v.giaTriMin ? formatCurrency(v.giaTriMin) : '0 ₫'}
                    {v.ngayKetThuc && (
                      <>
                        {' '}
                        • Hết hạn:{' '}
                        {new Date(v.ngayKetThuc).toLocaleDateString('vi-VN')}
                      </>
                    )}
                  </div>
                </div>

                <button
                  style={{
                    borderRadius: '50%',
                    border: '1px solid #ced4da',
                    width: 26,
                    height: 26,
                    padding: 0,
                    backgroundColor: isSelected(v.id) ? '#51cf66' : '#fff',
                    color: isSelected(v.id) ? '#fff' : '#343a40',
                    fontWeight: 700,
                    fontSize: '1rem',
                    lineHeight: 1,
                    cursor: 'pointer',
                  }}
                >
                  {isSelected(v.id) ? '✓' : '+'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* GỢI Ý TIẾT KIỆM */}
      <div style={{ marginTop: 10 }}>
        <p
          style={{
            margin: '0 0 6px',
            fontWeight: 600,
            fontSize: '0.9rem',
            color: '#495057',
          }}
        >
          Gợi ý tiết kiệm
        </p>

        <div
          style={{
            maxHeight: 200,
            overflowY: 'auto',
            borderRadius: 8,
          }}
        >
          {loading ? (
            <div
              style={{
                padding: 10,
                fontSize: '0.85rem',
                background: '#f8f9fa',
              }}
            >
              Đang tải voucher...
            </div>
          ) : !savingSuggestions.length ? (
            <div
              style={{
                padding: 10,
                fontSize: '0.85rem',
                background: '#f8f9fa',
                color: '#868e96',
              }}
            >
              Chưa có gợi ý tiết kiệm phù hợp.
            </div>
          ) : (
            savingSuggestions.map((v) => {
              const extra = extraToReachMin(v);
              return (
                <div
                  key={v.id}
                  style={{
                    padding: '9px 11px',
                    borderRadius: 10,
                    border: '1px dashed #ffd6cc',
                    background: '#fff5f5',
                    marginBottom: 8,
                    fontSize: '0.8rem',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      marginBottom: 2,
                    }}
                  >
                    {v.name}
                  </div>
                  <div style={{ color: '#f03e3e', marginBottom: 2 }}>
                    Giảm {labelGiaTriGiam(v)}
                  </div>
                  {extra > 0 && (
                    <div style={{ color: '#e03131' }}>
                      Mua thêm {formatCurrency(extra)} để được giảm{' '}
                      {labelGiaTriGiam(v)}
                    </div>
                  )}
                  <div style={{ color: '#868e96', marginTop: 2 }}>
                    Đơn tối thiểu: {formatCurrency(v.giaTriMin || 0)}
                    {v.ngayKetThuc && (
                      <>
                        {' '}
                        • Hết hạn:{' '}
                        {new Date(v.ngayKetThuc).toLocaleDateString('vi-VN')}
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* TỔNG GIẢM & BUTTON */}
      <div
        style={{
          borderTop: '1px solid #e9ecef',
          paddingTop: 12,
          marginTop: 10,
        }}
      >
        <p
          style={{
            margin: '0 0 10px',
            fontWeight: 600,
            fontSize: '0.95rem',
          }}
        >
          Tổng giảm tạm tính:{' '}
          <span style={{ float: 'right', color: '#e03131' }}>
            {formatCurrency(tempTotalDiscount)}
          </span>
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
            onClick={onClose}
            style={{
              padding: '9px 16px',
              borderRadius: 6,
              border: '1px solid #ced4da',
              backgroundColor: '#fff',
              cursor: 'pointer',
              color: '#495057',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            Hủy
          </button>
          <button
            onClick={handleApply}
            style={{
              padding: '9px 18px',
              borderRadius: 6,
              border: 'none',
              backgroundColor: primaryColor,
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              opacity: selectedIds.length ? 1 : 0.6,
            }}
            disabled={!selectedIds.length}
          >
            Áp dụng ({selectedIds.length})
          </button>
        </div>
      </div>
    </ModalLayout>
  );
};

export default VoucherSelector;
