import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, Select } from 'antd';
import { addKichthuoc, getAllById, updateKichthuoc } from '../../service/KichThuocService';
import useToast from '../../hooks/useNotify';

const { Option } = Select;

const AddKichThuocModal = ({ open, id, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    if (id) {
      // 🟡 EDIT
      getAllById(id)
        .then((res) => {
          const data =
            res?.data?.data ??
            res?.data?.content ??
            (Array.isArray(res?.data) ? res.data : res?.data) ??
            null;

          if (data) {
            form.setFieldsValue({
              idKichThuoc: data.idKichThuoc,
              chieuDai: Number(data.chieuDai ?? 0),
              chieuRong: Number(data.chieuRong ?? 0),
              chieuCao: Number(data.chieuCao ?? 0),
              khoiLuong: Number(data.khoiLuong ?? 0),
              trangThai: Number(data.trangThai ?? 1),
            });
          } else {
            error('Không tìm thấy dữ liệu Kích thước');
          }
        })
        .catch(() => {
          error('Không thể tải dữ liệu Kích thước');
        });
    } else {
      // 🔵 ADD – reset + default trạng thái = 1
      form.resetFields();
      form.setFieldsValue({
        chieuDai: 0,
        chieuRong: 0,
        chieuCao: 0,
        khoiLuong: 0,
        trangThai: 1,
      });
    }
  }, [id, form, error]);

  // ✅ Hàm thực sự gửi API
  const doSubmit = async (values) => {
    try {
      setLoading(true);

      const payload = {
        ...values,
        chieuDai: Number(values.chieuDai),
        chieuRong: Number(values.chieuRong),
        chieuCao: Number(values.chieuCao),
        khoiLuong: Number(values.khoiLuong),
        trangThai: Number(values.trangThai ?? 1),
      };

      const req = id
        ? updateKichthuoc({ id, ...payload })
        : addKichthuoc(payload);

      await req;

      success(
        id
          ? `Cập nhật kích thước "${values.idKichThuoc}" thành công`
          : `Thêm kích thước "${values.idKichThuoc}" thành công`
      );

      onSuccess?.(id ? 'edit' : 'add', values.idKichThuoc);
      onClose();
    } catch (err) {
      console.error('Lỗi submit Kích thước:', err);
      error(id ? 'Cập nhật kích thước thất bại' : 'Thêm kích thước thất bại');
      throw err; // để Modal.confirm biết là có lỗi
    } finally {
      setLoading(false);
    }
  };

  // 🔔 Hàm bấm nút OK trên modal – validate + hỏi xác nhận
  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      // Nếu đang sửa -> hỏi xác nhận cập nhật
      if (id) {
        Modal.confirm({
          title: 'Xác nhận cập nhật',
          content: `Bạn có chắc chắn muốn thay đổi thông tin kích thước "${values.idKichThuoc}"?`,
          okText: 'Đồng ý',
          cancelText: 'Hủy',
          centered: true,
          onOk: () => doSubmit(values), // trả về Promise -> antd sẽ hiện loading cho confirm
        });
      } else {
        // Nếu thêm mới -> cũng có thể hỏi cho chắc
        Modal.confirm({
          title: 'Xác nhận thêm mới',
          content: `Bạn có chắc chắn muốn thêm kích thước "${values.idKichThuoc}"?`,
          okText: 'Đồng ý',
          cancelText: 'Hủy',
          centered: true,
          onOk: () => doSubmit(values),
        });
      }
    } catch (err) {
      if (err?.errorFields) {
        // lỗi validate
        error('Vui lòng kiểm tra lại các trường bắt buộc');
      }
    }
  };

  return (
    <Modal
      open={open}
      title={id ? 'CẬP NHẬT KÍCH THƯỚC' : 'THÊM KÍCH THƯỚC'}
      onCancel={onClose}
      onOk={handleOk}          // 🔥 dùng handleOk mới
      okText="Xác nhận"
      cancelText="Hủy"
      confirmLoading={loading} // loading khi gọi API
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
          <Input/>
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

        {/* Trạng thái */}
        <Form.Item
          label="Trạng thái"
          name="trangThai"
          rules={[{ required: true, message: 'Vui lòng chọn Trạng thái' }]}
        >
          <Select>
            <Option value={1}>Đang hoạt động</Option>
            <Option value={0}>Ngừng hoạt động</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddKichThuocModal;
