import React, { useEffect, useRef, useState } from "react";
import { Modal, Form, Input, Select } from "antd";
import { toast } from "react-toastify";
import { addRom, getAllById, updateRom } from "../../service/RomService";

const { Option } = Select;

const AddRomModal = ({ open, id, onClose, onSuccess }) => {
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

  // ===== Load dữ liệu khi edit =====
  useEffect(() => {
    if (!open) return;

    // clear lỗi cũ
    form.setFields([{ name: "idSsd", errors: [] }]);

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
              idSsd: data.idSsd,
              dungLuongSsd: data.dungLuongSsd,
              loaiSsd: data.loaiSsd,
              tocDoDoc: data.tocDoDoc,
              tocDoGhi: data.tocDoGhi,
              moTa: data.moTa,
              trangThai: Number(data.trangThai ?? 1),
            });
          } else {
            toast.error("Không tìm thấy dữ liệu ROM");
          }
        })
        .catch((e) => {
          console.error(e);
          toast.error("Không thể tải dữ liệu ROM");
        });
    } else {
      form.resetFields();
      form.setFieldsValue({ trangThai: 1 });
      setTimeout(() => codeRef.current?.focus?.(), 0);
    }
  }, [open, id, form]);

  // ===== Submit =====
  const doSubmit = async (values) => {
    try {
      setLoading(true);
      form.setFields([{ name: "idSsd", errors: [] }]);

      const payload = {
        ...values,
        trangThai: Number(values.trangThai ?? 1),
      };

      const request = id ? updateRom({ id, ...payload }) : addRom(payload);
      await request;

      toast.success(
        id ? `Cập nhật ROM "${values.idSsd}" thành công` : `Thêm ROM "${values.idSsd}" thành công`
      );

      onSuccess?.(id ? "edit" : "add", values.idSsd);
      onClose?.();
    } catch (err) {
      console.error("Lỗi submit form:", err);

      // ✅ trùng mã
      if (isDuplicate(err)) {
        const msg = `Mã SSD "${values.idSsd}" đã tồn tại. Vui lòng nhập mã khác.`;
        toast.error(msg);
        form.setFields([{ name: "idSsd", errors: [msg] }]);
        setTimeout(() => codeRef.current?.focus?.(), 0);
        return;
      }

      const beMsg = getBeMsg(err);
      toast.error(beMsg || (id ? "Cập nhật ROM thất bại" : "Thêm ROM thất bại"));
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
          ? `Bạn có chắc chắn muốn cập nhật ROM "${values.idSsd}"?`
          : `Bạn có chắc chắn muốn thêm ROM "${values.idSsd}"?`,
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
      title={id ? "CẬP NHẬT ROM" : "THÊM ROM"}
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
          label="Mã SSD"
          name="idSsd"
          rules={[{ required: true, message: "Vui lòng nhập mã SSD" }]}
        >
          <Input ref={codeRef} />
        </Form.Item>

        <Form.Item
          label="Dung lượng SSD"
          name="dungLuongSsd"
          rules={[{ required: true, message: "Vui lòng nhập dung lượng SSD" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Loại SSD"
          name="loaiSsd"
          rules={[{ required: true, message: "Vui lòng nhập loại SSD" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Tốc độ đọc"
          name="tocDoDoc"
          rules={[{ required: true, message: "Vui lòng nhập tốc độ đọc" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Tốc độ ghi"
          name="tocDoGhi"
          rules={[{ required: true, message: "Vui lòng nhập tốc độ ghi" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item label="Mô tả" name="moTa">
          <Input />
        </Form.Item>

        <Form.Item
          label="Trạng thái"
          name="trangThai"
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

export default AddRomModal;
