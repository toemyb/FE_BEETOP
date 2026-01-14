import React, { useEffect, useRef, useState } from "react";
import { Modal, Form, Input, Select } from "antd";
import { toast } from "react-toastify";
import { addThuongHieu, getAllById, updateThuongHieu } from "../../service/ThuongHieuService";

const { Option } = Select;

const AddThuongHieuModal = ({ open, id, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const tenRef = useRef(null);

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

  useEffect(() => {
    if (!open) return;

    // clear lỗi cũ
    form.setFields([{ name: "ten", errors: [] }]);

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
            toast.error("Không tìm thấy dữ liệu Thương hiệu");
          }
        })
        .catch((e) => {
          console.error(e);
          toast.error("Không thể tải dữ liệu Thương hiệu");
        });
    } else {
      form.resetFields();
      form.setFieldsValue({ trangThai: 1 });
      setTimeout(() => tenRef.current?.focus?.(), 0);
    }
  }, [open, id, form]);

  const doSubmit = async (values) => {
    try {
      setLoading(true);
      form.setFields([{ name: "ten", errors: [] }]);

      const payload = {
        ...values,
        trangThai: Number(values.trangThai ?? 1),
      };

      const req = id ? updateThuongHieu({ id, ...payload }) : addThuongHieu(payload);
      await req;

      toast.success(id ? `Đã cập nhật thương hiệu: ${values.ten}` : `Đã thêm thương hiệu: ${values.ten}`);
      onSuccess?.(id ? "edit" : "add", values.ten);
      onClose?.();
    } catch (err) {
      console.error("Lỗi khi submit Thương hiệu:", err);

      if (isDuplicate(err)) {
        const msg = `Thương hiệu "${values.ten}" đã tồn tại. Vui lòng nhập tên khác.`;
        toast.error(msg);
        form.setFields([{ name: "ten", errors: [msg] }]);
        setTimeout(() => tenRef.current?.focus?.(), 0);
        return;
      }

      const beMsg = getBeMsg(err);
      toast.error(beMsg || (id ? "Cập nhật thất bại" : "Thêm mới thất bại"));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleOk = async () => {
    if (loading) return;

    try {
      const values = await form.validateFields();

      Modal.confirm({
        title: id ? "Xác nhận cập nhật" : "Xác nhận thêm mới",
        content: id
          ? `Bạn có chắc chắn muốn thay đổi thương hiệu "${values.ten}"?`
          : `Bạn có chắc chắn muốn thêm thương hiệu "${values.ten}"?`,
        okText: "Xác nhận",
        cancelText: "Hủy",
        centered: true,
        onOk: () => doSubmit(values),
      });
    } catch (err) {
      if (err?.errorFields) toast.error("Vui lòng kiểm tra lại các trường bắt buộc");
    }
  };

  return (
    <Modal
      open={open}
      title={id ? "CẬP NHẬT THƯƠNG HIỆU" : "THÊM THƯƠNG HIỆU"}
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
          label="Tên Thương Hiệu"
          name="ten"
          rules={[{ required: true, message: "Vui lòng nhập Tên Thương Hiệu" }]}
        >
          <Input ref={tenRef} placeholder="Ví dụ: Lenovo" />
        </Form.Item>

        <Form.Item label="Mô Tả" name="moTa">
          <Input placeholder="Mô tả ngắn" />
        </Form.Item>

        <Form.Item
          label="Trạng thái"
          name="trangThai"
          rules={[{ required: true, message: "Vui lòng chọn Trạng thái" }]}
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
