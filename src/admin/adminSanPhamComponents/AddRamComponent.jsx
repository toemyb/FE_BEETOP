import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { addRam, getAllById, updateRam } from '../../service/RamService';
import { Form, Input, Select, Button, Card, message } from 'antd';

const { Option } = Select;

const AddRamComponent = () => {
  const [idLoaiRam, setIdLoaiRam] = useState('');
  const [dungLuongRam, setDungLuongRam] = useState('');
  const [bus, setBus] = useState('');
  const [moTa, setMoTa] = useState('');
  const [trangThai, setTrangThai] = useState(1);

  const { id } = useParams();
  const navigator = useNavigate();

  useEffect(() => {
    if (id) {
      getAllById(id)
        .then((response) => {
          const ram = response.data.data;
          setIdLoaiRam(ram.idLoaiRam);
          setDungLuongRam(ram.dungLuongRam);
          setBus(ram.bus);
          setMoTa(ram.moTa);
          setTrangThai(ram.trangThai);
        })
        .catch(() => {
          message.error('Không thể tải dữ liệu RAM');
        });
    }
  }, [id]);

  const onFinish = () => {
    const ram = {
      idLoaiRam,
      dungLuongRam,
      bus,
      moTa,
      trangThai: Number(trangThai),
    };

    const request = id ? updateRam({ id, ...ram }) : addRam(ram);

    request
      .then(() => {
        message.success(id ? 'Cập nhật RAM thành công!' : 'Thêm RAM thành công!');
        navigator('/admin/ram');
      })
      .catch(() => {
        message.error(id ? 'Cập nhật thất bại' : 'Thêm thất bại');
      });
  };

  const handleCancel = () => {
    navigator('/admin/ram');
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 16px' }}>
      <Card title={id ? 'CẬP NHẬT RAM' : 'THÊM RAM'} style={{ width: '100%', maxWidth: 600 }}>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item label="Mã RAM">
            <Input value={idLoaiRam} onChange={(e) => setIdLoaiRam(e.target.value)} />
          </Form.Item>

          <Form.Item label="Dung lượng RAM" required>
            <Input value={dungLuongRam} onChange={(e) => setDungLuongRam(e.target.value)} />
          </Form.Item>

          <Form.Item label="Bus" required>
            <Input value={bus} onChange={(e) => setBus(e.target.value)} />
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

export default AddRamComponent;
