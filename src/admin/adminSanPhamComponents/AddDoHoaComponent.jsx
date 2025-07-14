import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select } from 'antd';
import { addDohoa, getAllById, updateDohoa } from '../../service/DoHoaService';
import useToast from '../../hooks/useNotify'; // Hook custom toast

const { Option } = Select;

const AddDoHoaModal = ({ open, id, onClose, onSuccess }) => {
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
          error('Không thể tải dữ liệu đồ họa');
        });
    } else {
      form.resetFields();
      form.setFieldsValue({ trangThai: 1 }); // Default trạng thái
    }
  }, [id, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const payload = { ...values, trangThai: Number(values.trangThai) };

      const request = id
        ? updateDohoa({ id, ...payload })
        : addDohoa(payload);

      await request;

      success(
        id
          ? `Đã cập nhật: ${values.idDohoa}`
          : `Đã thêm: ${values.idDohoa}`
      );

      if (onSuccess) onSuccess(id ? 'edit' : 'add', values.idDohoa);
      onClose();
    } catch (err) {
      console.error('Lỗi submit form:', err);
      error(id ? 'Cập nhật thất bại' : 'Thêm mới thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title={id ? 'CẬP NHẬT ĐỒ HỌA' : 'THÊM ĐỒ HỌA'}
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
          label="Mã Đồ Họa"
          name="idDohoa"
          rules={[{ required: true, message: 'Vui lòng nhập Mã Đồ Họa' }]}
        >
          <Input disabled={!!id} />
        </Form.Item>

        <Form.Item
          label="Hãng Card Onboard"
          name="hangcardOboard"
          rules={[{ required: true, message: 'Vui lòng nhập Hãng Card Onboard' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Model Card Onboard"
          name="modelcardOboard"
          rules={[{ required: true, message: 'Vui lòng nhập Model Card Onboard' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Tên Đầy Đủ"
          name="tenDayDu"
          rules={[{ required: true, message: 'Vui lòng nhập Tên đầy đủ' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Loại Card"
          name="loaiCard"
          rules={[{ required: true, message: 'Vui lòng nhập Loại Card' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Bộ Nhớ RAM"
          name="boNhoRam"
          rules={[{ required: true, message: 'Vui lòng nhập Bộ nhớ RAM' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item label="Mô Tả" name="moTa">
          <Input />
        </Form.Item>

        <Form.Item label="Trạng Thái" name="trangThai">
          <Select>
            <Option value={1}>Hoạt động</Option>
            <Option value={0}>Ngưng hoạt động</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddDoHoaModal;
