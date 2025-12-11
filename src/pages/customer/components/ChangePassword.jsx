import React, { useState } from 'react';
import { LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { Card, Input, Button, Form, message } from 'antd';
import api from '../../../service/api';
import './ChangePassword.css';

const ChangePassword = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (values) => {
        if (values.newPassword !== values.confirmPassword) {
            message.error('Mật khẩu mới và xác nhận mật khẩu không khớp!');
            return;
        }

        setLoading(true);
        try {
            const userId = localStorage.getItem('isUser');
            const response = await api.put(`/api/v1/laptops/tai-khoan/doi-mat-khau/${userId}`, {
                matKhauCu: values.oldPassword,
                matKhauMoi: values.newPassword,
            });

            if (response.data) {
                message.success('Đổi mật khẩu thành công!');
                form.resetFields();
            }
        } catch (error) {
            console.error('Error changing password:', error);
            const errorMessage = error.response?.data?.message || 'Đổi mật khẩu thất bại!';
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="change-password">
            <Card
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <LockOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                        <span style={{ fontSize: '20px', fontWeight: '600' }}>Đổi mật khẩu</span>
                    </div>
                }
                style={{
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    className="password-form"
                >
                    <Form.Item
                        label="Mật khẩu hiện tại"
                        name="oldPassword"
                        rules={[
                            { required: true, message: 'Vui lòng nhập mật khẩu hiện tại!' },
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Nhập mật khẩu hiện tại"
                            size="large"
                            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Mật khẩu mới"
                        name="newPassword"
                        rules={[
                            { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                            { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Nhập mật khẩu mới"
                            size="large"
                            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Xác nhận mật khẩu mới"
                        name="confirmPassword"
                        dependencies={['newPassword']}
                        rules={[
                            { required: true, message: 'Vui lòng xác nhận mật khẩu mới!' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('newPassword') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Nhập lại mật khẩu mới"
                            size="large"
                            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            loading={loading}
                            block
                            style={{
                                height: '48px',
                                fontSize: '16px',
                                fontWeight: '600'
                            }}
                        >
                            Đổi mật khẩu
                        </Button>
                    </Form.Item>
                </Form>

                <div className="password-tips">
                    <h4>Lưu ý:</h4>
                    <ul>
                        <li>Mật khẩu phải có ít nhất 6 ký tự</li>
                        <li>Nên sử dụng kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt</li>
                        <li>Không chia sẻ mật khẩu với người khác</li>
                    </ul>
                </div>
            </Card>
        </div>
    );
};

export default ChangePassword;

