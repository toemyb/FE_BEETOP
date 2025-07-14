import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select } from 'antd';
import { addMausac, getAllById, updateMausac } from '../../service/MauSacService';
import useToast from '../../hooks/useNotify'; // dùng hook toast tương tự

const { Option } = Select;

const AddMauSacModal = ({ open, id, onClose, onSuccess }) => {
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
          error('Không thể tải dữ liệu màu sắc');
        });
    } else {
      form.resetFields();
    }
  }, [id, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const payload = { ...values, trangThai: Number(values.trangThai) };
      const request = id ? updateMausac({ id, ...payload }) : addMausac(payload);
      await request;

      success(
        id
          ? `Cập nhật thành công: ${values.idMauSac}`
          : `Thêm mới thành công: ${values.idMauSac}`
      );

      if (onSuccess) {
        onSuccess(id ? 'edit' : 'add', values.idMauSac);
      }

      onClose();
    } catch (err) {
      console.error('Lỗi submit form:', err);
      error(id ? 'Cập nhật thất bại' : 'Thêm thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title={id ? 'CẬP NHẬT MÀU SẮC' : 'THÊM MÀU SẮC'}
      onCancel={onClose}
      onOk={handleOk}
      okText="Xác nhận"
      cancelText="Hủy"
      confirmLoading={loading}
      destroyOnClose
      centered
    >
      <Form form={form} layout="vertical">
        <Form.Item label="Mã Màu Sắc" name="idMauSac">
          <Input />
        </Form.Item>

        <Form.Item
          label="Tên Màu"
          name="ten"
          rules={[{ required: true, message: 'Vui lòng nhập tên màu' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item label="Mô Tả" name="moTa">
          <Input />
        </Form.Item>

        <Form.Item label="Trạng Thái" name="trangThai" initialValue={1}>
          <Select>
            <Option value={1}>Hoạt động</Option>
            <Option value={0}>Ngưng hoạt động</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddMauSacModal;
