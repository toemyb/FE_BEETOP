import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select } from 'antd';
import { addCpu, getAllById, updateCpu } from '../../service/CpuService';
import useToast from '../../hooks/useNotify';

const { Option } = Select;

const AddCpuModal = ({ open, id, onClose, onSuccess }) => {
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
          error('Không thể tải dữ liệu CPU');
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
      const request = id ? updateCpu({ id, ...payload }) : addCpu(payload);
      await request;

      success(
        id
          ? `Cập nhật thành công: ${values.idCpu}`
          : `Thêm mới thành công: ${values.idCpu}`
      );

      if (onSuccess) {
        onSuccess(id ? 'edit' : 'add', values.idCpu);
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
      title={id ? 'CẬP NHẬT CPU' : 'THÊM CPU'}
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
          label="Mã CPU"
          name="idCpu"
          rules={[{ required: true, message: 'Vui lòng nhập mã CPU' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Tên Chip"
          name="ten"
          rules={[{ required: true, message: 'Vui lòng nhập tên chip' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item label="Mô tả" name="moTa">
          <Input />
        </Form.Item>

        <Form.Item label="Trạng thái" name="trangThai" initialValue={1}>
          <Select>
            <Option value={1}>Hoạt động</Option>
            <Option value={0}>Ngừng hoạt động</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddCpuModal;
