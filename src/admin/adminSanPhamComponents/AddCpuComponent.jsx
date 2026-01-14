import React, { useEffect, useRef, useState } from "react";
import { Modal, Form, Input, Select } from "antd";
import { toast } from "react-toastify";
import { addCpu, getAllById, updateCpu } from "../../service/CpuService";

const { Option } = Select;

const AddCpuModal = ({ open, id, onClose, onSuccess }) => {
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
    form.setFields([{ name: "idCpu", errors: [] }]);

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
              idCpu: data.idCpu,
              ten: data.ten,
              moTa: data.moTa,
              trangThai: Number(data.trangThai ?? 1),
            });
          } else {
            toast.error("Không tìm thấy dữ liệu CPU");
          }
        })
        .catch((e) => {
          console.error(e);
          toast.error("Không thể tải dữ liệu CPU");
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
      form.setFields([{ name: "idCpu", errors: [] }]);

      const payload = {
        ...values,
        trangThai: Number(values.trangThai ?? 1),
      };

      const request = id ? updateCpu({ id, ...payload }) : addCpu(payload);
      await request;

      toast.success(
        id ? `Cập nhật CPU "${values.idCpu}" thành công` : `Thêm CPU "${values.idCpu}" thành công`
      );

      onSuccess?.(id ? "edit" : "add", values.idCpu);
      onClose?.();
    } catch (err) {
      console.error("Lỗi submit CPU:", err);

      // ✅ trùng mã
      if (isDuplicate(err)) {
        const msg = `Mã CPU "${values.idCpu}" đã tồn tại. Vui lòng nhập mã khác.`;
        toast.error(msg);
        form.setFields([{ name: "idCpu", errors: [msg] }]);
        setTimeout(() => codeRef.current?.focus?.(), 0);
        return;
      }

      const beMsg = getBeMsg(err);
      toast.error(beMsg || (id ? "Cập nhật CPU thất bại" : "Thêm CPU thất bại"));
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
          ? `Bạn có chắc chắn muốn cập nhật CPU "${values.idCpu}"?`
          : `Bạn có chắc chắn muốn thêm CPU "${values.idCpu}"?`,
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
      title={id ? "CẬP NHẬT CPU" : "THÊM CPU"}
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
          label="Mã CPU"
          name="idCpu"
          rules={[{ required: true, message: "Vui lòng nhập mã CPU" }]}
        >
          <Input ref={codeRef} />
        </Form.Item>

        <Form.Item
          label="Tên Chip"
          name="ten"
          rules={[{ required: true, message: "Vui lòng nhập tên chip" }]}
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
            <Option value={0}>Ngừng hoạt động</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddCpuModal;
