import React, { useState, useEffect } from 'react';
import { 
    UserOutlined, 
    PhoneOutlined, 
    MailOutlined, 
    CalendarOutlined,
    ManOutlined,
    WomanOutlined,
    EditOutlined,
    SaveOutlined
} from '@ant-design/icons';
import { Card, Input, Button, Select, DatePicker, message, Upload, Avatar } from 'antd';
import dayjs from 'dayjs';
import './PersonalInfo.css';

const { Option } = Select;

const PersonalInfo = ({ user, setUser }) => {
    const [isEditing, setIsEditing] = useState(false);
    
    // Helper function để parse ngày sinh
    const parseNgaySinh = (ngaySinh) => {
        if (!ngaySinh) return null;
        // Nếu là string hoặc date, parse nó
        try {
            return dayjs(ngaySinh);
        } catch (error) {
            console.error('Error parsing date:', error);
            return null;
        }
    };
    
    const [formData, setFormData] = useState({
        ten: user?.ten || '',
        email: user?.email || '',
        soDienThoai: user?.soDienThoai || '',
        gioiTinh: user?.gioiTinh || '',
        ngaySinh: parseNgaySinh(user?.ngaySinh),
    });
    
    // Update formData khi user thay đổi
    useEffect(() => {
        setFormData({
            ten: user?.ten || '',
            email: user?.email || '',
            soDienThoai: user?.soDienThoai || '',
            gioiTinh: user?.gioiTinh || '',
            ngaySinh: parseNgaySinh(user?.ngaySinh),
        });
    }, [user]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = async () => {
        try {
            // TODO: Gọi API để cập nhật thông tin
            // const response = await updateUserInfo(formData);
            
            // Cập nhật sessionStorage
            const updatedUser = {
                ...user,
                ...formData,
                ngaySinh: formData.ngaySinh ? formData.ngaySinh.format('YYYY-MM-DD') : user.ngaySinh
            };
            sessionStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            
            setIsEditing(false);
            message.success('Cập nhật thông tin thành công!');
        } catch (error) {
            console.error('Error updating user info:', error);
            message.error('Cập nhật thông tin thất bại!');
        }
    };

    const handleCancel = () => {
        setFormData({
            ten: user?.ten || '',
            email: user?.email || '',
            soDienThoai: user?.soDienThoai || '',
            gioiTinh: user?.gioiTinh || '',
            ngaySinh: parseNgaySinh(user?.ngaySinh),
        });
        setIsEditing(false);
    };

    const getAvatarUrl = () => {
        if (user?.anh) {
            if (user.anh.startsWith('http')) {
                return user.anh;
            }
            return `http://localhost:8080${user.anh.startsWith('/') ? '' : '/'}${user.anh}`;
        }
        return null;
    };

    return (
        <div className="personal-info">
            <Card
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <UserOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                        <span style={{ fontSize: '20px', fontWeight: '600' }}>Thông tin cá nhân</span>
                    </div>
                }
                extra={
                    !isEditing ? (
                        <Button 
                            type="primary" 
                            icon={<EditOutlined />}
                            onClick={() => setIsEditing(true)}
                        >
                            Chỉnh sửa
                        </Button>
                    ) : (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <Button onClick={handleCancel}>Hủy</Button>
                            <Button 
                                type="primary" 
                                icon={<SaveOutlined />}
                                onClick={handleSave}
                            >
                                Lưu thay đổi
                            </Button>
                        </div>
                    )
                }
                style={{
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
            >
                <div className="info-content">
                    {/* Avatar Section */}
                    <div className="avatar-section">
                        <Avatar
                            size={120}
                            src={getAvatarUrl()}
                            icon={<UserOutlined />}
                            style={{
                                border: '4px solid #1890ff',
                                boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)'
                            }}
                        />
                        {isEditing && (
                            <Upload
                                showUploadList={false}
                                beforeUpload={() => false}
                                onChange={(info) => {
                                    // TODO: Upload avatar
                                    console.log('Upload avatar:', info);
                                }}
                            >
                                <Button 
                                    type="link" 
                                    style={{ marginTop: '12px' }}
                                >
                                    Thay đổi ảnh đại diện
                                </Button>
                            </Upload>
                        )}
                    </div>

                    {/* Form Fields */}
                    <div className="info-fields">
                        <div className="info-field">
                            <label>
                                <UserOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                                Họ và tên
                            </label>
                            {isEditing ? (
                                <Input
                                    value={formData.ten}
                                    onChange={(e) => handleInputChange('ten', e.target.value)}
                                    placeholder="Nhập họ và tên"
                                    size="large"
                                />
                            ) : (
                                <div className="field-value">{formData.ten || 'Chưa cập nhật'}</div>
                            )}
                        </div>

                        <div className="info-field">
                            <label>
                                <MailOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                                Email
                            </label>
                            {isEditing ? (
                                <Input
                                    value={formData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    placeholder="Nhập email"
                                    size="large"
                                    type="email"
                                />
                            ) : (
                                <div className="field-value">{formData.email || 'Chưa cập nhật'}</div>
                            )}
                        </div>

                        <div className="info-field">
                            <label>
                                <PhoneOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                                Số điện thoại
                            </label>
                            {isEditing ? (
                                <Input
                                    value={formData.soDienThoai}
                                    onChange={(e) => handleInputChange('soDienThoai', e.target.value)}
                                    placeholder="Nhập số điện thoại"
                                    size="large"
                                />
                            ) : (
                                <div className="field-value">{formData.soDienThoai || 'Chưa cập nhật'}</div>
                            )}
                        </div>

                        <div className="info-field">
                            <label>
                                {formData.gioiTinh === 'Nữ' ? (
                                    <WomanOutlined style={{ marginRight: '8px', color: '#eb2f96' }} />
                                ) : (
                                    <ManOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                                )}
                                Giới tính
                            </label>
                            {isEditing ? (
                                <Select
                                    value={formData.gioiTinh}
                                    onChange={(value) => handleInputChange('gioiTinh', value)}
                                    placeholder="Chọn giới tính"
                                    size="large"
                                    style={{ width: '100%' }}
                                >
                                    <Option value="Nam">Nam</Option>
                                    <Option value="Nữ">Nữ</Option>
                                    <Option value="Khác">Khác</Option>
                                </Select>
                            ) : (
                                <div className="field-value">{formData.gioiTinh || 'Chưa cập nhật'}</div>
                            )}
                        </div>

                        <div className="info-field">
                            <label>
                                <CalendarOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                                Ngày sinh
                            </label>
                            {isEditing ? (
                                <DatePicker
                                    value={formData.ngaySinh}
                                    onChange={(date) => handleInputChange('ngaySinh', date)}
                                    placeholder="Chọn ngày sinh"
                                    size="large"
                                    style={{ width: '100%' }}
                                    format="DD/MM/YYYY"
                                />
                            ) : (
                                <div className="field-value">
                                    {formData.ngaySinh 
                                        ? formData.ngaySinh.format('DD/MM/YYYY') 
                                        : (user?.ngaySinh 
                                            ? dayjs(user.ngaySinh).format('DD/MM/YYYY') 
                                            : 'Chưa cập nhật')}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default PersonalInfo;

