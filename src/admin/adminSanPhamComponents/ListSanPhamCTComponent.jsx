import React, { useEffect, useState } from 'react';
import { Table, Tag, Space, Button, message, Modal } from 'antd'; // 👈 THÊM Modal
import { ReloadOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { getLaptopCTByLaptop } from '../../service/LapTopCTService';
import { getSeriByLaptopCt } from '../../service/SeriService';
import AddSeriComponent from './AddSeriComponent'; // 👈 IMPORT FORM SERI

const ListLaptopCTComponent = () => {
  const navigate = useNavigate();
  const { idLaptop } = useParams();

  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [seriCounts, setSeriCounts] = useState({});

  // state cho modal thêm seri
  const [openSeriModal, setOpenSeriModal] = useState(false);
  const [currentLaptopCtId, setCurrentLaptopCtId] = useState(null);

  const fetchData = async () => {
    if (!idLaptop) {
      message.error('Không tìm thấy ID laptop. Vui lòng quay lại danh sách sản phẩm!');
      navigate('/admin/lap-top');
      return;
    }

    setLoading(true);
    try {
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
      }));

      setVariants(mapped);
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

  // ====== LOAD SỐ LƯỢNG SERI CHO TỪNG BIẾN THỂ ======
  useEffect(() => {
    if (!variants.length) return;

    const fetchSeriCounts = async () => {
      try {
        const result = {};
        await Promise.all(
          variants.map(async (v) => {
            const res = await getSeriByLaptopCt(v.id);
            const list = res?.data?.data || res?.data || [];
            result[v.id] = Array.isArray(list) ? list.length : 0;
          })
        );
        setSeriCounts(result);
      } catch (e) {
        console.error('❌ Lỗi load số lượng seri:', e);
      }
    };

    fetchSeriCounts();
  }, [variants]);

  const columns = [
    { title: 'STT', dataIndex: 'stt', width: 60 },
    {
      title: 'Mã biến thể',
      dataIndex: 'idLaptopCT',
      width: 160,
      render: (val) => val || <span style={{ color: '#aaa' }}>(Chưa gán mã)</span>,
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
        val != null ? val.toLocaleString('vi-VN') + ' ₫' : <span style={{ color: '#aaa' }}>-</span>,
    },
    {
      title: 'Số lượng seri',
      dataIndex: 'soLuongSeri',
      width: 130,
      align: 'center',
      render: (_, record) => seriCounts[record.id] ?? 0,
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
          <Button
            icon={<EditOutlined />}
            type="text"
            onClick={() => navigate(`/admin/lap-top-ct/edit/${record.id}`)}
          />

          <Button
            icon={<EyeOutlined />}
            type="text"
            onClick={() => {
              console.log('View variant id = ', record.id);
            }}
          />

          {/* 👇 Nút mở modal thêm seri */}
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
      >
        {currentLaptopCtId && (
          <AddSeriComponent
            idLaptopCt={currentLaptopCtId}
            onClose={() => {
              setOpenSeriModal(false);
              fetchData(); // reload lại list + số lượng seri
            }}
          />
        )}
      </Modal>
    </div>
  );
};

export default ListLaptopCTComponent;
