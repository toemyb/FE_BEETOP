import React, { useEffect, useRef, useState } from "react";
import { Modal, Form, Input, Select } from "antd";
import { toast } from "react-toastify";
import { addMausac, getAllById, updateMausac } from "../../service/MauSacService";

const { Option } = Select;

const AddMauSacModal = ({ open, id, onClose, onSuccess }) => {
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
    form.setFields([{ name: "idMauSac", errors: [] }]);

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
              idMauSac: data.idMauSac,
              ten: data.ten,
              moTa: data.moTa,
              trangThai: Number(data.trangThai ?? 1),
            });
          } else {
            toast.error("Không tìm thấy dữ liệu màu sắc");
          }
        })
        .catch((e) => {
          console.error(e);
          toast.error("Không thể tải dữ liệu màu sắc");
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
      form.setFields([{ name: "idMauSac", errors: [] }]);

      const payload = {
        ...values,
        trangThai: Number(values.trangThai ?? 1),
      };

      const request = id ? updateMausac({ id, ...payload }) : addMausac(payload);
      await request;

      toast.success(
        id
          ? `Cập nhật màu sắc "${values.idMauSac}" thành công`
          : `Thêm màu sắc "${values.idMauSac}" thành công`
      );

      onSuccess?.(id ? "edit" : "add", values.idMauSac);
      onClose?.();
    } catch (err) {
      console.error("Lỗi submit màu sắc:", err);

      // ✅ trùng mã
      if (isDuplicate(err)) {
        const msg = `Mã màu sắc "${values.idMauSac}" đã tồn tại. Vui lòng nhập mã khác.`;
        toast.error(msg);
        form.setFields([{ name: "idMauSac", errors: [msg] }]);
        setTimeout(() => codeRef.current?.focus?.(), 0);
        return;
      }

      const beMsg = getBeMsg(err);
      toast.error(beMsg || (id ? "Cập nhật màu sắc thất bại" : "Thêm màu sắc thất bại"));
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
          ? `Bạn có chắc chắn muốn cập nhật màu sắc "${values.idMauSac}"?`
          : `Bạn có chắc chắn muốn thêm màu sắc "${values.idMauSac}"?`,
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
      title={id ? "CẬP NHẬT MÀU SẮC" : "THÊM MÀU SẮC"}
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
          label="Mã Màu Sắc"
          name="idMauSac"
          rules={[{ required: true, message: "Vui lòng nhập mã màu sắc" }]}
        >
          <Input ref={codeRef} />
        </Form.Item>

        <Form.Item
          label="Tên Màu"
          name="ten"
          rules={[{ required: true, message: "Vui lòng nhập tên màu" }]}
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
            <Option value={0}>Ngưng hoạt động</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddMauSacModal;
