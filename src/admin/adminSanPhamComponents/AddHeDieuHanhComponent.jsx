import React, { useEffect, useRef, useState } from "react";
import { Modal, Form, Input, Select } from "antd";
import { toast } from "react-toastify";
import {
  addHeDieuHanh,
  getAllById,
  updateHeDieuHanh,
} from "../../service/HeDieuHanhService";

const { Option } = Select;

const AddHeDieuHanhModal = ({ open, id, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const maRef = useRef(null);

  const isDuplicate = (err) => {
    const status = err?.response?.status;
    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "";
    return status === 409 || /trùng|đã tồn tại|duplicate|exists/i.test(String(msg));
  };

  const getBeMsg = (err) =>
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    "";

  // ===== Load data khi edit =====
  useEffect(() => {
    if (!open) return;

    // clear lỗi cũ
    form.setFields([{ name: "ma", errors: [] }]);

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
              ma: data.ma,
              ten: data.ten,
              trangThai: Number(data.trangThai ?? 1),
            });
          } else {
            toast.error("Không tìm thấy dữ liệu hệ điều hành");
          }
        })
        .catch((e) => {
          console.error(e);
          toast.error("Không thể tải dữ liệu hệ điều hành");
        });
    } else {
      form.resetFields();
      form.setFieldsValue({ trangThai: 1 });
      setTimeout(() => maRef.current?.focus?.(), 0);
    }
  }, [open, id, form]);

  // ===== Save =====
  const doSave = async (values) => {
    try {
      setLoading(true);
      form.setFields([{ name: "ma", errors: [] }]);

      const payload = {
        ...values,
        trangThai: Number(values.trangThai ?? 1),
      };

      if (id) {
        await updateHeDieuHanh({ id, ...payload });
        toast.success(`Cập nhật hệ điều hành "${values.ten}" thành công`);
      } else {
        await addHeDieuHanh(payload);
        toast.success(`Thêm hệ điều hành "${values.ten}" thành công`);
      }

      onSuccess?.(id ? "edit" : "add", values.ma);
      onClose?.();
    } catch (err) {
      console.error("Lỗi lưu hệ điều hành:", err);

      // ❌ trùng mã
      if (isDuplicate(err)) {
        const msg = `Mã hệ điều hành "${values.ma}" đã tồn tại. Vui lòng nhập mã khác.`;
        toast.error(msg);
        form.setFields([{ name: "ma", errors: [msg] }]);
        setTimeout(() => maRef.current?.focus?.(), 0);
        return;
      }

      toast.error(
        getBeMsg(err) ||
        (id
          ? "Cập nhật hệ điều hành thất bại"
          : "Thêm hệ điều hành thất bại")
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ===== OK =====
  const handleOk = async () => {
    if (loading) return;

    try {
      const values = await form.validateFields();

      Modal.confirm({
        title: id ? "Xác nhận cập nhật" : "Xác nhận thêm mới",
        content: id
          ? `Bạn có chắc chắn muốn cập nhật hệ điều hành "${values.ten}"?`
          : `Bạn có chắc chắn muốn thêm hệ điều hành "${values.ten}"?`,
        okText: "Xác nhận",
        cancelText: "Hủy",
        centered: true,
        onOk: () => doSave(values),
      });
    } catch (e) {
      if (e?.errorFields) {
        toast.error("Vui lòng kiểm tra lại các trường bắt buộc");
      } else {
        console.error(e);
      }
    }
  };

  return (
    <Modal
      title={id ? "Cập nhật hệ điều hành" : "Thêm hệ điều hành mới"}
      open={open}
      onCancel={() => !loading && onClose?.()}
      onOk={handleOk}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={loading}
      okButtonProps={{ disabled: loading }}
      cancelButtonProps={{ disabled: loading }}
      destroyOnClose
      centered
    >
      <Form layout="vertical" form={form} initialValues={{ trangThai: 1 }}>
        <Form.Item
          name="ma"
          label="Mã hệ điều hành"
          rules={[{ required: true, message: "Vui lòng nhập mã hệ điều hành" }]}
        >
          <Input ref={maRef} placeholder="Ví dụ: hdh1, win11, mac01..." />
        </Form.Item>

        <Form.Item
          name="ten"
          label="Tên hệ điều hành"
          rules={[{ required: true, message: "Vui lòng nhập tên hệ điều hành" }]}
        >
          <Input placeholder="Ví dụ: Windows, macOS, Linux..." />
        </Form.Item>

        <Form.Item
          name="trangThai"
          label="Trạng thái"
          rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
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

export default AddHeDieuHanhModal;
