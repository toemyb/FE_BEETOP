import React, { useEffect, useState } from "react";
import { Modal, Form, Input, InputNumber, Select } from "antd";
import { toast } from "react-toastify";
import { addManHinh, updateManHinh, getAllById } from "../../service/ManHinhService";

const { Option } = Select;

const AddManHinhModal = ({ open, id, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // ===== Load data khi edit =====
  useEffect(() => {
    if (!open) return; // tránh set state khi modal đóng

    if (id) {
      getAllById(id)
        .then((res) => {
          const data = res?.data?.data ?? res?.data?.content ?? res?.data ?? null;

          if (data) {
            form.setFieldsValue({
              ma: data.ma,
              doPhanGiai: data.doPhanGiai,
              tanSoQuet: Number(data.tanSoQuet ?? 60),
              kichThuoc: Number(data.kichThuoc ?? 0),
              trangThai: Number(data.trangThai ?? 1),
            });
          } else {
            toast.error("Không tìm thấy dữ liệu màn hình");
          }
        })
        .catch((e) => {
          console.error(e);
          toast.error("Không thể tải dữ liệu màn hình");
        });
    } else {
      // ADD – reset + default
      form.resetFields();
      form.setFieldsValue({
        tanSoQuet: 60,
        trangThai: 1,
      });
    }
  }, [open, id, form]);

  // ===== Gọi API submit =====
  const doSubmit = async (values) => {
    try {
      setLoading(true);

      const payload = {
        ...values,
        tanSoQuet: Number(values.tanSoQuet),
        kichThuoc: Number(values.kichThuoc),
        trangThai: Number(values.trangThai ?? 1),
      };

      const request = id ? updateManHinh({ id, ...payload }) : addManHinh(payload);

      await request;

      toast.success(
        id
          ? `Cập nhật màn hình "${values.ma}" thành công`
          : `Thêm màn hình "${values.ma}" thành công`
      );

      onSuccess?.(id ? "edit" : "add", values.ma);
      onClose?.();
    } catch (err) {
      console.error("Lỗi xử lý:", err);

      const beMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        (id ? "Cập nhật màn hình thất bại" : "Thêm màn hình thất bại");

      toast.error(beMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ===== OK: validate + confirm =====
  const handleOk = async () => {
    if (loading) return; // chặn double click

    try {
      const values = await form.validateFields();

      Modal.confirm({
        title: id ? "Xác nhận cập nhật" : "Xác nhận thêm mới",
        content: id
          ? `Bạn có chắc chắn muốn thay đổi màn hình "${values.ma}"?`
          : `Bạn có chắc chắn muốn thêm màn hình "${values.ma}"?`,
        okText: "Xác nhận",
        cancelText: "Hủy",
        centered: true,
        onOk: () => doSubmit(values),
      });
    } catch (err) {
      if (err?.errorFields) {
        toast.error("Vui lòng kiểm tra lại các trường bắt buộc");
      } else {
        console.error(err);
      }
    }
  };

  return (
    <Modal
      open={open}
      title={id ? "CẬP NHẬT MÀN HÌNH" : "THÊM MÀN HÌNH"}
      onCancel={() => {
        if (!loading) onClose?.();
      }}
      onOk={handleOk}
      okText="Xác nhận"
      cancelText="Hủy"
      confirmLoading={loading}
      okButtonProps={{ disabled: loading }}
      cancelButtonProps={{ disabled: loading }}
      destroyOnClose
      centered
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Mã"
          name="ma"
          rules={[{ required: true, message: "Vui lòng nhập mã màn hình" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Độ phân giải"
          name="doPhanGiai"
          rules={[{ required: true, message: "Vui lòng nhập độ phân giải" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Tần số quét (Hz)"
          name="tanSoQuet"
          rules={[{ required: true, message: "Vui lòng nhập tần số quét" }]}
        >
          <InputNumber min={30} max={360} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          label="Kích thước (inch)"
          name="kichThuoc"
          rules={[{ required: true, message: "Vui lòng nhập kích thước" }]}
        >
          <InputNumber min={10} max={50} step={0.1} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          label="Trạng thái"
          name="trangThai"
          rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
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
