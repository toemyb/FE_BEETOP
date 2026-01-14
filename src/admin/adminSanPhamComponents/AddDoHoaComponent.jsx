import React, { useEffect, useRef, useState } from "react";
import { Modal, Form, Input, Select } from "antd";
import { toast } from "react-toastify";
import { addDohoa, getAllById, updateDohoa } from "../../service/DoHoaService";

const { Option } = Select;

const AddDoHoaModal = ({ open, id, onClose, onSuccess }) => {
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
    form.setFields([{ name: "idDohoa", errors: [] }]);

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
              idDohoa: data.idDohoa,
              hangcardOboard: data.hangcardOboard,
              modelcardOboard: data.modelcardOboard,
              tenDayDu: data.tenDayDu,
              loaiCard: data.loaiCard,
              boNhoRam: data.boNhoRam,
              moTa: data.moTa,
              trangThai: Number(data.trangThai ?? 1),
            });
          } else {
            toast.error("Không tìm thấy dữ liệu đồ họa");
          }
        })
        .catch((e) => {
          console.error(e);
          toast.error("Không thể tải dữ liệu đồ họa");
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
      form.setFields([{ name: "idDohoa", errors: [] }]);

      const payload = {
        ...values,
        trangThai: Number(values.trangThai ?? 1),
      };

      const request = id ? updateDohoa({ id, ...payload }) : addDohoa(payload);
      await request;

      toast.success(
        id
          ? `Cập nhật đồ họa "${values.idDohoa}" thành công`
          : `Thêm đồ họa "${values.idDohoa}" thành công`
      );

      onSuccess?.(id ? "edit" : "add", values.idDohoa);
      onClose?.();
    } catch (err) {
      console.error("Lỗi submit đồ họa:", err);

      // ✅ trùng mã
      if (isDuplicate(err)) {
        const msg = `Mã đồ họa "${values.idDohoa}" đã tồn tại. Vui lòng nhập mã khác.`;
        toast.error(msg);
        form.setFields([{ name: "idDohoa", errors: [msg] }]);
        setTimeout(() => codeRef.current?.focus?.(), 0);
        return;
      }

      const beMsg = getBeMsg(err);
      toast.error(beMsg || (id ? "Cập nhật đồ họa thất bại" : "Thêm đồ họa thất bại"));
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
          ? `Bạn có chắc chắn muốn cập nhật đồ họa "${values.idDohoa}"?`
          : `Bạn có chắc chắn muốn thêm đồ họa "${values.idDohoa}"?`,
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
      title={id ? "CẬP NHẬT ĐỒ HỌA" : "THÊM ĐỒ HỌA"}
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
          label="Mã Đồ Họa"
          name="idDohoa"
          rules={[{ required: true, message: "Vui lòng nhập Mã Đồ Họa" }]}
        >
          <Input ref={codeRef} />
        </Form.Item>

        <Form.Item
          label="Hãng Card Onboard"
          name="hangcardOboard"
          rules={[{ required: true, message: "Vui lòng nhập Hãng Card Onboard" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Model Card Onboard"
          name="modelcardOboard"
          rules={[{ required: true, message: "Vui lòng nhập Model Card Onboard" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Tên Đầy Đủ"
          name="tenDayDu"
          rules={[{ required: true, message: "Vui lòng nhập Tên đầy đủ" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Loại Card"
          name="loaiCard"
          rules={[{ required: true, message: "Vui lòng nhập Loại Card" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Bộ Nhớ RAM"
          name="boNhoRam"
          rules={[{ required: true, message: "Vui lòng nhập Bộ nhớ RAM" }]}
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

export default AddDoHoaModal;
