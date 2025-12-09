import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select } from 'antd';
import {
  addThuongHieu,
  getAllById,
  updateThuongHieu,
} from '../../service/ThuongHieuService';
import useToast from '../../hooks/useNotify';

const { Option } = Select;

const AddThuongHieuModal = ({ open, id, onClose, onSuccess }) => {
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
          if (data) {
            form.setFieldsValue({
              ten: data.ten,
              moTa: data.moTa,
              trangThai: Number(data.trangThai ?? 1),
            });
          } else {
            error('Không tìm thấy dữ liệu Thương hiệu');
          }
        })
        .catch(() => {
          error('Không thể tải dữ liệu Thương hiệu');
        });
    } else {
      form.resetFields();
      form.setFieldsValue({ trangThai: 1 });
    }
  }, [id, form, error]);

  // Hàm thực sự gọi API
  const doSubmit = async (values) => {
    try {
      setLoading(true);

      const payload = {
        ...values,
        trangThai: Number(values.trangThai ?? 1),
      };

      const req = id
        ? updateThuongHieu({ id, ...payload })
        : addThuongHieu(payload);

      await req;

      success(
        id
          ? `Đã cập nhật thương hiệu: ${values.ten}`
          : `Đã thêm thương hiệu: ${values.ten}`
      );
      onSuccess?.(id ? 'edit' : 'add', values.ten);
      onClose();
    } catch (err) {
      console.error('Lỗi khi submit Thương hiệu:', err);
      error(id ? 'Cập nhật thất bại' : 'Thêm mới thất bại');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Nút OK: validate + popup xác nhận
  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      if (id) {
        Modal.confirm({
          title: 'Xác nhận cập nhật',
          content: `Bạn có chắc chắn muốn thay đổi thương hiệu "${values.ten}"?`,
          okText: 'Đồng ý',
          cancelText: 'Hủy',
          centered: true,
          onOk: () => doSubmit(values),
        });
      } else {
        Modal.confirm({
          title: 'Xác nhận thêm mới',
          content: `Bạn có chắc chắn muốn thêm thương hiệu "${values.ten}"?`,
          okText: 'Đồng ý',
          cancelText: 'Hủy',
          centered: true,
          onOk: () => doSubmit(values),
        });
      }
    } catch (err) {
      if (err?.errorFields) {
        error('Vui lòng kiểm tra lại các trường bắt buộc');
      }
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

        <Form.Item
          label="Trạng thái"
          name="trangThai"
          rules={[{ required: true, message: 'Vui lòng chọn Trạng thái' }]}
        >
          <Select>
            <Option value={1}>Hoạt động</Option>
            <Option value={0}>Ngưng hoạt động</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddThuongHieuModal;
