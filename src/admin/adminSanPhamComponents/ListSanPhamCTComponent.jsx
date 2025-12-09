import React, { useEffect, useState } from 'react';
import { Table, Tag, Space, Button, message, Modal } from 'antd';
import {
  ReloadOutlined,
  EditOutlined,
  PlusOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { getLaptopCTByLaptop } from '../../service/LapTopCTService';
import { getAnhByLaptopCt } from '../../service/AnhService';   // ✅ service ảnh
import AddSeriComponent from './AddSeriComponent';
import AddAnhComponent from './AddAnhComponent';

const ListLaptopCTComponent = () => {
  const navigate = useNavigate();
  const { idLaptop } = useParams();

  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);

  // modal thêm seri
  const [openSeriModal, setOpenSeriModal] = useState(false);

  // modal quản lý ảnh
  const [openAnhModal, setOpenAnhModal] = useState(false);

  // id biến thể đang thao tác (dùng chung cho cả seri & ảnh)
  const [currentLaptopCtId, setCurrentLaptopCtId] = useState(null);

  const fetchData = async () => {
    if (!idLaptop) {
      message.error('Không tìm thấy ID laptop. Vui lòng quay lại danh sách sản phẩm!');
      navigate('/admin/lap-top');
      return;
    }

    setLoading(true);
    try {
      // ===== 1. Lấy list biến thể =====
      const response = await getLaptopCTByLaptop(idLaptop);

      const raw =
        Array.isArray(response?.data?.data)
          ? response.data.data
          : Array.isArray(response?.data)
          ? response.data
          : [];

      const mapped = raw.map((item, index) => ({
        stt: index + 1,
        id: item.id, // idLaptopCt
        idLaptop: item.idLaptop,
        idLaptopCT: item.idLaptopCT,
        ram: item.tenRam,
        ssd: item.tenSsd,
        cpu: item.tenCpu,
        doHoa: item.tenDohoa,
        mauSac: item.tenMauSac,
        giaBan: item.giaBan,
        moTa: item.moTa,
        trangThai: item.trangThai,
        ngayTao: item.ngayTao,
        ngayCapNhat: item.ngayCapNhat,
        soLuongSeri: item.soLuongSeri ?? 0,
      }));

      // ===== 2. Với mỗi biến thể, gọi API ảnh để lấy thumbnail =====
      const withImage = await Promise.all(
        mapped.map(async (v) => {
          try {
            const resAnh = await getAnhByLaptopCt(v.id);
            const listAnh = resAnh?.data?.data || resAnh?.data || [];
            const first = Array.isArray(listAnh) && listAnh.length > 0 ? listAnh[0] : null;

            return {
              ...v,
              anhUrl: first?.imgURL || null,
            };
          } catch (e) {
            console.error('Lỗi load ảnh cho biến thể', v.id, e);
            return {
              ...v,
              anhUrl: null,
            };
          }
        })
      );

      setVariants(withImage);
    } catch (err) {
      console.error('❌ Lỗi khi tải danh sách biến thể laptop:', err);
      message.error('Không tải được danh sách biến thể.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idLaptop]);

  const columns = [
    { title: 'STT', dataIndex: 'stt', width: 60 },

    // ✅ CỘT ẢNH SAU STT
    {
      title: 'Ảnh',
      dataIndex: 'anhUrl',
      width: 90,
      render: (url) =>
        url ? (
          <img
            src={url}
            alt="Ảnh biến thể"
            style={{
              width: 50,
              height: 50,
              objectFit: 'cover',
              borderRadius: 4,
            }}
          />
        ) : (
          <span style={{ color: '#aaa' }}>(Chưa có)</span>
        ),
    },

    {
      title: 'Mã biến thể',
      dataIndex: 'idLaptopCT',
      width: 160,
      render: (val) =>
        val || <span style={{ color: '#aaa' }}>(Chưa gán mã)</span>,
    },
    { title: 'RAM', dataIndex: 'ram', width: 100 },
    { title: 'SSD', dataIndex: 'ssd', width: 100 },
    { title: 'CPU', dataIndex: 'cpu', width: 180 },
    { title: 'Đồ họa', dataIndex: 'doHoa', width: 180 },
    { title: 'Màu sắc', dataIndex: 'mauSac', width: 120 },
    {
      title: 'Giá bán',
      dataIndex: 'giaBan',
      width: 140,
      render: (val) =>
        val != null ? Number(val).toLocaleString('vi-VN') + ' ₫' : (
          <span style={{ color: '#aaa' }}>-</span>
        ),
    },
    {
      title: 'Số lượng seri',
      dataIndex: 'soLuongSeri',
      width: 130,
      align: 'center',
      render: (val) => val ?? 0,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      width: 110,
      render: (val) =>
        val === 1 ? <Tag color="green">Kinh doanh</Tag> : <Tag color="red">Ngừng</Tag>,
    },
    {
      title: 'Mô tả',
      dataIndex: 'moTa',
      width: 260,
      render: (val) => val || <span style={{ color: '#aaa' }}>(Không có)</span>,
    },
    {
      title: 'Thao tác',
      fixed: 'right',
      width: 220,
      render: (_, record) => (
        <Space>
          {/* Sửa biến thể */}
          <Button
            icon={<EditOutlined />}
            type="text"
            onClick={() => navigate(`/admin/lap-top-ct/edit/${record.id}`)}
          />

          {/* Quản lý ảnh biến thể */}
          <Button
            icon={<PictureOutlined />}
            type="text"
            title="Quản lý ảnh"
            onClick={() => {
              setCurrentLaptopCtId(record.id);
              setOpenAnhModal(true);
            }}
          />

          {/* Thêm Seri */}
          <Button
            icon={<PlusOutlined />}
            type="text"
            title="Thêm seri"
            onClick={() => {
              setCurrentLaptopCtId(record.id);
              setOpenSeriModal(true);
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2>Danh sách biến thể Laptop</h2>

      <Space style={{ marginBottom: 16 }}>
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchData}
          style={{ background: '#FFD700', color: '#000' }}
        >
          Làm mới
        </Button>
        <Button onClick={() => navigate('/admin/lap-top')}>
          Quay lại danh sách laptop
        </Button>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate(`/admin/lap-top-ct/add/${idLaptop}`)}
        >
          Thêm biến thể
        </Button>
      </Space>

      <Table
        rowKey="id"
        dataSource={variants}
        columns={columns}
        loading={loading}
        bordered
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1200 }}
        locale={{ emptyText: 'Chưa có dữ liệu biến thể' }}
      />

      {/* MODAL THÊM SERI */}
      <Modal
        open={openSeriModal}
        onCancel={() => setOpenSeriModal(false)}
        footer={null}
        width={900}
        destroyOnClose
        title="Quản lý Serial Numbers"
      >
        {currentLaptopCtId && (
          <AddSeriComponent
            idLaptopCt={currentLaptopCtId}
            onClose={() => {
              setOpenSeriModal(false);
              fetchData(); // reload số lượng seri
            }}
          />
        )}
      </Modal>

      {/* MODAL QUẢN LÝ ẢNH */}
      <Modal
        open={openAnhModal}
        onCancel={() => setOpenAnhModal(false)}
        footer={null}
        width={900}
        destroyOnClose
        title="Quản lý ảnh biến thể"
      >
        {currentLaptopCtId && (
          <AddAnhComponent
            idLaptopCt={currentLaptopCtId}
            onClose={() => {
              setOpenAnhModal(false);
              // nếu sau này cần dùng số lượng ảnh trong list thì có thể gọi fetchData() ở đây
            }}
          />
        )}
      </Modal>
    </div>
  );
};

export default ListLaptopCTComponent;
