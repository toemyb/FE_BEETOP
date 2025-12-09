import React, { useEffect } from 'react';
import { Modal, Form, Input, Select } from 'antd';
import { addHeDieuHanh, getAllById, updateHeDieuHanh } from '../../service/HeDieuHanhService';
import useToast from '../../hooks/useNotify';

const { Option } = Select;

const AddHeDieuHanhModal = ({ open, id, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const { success, error } = useToast();

  useEffect(() => {
    if (id && open) {
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
        .catch(() => error('Không thể tải dữ liệu hệ điều hành'));
    } else if (open) {
      form.resetFields();
    }
  }, [id, open, form, error]);

  const doSave = async (values) => {
    if (id) {
      // 🟡 GỌI API UPDATE
      await updateHeDieuHanh({ id, ...values });
      success('Cập nhật hệ điều hành thành công!');
    } else {
      // 🟢 GỌI API ADD
      await addHeDieuHanh(values);
      success('Thêm hệ điều hành thành công!');
    }

    onSuccess?.();
    onClose();
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      if (id) {
        // 🔔 HỎI XÁC NHẬN KHI SỬA
        Modal.confirm({
          title: 'Xác nhận cập nhật',
          content: `Bạn có chắc chắn muốn cập nhật hệ điều hành "${values.ten}"?`,
          okText: 'Đồng ý',
          cancelText: 'Hủy',
          onOk: async () => {
            try {
              await doSave(values);
            } catch (e) {
              console.error(e);
              error('Cập nhật hệ điều hành thất bại');
            }
          },
        });
      } else {
        // THÊM MỚI – KHÔNG CẦN CONFIRM
        try {
          await doSave(values);
        } catch (e) {
          console.error(e);
          error('Thêm hệ điều hành thất bại');
        }
      }
    } catch (e) {
      // lỗi validate form -> không làm gì thêm
      console.error(e);
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
      <Form layout="vertical" form={form} initialValues={{ trangThai: 1 }}>
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

        <Form.Item
          name="trangThai"
          label="Trạng thái"
          rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
        >
          <Select placeholder="Chọn trạng thái">
            <Option value={1}>Hoạt động</Option>
            <Option value={0}>Ngưng</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddHeDieuHanhModal;
