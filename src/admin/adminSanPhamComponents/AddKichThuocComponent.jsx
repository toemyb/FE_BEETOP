import React, { useEffect, useRef, useState } from "react";
import { Modal, Form, Input, InputNumber, Select } from "antd";
import { toast } from "react-toastify";
import { addKichthuoc, getAllById, updateKichthuoc } from "../../service/KichThuocService";

const { Option } = Select;

const AddKichThuocModal = ({ open, id, onClose, onSuccess }) => {
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

  // ===== Load data khi edit =====
  useEffect(() => {
    if (!open) return;

    // clear lỗi cũ khi mở modal
    form.setFields([{ name: "idKichThuoc", errors: [] }]);

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
            toast.error("Không tìm thấy dữ liệu Kích thước");
          }
        })
        .catch((e) => {
          console.error(e);
          toast.error("Không thể tải dữ liệu Kích thước");
        });
    } else {
      // 🔵 ADD – reset + default
      form.resetFields();
      form.setFieldsValue({
        chieuDai: 0,
        chieuRong: 0,
        chieuCao: 0,
        khoiLuong: 0,
        trangThai: 1,
      });

      // focus mã khi thêm mới
      setTimeout(() => codeRef.current?.focus?.(), 0);
    }
  }, [open, id, form]);

  // ✅ Hàm thực sự gửi API
  const doSubmit = async (values) => {
    try {
      setLoading(true);
      form.setFields([{ name: "idKichThuoc", errors: [] }]);

      const payload = {
        ...values,
        chieuDai: Number(values.chieuDai),
        chieuRong: Number(values.chieuRong),
        chieuCao: Number(values.chieuCao),
        khoiLuong: Number(values.khoiLuong),
        trangThai: Number(values.trangThai ?? 1),
      };

      const req = id ? updateKichthuoc({ id, ...payload }) : addKichthuoc(payload);

      await req;

      toast.success(
        id
          ? `Cập nhật kích thước "${values.idKichThuoc}" thành công`
          : `Thêm kích thước "${values.idKichThuoc}" thành công`
      );

      onSuccess?.(id ? "edit" : "add", values.idKichThuoc);
      onClose?.();
    } catch (err) {
      console.error("Lỗi submit Kích thước:", err);

      // ✅ TRÙNG MÃ
      if (isDuplicate(err)) {
        const msg = `Mã kích thước "${values.idKichThuoc}" đã tồn tại. Vui lòng nhập mã khác.`;
        toast.error(msg);
        form.setFields([{ name: "idKichThuoc", errors: [msg] }]);
        setTimeout(() => codeRef.current?.focus?.(), 0);
        return;
      }

      // ❌ lỗi khác: ưu tiên message BE
      const beMsg = getBeMsg(err);
      toast.error(beMsg || (id ? "Cập nhật kích thước thất bại" : "Thêm kích thước thất bại"));
      throw err; // để Modal.confirm biết là có lỗi
    } finally {
      setLoading(false);
    }
  };

  // 🔔 OK: validate + confirm
  const handleOk = async () => {
    if (loading) return;

    try {
      const values = await form.validateFields();

      Modal.confirm({
        title: id ? "Xác nhận cập nhật" : "Xác nhận thêm mới",
        content: id
          ? `Bạn có chắc chắn muốn thay đổi thông tin kích thước "${values.idKichThuoc}"?`
          : `Bạn có chắc chắn muốn thêm kích thước "${values.idKichThuoc}"?`,
        okText: "Xác nhận",
        cancelText: "Hủy",
        centered: true,
        onOk: () => doSubmit(values), // trả Promise -> antd confirm tự loading
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
      title={id ? "CẬP NHẬT KÍCH THƯỚC" : "THÊM KÍCH THƯỚC"}
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
          label="Mã Kích thước"
          name="idKichThuoc"
          rules={[{ required: true, message: "Vui lòng nhập Mã Kích thước" }]}
        >
          <Input ref={codeRef} />
        </Form.Item>

        <Form.Item
          label="Chiều dài (cm)"
          name="chieuDai"
          rules={[{ required: true, message: "Vui lòng nhập Chiều dài" }]}
        >
          <InputNumber min={0} step={0.1} style={{ width: "100%" }} placeholder="Ví dụ: 15" />
        </Form.Item>

        <Form.Item
          label="Chiều rộng (cm)"
          name="chieuRong"
          rules={[{ required: true, message: "Vui lòng nhập Chiều rộng" }]}
        >
          <InputNumber min={0} step={0.1} style={{ width: "100%" }} placeholder="Ví dụ: 10" />
        </Form.Item>

        <Form.Item
          label="Chiều cao (cm)"
          name="chieuCao"
          rules={[{ required: true, message: "Vui lòng nhập Chiều cao" }]}
        >
          <InputNumber min={0} step={0.1} style={{ width: "100%" }} placeholder="Ví dụ: 2" />
        </Form.Item>

        <Form.Item
          label="Khối lượng (kg)"
          name="khoiLuong"
          rules={[{ required: true, message: "Vui lòng nhập Khối lượng" }]}
        >
          <InputNumber min={0} step={0.1} style={{ width: "100%" }} placeholder="Ví dụ: 3" />
        </Form.Item>

        <Form.Item
          label="Trạng thái"
          name="trangThai"
          rules={[{ required: true, message: "Vui lòng chọn Trạng thái" }]}
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
