import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { addCpu, getAllById, updateCpu, listCpu } from '../../service/CpuService';
import { Form, Input, Button, Select, Card, message } from 'antd';

const AddCpuComponent = () => {
  const [idCpu, setidCpu] = useState('');
  const [ten, setten] = useState('');
  const [moTa, setmoTa] = useState('');
  const [trangThai, settrangThai] = useState(1);
  const { id } = useParams();
  const navigator = useNavigate();

  const generateIdCpu = async () => {
    try {
      const response = await listCpu();
      const list = response.data;
      const nextNumber = (list.length || 0) + 1;
      const generatedId = 'CPU' + String(nextNumber).padStart(3, '0');
      setidCpu(generatedId);
    } catch (error) {
      console.error('Lỗi khi sinh mã idCpu:', error);
    }
  };

  useEffect(() => {
    if (id) {
      getAllById(id)
        .then((response) => {
          const cpu = response.data.data;
          setidCpu(cpu.idCpu);
          setten(cpu.ten);
          setmoTa(cpu.moTa);
          settrangThai(cpu.trangThai);
        })
        .catch((error) => {
          console.error('Lỗi khi load CPU:', error);
          message.error('Không thể tải dữ liệu CPU');
        });
    } else {
      generateIdCpu();
    }
  }, [id]);

  const onFinish = () => {
    const cpu = {
      idCpu,
      ten,
      moTa,
      trangThai: Number(trangThai)
    };

    if (id) {
      const cpuUpdate = { id, ...cpu };
      updateCpu(cpuUpdate)
        .then(() => {
          message.success('Cập nhật CPU thành công!');
          navigator('/admin/cpu');
        })
        .catch((error) => {
          console.error('Lỗi khi cập nhật:', error);
          message.error('Cập nhật thất bại');
        });
    } else {
      addCpu(cpu)
        .then(() => {
          message.success('Thêm CPU thành công!');
          navigator('/admin/cpu');
        })
        .catch((error) => {
          console.error('Lỗi khi thêm:', error);
          message.error('Thêm thất bại');
        });
    }
  };

  const handleCancel = () => {
    navigator('/admin/cpu');
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
      <Card title={id ? 'CẬP NHẬT CPU' : 'THÊM CPU'} style={{ width: 500 }}>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item label="Mã CPU">
            <Input value={idCpu} disabled />
          </Form.Item>

          <Form.Item label="Tên Chip" required>
            <Input value={ten} onChange={(e) => setten(e.target.value)} />
          </Form.Item>

          <Form.Item label="Mô tả" required>
            <Input value={moTa} onChange={(e) => setmoTa(e.target.value)} />
          </Form.Item>

          <Form.Item label="Trạng thái" required>
            <Select value={trangThai} onChange={settrangThai}>
              <Select.Option value={1}>Hoạt động</Select.Option>
              <Select.Option value={0}>Ngừng hoạt động</Select.Option>
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

export default AddCpuComponent;
