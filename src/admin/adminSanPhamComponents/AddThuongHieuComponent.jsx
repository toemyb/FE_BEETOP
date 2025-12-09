import React, { useEffect, useState } from 'react';
import { Modal, Form, Input } from 'antd';
import { addThuongHieu, getAllById, updateThuongHieu } from '../../service/ThuongHieuService';
import useToast from '../../hooks/useNotify';

const AddThuongHieuModal = ({ open, id, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  // Load dữ liệu khi sửa (style giống AddPinModal)
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
          error('Không thể tải dữ liệu Thương hiệu');
        });
    } else {
      form.resetFields();
    }
  }, [id, form, error]);

  // Lưu (thêm/sửa) — giống pattern AddPinModal
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const req = id ? updateThuongHieu({ id, ...values }) : addThuongHieu(values);
      await req;

      success(id ? `Đã cập nhật: ${values.ten}` : `Đã thêm: ${values.ten}`);
      onSuccess?.(id ? 'edit' : 'add', values.ten);
      onClose();
    } catch (err) {
      console.error('Lỗi khi submit Thương hiệu:', err);
      error(id ? 'Cập nhật thất bại' : 'Thêm mới thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title={id ? 'CẬP NHẬT THƯƠNG HIỆU' : 'THÊM THƯƠNG HIỆU'}
      onCancel={onClose}
      onOk={handleOk}
      okText="Xác nhận"
      cancelText="Hủy"
      confirmLoading={loading}
      destroyOnClose
      centered
    >
      <Form form={form} layout="vertical">
        {/* Giống “Mã Pin” nhưng ở Brand dữ liệu BE bạn chỉ có tên & mô tả, nên để tên là khoá chính hiển thị */}
        <Form.Item
          label="Tên Thương Hiệu"
          name="ten"
          rules={[{ required: true, message: 'Vui lòng nhập Tên Thương Hiệu' }]}
        >
          <Input placeholder="Ví dụ: Lenovo" />
        </Form.Item>

        <Form.Item label="Mô Tả" name="moTa">
          <Input placeholder="Mô tả ngắn" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddThuongHieuModal;
