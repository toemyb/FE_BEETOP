import React, { useState, useEffect } from 'react';
import { 
    UserOutlined, 
    LockOutlined, 
    ShoppingOutlined,
    EditOutlined,
    PhoneOutlined,
    MailOutlined,
    CalendarOutlined,
    ManOutlined,
    WomanOutlined
} from '@ant-design/icons';
import { Button, Avatar, Card } from 'antd';
import PersonalInfo from './components/PersonalInfo';
import ChangePassword from './components/ChangePassword';
import OrderHistory from './components/OrderHistory';
import './AccountPage.css';

const AccountPage = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const [user, setUser] = useState(null);

    useEffect(() => {
        const userData = sessionStorage.getItem('user');
        if (userData) {
            try {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        }
    }, []);

    // Không yêu cầu đăng nhập, hiển thị thông báo nếu chưa đăng nhập
    if (!user) {
        return (
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '60vh',
                padding: '40px'
            }}>
                <h2 style={{ marginBottom: '20px', color: '#262626' }}>Thông tin cá nhân</h2>
                <div style={{
                    background: '#f5f5f5',
                    padding: '40px',
                    borderRadius: '12px',
                    textAlign: 'center',
                    maxWidth: '500px'
                }}>
                    <p style={{ fontSize: '16px', color: '#666', marginBottom: '20px' }}>
                        Bạn chưa đăng nhập. Vui lòng đăng nhập để xem và quản lý thông tin cá nhân.
                    </p>
                    <Button 
                        type="primary" 
                        size="large"
                        onClick={() => window.location.href = '/login'}
                        style={{
                            padding: '10px 30px',
                            height: 'auto',
                            fontSize: '16px'
                        }}
                    >
                        Đăng nhập
                    </Button>
                </div>
            </div>
        );
    }

    const menuItems = [
        {
            key: 'profile',
            label: 'Thông tin cá nhân',
            icon: <UserOutlined />,
        },
        {
            key: 'orders',
            label: 'Thông tin đơn hàng',
            icon: <ShoppingOutlined />,
        },
        {
            key: 'password',
            label: 'Đổi mật khẩu',
            icon: <LockOutlined />,
        },
    ];

    const getAvatarUrl = () => {
        if (user.anh) {
            // Nếu anh là đường dẫn đầy đủ
            if (user.anh.startsWith('http')) {
                return user.anh;
            }
            // Nếu anh là đường dẫn tương đối
            return `http://localhost:8080${user.anh.startsWith('/') ? '' : '/'}${user.anh}`;
        }
        return null;
    };

    return (
        <div className="account-page">
            <div className="account-container">
                {/* Sidebar Menu */}
                <div className="account-sidebar">
                    <Card className="profile-card" style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        borderRadius: '16px',
                        marginBottom: '24px',
                        color: 'white'
                    }}>
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <Avatar
                                size={100}
                                src={getAvatarUrl()}
                                icon={<UserOutlined />}
                                style={{
                                    marginBottom: '16px',
                                    border: '4px solid white',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                }}
                            />
                            <h2 style={{ 
                                color: 'white', 
                                margin: '8px 0',
                                fontSize: '20px',
                                fontWeight: '600'
                            }}>
                                {user.ten || 'Người dùng'}
                            </h2>
                            <p style={{ 
                                color: 'rgba(255,255,255,0.9)', 
                                margin: 0,
                                fontSize: '14px'
                            }}>
                                {user.email || ''}
                            </p>
                        </div>
                    </Card>

                    <div className="sidebar-menu">
                        {menuItems.map((item) => (
                            <div
                                key={item.key}
                                className={`menu-item ${activeTab === item.key ? 'active' : ''}`}
                                onClick={() => setActiveTab(item.key)}
                            >
                                <span className="menu-icon">{item.icon}</span>
                                <span className="menu-label">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="account-content">
                    {activeTab === 'profile' && <PersonalInfo user={user} setUser={setUser} />}
                    {activeTab === 'orders' && <OrderHistory />}
                    {activeTab === 'password' && <ChangePassword />}
                </div>
            </div>
        </div>
    );
};

export default AccountPage;

