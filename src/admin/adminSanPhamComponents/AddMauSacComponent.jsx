import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { addMausac, getAllById, updateMausac } from '../../service/MauSacService';
import { Form, Input, Select, Button, Card, message } from 'antd';

const { Option } = Select;

const AddMauSacComponent = () => {
  const [idMauSac, setIdMauSac] = useState('');
  const [ten, setTen] = useState('');
  const [moTa, setMoTa] = useState('');
  const [trangThai, setTrangThai] = useState(1);

  const { id } = useParams();
  const navigator = useNavigate();

  useEffect(() => {
    if (id) {
      getAllById(id)
        .then((response) => {
          const ms = response.data.data;
          setIdMauSac(ms.idMauSac);
          setTen(ms.ten);
          setMoTa(ms.moTa);
          setTrangThai(ms.trangThai);
        })
        .catch((error) => {
          console.error('Lỗi khi tải màu sắc:', error);
          message.error('Không thể tải dữ liệu màu sắc');
        });
    }
  }, [id]);

  const onFinish = () => {
    const ms = {
      idMauSac,
      ten,
      moTa,
      trangThai: Number(trangThai),
    };

    const request = id ? updateMausac({ id, ...ms }) : addMausac(ms);

    request
      .then(() => {
        message.success(id ? 'Cập nhật màu sắc thành công!' : 'Thêm màu sắc thành công!');
        navigator('/admin/mau-sac');
      })
      .catch((error) => {
        console.error('Lỗi khi lưu:', error);
        message.error(id ? 'Cập nhật thất bại' : 'Thêm thất bại');
      });
  };

  const handleCancel = () => {
    navigator('/admin/mau-sac');
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 16px' }}>
      <Card title={id ? 'CẬP NHẬT MÀU SẮC' : 'THÊM MÀU SẮC'} style={{ width: '100%', maxWidth: 600 }}>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item label="Mã màu sắc">
            <Input value={idMauSac} onChange={(e) => setIdMauSac(e.target.value)} />
          </Form.Item>

          <Form.Item label="Tên màu" required>
            <Input value={ten} onChange={(e) => setTen(e.target.value)} />
          </Form.Item>

          <Form.Item label="Mô tả">
            <Input value={moTa} onChange={(e) => setMoTa(e.target.value)} />
          </Form.Item>

          <Form.Item label="Trạng thái">
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

export default AddMauSacComponent;
