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
      // EDIT
      getAllById(id)
        .then((res) => {
          const data =
            res?.data?.data ??
            res?.data?.content ??
            res?.data ??
            null;
          if (data) {
            form.setFieldsValue({
              ma: data.ma,
              doPhanGiai: data.doPhanGiai,
              tanSoQuet: Number(data.tanSoQuet ?? 60),
              kichThuoc: Number(data.kichThuoc ?? 0),
              trangThai: Number(data.trangThai ?? 1),
            });
          } else {
            error('Không tìm thấy dữ liệu màn hình');
          }
        })
        .catch(() => {
          error('Không thể tải dữ liệu màn hình');
        });
    } else {
      // ADD – reset + default
      form.resetFields();
      form.setFieldsValue({
        tanSoQuet: 60,
        trangThai: 1,
      });
    }
  }, [id, form, error]);

  // ✅ Hàm thực sự gọi API
  const doSubmit = async (values) => {
    try {
      setLoading(true);

      const payload = {
        ...values,
        tanSoQuet: Number(values.tanSoQuet),
        kichThuoc: Number(values.kichThuoc),
        trangThai: Number(values.trangThai ?? 1),
      };

      const request = id
        ? updateManHinh({ id, ...payload })
        : addManHinh(payload);

      await request;

      success(
        id
          ? `Cập nhật màn hình "${values.ma}" thành công`
          : `Thêm màn hình "${values.ma}" thành công`
      );

      onSuccess?.(id ? 'edit' : 'add', values.ma);
      onClose();
    } catch (err) {
      console.error('Lỗi xử lý:', err);
      error(id ? 'Cập nhật màn hình thất bại' : 'Thêm màn hình thất bại');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 🔔 Nút OK: validate + popup xác nhận
  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      if (id) {
        Modal.confirm({
          title: 'Xác nhận cập nhật',
          content: `Bạn có chắc chắn muốn thay đổi màn hình "${values.ma}"?`,
          okText: 'Đồng ý',
          cancelText: 'Hủy',
          centered: true,
          onOk: () => doSubmit(values),
        });
      } else {
        Modal.confirm({
          title: 'Xác nhận thêm mới',
          content: `Bạn có chắc chắn muốn thêm màn hình "${values.ma}"?`,
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

        <Form.Item
          label="Trạng thái"
          name="trangThai"
          rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
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

export default AddManHinhModal;
