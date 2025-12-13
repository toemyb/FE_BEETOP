import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircleOutlined, HomeOutlined, ShoppingOutlined } from '@ant-design/icons';
import { Button, Result, Card, message, Spin } from 'antd';
import './PaymentSuccessPage.css';

const PaymentSuccessPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('');
    const [messageText, setMessageText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [orderProcessed, setOrderProcessed] = useState(false);

    useEffect(() => {
        const statusParam = searchParams.get('status');
        const messageParam = searchParams.get('message');
        
        setStatus(statusParam || '');
        setMessageText(messageParam ? decodeURIComponent(messageParam) : '');

        // Nếu thanh toán thành công, xử lý đơn hàng (backend sẽ tự động gửi email khi nhận callback từ VNPay)
        if (statusParam === 'success') {
            processOrderAfterPayment();
        } else {
            // Nếu thanh toán thất bại, xóa dữ liệu đã lưu
            sessionStorage.removeItem("vnpayOrderId");
            sessionStorage.removeItem("pendingOrderSelectedProducts");
            sessionStorage.removeItem("pendingOrderProductList");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    const processOrderAfterPayment = async () => {
        // Kiểm tra xem đã xử lý chưa (tránh xử lý lại khi re-render)
        if (orderProcessed || isProcessing) {
            return;
        }

        // Lấy idOrder từ sessionStorage (đã được tạo trước khi thanh toán)
        const orderId = sessionStorage.getItem("vnpayOrderId");
        const pendingOrderSelectedProducts = sessionStorage.getItem("pendingOrderSelectedProducts");
        const pendingOrderProductList = sessionStorage.getItem("pendingOrderProductList");

        if (!orderId) {
            console.warn("Không tìm thấy ID đơn hàng");
            // Vẫn hiển thị thông báo thành công vì thanh toán đã thành công
            return;
        }

        try {
            setIsProcessing(true);
            
            // Backend sẽ tự động xử lý việc cập nhật trạng thái đơn hàng và gửi email
            // khi nhận callback từ VNPay thành công. Ở đây chúng ta chỉ cần:
            // 1. Xóa dữ liệu đã lưu
            // 2. Cập nhật localStorage (xóa sản phẩm đã đặt hàng)

            // Xóa dữ liệu đã lưu
            sessionStorage.removeItem("vnpayOrderId");
            sessionStorage.removeItem("pendingOrderSelectedProducts");
            sessionStorage.removeItem("pendingOrderProductList");

            // Cập nhật localStorage (xóa sản phẩm đã đặt hàng)
            if (pendingOrderSelectedProducts && pendingOrderProductList) {
                const selectedProductsArray = JSON.parse(pendingOrderSelectedProducts);
                const orderProductList = JSON.parse(pendingOrderProductList);
                
                const remainingProducts = orderProductList.filter((item, index) => {
                    const itemId = String(item.idSpct || item.id || `temp-${index}`);
                    return !selectedProductsArray.includes(itemId);
                });

                const customerId =
  localStorage.getItem("customerId") || sessionStorage.getItem("idTaiKhoan");
                if (!isCustomer) {
                    if (remainingProducts.length > 0) {
                        localStorage.setItem("orderProduct", JSON.stringify(remainingProducts));
                    } else {
                        localStorage.removeItem("orderProduct");
                    }
                }
            }

            setOrderProcessed(true);
            console.log("✅ Đơn hàng đã được xử lý. Backend sẽ tự động gửi email.");
        } catch (error) {
            console.error("❌ Lỗi khi xử lý đơn hàng sau thanh toán VNPay:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleGoHome = () => {
        navigate('/');
    };

    const handleViewOrders = () => {
        navigate('/orders');
    };

    return (
        <div className="payment-success-container">
            <Card className="payment-success-card">
                {isProcessing ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <Spin size="large" />
                        <div style={{ marginTop: '20px', fontSize: '16px', color: '#595959' }}>
                            Đang xử lý đơn hàng...
                        </div>
                    </div>
                ) : status === 'success' ? (
                    <Result
                        status="success"
                        icon={<CheckCircleOutlined style={{ fontSize: '80px', color: '#52c41a' }} />}
                        title="Thanh toán thành công!"
                        subTitle={messageText || "Đơn hàng của bạn đã được xử lý thành công. Chúng tôi sẽ liên hệ với bạn sớm nhất có thể."}
                        extra={[
                            <Button 
                                type="primary" 
                                key="home" 
                                icon={<HomeOutlined />}
                                onClick={handleGoHome}
                                size="large"
                            >
                                Về trang chủ
                            </Button>,
                            <Button 
                                key="orders" 
                                icon={<ShoppingOutlined />}
                                onClick={handleViewOrders}
                                size="large"
                            >
                                Xem đơn hàng
                            </Button>
                        ]}
                    />
                ) : (
                    <Result
                        status="error"
                        title="Thanh toán thất bại"
                        subTitle={messageText || "Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại hoặc liên hệ với chúng tôi để được hỗ trợ."}
                        extra={[
                            <Button 
                                type="primary" 
                                key="home" 
                                icon={<HomeOutlined />}
                                onClick={handleGoHome}
                                size="large"
                            >
                                Về trang chủ
                            </Button>
                        ]}
                    />
                )}
            </Card>
        </div>
    );
};

export default PaymentSuccessPage;

