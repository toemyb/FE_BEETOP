import React, { useState, useEffect, useMemo } from 'react';
import {
  getAllLaptopCT,
  getLaptopCTByLaptop,
} from '../service/LapTopCTService';
import { getSeriByLaptopCt } from '../service/SeriService';

// ✅ IMPORT từ LaptopService (bạn đổi đúng path file service của bạn)
import { getAllById } from '../service/LapTopService';

// SERI STATUS
// 1: ACTIVE | 2: PENDING | 3: SOLD
const SERI_ACTIVE = 1;

// Seri có sẵn khi trangThai = SERI_ACTIVE (1)
const isSeriAvailable = (s) => Number(s?.trangThai) === SERI_ACTIVE;

// ====== Color map (gán màu) ======
const COLOR_HEX_MAP = {
  'đen': '#111827',
  'black': '#111827',
  'trắng': '#f8fafc',
  'white': '#f8fafc',
  'bạc': '#cbd5e1',
  'silver': '#cbd5e1',
  'xám': '#9ca3af',
  'gray': '#9ca3af',
  'grey': '#9ca3af',
  'xanh': '#2563eb',
  'blue': '#2563eb',
  'xanh dương': '#2563eb',
  'xanh lá': '#16a34a',
  'green': '#16a34a',
  'đỏ': '#dc2626',
  'red': '#dc2626',
  'vàng': '#f59e0b',
  'yellow': '#f59e0b',
  'hồng': '#ec4899',
  'pink': '#ec4899',
  'tím': '#7c3aed',
  'purple': '#7c3aed',
  'cam': '#f97316',
  'orange': '#f97316',
  'nâu': '#92400e',
  'brown': '#92400e',
};

const normalizeText = (v) =>
  (v ?? '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const getColorHex = (colorNameOrCode) => {
  const v = (colorNameOrCode || '').toString().trim();
  if (!v) return '#e5e7eb';
  if (/^#([0-9a-fA-F]{3}){1,2}$/.test(v)) return v;
  const key = normalizeText(v);
  return COLOR_HEX_MAP[key] || '#94a3b8';
};

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
        <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#212529' }}>
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

const ProductSelector = ({ idLaptop, onClose, onAddProducts, formatCurrency }) => {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);

  const [serials, setSerials] = useState([]);
  const [loadingSerials, setLoadingSerials] = useState(false);
  const [selectedSerials, setSelectedSerials] = useState([]);

  const [seriCounts, setSeriCounts] = useState({});

  const [productKeyword, setProductKeyword] = useState('');
  const [serialKeyword, setSerialKeyword] = useState('');

  // ✅ Cache tên/mã sản phẩm theo laptopId (lấy từ LaptopService)
  const [laptopMap, setLaptopMap] = useState({});

  // ====== FILTER STATES (UI giống ảnh) ======
  const [fCpu, setFCpu] = useState('');
  const [fRam, setFRam] = useState('');
  const [fGpu, setFGpu] = useState('');
  const [fColor, setFColor] = useState('');
  const [fStorage, setFStorage] = useState('');
  const [fScreen, setFScreen] = useState('');
  const [priceMax, setPriceMax] = useState(null);

  // ✅ thêm lọc "có sẵn"
  // ALL | IN_STOCK | OUT_OF_STOCK
  const [stockFilter, setStockFilter] = useState('ALL');

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

  // ✅ style dùng lại cho filter select
  const filterLabelStyle = {
    fontSize: '0.78rem',
    fontWeight: 700,
    color: '#374151',
    marginBottom: 6,
  };
  const filterSelectStyle = {
    width: '100%',
    height: 36,
    borderRadius: 8,
    border: '1px solid #d1d5db',
    padding: '0 10px',
    fontSize: '0.84rem',
    background: '#fff',
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

  // ✅ helper lấy laptopId từ laptopCT (bạn có thể bổ sung key nếu BE khác)
  const getLaptopIdFromCT = (p) =>
    p?.idLaptop ||
    p?.laptopId ||
    p?.laptopID ||
    p?.laptop?.id ||
    p?.idSanPham ||
    p?.sanPhamId ||
    null;

  // ✅ lấy tên/mã sản phẩm ưu tiên từ laptopService (laptopMap)
  const getProductName = (p) => {
    const lid = getLaptopIdFromCT(p);
    return (
      laptopMap?.[lid]?.tenSanPham ||
      laptopMap?.[lid]?.tenLaptop ||
      p.tenSanPham ||
      p.tenLaptop ||
      p.name ||
      'Laptop'
    );
  };

  const getProductCode = (p) => {
    const lid = getLaptopIdFromCT(p);
    return (
      laptopMap?.[lid]?.maSanPham ||
      laptopMap?.[lid]?.maLaptop ||
      p.maSanPham ||
      p.maLaptop ||
      p.ma ||
      p.code ||
      p.productCode ||
      ''
    );
  };

  // ✅ helper lấy SKU cấu hình (dùng cả list + title)
  const getSku = (p) =>
    p?.sku ||
    p?.maSku ||
    p?.maSKU ||
    p?.SKU ||
    p?.skuCode ||
    p?.idLaptopCT ||
    p?.id ||
    '';

  // #1 Lấy LaptopChiTiet
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);

        let res;
        if (idLaptop) res = await getLaptopCTByLaptop(idLaptop);
        else res = await getAllLaptopCT(1, 50);

        const raw = res.data?.data ?? res.data;
        let list = [];

        if (Array.isArray(raw)) list = raw;
        else if (raw?.content && Array.isArray(raw.content)) list = raw.content;
        else if (Array.isArray(res.data)) list = res.data;

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

  // ✅ #1.05 Load tên/mã sản phẩm từ LaptopService theo laptopId (không đổi logic chính)
  useEffect(() => {
    if (!products.length) return;

    let cancelled = false;

    const fetchLaptopInfo = async () => {
      try {
        const ids = Array.from(
          new Set(products.map(getLaptopIdFromCT).filter(Boolean))
        );

        if (!ids.length) return;

        const pairs = await Promise.all(
          ids.map(async (id) => {
            try {
              const res = await getAllById(id);
              const raw = res?.data?.data ?? res?.data;

              const tenSanPham =
                raw?.tenSanPham || raw?.tenLaptop || raw?.name || '';
              const maSanPham =
                raw?.maSanPham || raw?.maLaptop || raw?.code || '';

              return [id, { tenSanPham, maSanPham }];
            } catch (e) {
              return [id, null];
            }
          })
        );

        if (cancelled) return;

        setLaptopMap((prev) => {
          const next = { ...prev };
          pairs.forEach(([id, info]) => {
            if (info) next[id] = info;
          });
          return next;
        });
      } catch (e) {
        console.error('Lỗi load tên/mã sản phẩm từ LaptopService:', e);
      }
    };

    fetchLaptopInfo();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

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
            const available = Array.isArray(list) ? list.filter(isSeriAvailable) : [];
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

        const available = Array.isArray(list) ? list.filter(isSeriAvailable) : [];
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
      prev.includes(serialId) ? prev.filter((id) => id !== serialId) : [...prev, serialId]
    );
  };

  const handleAddConfirmed = () => {
    const newItems = selectedSerials.map((serialId) => ({ seriId: serialId }));
    onAddProducts(newItems);
    onClose();
  };

  // ====== options cho filter (lấy từ data) ======
  const filterOptions = useMemo(() => {
    const uniq = (arr) =>
      Array.from(new Set(arr.filter(Boolean).map((x) => x.toString().trim())));

    const cpus = uniq(products.map((p) => p.tenCpu));
    const rams = uniq(products.map((p) => p.tenRam));
    const gpus = uniq(products.map((p) => p.tenDohoa));
    const colors = uniq(products.map((p) => p.tenMauSac || p.mauSac));
    const storages = uniq(products.map((p) => p.tenSsd));
    const screens = uniq(products.map((p) => p.tenManHinh || p.manHinh));

    const prices = products
      .map((p) => Number(p.giaBan || p.currentPrice || 0))
      .filter((n) => Number.isFinite(n));

    const maxP = prices.length ? Math.max(...prices) : 0;

    return { cpus, rams, gpus, colors, storages, screens, maxP };
  }, [products]);

  useEffect(() => {
    if (priceMax === null && filterOptions.maxP > 0) {
      setPriceMax(filterOptions.maxP);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterOptions.maxP]);

  const clearFilters = () => {
    setProductKeyword('');
    setFCpu('');
    setFRam('');
    setFGpu('');
    setFColor('');
    setFStorage('');
    setFScreen('');
    setPriceMax(filterOptions.maxP || null);
    setStockFilter('ALL'); // ✅ reset thêm
  };

  // Filter products theo keyword + bộ lọc
  const filteredProducts = products.filter((p) => {
    const stock = seriCounts[p.id] ?? 0;

    if (productKeyword.trim()) {
      const kw = productKeyword.trim().toLowerCase();

      const name = (getProductName(p) || '').toLowerCase();
      const code = (getProductCode(p) || '').toLowerCase();

      const cpu = (p.tenCpu || '').toLowerCase();
      const ram = (p.tenRam || '').toLowerCase();
      const ssd = (p.tenSsd || '').toLowerCase();
      const gpu = (p.tenDohoa || '').toLowerCase();

      const sku = (p.sku || p.maSku || p.maSKU || p.SKU || '').toString().toLowerCase();

      const okKw =
        name.includes(kw) ||
        code.includes(kw) ||
        cpu.includes(kw) ||
        ram.includes(kw) ||
        ssd.includes(kw) ||
        gpu.includes(kw) ||
        sku.includes(kw);

      if (!okKw) return false;
    }

    if (fCpu && (p.tenCpu || '') !== fCpu) return false;
    if (fRam && (p.tenRam || '') !== fRam) return false;
    if (fGpu && (p.tenDohoa || '') !== fGpu) return false;

    const pColor = (p.tenMauSac || p.mauSac || '').toString().trim();
    if (fColor && pColor !== fColor) return false;

    if (fStorage && (p.tenSsd || '') !== fStorage) return false;

    const pScreen = (p.tenManHinh || p.manHinh || '').toString().trim();
    if (fScreen && pScreen !== fScreen) return false;

    if (Number.isFinite(priceMax)) {
      const price = Number(p.giaBan || p.currentPrice || 0);
      if (price > priceMax) return false;
    }

    // ✅ lọc theo có sẵn
    if (stockFilter === 'IN_STOCK' && stock <= 0) return false;
    if (stockFilter === 'OUT_OF_STOCK' && stock > 0) return false;

    return true;
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
    const showingCount = filteredProducts.length;
    const totalCount = products.length;

    return (
      <ModalLayout title="Chọn sản phẩm" onClose={onClose} width="1100px">
        {/* Header nhỏ */}
        <div
          style={{
            border: '1px solid #eef2f7',
            borderRadius: 10,
            padding: '10px 12px',
            background: '#fff',
            marginBottom: 12,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 800, color: '#1f2937', fontSize: '0.95rem' }}>
                Danh mục sản phẩm
              </div>
              <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2 }}>
                Chọn serial number để thêm sản phẩm vào giỏ hàng
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '0.78rem', color: '#0f766e', whiteSpace: 'nowrap' }}>
                ✓ {totalCount} phiên bản
              </span>
              <span style={{ fontSize: '0.78rem', color: '#0f766e', whiteSpace: 'nowrap' }}>
                ✓ {showingCount} hiển thị
              </span>
            </div>
          </div>
        </div>

        {/* Bộ lọc */}
        <div
          style={{
            border: '1px solid #eef2f7',
            borderRadius: 10,
            padding: '12px 12px',
            background: '#fff',
            marginBottom: 12,
          }}
        >
          <div style={{ fontWeight: 800, color: '#111827', fontSize: '0.9rem', marginBottom: 10 }}>
            Chọn phiên bản sản phẩm
          </div>

          {/* Xóa bộ lọc */}
          <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'flex-end', marginBottom: 6 }}>
            <button
              onClick={clearFilters}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#0f766e',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Xóa bộ lọc
            </button>
          </div>

          {/* Search */}
          <div style={{ marginBottom: 10 }}>
            <div style={filterLabelStyle}>Tìm kiếm sản phẩm</div>
            <input
              type="text"
              placeholder="Tìm theo tên sản phẩm, mã sản phẩm, CPU, RAM, GPU..."
              value={productKeyword}
              onChange={(e) => setProductKeyword(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 10px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Grid filters */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: 10,
            }}
          >
            <div>
              <div style={filterLabelStyle}>CPU</div>
              <select value={fCpu} onChange={(e) => setFCpu(e.target.value)} style={filterSelectStyle}>
                <option value="">Chọn CPU</option>
                {filterOptions.cpus.map((x) => (
                  <option key={x} value={x}>{x}</option>
                ))}
              </select>
            </div>

            <div>
              <div style={filterLabelStyle}>RAM</div>
              <select value={fRam} onChange={(e) => setFRam(e.target.value)} style={filterSelectStyle}>
                <option value="">Chọn RAM</option>
                {filterOptions.rams.map((x) => (
                  <option key={x} value={x}>{x}</option>
                ))}
              </select>
            </div>

            <div>
              <div style={filterLabelStyle}>GPU</div>
              <select value={fGpu} onChange={(e) => setFGpu(e.target.value)} style={filterSelectStyle}>
                <option value="">Chọn GPU</option>
                {filterOptions.gpus.map((x) => (
                  <option key={x} value={x}>{x}</option>
                ))}
              </select>
            </div>

            <div>
              <div style={filterLabelStyle}>Màu sắc</div>
              <select value={fColor} onChange={(e) => setFColor(e.target.value)} style={filterSelectStyle}>
                <option value="">Chọn màu sắc</option>
                {filterOptions.colors.map((x) => (
                  <option key={x} value={x}>{x}</option>
                ))}
              </select>
            </div>

            <div>
              <div style={filterLabelStyle}>Dung lượng</div>
              <select value={fStorage} onChange={(e) => setFStorage(e.target.value)} style={filterSelectStyle}>
                <option value="">Chọn dung lượng</option>
                {filterOptions.storages.map((x) => (
                  <option key={x} value={x}>{x}</option>
                ))}
              </select>
            </div>

            {/* ✅ THÊM BỘ LỌC CÓ SẴN */}
            <div>
              <div style={filterLabelStyle}>Kho</div>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                style={filterSelectStyle}
              >
                <option value="ALL">Tất cả</option>
                <option value="IN_STOCK">Còn hàng</option>
                <option value="OUT_OF_STOCK">Hết hàng</option>
              </select>
            </div>
          </div>

          {/* Khoảng giá (slider) */}
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={filterLabelStyle}>Khoảng giá</div>
              <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                {formatCurrency(Number(priceMax || 0))}
              </div>
            </div>

            <input
              type="range"
              min={0}
              max={filterOptions.maxP || 0}
              step={100000}
              value={Number(priceMax || 0)}
              onChange={(e) => setPriceMax(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Table sản phẩm */}
        <div style={{ marginTop: '4px' }}>
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
                    <th style={{ ...tableHeaderStyle, minWidth: 220 }}>Sản phẩm</th>
                    {/* ✅ giữ như bạn đang để "Mã" (đang hiển thị SKU) */}
                    <th style={{ ...tableHeaderStyle, minWidth: 140 }}>Mã</th>
                    <th style={{ ...tableHeaderStyle, minWidth: 110 }}>Màu sắc</th>
                    <th style={{ ...tableHeaderStyle, minWidth: 125 }}>CPU</th>
                    <th style={{ ...tableHeaderStyle, minWidth: 90 }}>RAM</th>
                    <th style={{ ...tableHeaderStyle, minWidth: 120 }}>GPU</th>
                    <th style={{ ...tableHeaderStyle, minWidth: 110 }}>Dung lượng</th>

                    {/* ✅ Tách rõ */}
                    <th style={{ ...tableHeaderStyle, minWidth: 150, textAlign: 'right' }}>
                      Giá bán
                    </th>
                    <th style={{ ...tableHeaderStyle, minWidth: 110, textAlign: 'center' }}>
                      Có sẵn
                    </th>

                    <th style={{ ...tableHeaderStyle, minWidth: 130 }}>Ngày cập nhật</th>
                    <th style={{ ...tableHeaderStyle, textAlign: 'center', minWidth: 120 }}>
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => {
                    const productName = getProductName(p);
                    const productCode = getProductCode(p);
                    const sku = getSku(p);

                    const colorName = p.tenMauSac || p.mauSac || '';
                    const colorHex = getColorHex(p.maMauSac || p.colorCode || colorName);

                    const cpu = p.tenCpu || '';
                    const ram = p.tenRam || '';
                    const gpu = p.tenDohoa || '';
                    const ssd = p.tenSsd || '';
                    const price = p.giaBan || p.currentPrice || 0;
                    const priceOld = p.giaGoc || null;
                    const stock = seriCounts[p.id] ?? 0;
                    const updatedAt = p.ngayCapNhat || p.lastModifiedDate;

                    return (
                      <tr key={p.id}>
                        <td style={tableCellStyle}>
                          <div style={{ fontWeight: 800, color: '#111827' }}>{productName}</div>
                          <div style={{ fontSize: '0.76rem', color: '#6b7280', marginTop: 2 }}>
                            {productCode ? `Mã SP: ${productCode}` : ''}
                          </div>
                        </td>

                        <td style={tableCellStyle}>
                          <div style={{ fontWeight: 700, color: '#111827' }}>{sku}</div>
                        </td>

                        <td style={tableCellStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span
                              style={{
                                width: 14,
                                height: 14,
                                borderRadius: '50%',
                                display: 'inline-block',
                                border: '1px solid #ced4da',
                                backgroundColor: colorHex,
                              }}
                            />
                            <span>{colorName}</span>
                          </div>
                        </td>

                        <td style={tableCellStyle}>{cpu}</td>
                        <td style={tableCellStyle}>{ram}</td>
                        <td style={tableCellStyle}>{gpu}</td>
                        <td style={tableCellStyle}>{ssd}</td>

                        <td style={{ ...tableCellStyle, textAlign: 'right', whiteSpace: 'normal' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                            {priceOld ? (
                              <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '0.75rem' }}>
                                {formatCurrency(priceOld)}
                              </span>
                            ) : null}
                            <span style={{ color: '#dc2626', fontWeight: 800, fontSize: '0.9rem', lineHeight: 1.2 }}>
                              {formatCurrency(price)}
                            </span>
                          </div>
                        </td>

                        <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minWidth: 44,
                              padding: '4px 10px',
                              borderRadius: 999,
                              fontWeight: 800,
                              fontSize: '0.78rem',
                              color: stock > 0 ? '#166534' : '#6b7280',
                              background: stock > 0 ? '#dcfce7' : '#f1f5f9',
                              border: `1px solid ${stock > 0 ? '#bbf7d0' : '#e2e8f0'}`,
                            }}
                          >
                            {stock}
                          </span>
                        </td>

                        <td style={tableCellStyle}>{formatDateTime(updatedAt)}</td>

                        <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                          <button onClick={() => setSelectedProduct(p)} style={actionButtonStyle}>
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
  // ✅ title: "Chọn serial number cho {tên sp} + {mã(sp)}"
  const selectedSKU = getSku(selectedProduct);
  const selectedName = getProductName(selectedProduct);
  const titleSerial = `Chọn serial number cho ${selectedSKU}`;

  return (
    <ModalLayout
      title={titleSerial}
      onClose={() => setSelectedProduct(null)}
      width="650px"
    >
      <div style={{ padding: '6px 0 10px' }}>
         <p style={{ margin: '0 0 4px 0', fontSize: '0.86rem' }}>
          Tên sản phẩm:{' '}
          <strong>
            {selectedName}
          </strong>
        </p>
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
            {formatCurrency(selectedProduct.giaBan || selectedProduct.currentPrice || 0)}
          </span>
        </p>

        <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#212529' }}>
          Serial Numbers có sẵn ({availableSerials.length})
        </h4>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: 10 }}>
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
          <span style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#495057' }}>
            Đã chọn: {selectedSerials.length}
          </span>
        </div>

        {loadingSerials ? (
          <p style={{ fontSize: '0.9rem', color: '#868e96' }}>Đang tải serial...</p>
        ) : filteredSerials.length === 0 ? (
          <p style={{ fontSize: '0.9rem', color: '#868e96' }}>Không có serial phù hợp.</p>
        ) : (
          <div style={{ maxHeight: '320px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '6px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th style={{ ...tableHeaderStyle, width: '8%' }}></th>
                  <th style={tableHeaderStyle}>Serial Number</th>
                  <th style={{ ...tableHeaderStyle, width: '25%', textAlign: 'center' }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredSerials.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => toggleSerial(s.id)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: selectedSerials.includes(s.id) ? '#e7f5ff' : 'white',
                    }}
                  >
                    <td style={tableCellStyle}>
                      <input type="checkbox" checked={selectedSerials.includes(s.id)} readOnly />
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

        <div style={{ textAlign: 'right', marginTop: '12px', borderTop: '1px solid #e9ecef', paddingTop: '10px' }}>
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
              backgroundColor: selectedSerials.length > 0 ? '#1971c2' : '#a5c0e6',
              cursor: selectedSerials.length > 0 ? 'pointer' : 'not-allowed',
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
