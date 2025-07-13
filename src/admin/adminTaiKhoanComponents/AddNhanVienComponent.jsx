import React, { useState, useEffect } from 'react';
import { Form, Input, DatePicker, Radio, Button, Select, Row, Col, message, Upload } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import userService from '../../service/userService';

const { Option } = Select;

const removeAccents = (str) => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};

const AddNhanVienComponent = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const response = await axios.get('https://provinces.open-api.vn/api/p/');
        setProvinces(response.data);
      } catch (error) {
        message.error('Không thể tải danh sách tỉnh/thành phố!');
      } finally {
        setLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

  useEffect(() => {
    // Đặt giá trị mặc định cho quốc gia
    form.setFieldsValue({ quocGia: 'Việt Nam' });
  }, [form]);

  const handleProvinceChange = async (provinceCode) => {
    setLoadingDistricts(true);
    try {
      const response = await axios.get(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
      setDistricts(response.data.districts || []);
      setWards([]);
      form.setFieldsValue({ quanHuyen: undefined, phuongXa: undefined });
    } catch (error) {
      message.error('Không thể tải danh sách quận/huyện!');
    } finally {
      setLoadingDistricts(false);
    }
  };

  const handleDistrictChange = async (districtCode) => {
    setLoadingWards(true);
    try {
      const response = await axios.get(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
      setWards(response.data.wards || []);
      form.setFieldsValue({ phuongXa: undefined });
    } catch (error) {
      message.error('Không thể tải danh sách phường/xã!');
    } finally {
      setLoadingWards(false);
    }
  };

  const filterOption = (input, option) => {
    const inputValue = removeAccents(input.toLowerCase());
    const optionValue = removeAccents(option.children.toLowerCase());
    return optionValue.includes(inputValue);
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const province = provinces.find((p) => p.code === values.tinhThanh);
      const district = districts.find((d) => d.code === values.quanHuyen);
      const ward = wards.find((w) => w.code === values.phuongXa);

      if (!province || !district || !ward) {
        message.error('Vui lòng chọn đầy đủ thông tin địa chỉ!');
        return;
      }

      const payload = {
        ten: values.ten,
        email: values.email,
        soDienThoai: values.soDienThoai,
        ngaySinh: values.ngaySinh ? values.ngaySinh.format('YYYY-MM-DD') : null,
        gioiTinh: values.gioiTinh,
        quocGia: values.quocGia || 'Việt Nam', // Đảm bảo quốc gia là Việt Nam
        tinhThanh: province.name,
        quanHuyen: district.name,
        phuongXa: ward.name,
        diaChiChiTiet: values.diaChiChiTiet,
      };

      const avatarFile = fileList.length > 0 ? fileList[0].originFileObj : null;

      console.log('Payload gửi đi:', payload);
      console.log('File ảnh:', avatarFile);

      await userService.createEmployee(payload, avatarFile);
      message.success('Tạo nhân viên thành công!');
      navigate('/admin/nhan-vien');
    } catch (error) {
      console.error('Lỗi khi tạo nhân viên:', error);
      message.error(error.message || 'Không thể tạo nhân viên!');
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = {
    onRemove: () => {
      setFileList([]);
    },
    beforeUpload: (file) => {
      const isImage = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isImage) {
        message.error('Chỉ được tải lên file JPG hoặc PNG!');
        return Upload.LIST_IGNORE;
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('Kích thước ảnh phải nhỏ hơn 5MB!');
        return Upload.LIST_IGNORE;
      }
      setFileList([{ uid: file.uid, name: file.name, status: 'done', url: URL.createObjectURL(file), originFileObj: file }]);
      return false;
    },
    fileList,
    accept: 'image/jpeg,image/png',
    listType: 'picture-circle',
    maxCount: 1,
  };
  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Tạo tài khoản nhân viên</h2>
      <Form
        form={form}
        onFinish={handleSubmit}
        layout="vertical"
        style={{ maxWidth: 1000, margin: '0 auto' }}
      >
        <Row gutter={24}>
          <Col span={4} style={{ textAlign: 'center' }}>
            <Form.Item name="anh" label="Ảnh đại diện">
              <Upload {...uploadProps}>
                {fileList.length < 1 && (
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      backgroundColor: '#f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <PlusOutlined />
                  </div>
                )}
              </Upload>
            </Form.Item>
          </Col>
          <Col span={20}>
            <Form.Item
              name="ten"
              label="Họ và tên"
              rules={[
                { required: true, message: 'Vui lòng nhập Họ và tên!' },
                { pattern: /^[\p{L} ]+$/u, message: 'Họ và tên chỉ chứa chữ cái và khoảng trắng!' },
              ]}
            >
              <Input placeholder="Họ và tên" disabled={loading} />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="ngaySinh"
                  label="Ngày sinh"
                  rules={[
                    { required: true, message: 'Vui lòng chọn Ngày sinh!' },
                    {
                      validator: (_, value) => {
                        if (!value || !value.isValid?.()) {
                          return Promise.reject('Vui lòng chọn ngày hợp lệ!');
                        }

                        const today = moment().startOf('day');
                        const birthday = value.clone().startOf('day');

                        if (birthday.isAfter(today)) {
                          return Promise.reject('Ngày sinh không được lớn hơn ngày hiện tại!');
                        }

                        const eighteenYearsAgo = today.clone().subtract(18, 'years');
                        if (birthday.isAfter(eighteenYearsAgo)) {
                          return Promise.reject('Khách hàng phải từ 18 tuổi trở lên!');
                        }

                        const oneHundredYearsAgo = today.clone().subtract(100, 'years');
                        if (birthday.isBefore(oneHundredYearsAgo)) {
                          return Promise.reject('Tuổi không được quá 100!');
                        }

                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <DatePicker
                    format="DD/MM/YYYY"
                    style={{ width: '100%' }}
                    placeholder="Ngày sinh"
                    disabled={loading}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="gioiTinh"
                  label="Giới tính"
                  rules={[{ required: true, message: 'Vui lòng chọn Giới tính!' }]}
                >
                  <Radio.Group disabled={loading}>
                    <Radio value="Nam">Nam</Radio>
                    <Radio value="Nữ">Nữ</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="soDienThoai"
                  label="Số điện thoại"
                  rules={[
                    { required: true, message: 'Vui lòng nhập SĐT!' },
                    {
                      pattern: /^0\d{9}$/,
                      message: 'SĐT phải bắt đầu bằng 0 và gồm 10 chữ số!',
                    },
                  ]}
                >
                  <Input placeholder="Số điện thoại" disabled={loading} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: 'Vui lòng nhập Email!' },
                    { type: 'email', message: 'Email không hợp lệ!' },
                  ]}
                >
                  <Input placeholder="Email" disabled={loading} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="quocGia"
              label="Quốc gia"
              initialValue="Việt Nam"
              rules={[{ required: true, message: 'Vui lòng chọn Quốc gia!' }]}
            >
              <Input value="Việt Nam" disabled />
            </Form.Item>

            <Form.Item
              name="diaChiChiTiet"
              label="Địa chỉ chi tiết"
              rules={[{ required: true, message: 'Vui lòng nhập địa chỉ chi tiết!' }]}
            >
              <Input placeholder="Địa chỉ chi tiết" disabled={loading} />
            </Form.Item>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="tinhThanh"
                  label="Tỉnh/Thành phố"
                  rules={[{ required: true, message: 'Chọn Tỉnh/Thành phố!' }]}
                >
                  <Select
                    showSearch
                    placeholder="Gõ để tìm kiếm Tỉnh/Thành phố"
                    onChange={handleProvinceChange}
                    filterOption={filterOption}
                    loading={loadingProvinces}
                    disabled={loading}
                  >
                    {provinces.map((province) => (
                      <Option key={province.code} value={province.code}>
                        {province.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="quanHuyen"
                  label="Quận/Huyện"
                  rules={[{ required: true, message: 'Chọn Quận/Huyện!' }]}
                >
                  <Select
                    showSearch
                    placeholder="Gõ để tìm kiếm Quận/Huyện"
                    onChange={handleDistrictChange}
                    disabled={loading || !districts.length}
                    filterOption={filterOption}
                    loading={loadingDistricts}
                  >
                    {districts.map((district) => (
                      <Option key={district.code} value={district.code}>
                        {district.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="phuongXa"
                  label="Phường/Xã"
                  rules={[{ required: true, message: 'Chọn Phường/Xã!' }]}
                >
                  <Select
                    showSearch
                    placeholder="Gõ để tìm kiếm Phường/Xã"
                    disabled={loading || !wards.length}
                    filterOption={filterOption}
                    loading={loadingWards}
                  >
                    {wards.map((ward) => (
                      <Option key={ward.code} value={ward.code}>
                        {ward.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item style={{ textAlign: 'center' }}>
              <Button
                type="primary"
                htmlType="submit"
                style={{ minWidth: 120 }}
                loading={loading}
                disabled={loading}
              >
                Xác nhận
              </Button>
              <Button
                onClick={() => navigate('/admin/nhan-vien')}
                style={{ marginLeft: 8 }}
                disabled={loading}
              >
                Hủy
              </Button>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default AddNhanVienComponent;