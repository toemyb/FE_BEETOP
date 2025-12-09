import React, { useEffect } from 'react';
import { Modal, Form, Input } from 'antd';
import { addHeDieuHanh, getAllById, updateHeDieuHanh } from '../../service/HeDieuHanhService';
import useToast from '../../hooks/useNotify';

const AddHeDieuHanhModal = ({ open, id, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const { success, error } = useToast();

  useEffect(() => {
    if (id && open) {
      getAllById(id)
        .then((res) => {
          form.setFieldsValue(res.data.data); // ⬅ Lấy đúng object bên trong
        })
        .catch(() => error('Không thể tải dữ liệu hệ điều hành'));
    } else if (open) {
      form.resetFields();
    }
  }, [id, open, form, error]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      if (id) {
        await updateHeDieuHanh({ id, ...values });
        success('Cập nhật hệ điều hành thành công!');
      } else {
        await addHeDieuHanh(values);
        success('Thêm hệ điều hành thành công!');
      }

      onSuccess?.();
      onClose();
    } catch (e) {
      error('Lưu hệ điều hành thất bại');
    }
  };

  return (
    <Modal
      title={id ? 'Cập nhật hệ điều hành' : 'Thêm hệ điều hành mới'}
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="Lưu"
      cancelText="Hủy"
      destroyOnClose
    >
      <Form layout="vertical" form={form}>
        
        <Form.Item
          name="ma"
          label="Mã hệ điều hành"
          rules={[{ required: true, message: 'Vui lòng nhập mã hệ điều hành' }]}
        >
          <Input placeholder="Ví dụ: hdh1, win11, mac01..." />
        </Form.Item>

        <Form.Item
          name="ten"
          label="Tên hệ điều hành"
          rules={[{ required: true, message: 'Vui lòng nhập tên hệ điều hành' }]}
        >
          <Input placeholder="Ví dụ: Windows 11, macOS Ventura..." />
        </Form.Item>

        <Form.Item
          name="phienBan"
          label="Phiên bản"
          rules={[{ required: true, message: 'Vui lòng nhập phiên bản (ví dụ 22H2)' }]}
        >
          <Input placeholder="Ví dụ: 22H2, 2023, 12.4..." />
        </Form.Item>

      </Form>
    </Modal>
  );
};

export default AddHeDieuHanhModal;
