import React, { useEffect, useRef, useState } from "react";
import { Modal, Form, Input, Select } from "antd";
import { toast } from "react-toastify";
import { addPin, getAllById, updatePin } from "../../service/PinService";

const { Option } = Select;

const AddPinModal = ({ open, id, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const codeRef = useRef(null);

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
    err?.response?.data?.message || err?.response?.data?.error || err?.message || "";

  // ===== Load dữ liệu khi sửa =====
  useEffect(() => {
    if (!open) return;

    // clear lỗi cũ
    form.setFields([{ name: "idPin", errors: [] }]);

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
              idPin: data.idPin,
              dungLuong: data.dungLuong,
              trangThai: Number(data.trangThai ?? 1),
            });
          } else {
            toast.error("Không tìm thấy dữ liệu Pin");
          }
        })
        .catch((e) => {
          console.error(e);
          toast.error("Không thể tải dữ liệu Pin");
        });
    } else {
      form.resetFields();
      form.setFieldsValue({ trangThai: 1 });

      // focus mã khi thêm
      setTimeout(() => codeRef.current?.focus?.(), 0);
    }
  }, [open, id, form]);

  // ===== Submit =====
  const doSubmit = async (values) => {
    try {
      setLoading(true);
      form.setFields([{ name: "idPin", errors: [] }]);

      const payload = {
        ...values,
        trangThai: Number(values.trangThai ?? 1),
      };

      const req = id ? updatePin({ id, ...payload }) : addPin(payload);
      await req;

      toast.success(
        id ? `Cập nhật Pin "${values.idPin}" thành công` : `Thêm Pin "${values.idPin}" thành công`
      );

      onSuccess?.(id ? "edit" : "add", values.idPin);
      onClose?.();
    } catch (err) {
      console.error("Lỗi khi submit Pin:", err);

      // ✅ trùng mã
      if (isDuplicate(err)) {
        const msg = `Mã Pin "${values.idPin}" đã tồn tại. Vui lòng nhập mã khác.`;
        toast.error(msg);
        form.setFields([{ name: "idPin", errors: [msg] }]);
        setTimeout(() => codeRef.current?.focus?.(), 0);
        return;
      }

      const beMsg = getBeMsg(err);
      toast.error(beMsg || (id ? "Cập nhật Pin thất bại" : "Thêm Pin thất bại"));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ===== OK: validate + confirm =====
  const handleOk = async () => {
    if (loading) return;

    try {
      const values = await form.validateFields();

      Modal.confirm({
        title: id ? "Xác nhận cập nhật" : "Xác nhận thêm mới",
        content: id
          ? `Bạn có chắc chắn muốn cập nhật Pin "${values.idPin}"?`
          : `Bạn có chắc chắn muốn thêm Pin "${values.idPin}"?`,
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
      title={id ? "CẬP NHẬT PIN" : "THÊM PIN"}
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
      <Form form={form} layout="vertical" initialValues={{ trangThai: 1 }}>
        <Form.Item
          label="Mã Pin"
          name="idPin"
          rules={[{ required: true, message: "Vui lòng nhập Mã Pin" }]}
        >
          <Input ref={codeRef} />
        </Form.Item>

        <Form.Item
          label="Dung lượng"
          name="dungLuong"
          rules={[{ required: true, message: "Vui lòng nhập Dung lượng" }]}
        >
          <Input placeholder="Ví dụ: 3-cell, 5-cell, 56Wh..." />
        </Form.Item>

        <Form.Item
          label="Trạng thái"
          name="trangThai"
          rules={[{ required: true, message: "Vui lòng chọn Trạng thái" }]}
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
