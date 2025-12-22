import React, { useState, useEffect } from 'react';
import {
  getAllLaptopCT,
  getLaptopCTByLaptop,
} from '../service/LapTopCTService';
import { getSeriByLaptopCt } from '../service/SeriService';

// SERI STATUS
// 1: ACTIVE | 2: PENDING | 3: SOLD
const SERI_ACTIVE = 1;

// Seri có sẵn khi trangThai = SERI_ACTIVE (1)
const isSeriAvailable = (s) => Number(s?.trangThai) === SERI_ACTIVE;

// Layout chung cho Modal
const ModalLayout = ({ title, onClose, children, width = '900px' }) => (
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
        backgroundColor: '#fff',
        padding: '18px 20px',
        borderRadius: '10px',
        width,
        maxWidth: '95%',
        boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
        maxHeight: '92vh',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          borderBottom: '1px solid #e9ecef',
          paddingBottom: '8px',
          marginBottom: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: '1.05rem',
            color: '#212529',
          }}
        >
          {title}
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
          &times;
        </button>
      </div>
      {children}
    </div>
  </div>
);

const ProductSelector = ({
  idLaptop,
  onClose,
  onAddProducts,
  formatCurrency,
}) => {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);

  const [serials, setSerials] = useState([]);
  const [loadingSerials, setLoadingSerials] = useState(false);
  const [selectedSerials, setSelectedSerials] = useState([]);

  const [seriCounts, setSeriCounts] = useState({});

  const [productKeyword, setProductKeyword] = useState('');
  const [serialKeyword, setSerialKeyword] = useState('');

  const tableHeaderStyle = {
    padding: '7px 8px',
    textAlign: 'left',
    borderBottom: '2px solid #dee2e6',
    backgroundColor: '#f8f9fa',
    fontSize: '0.78rem',
    whiteSpace: 'nowrap',
  };
  const tableCellStyle = {
    padding: '7px 8px',
    borderBottom: '1px solid #f1f3f5',
    fontSize: '0.8rem',
    verticalAlign: 'middle',
  };
  const actionButtonStyle = {
    padding: '6px 10px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    backgroundColor: '#1971c2',
    color: 'white',
    fontWeight: '600',
    fontSize: '0.78rem',
  };

  const formatDateTime = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return (
      d.toLocaleTimeString('vi-VN', { hour12: false }) +
      ' ' +
      d.toLocaleDateString('vi-VN')
    );
  };

  // #1 Lấy LaptopChiTiet
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);

        let res;
        if (idLaptop) {
          res = await getLaptopCTByLaptop(idLaptop);
        } else {
          res = await getAllLaptopCT(1, 50);
        }

        const raw = res.data?.data ?? res.data;
        let list = [];

        if (Array.isArray(raw)) {
          list = raw;
        } else if (raw?.content && Array.isArray(raw.content)) {
          list = raw.content;
        } else if (Array.isArray(res.data)) {
          list = res.data;
        }

        setProducts(list || []);
      } catch (error) {
        console.error('Lỗi load LaptopChiTiet:', error);
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [idLaptop]);

  // #1.1 Đếm số seri AVAILABLE theo LaptopCt
  useEffect(() => {
    if (!products.length) return;

    const fetchSeriCounts = async () => {
      try {
        const result = {};
        await Promise.all(
          products.map(async (p) => {
            const res = await getSeriByLaptopCt(p.id);
            const list = res?.data?.data || res?.data || [];
            const available = Array.isArray(list)
              ? list.filter(isSeriAvailable)
              : [];
            result[p.id] = available.length;
          })
        );
        setSeriCounts(result);
      } catch (e) {
        console.error('Lỗi load số lượng seri:', e);
      }
    };

    fetchSeriCounts();
  }, [products]);

  // #2 Chọn 1 LaptopChiTiet -> load seri AVAILABLE
  useEffect(() => {
    if (!selectedProduct) {
      setSerials([]);
      setSelectedSerials([]);
      setSerialKeyword('');
      return;
    }

    const fetchSeri = async () => {
      try {
        setLoadingSerials(true);
        const res = await getSeriByLaptopCt(selectedProduct.id);
        const raw = res.data?.data ?? res.data;
        let list = [];

        if (Array.isArray(raw)) list = raw;
        else if (raw?.content && Array.isArray(raw.content)) list = raw.content;

        const available = Array.isArray(list)
          ? list.filter(isSeriAvailable)
          : [];
        setSerials(available);
      } catch (error) {
        console.error('Lỗi load Seri:', error);
        setSerials([]);
      } finally {
        setLoadingSerials(false);
      }
    };

    fetchSeri();
  }, [selectedProduct]);

  const toggleSerial = (serialId) => {
    setSelectedSerials((prev) =>
      prev.includes(serialId)
        ? prev.filter((id) => id !== serialId)
        : [...prev, serialId]
    );
  };

  // #3 Thêm serial đã chọn -> trả về danh sách seriIds cho POS
  const handleAddConfirmed = () => {
    const newItems = selectedSerials.map((serialId) => ({
      seriId: serialId,
    }));

    onAddProducts(newItems);
    onClose();
  };

  // Filter products theo từ khóa
  const filteredProducts = products.filter((p) => {
    if (!productKeyword.trim()) return true;
    const kw = productKeyword.trim().toLowerCase();
    const name =
      (p.tenLaptop || p.tenSanPham || p.name || '').toLowerCase();
    const id = (p.idLaptopCT || p.id || '').toString().toLowerCase();
    const cpu = (p.tenCpu || '').toLowerCase();
    const ram = (p.tenRam || '').toLowerCase();
    const ssd = (p.tenSsd || '').toLowerCase();
    return (
      name.includes(kw) ||
      id.includes(kw) ||
      cpu.includes(kw) ||
      ram.includes(kw) ||
      ssd.includes(kw)
    );
  });

  // Filter serial theo keyword
  const availableSerials = serials;
  const filteredSerials = availableSerials.filter((s) => {
    if (!serialKeyword.trim()) return true;
    const kw = serialKeyword.trim().toLowerCase();
    const code = (s.idSeri || s.maSeri || s.id || '').toLowerCase();
    return code.includes(kw);
  });

  // ================= BƯỚC 1: CHỌN LAPTOP CHI TIẾT =================
  if (!selectedProduct) {
    return (
      <ModalLayout
        title="Chọn phiên bản & Serial sản phẩm"
        onClose={onClose}
        width="1100px"
      >
        <div style={{ marginTop: '4px' }}>
          <div
            style={{
              marginBottom: '10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <input
              type="text"
              placeholder="Tìm kiếm theo mã, tên, cấu hình..."
              value={productKeyword}
              onChange={(e) => setProductKeyword(e.target.value)}
              style={{
                flex: 1,
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                fontSize: '0.85rem',
              }}
            />
            <span
              style={{ fontSize: '0.8rem', color: '#868e96', whiteSpace: 'nowrap' }}
            >
              Tổng phiên bản: <strong>{filteredProducts.length}</strong>
            </span>
          </div>

          {loadingProducts ? (
            <p style={{ fontSize: '0.9rem', color: '#868e96' }}>
              Đang tải dữ liệu sản phẩm...
            </p>
          ) : filteredProducts.length === 0 ? (
            <p style={{ fontSize: '0.9rem', color: '#868e96' }}>
              Không tìm thấy phiên bản phù hợp.
            </p>
          ) : (
            <div
              style={{
                borderRadius: '8px',
                border: '1px solid #dee2e6',
                overflow: 'hidden',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  tableLayout: 'fixed',
                }}
              >
                <thead>
                  <tr>
                    <th style={{ ...tableHeaderStyle, minWidth: 150 }}>
                      Sản phẩm
                    </th>
                    <th style={{ ...tableHeaderStyle, minWidth: 120 }}>ID</th>
                    <th style={{ ...tableHeaderStyle, minWidth: 90 }}>
                      Màu sắc
                    </th>
                    <th style={{ ...tableHeaderStyle, minWidth: 125 }}>CPU</th>
                    <th style={{ ...tableHeaderStyle, minWidth: 80 }}>RAM</th>
                    <th style={{ ...tableHeaderStyle, minWidth: 110 }}>GPU</th>
                    <th style={{ ...tableHeaderStyle, minWidth: 110 }}>
                      Dung lượng
                    </th>
                    <th style={{ ...tableHeaderStyle, minWidth: 110 }}>
                      Giá bán
                    </th>
                    <th style={{ ...tableHeaderStyle, minWidth: 80 }}>
                      Có sẵn
                    </th>
                    <th style={{ ...tableHeaderStyle, minWidth: 120 }}>
                      Ngày cập nhật
                    </th>
                    <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => {
                    const productName =
                      p.tenLaptop || p.tenSanPham || p.name || 'Laptop';
                    const id = p.idLaptopCT || p.id || '';
                    const colorName = p.tenMauSac || p.mauSac || '';
                    const colorCode = p.maMauSac || p.colorCode || '';
                    const cpu = p.tenCpu || '';
                    const ram = p.tenRam || '';
                    const gpu = p.tenDohoa || '';
                    const ssd = p.tenSsd || '';
                    const price = p.giaBan || 0;
                    const priceOld = p.giaGoc || null;
                    const stock = seriCounts[p.id] ?? 0;
                    const updatedAt = p.ngayCapNhat || p.lastModifiedDate;

                    return (
                      <tr key={p.id}>
                        <td style={tableCellStyle}>
                          <div style={{ fontWeight: 600 }}>{productName}</div>
                          {p.moTa && (
                            <div
                              style={{
                                fontSize: '0.75rem',
                                color: '#868e96',
                                marginTop: 2,
                              }}
                            >
                              {p.moTa}
                            </div>
                          )}
                        </td>

                        <td style={tableCellStyle}>{id}</td>

                        <td style={tableCellStyle}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <span
                              style={{
                                width: 14,
                                height: 14,
                                borderRadius: '50%',
                                display: 'inline-block',
                                border: '1px solid #ced4da',
                                backgroundColor: colorCode,
                              }}
                            />
                            <span>{colorName}</span>
                          </div>
                        </td>

                        <td style={tableCellStyle}>{cpu}</td>
                        <td style={tableCellStyle}>{ram}</td>
                        <td style={tableCellStyle}>{gpu}</td>
                        <td style={tableCellStyle}>{ssd}</td>

                        <td style={tableCellStyle}>
                          {priceOld ? (
                            <>
                              <div
                                style={{
                                  textDecoration: 'line-through',
                                  color: '#adb5bd',
                                  fontSize: '0.75rem',
                                }}
                              >
                                {formatCurrency(priceOld)}
                              </div>
                              <div
                                style={{
                                  color: '#e03131',
                                  fontWeight: 600,
                                  fontSize: '0.86rem',
                                }}
                              >
                                {formatCurrency(price)}
                              </div>
                            </>
                          ) : (
                            <span
                              style={{
                                color: '#e03131',
                                fontWeight: 600,
                                fontSize: '0.86rem',
                              }}
                            >
                              {formatCurrency(price)}
                            </span>
                          )}
                        </td>

                        <td style={tableCellStyle}>
                          <span
                            style={{
                              color: stock > 0 ? '#2b8a3e' : '#868e96',
                              fontWeight: 600,
                            }}
                          >
                            {stock}
                          </span>
                          <span
                            style={{ fontSize: '0.72rem', color: '#868e96' }}
                          >
                            {' '}
                            sp
                          </span>
                        </td>

                        <td style={tableCellStyle}>
                          {formatDateTime(updatedAt)}
                        </td>

                        <td
                          style={{
                            ...tableCellStyle,
                            textAlign: 'center',
                          }}
                        >
                          <button
                            onClick={() => setSelectedProduct(p)}
                            style={actionButtonStyle}
                          >
                            Chọn &amp; Serial
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </ModalLayout>
    );
  }

  // ================= BƯỚC 2: CHỌN SERI =================

  return (
    <ModalLayout
      title={`Chọn Serial Numbers cho ${selectedProduct.id}`}
      onClose={() => setSelectedProduct(null)}
      width="650px"
    >
      <div style={{ padding: '6px 0 10px' }}>
        <p style={{ margin: '0 0 4px 0', fontSize: '0.86rem' }}>
          Phiên bản:{' '}
          <strong>
            {[
              selectedProduct.tenCpu,
              selectedProduct.tenRam,
              selectedProduct.tenSsd,
              selectedProduct.tenDohoa,
              selectedProduct.tenMauSac,
            ]
              .filter(Boolean)
              .join(' / ')}
          </strong>
        </p>
        <p style={{ margin: '0 0 10px 0', fontSize: '0.86rem' }}>
          Giá:{' '}
          <span style={{ color: '#e03131', fontWeight: 'bold' }}>
            {formatCurrency(
              selectedProduct.giaBan || selectedProduct.currentPrice || 0
            )}
          </span>
        </p>

        <h4
          style={{
            margin: '0 0 8px 0',
            fontSize: '0.95rem',
            color: '#212529',
          }}
        >
          Serial Numbers có sẵn ({availableSerials.length})
        </h4>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
            gap: 10,
          }}
        >
          <input
            type="text"
            placeholder="Tìm kiếm serial number..."
            value={serialKeyword}
            onChange={(e) => setSerialKeyword(e.target.value)}
            style={{
              flex: 1,
              padding: '7px',
              border: '1px solid #ced4da',
              borderRadius: '5px',
              fontSize: '0.84rem',
            }}
          />
          <span
            style={{
              fontWeight: 'bold',
              fontSize: '0.8rem',
              color: '#495057',
            }}
          >
            Đã chọn: {selectedSerials.length}
          </span>
        </div>

        {loadingSerials ? (
          <p style={{ fontSize: '0.9rem', color: '#868e96' }}>
            Đang tải serial...
          </p>
        ) : filteredSerials.length === 0 ? (
          <p style={{ fontSize: '0.9rem', color: '#868e96' }}>
            Không có serial phù hợp.
          </p>
        ) : (
          <div
            style={{
              maxHeight: '320px',
              overflowY: 'auto',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                tableLayout: 'fixed',
              }}
            >
              <thead>
                <tr>
                  <th style={{ ...tableHeaderStyle, width: '8%' }}></th>
                  <th style={tableHeaderStyle}>Serial Number</th>
                  <th
                    style={{
                      ...tableHeaderStyle,
                      width: '25%',
                      textAlign: 'center',
                    }}
                  >
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSerials.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => toggleSerial(s.id)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: selectedSerials.includes(s.id)
                        ? '#e7f5ff'
                        : 'white',
                    }}
                  >
                    <td style={tableCellStyle}>
                      <input
                        type="checkbox"
                        checked={selectedSerials.includes(s.id)}
                        readOnly
                      />
                    </td>
                    <td style={tableCellStyle}>
                      <strong>{s.idSeri || s.maSeri || s.id}</strong>
                    </td>
                    <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                      <span
                        style={{
                          color: '#2b8a3e',
                          backgroundColor: '#e6fcf5',
                          padding: '3px 8px',
                          borderRadius: '999px',
                          border: '1px solid #c3fae8',
                          fontSize: '0.78rem',
                        }}
                      >
                        Có sẵn
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div
          style={{
            textAlign: 'right',
            marginTop: '12px',
            borderTop: '1px solid #e9ecef',
            paddingTop: '10px',
          }}
        >
          <button
            onClick={() => setSelectedProduct(null)}
            style={{
              ...actionButtonStyle,
              backgroundColor: '#fff',
              border: '1px solid #ced4da',
              color: '#495057',
              marginRight: '8px',
            }}
          >
            Quay lại
          </button>
          <button
            onClick={handleAddConfirmed}
            disabled={selectedSerials.length === 0}
            style={{
              ...actionButtonStyle,
              backgroundColor:
                selectedSerials.length > 0 ? '#1971c2' : '#a5c0e6',
              cursor:
                selectedSerials.length > 0 ? 'pointer' : 'not-allowed',
            }}
          >
            Thêm {selectedSerials.length} sản phẩm
          </button>
        </div>
      </div>
    </ModalLayout>
  );
};

export default ProductSelector;
