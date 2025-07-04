import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { addDohoa, getAllById, updateDohoa } from '../../service/DoHoaService';
import { Form, Input, Select, Button, Card, message } from 'antd';

const { Option } = Select;

const AddDoHoaComponent = () => {
  const [idDohoa, setIdDohoa] = useState('');
  const [hangcardOboard, setHangcardOboard] = useState('');
  const [modelcardOboard, setModelcardOboard] = useState('');
  const [tenDayDu, setTenDayDu] = useState('');
  const [loaiCard, setLoaiCard] = useState('');
  const [boNhoRam, setBoNhoRam] = useState('');
  const [moTa, setMoTa] = useState('');
  const [trangThai, setTrangThai] = useState(1);

  const { id } = useParams();
  const navigator = useNavigate();

  useEffect(() => {
    if (id) {
      getAllById(id)
        .then((response) => {
          const data = response.data.data;
          setIdDohoa(data.idDohoa);
          setHangcardOboard(data.hangcardOboard);
          setModelcardOboard(data.modelcardOboard);
          setTenDayDu(data.tenDayDu);
          setLoaiCard(data.loaiCard);
          setBoNhoRam(data.boNhoRam);
          setMoTa(data.moTa);
          setTrangThai(data.trangThai);
        })
        .catch((error) => {
          console.error('Lỗi khi tải dữ liệu:', error);
          message.error('Không thể tải dữ liệu đồ họa');
        });
    }
  }, [id]);

  const onFinish = () => {
    const doHoa = {
      idDohoa,
      hangcardOboard,
      modelcardOboard,
      tenDayDu,
      loaiCard,
      boNhoRam,
      moTa,
      trangThai: Number(trangThai),
    };

    const request = id ? updateDohoa({ id, ...doHoa }) : addDohoa(doHoa);

    request
      .then(() => {
        message.success(id ? 'Cập nhật đồ họa thành công!' : 'Thêm đồ họa thành công!');
        navigator('/admin/do-hoa');
      })
      .catch((error) => {
        console.error('Lỗi khi lưu:', error);
        message.error(id ? 'Cập nhật thất bại' : 'Thêm thất bại');
      });
  };

  const handleCancel = () => {
    navigator('/admin/do-hoa');
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 16px' }}>
      <Card title={id ? 'CẬP NHẬT ĐỒ HỌA' : 'THÊM ĐỒ HỌA'} style={{ width: '100%', maxWidth: 700 }}>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item label="Mã Đồ Họa">
            <Input value={idDohoa} onChange={(e) => setIdDohoa(e.target.value)} />
          </Form.Item>

          <Form.Item label="Hãng Card Onboard" required>
            <Input value={hangcardOboard} onChange={(e) => setHangcardOboard(e.target.value)} />
          </Form.Item>

          <Form.Item label="Model Card Onboard" required>
            <Input value={modelcardOboard} onChange={(e) => setModelcardOboard(e.target.value)} />
          </Form.Item>

          <Form.Item label="Tên Đầy Đủ" required>
            <Input value={tenDayDu} onChange={(e) => setTenDayDu(e.target.value)} />
          </Form.Item>

          <Form.Item label="Loại Card" required>
            <Input value={loaiCard} onChange={(e) => setLoaiCard(e.target.value)} />
          </Form.Item>

          <Form.Item label="Bộ Nhớ RAM" required>
            <Input value={boNhoRam} onChange={(e) => setBoNhoRam(e.target.value)} />
          </Form.Item>

          <Form.Item label="Mô Tả">
            <Input value={moTa} onChange={(e) => setMoTa(e.target.value)} />
          </Form.Item>

          <Form.Item label="Trạng Thái">
            <Select value={trangThai} onChange={setTrangThai}>
              <Option value={1}>Hoạt động</Option>
              <Option value={0}>Ngưng hoạt động</Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ textAlign: 'right' }}>
            <Button onClick={handleCancel} style={{ marginRight: 8 }}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit">
              Xác nhận
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AddDoHoaComponent;
