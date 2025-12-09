import { Sandwich } from 'lucide-react';
import React, { useState } from 'react';

const DotGiamGiaComponent = () => {
  const fakeSanPhamData = [
    {
      id: 'lap1',
      ten: 'Laptop ASUS ROG Strix G16',
      ma: 'ASUS-G16',
      hang: 'ASUS',
      trangThai: 'Đang bán',
      chiTiet: [
        { id: 'ct1', ram: '16GB', ssd: '512GB', cpu: 'i7-13650HX', gia: 29990000, anh: 'https://via.placeholder.com/100' },
        { id: 'ct2', ram: '32GB', ssd: '1TB', cpu: 'i9-13900HX', gia: 36990000, anh: 'https://via.placeholder.com/100' }
      ]
    },
    {
      id: 'lap2',
      ten: 'Laptop Acer Nitro 5',
      ma: 'ACER-N5',
      hang: 'Acer',
      trangThai: 'Đang bán',
      chiTiet: [
        { id: 'ct3', ram: '8GB', ssd: '512GB', cpu: 'i5-12500H', gia: 18990000, anh: 'https://via.placeholder.com/100' },
        { id: 'ct4', ram: '16GB', ssd: '1TB', cpu: 'i7-12700H', gia: 22990000, anh: 'https://via.placeholder.com/100' }
      ]
    }
  ];

  const [form, setForm] = useState({ tenDot: '', moTa: '', ngayBatDau: '', ngayKetThuc: '' });
  const [giaTriGiam, setGiaTriGiam] = useState('');
  const [kieuGiamGia, setKieuGiamGia] = useState('phanTram');
  const [selectedCT, setSelectedCT] = useState([]);

  const handleChonLaptop = (sp) => {
    const giam = parseFloat(giaTriGiam);
    const isValid = !isNaN(giam) && giam >= 0;

    const newItems = sp.chiTiet.map(ct => {
      let tienGiam = 0;
      if (isValid) {
        tienGiam = kieuGiamGia === 'phanTram' ? Math.round(ct.gia * giam / 100) : giam;
        if (tienGiam > ct.gia) tienGiam = ct.gia;
      }

      return {
        ...ct,
        tenLaptop: sp.ten,
        maLaptop: sp.ma,
        hang: sp.hang,
        giamTrucTiep: tienGiam,
        giaGiam: ct.gia - tienGiam,
        isChecked: true // ✅ Mặc định chọn khi thêm mới
      };
    });

    setSelectedCT(prev => {
      // Bỏ các phiên bản cũ thuộc laptop này nếu đã có
      const filtered = prev.filter(p => !sp.chiTiet.some(ct => ct.id === p.id));
      return [...filtered, ...newItems];
    });
  };

  const handleToggleChiTiet = (id) => {
    setSelectedCT(prev =>
      prev.map(ct => ct.id === id ? { ...ct, isChecked: !ct.isChecked } : ct)
    );
  };

  const handleSubmit = () => {
    const data = {
      ...form,
      kieuGiamGia,
      giaTriGiam,
      chiTietSanPhamGiamGia: selectedCT
        .filter(ct => ct.isChecked)
        .map(ct => ({ idChiTietSanPham: ct.id, giaGiam: ct.giaGiam }))
    };
    console.log('📦 Dữ liệu đợt giảm giá:', data);
  };

  const formatVND = (val) => val.toLocaleString('vi-VN') + '₫';

  return (
    <div className="container py-4">
      <h2>🎯 Thêm Đợt Giảm Giá</h2>

      <div className="row mb-4">
        <div className="col-md-6">
          <input className="form-control my-2" placeholder="Tên đợt" value={form.tenDot} onChange={e => setForm({ ...form, tenDot: e.target.value })} />
          <input className="form-control my-2" placeholder="Mô tả" value={form.moTa} onChange={e => setForm({ ...form, moTa: e.target.value })} />
        </div>
        <div className="col-md-6">
          <label>Ngày bắt đầu</label>
          <input type="date" className="form-control mb-2" value={form.ngayBatDau} onChange={e => setForm({ ...form, ngayBatDau: e.target.value })} />
          <label>Ngày kết thúc</label>
          <input type="date" className="form-control mb-2" value={form.ngayKetThuc} onChange={e => setForm({ ...form, ngayKetThuc: e.target.value })} />
        </div>
        <div className="col-md-6">
          <label>Giá trị giảm</label>
          <input type="number" className="form-control" value={giaTriGiam} onChange={e => setGiaTriGiam(e.target.value)} />
        </div>
        <div className="col-md-6">
          <label>Kiểu giảm giá</label>
          <select className="form-control" value={kieuGiamGia} onChange={e => setKieuGiamGia(e.target.value)}>
            <option value="phanTram">Giảm theo %</option>
            <option value="coDinh">Giảm cố định (VNĐ)</option>
          </select>
        </div>
      </div>

      <h4>📋 Danh sách Laptop</h4>
      <table className="table table-bordered">
        <thead>
          <tr><th>STT</th><th>Mã</th><th>Tên sản phẩm</th><th>Hãng</th><th>Chọn</th></tr>
        </thead>
        <tbody>
          {fakeSanPhamData.map((sp, idx) => (
            <tr key={sp.id}>
              <td>{idx + 1}</td>
              <td>{sp.ma}</td>
              <td>{sp.ten}</td>
              <td>{sp.hang}</td>
              <td>
                <button className="btn btn-primary btn-sm" onClick={() => handleChonLaptop(sp)}>
                  Chọn giảm giá
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h4>✅ Danh sách phiên bản được áp dụng</h4>
      {selectedCT.length === 0 ? <p>Chưa chọn sản phẩm nào</p> : (
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>STT</th><th>Ảnh</th><th>Tên sản phẩm</th><th>Đơn giá</th><th>Giảm giá</th><th>Giá sau giảm</th><th>Chọn</th>
            </tr>
          </thead>
          <tbody>
            {selectedCT.map((item, idx) => (
              <tr key={item.id}>
                <td>{idx + 1}</td>
                <td><img src={item.anh} width="80" /></td>
                <td>{item.tenLaptop} ({item.cpu} - {item.ram} - {item.ssd})</td>
                <td>{formatVND(item.gia)}</td>
                <td>{formatVND(item.giamTrucTiep)}</td>
                <td>{formatVND(item.giaGiam)}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={item.isChecked}
                    onChange={() => handleToggleChiTiet(item.id)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="text-end mt-3">
        <button className="btn btn-success" onClick={handleSubmit}>Tạo đợt giảm giá</button>
      </div>
    </div>
  );
};

export default DotGiamGiaComponent;
