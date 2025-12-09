import React, { useEffect, useState } from 'react';
import { Modal, Form, Input } from 'antd';
import { addPin, getAllById, updatePin } from '../../service/PinService';
import useToast from '../../hooks/useNotify';

const AddPinModal = ({ open, id, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  // Load dữ liệu khi sửa
  useEffect(() => {
    if (id) {
      getAllById(id)
        .then((res) => {
          const data =
            res?.data?.data ??
            res?.data?.content ??
            (Array.isArray(res?.data) ? res.data : res?.data) ??
            null;

          if (data) form.setFieldsValue(data);
        })
        .catch(() => {
          error('Không thể tải dữ liệu Pin');
        });
    } else {
      form.resetFields();
    }
  }, [id, form, error]);

  // Lưu (thêm/sửa)
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const req = id ? updatePin({ id, ...values }) : addPin(values);
      await req;

      success(id ? `Đã cập nhật: ${values.idPin}` : `Đã thêm: ${values.idPin}`);
      onSuccess?.(id ? 'edit' : 'add', values.idPin);
      onClose();
    } catch (err) {
      console.error('Lỗi khi submit Pin:', err);
      error(id ? 'Cập nhật thất bại' : 'Thêm mới thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title={id ? 'CẬP NHẬT PIN' : 'THÊM PIN'}
      onCancel={onClose}
      onOk={handleOk}
      okText="Xác nhận"
      cancelText="Hủy"
      confirmLoading={loading}
      destroyOnClose
      centered
    >
      <Form form={form} layout="vertical">
        {/* Mã Pin */}
        <Form.Item
          label="Mã Pin"
          name="idPin"
          rules={[{ required: true, message: 'Vui lòng nhập Mã Pin' }]}
        >
          <Input disabled={!!id} placeholder="Ví dụ: PIN001" />
        </Form.Item>

        {/* Dung lượng */}
        <Form.Item
          label="Dung lượng"
          name="dungLuong"
          rules={[{ required: true, message: 'Vui lòng nhập Dung lượng' }]}
        >
          <Input placeholder="Ví dụ: 3-cell, 5-cell, 56Wh..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddPinModal;
