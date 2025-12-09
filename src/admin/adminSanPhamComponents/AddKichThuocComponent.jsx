import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber } from 'antd';
import { addKichthuoc, getAllById, updateKichthuoc } from '../../service/KichThuocService';
import useToast from '../../hooks/useNotify';

const AddKichThuocModal = ({ open, id, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    if (id) {
      getAllById(id)
        .then((res) => {
          const data =
            res?.data?.data ??
            res?.data?.content ??
            (Array.isArray(res?.data) ? res.data : res?.data) ??
            null;

          // Ép kiểu số an toàn trước khi set vào form
          if (data) {
            form.setFieldsValue({
              idKichThuoc: data.idKichThuoc,
              chieuDai: Number(data.chieuDai ?? 0),
              chieuRong: Number(data.chieuRong ?? 0),
              chieuCao: Number(data.chieuCao ?? 0),
              khoiLuong: Number(data.khoiLuong ?? 0),
            });
          }
        })
        .catch(() => {
          error('Không thể tải dữ liệu Kích thước');
        });
    } else {
      form.resetFields();
    }
  }, [id, form, error]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // đảm bảo số
      const payload = {
        ...values,
        chieuDai: Number(values.chieuDai),
        chieuRong: Number(values.chieuRong),
        chieuCao: Number(values.chieuCao),
        khoiLuong: Number(values.khoiLuong),
      };

      const req = id ? updateKichthuoc({ id, ...payload }) : addKichthuoc(payload);
      await req;

      success(id ? `Đã cập nhật: ${values.idKichThuoc}` : `Đã thêm: ${values.idKichThuoc}`);
      onSuccess?.(id ? 'edit' : 'add', values.idKichThuoc);
      onClose();
    } catch (err) {
      console.error('Lỗi submit Kích thước:', err);
      error(id ? 'Cập nhật thất bại' : 'Thêm mới thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title={id ? 'CẬP NHẬT KÍCH THƯỚC' : 'THÊM KÍCH THƯỚC'}
      onCancel={onClose}
      onOk={handleOk}
      okText="Xác nhận"
      cancelText="Hủy"
      confirmLoading={loading}
      destroyOnClose
      centered
    >
      <Form form={form} layout="vertical">
        {/* Mã Kích Thước */}
        <Form.Item
          label="Mã Kích thước"
          name="idKichThuoc"
          rules={[{ required: true, message: 'Vui lòng nhập Mã Kích thước' }]}
        >
          <Input disabled={!!id} placeholder="Ví dụ: KT01" />
        </Form.Item>

        {/* Chiều dài */}
        <Form.Item
          label="Chiều dài (cm)"
          name="chieuDai"
          rules={[{ required: true, message: 'Vui lòng nhập Chiều dài' }]}
        >
          <InputNumber min={0} step={0.1} style={{ width: '100%' }} placeholder="Ví dụ: 15" />
        </Form.Item>

        {/* Chiều rộng */}
        <Form.Item
          label="Chiều rộng (cm)"
          name="chieuRong"
          rules={[{ required: true, message: 'Vui lòng nhập Chiều rộng' }]}
        >
          <InputNumber min={0} step={0.1} style={{ width: '100%' }} placeholder="Ví dụ: 10" />
        </Form.Item>

        {/* Chiều cao */}
        <Form.Item
          label="Chiều cao (cm)"
          name="chieuCao"
          rules={[{ required: true, message: 'Vui lòng nhập Chiều cao' }]}
        >
          <InputNumber min={0} step={0.1} style={{ width: '100%' }} placeholder="Ví dụ: 2" />
        </Form.Item>

        {/* Khối lượng */}
        <Form.Item
          label="Khối lượng (kg)"
          name="khoiLuong"
          rules={[{ required: true, message: 'Vui lòng nhập Khối lượng' }]}
        >
          <InputNumber min={0} step={0.1} style={{ width: '100%' }} placeholder="Ví dụ: 3" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddKichThuocModal;
