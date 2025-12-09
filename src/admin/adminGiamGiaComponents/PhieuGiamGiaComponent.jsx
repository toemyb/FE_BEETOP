import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Select, DatePicker, Button, message } from 'antd';
import { toast } from 'react-toastify';
import moment from 'moment';
import { addEmployee, getVoucher, updateVoucher, checkMaTrung } from '../../service/PhieuGiamGiaService';

const { Option } = Select;

const PhieuGiamGiaComponent = () => {
    const [form] = Form.useForm();
    const navigator = useNavigate();
    const { idPhieugiamgia: paramid } = useParams();

    useEffect(() => {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user || user.role !== 'ADMIN') {
            message.error('Bạn không có quyền truy cập trang này!');
            navigator('/login');
            return;
        }

        if (paramid) {
            getVoucher(paramid).then((res) => {
                const data = res.data;
                form.setFieldsValue({
                    idPhieugiamgia: data.idPhieugiamgia,
                    ten: data.ten,
                    soLuong: data.soLuong,
                    kieuGiamGia: data.kieuGiamGia,
                    giaTriGiam: data.giaTriGiam,
                    ngayBatDau: moment(data.ngayBatDau),
                    ngayKetThuc: moment(data.ngayKetThuc),
                    giaTriMin: data.giaTriMin,
                    // giaTriMax: data.giaTriMax,
                    moTa: data.moTa,
                });
            });
        }
    }, [paramid, navigator, form]);

    const validateUniqueId = async (_, value) => {
        if (!value) return Promise.reject('Mã không được để trống');
        try {
            const res = await checkMaTrung(value);
            if (res.data === true && !paramid) {
                return Promise.reject('Mã phiếu đã tồn tại');
            }
            return Promise.resolve();
        } catch (err) {
            console.error(err);
            return Promise.resolve();
        }
    };

    const onFinish = async (values) => {
        const voucher = {
            ...values,
            ngayBatDau: values.ngayBatDau.format('YYYY-MM-DD'),
            ngayKetThuc: values.ngayKetThuc.format('YYYY-MM-DD'),
        };

        if (paramid) {
            if (!window.confirm("Bạn có muốn cập nhật phiếu giảm giá không?")) return;
            updateVoucher(paramid, voucher)
                .then(() => {
                    toast.success("Cập nhật phiếu giảm giá thành công!");
                    navigator('/admin/phieu-giam-gia');
                })
                .catch((err) => {
                    console.error(err);
                    toast.error("Lỗi khi cập nhật phiếu giảm giá");
                });
        } else {
            if (!window.confirm("Bạn có chắc muốn thêm phiếu giảm giá không?")) return;
            addEmployee(voucher)
                .then((res) => {
                    toast.success("Thêm phiếu giảm giá thành công!");
                    navigator('/admin/phieu-giam-gia', { state: { newVoucher: res.data } });
                })
                .catch((err) => {
                    console.error(err);
                    toast.error("Lỗi khi thêm phiếu giảm giá!");
                });
        }
    };

    return (
        <div className='container'>
            <h2 className='text-center mb-4'>{paramid ? 'Update Voucher' : 'Thêm phiếu giảm giá'}</h2>
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
            >
                <Form.Item
                    label="Mã"
                    name="idPhieugiamgia"
                    rules={[{ validator: validateUniqueId }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Tên"
                    name="ten"
                    rules={[{ required: true, message: 'Tên không được để trống' }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Số lượng"
                    name="soLuong"
                    rules={[
                        { required: true, message: 'Số lượng không được để trống' },
                        { type: 'number', min: 1, message: 'Số lượng phải ≥ 1', transform: (value) => Number(value) },
                    ]}
                >
                    <Input type="number" />
                </Form.Item>

                <Form.Item
                    label="Kiểu giảm giá"
                    name="kieuGiamGia"
                    rules={[{ required: true, message: 'Chọn kiểu giảm giá' }]}
                >
                    <Select placeholder="-- Chọn kiểu giảm --">
                        <Option value="GIAM_CO_DINH">Giảm cố định</Option>
                        <Option value="GIAM_PHAN_TRAM">Giảm phần trăm</Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    label="Giá trị giảm"
                    name="giaTriGiam"
                    rules={[
                        { required: true, message: 'Giá trị giảm không được để trống' },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                const kieu = getFieldValue('kieuGiamGia');
                                const val = parseFloat(value);
                                if (!value) return Promise.reject('Giá trị giảm không được để trống');
                                if (kieu === 'GIAM_PHAN_TRAM' && (val < 1 || val > 100)) {
                                    return Promise.reject('Giá trị giảm phần trăm phải từ 1% đến 100%');
                                }
                                if (kieu === 'GIAM_CO_DINH' && val <= 0) {
                                    return Promise.reject('Giá trị giảm cố định phải > 0');
                                }
                                return Promise.resolve();
                            }
                        })
                    ]}
                >
                    <Input type="number" />
                </Form.Item>

                <Form.Item
                    label="Ngày bắt đầu"
                    name="ngayBatDau"
                    rules={[
                        { required: true, message: 'Ngày bắt đầu không được để trống' },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                const today = moment().startOf('day');
                                const end = getFieldValue('ngayKetThuc');
                                if (value && value.isBefore(today)) {
                                    return Promise.reject('Ngày bắt đầu không được ở quá khứ');
                                }
                                if (value && end && value.isAfter(end)) {
                                    return Promise.reject('Ngày bắt đầu phải trước ngày kết thúc');
                                }
                                return Promise.resolve();
                            }
                        })
                    ]}
                >
                    <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                    label="Ngày kết thúc"
                    name="ngayKetThuc"
                    rules={[
                        { required: true, message: 'Ngày kết thúc không được để trống' },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                const start = getFieldValue('ngayBatDau');
                                if (value && start && value.isBefore(start)) {
                                    return Promise.reject('Ngày kết thúc phải sau ngày bắt đầu');
                                }
                                return Promise.resolve();
                            }
                        })
                    ]}
                >
                    <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                    label="Giá trị tối thiểu"
                    name="giaTriMin"
                    rules={[
                        { required: true, message: 'Giá trị tối thiểu không được để trống' },
                        { type: 'number', min: 0, message: 'Giá trị tối thiểu phải > 0', transform: (value) => Number(value) },

                    ]}
                >
                    <Input type="number" />
                </Form.Item>


                {/* <Form.Item
                    label="Giá trị tối đa"
                    name="giaTriMax"
                    rules={[
                        { required: true, message: 'Giá trị tối đa không được để trống' },
                        { type: 'number', min: 0, message: 'Giá trị tối đa phải > 0', transform: (value) => Number(value) },
                    ]}
                >
                    <Input type="number" />
                </Form.Item> */}

                <Form.Item
                    label="Mô tả"
                    name="moTa"
                    rules={[{ required: true, message: 'Mô tả không được để trống' }]}
                >
                    <Input.TextArea rows={3} />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit">
                        Xác nhận
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};

export default PhieuGiamGiaComponent;
