export const mockProducts = [
  {
    id: 'SP1111',
    name: 'Testsp',
    version: 'Intel Core i5 15400K - 16 GB DDR4 - RTX 5090 - Đỏ - 512 GB SSD',
    sku: 'SP1111-CPU003-RAM001-BN001-MS002-GPU001-MH001',
    currentPrice: 4500000,
    originalPrice: 5000000,
    image: 'https://via.placeholder.com/60x45?text=SP',
  },
  {
    id: 'SP014',
    name: 'Delllap 7420',
    version: 'AMD Ryzen 7 5800H - 16GB DDR4 - RX7600M - Xanh - 256GB SSD',
    sku: 'SP014-AMD-RX7600M',
    currentPrice: 9700000,
    originalPrice: 10000000,
    image: 'https://via.placeholder.com/60x45?text=DL',
  },
];

export const mockSerials = [
  { id: 'SN1005', status: 'Có sẵn', productId: 'SP1111' },
  { id: 'SN1008', status: 'Có sẵn', productId: 'SP1111' },
  { id: 'SN1010', status: 'Có sẵn', productId: 'SP1111' },
  { id: 'SN1099', status: 'Có sẵn', productId: 'SP1111' },
  { id: 'SN1096', status: 'Có sẵn', productId: 'SP1111' },
];
export const mockVouchers = [
  { id: 'VC123', name: 'VC123', discount: 450000 },
  {
    id: 'VOUCHER-STUDENT', name: 'VOUCHER-STUDENT',
    discount: 225000,
    expires: '31/05/2026',
    minOrder: 1000000,
    des: 'Giảm áp dụng cho học sinh 2025-2026'
  },
  { id: 'vct3', name: 'vct3', discount: 1000000, des: 'Mua thêm 5.5tr được giảm 1tr', minOrder: 6000000 },
  { id: 'Voucher-09', name: 'Voucher-09', discount: 600000, minOrder: 12000000 }
];