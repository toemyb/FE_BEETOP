import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select } from 'antd';
import { addRom, getAllById, updateRom } from '../../service/RomService';
import useToast from '../../hooks/useNotify';

const { Option } = Select;

const AddRomModal = ({ open, id, onClose, onSuccess }) => {
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
          error('Không thể tải dữ liệu ROM');
        });
    } else {
      form.resetFields();
      form.setFieldsValue({ trangThai: 1 });
    }
  }, [id, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const payload = { ...values, trangThai: Number(values.trangThai) };
      const request = id ? updateRom({ id, ...payload }) : addRom(payload);
      await request;

      success(id ? 'Cập nhật ROM thành công!' : 'Thêm ROM thành công!');
      if (onSuccess) onSuccess(id ? 'edit' : 'add', values.idSsd);
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
      title={id ? 'CẬP NHẬT ROM' : 'THÊM ROM'}
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
          label="Mã SSD"
          name="idSsd"
          rules={[{ required: true, message: 'Vui lòng nhập mã SSD' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Dung lượng SSD"
          name="dungLuongSsd"
          rules={[{ required: true, message: 'Vui lòng nhập dung lượng SSD' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Loại SSD"
          name="loaiSsd"
          rules={[{ required: true, message: 'Vui lòng nhập loại SSD' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Tốc độ đọc"
          name="tocDoDoc"
          rules={[{ required: true, message: 'Vui lòng nhập tốc độ đọc' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Tốc độ ghi"
          name="tocDoGhi"
          rules={[{ required: true, message: 'Vui lòng nhập tốc độ ghi' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item label="Mô tả" name="moTa">
          <Input />
        </Form.Item>

        <Form.Item label="Trạng thái" name="trangThai" initialValue={1}>
          <Select>
            <Option value={1}>Hoạt động</Option>
            <Option value={0}>Ngưng</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddRomModal;
