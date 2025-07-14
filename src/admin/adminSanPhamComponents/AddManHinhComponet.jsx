import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, Select } from 'antd';
import { addManHinh, updateManHinh, getAllById } from '../../service/ManHinhService';
import useToast from '../../hooks/useNotify';

const { Option } = Select;

const AddManHinhModal = ({ open, id, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    if (id) {
      getAllById(id)
        .then((res) => {
          const data = res.data.data;
          form.setFieldsValue(data);
        })
        .catch(() => {
          error('Không thể tải dữ liệu màn hình');
        });
    } else {
      form.resetFields();
      form.setFieldsValue({ tanSoQuet: 60, trangThai: 1 });
    }
  }, [id, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const payload = { ...values, trangThai: Number(values.trangThai) };
      const request = id
        ? updateManHinh({ id, ...payload })
        : addManHinh(payload);

      await request;
      success(id ? 'Cập nhật màn hình thành công!' : 'Thêm màn hình thành công!');
      if (onSuccess) onSuccess(id ? 'edit' : 'add', values.ma);
      onClose();
    } catch (err) {
      console.error('Lỗi xử lý:', err);
      error(id ? 'Cập nhật thất bại' : 'Thêm thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title={id ? 'CẬP NHẬT MÀN HÌNH' : 'THÊM MÀN HÌNH'}
      onCancel={onClose}
      onOk={handleOk}
      okText="Xác nhận"
      cancelText="Hủy"
      confirmLoading={loading}
      destroyOnClose
      centered
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Mã"
          name="ma"
          rules={[{ required: true, message: 'Vui lòng nhập mã màn hình' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Độ phân giải"
          name="doPhanGiai"
          rules={[{ required: true, message: 'Vui lòng nhập độ phân giải' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Tần số quét (Hz)"
          name="tanSoQuet"
          rules={[{ required: true, message: 'Vui lòng nhập tần số quét' }]}
        >
          <InputNumber min={30} max={360} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          label="Kích thước (inch)"
          name="kichThuoc"
          rules={[{ required: true, message: 'Vui lòng nhập kích thước' }]}
        >
          <InputNumber min={10} max={50} step={0.1} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="Trạng thái" name="trangThai" initialValue={1}>
          <Select>
            <Option value={1}>Hoạt động</Option>
            <Option value={0}>Ngưng hoạt động</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddManHinhModal;
