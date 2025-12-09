import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select } from 'antd';
import { addPin, getAllById, updatePin } from '../../service/PinService';
import useToast from '../../hooks/useNotify';

const { Option } = Select;

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

          if (data) {
            form.setFieldsValue(data);
          }
        })
        .catch(() => {
          error('Không thể tải dữ liệu Pin');
        });
    } else {
      form.resetFields();
      // mặc định trạng thái = 1 khi thêm mới
      form.setFieldsValue({ trangThai: 1 });
    }
  }, [id, form, error]);

  const doSubmit = async (values) => {
    try {
      setLoading(true);
      const payload = { ...values };

      const req = id ? updatePin({ id, ...payload }) : addPin(payload);
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

  // Lưu (thêm/sửa)
  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      // nếu đang sửa → hỏi confirm
      if (id) {
        Modal.confirm({
          title: 'Xác nhận cập nhật',
          content: `Bạn có chắc chắn muốn cập nhật Pin "${values.idPin}"?`,
          okText: 'Cập nhật',
          cancelText: 'Hủy',
          onOk: () => doSubmit(values),
        });
      } else {
        // thêm mới thì submit luôn
        await doSubmit(values);
      }
    } catch (err) {
      // validate fail thì không làm gì
      console.error(err);
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
      <Form
        form={form}
        layout="vertical"
        initialValues={{ trangThai: 1 }}
      >
        {/* Mã Pin */}
        <Form.Item
          label="Mã Pin"
          name="idPin"
          rules={[{ required: true, message: 'Vui lòng nhập Mã Pin' }]}
        >
          <Input/>
        </Form.Item>

        {/* Dung lượng */}
        <Form.Item
          label="Dung lượng"
          name="dungLuong"
          rules={[{ required: true, message: 'Vui lòng nhập Dung lượng' }]}
        >
          <Input placeholder="Ví dụ: 3-cell, 5-cell, 56Wh..." />
        </Form.Item>

        {/* Trạng thái */}
        <Form.Item
          label="Trạng thái"
          name="trangThai"
          rules={[{ required: true, message: 'Vui lòng chọn Trạng thái' }]}
        >
          <Select>
            <Option value={1}>Hoạt động</Option>
            <Option value={0}>Ngưng</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddPinModal;
