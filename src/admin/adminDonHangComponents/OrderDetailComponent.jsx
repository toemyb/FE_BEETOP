// src/admin/adminDonHangComponents/OrderDetailComponent.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Tabs,
  Card,
  Descriptions,
  Tag,
  Table,
  Progress,
  Row,
  Col,
  Button,
  Space,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  ReloadOutlined,
  PrinterOutlined,
  FileTextOutlined,
} from '@ant-design/icons';

import { getOrderDetail, unwrapApi } from '../../service/PosOrderService';

const { Title, Text } = Typography;

const formatCurrency = (amount) => {
  const n = Number(amount || 0);
  return n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
};

const formatDateTime = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value; // fallback nếu BE trả sẵn string
  const time = d.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const date = d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  return `${time} ${date}`;
};

// Map trạng thái đơn
const ORDER_STATUS_MAP = {
  1: { text: 'Đang chuẩn bị hàng', color: 'blue' }, // draft / chuẩn bị
  2: { text: 'Hoàn thành', color: 'green' },
  3: { text: 'Đã hủy', color: 'red' },
};

// Map loại đơn
const ORDER_TYPE_MAP = {
  TAI_QUAY: 'Bán tại quầy',
  ONLINE: 'Đơn hàng online',
};

const OrderDetailComponent = () => {
  const { id } = useParams(); // UUID đơn
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null); // PosOrderDetailDTO

  const fetchDetail = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await getOrderDetail(id);
      const data = unwrapApi(res);
      setOrder(data);
    } catch (err) {
      console.error('Lỗi load chi tiết đơn hàng:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const mustPay = Number(order?.tongTienThuHo || 0);
  const totalPaid = useMemo(() => {
    if (!Array.isArray(order?.payments)) return 0;
    return order.payments.reduce(
      (sum, p) => sum + Number(p.soTien || 0),
      0
    );
  }, [order]);

  const isPaid = mustPay > 0 && totalPaid >= mustPay;
  const paymentPercent =
    mustPay > 0 ? Math.min(100, Math.round((totalPaid * 100) / mustPay)) : 0;

  const paymentStatusTag = isPaid ? (
    <Tag color="green">Đã thanh toán</Tag>
  ) : (
    <Tag color="orange">Chưa thanh toán</Tag>
  );

  const orderStatusInfo = ORDER_STATUS_MAP[order?.trangThai] || {
    text: 'Không xác định',
    color: 'default',
  };

  // Bảng sản phẩm
  const productColumns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'tenSanPham',
      key: 'tenSanPham',
    },
    {
      title: 'Cấu hình',
      dataIndex: 'cauHinh',
      key: 'cauHinh',
      width: '40%',
    },
    {
      title: 'Giá bán',
      dataIndex: 'giaBan',
      key: 'giaBan',
      align: 'right',
      render: (value) => <Text strong>{formatCurrency(value)}</Text>,
    },
    {
      title: 'Serial',
      dataIndex: 'maSeri',
      key: 'maSeri',
    },
  ];

  // Bảng thanh toán
  const paymentColumns = [
    {
      title: 'Phương thức',
      dataIndex: 'tenHinhThuc',
      key: 'tenHinhThuc',
    },
    {
      title: 'Khách đưa',
      dataIndex: 'khachDua',
      key: 'khachDua',
      align: 'right',
      render: (v) => formatCurrency(v),
    },
    {
      title: 'Số tiền thanh toán',
      dataIndex: 'soTien',
      key: 'soTien',
      align: 'right',
      render: (v) => <Text strong>{formatCurrency(v)}</Text>,
    },
    {
      title: 'Tiền trả lại',
      dataIndex: 'tienTraLai',
      key: 'tienTraLai',
      align: 'right',
      render: (v) => formatCurrency(v),
    },
  ];

  if (!order && !loading) {
    return (
      <div
        style={{
          padding: 24,
          minHeight: '100vh',
          background: '#f5f7fb',
        }}
      >
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <Button
            type="link"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            style={{ paddingLeft: 0, marginBottom: 12 }}
          >
            Quay lại
          </Button>
          <Card>Không tìm thấy đơn hàng. Vui lòng kiểm tra lại đường dẫn.</Card>
        </div>
      </div>
    );
  }

  const tongSanPham = order?.items?.length || 0;

  return (
    <div
      style={{
        padding: 24,
        minHeight: '100vh',
        background: '#f5f7fb',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        {/* HEADER */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <Space align="start">
            <Button
              icon={<ArrowLeftOutlined />}
              shape="circle"
              onClick={() => navigate(-1)}
            />
            <div>
              <Title level={4} style={{ margin: 0 }}>
                Chi tiết đơn hàng {order?.maDonHang}
              </Title>
              <div style={{ marginTop: 4 }}>
                <Text type="secondary">
                  Xem thông tin chi tiết và lịch sử thay đổi của đơn hàng
                </Text>
              </div>
              <div style={{ marginTop: 8 }}>
                <Space size={6}>
                  <Tag color="cyan">
                    {ORDER_TYPE_MAP[order?.loaiDon] || order?.loaiDon}
                  </Tag>
                  <Tag color={orderStatusInfo.color}>
                    {orderStatusInfo.text}
                  </Tag>
                  {paymentStatusTag}
                </Space>
              </div>
            </div>
          </Space>

          <Space>
            <Button icon={<FileTextOutlined />}>Xem hóa đơn</Button>
            <Button icon={<PrinterOutlined />}>In hóa đơn</Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchDetail}
              loading={loading}
            >
              Làm mới
            </Button>
          </Space>
        </div>

        {/* MAIN CARD + TABS */}
        <Card
          style={{
            borderRadius: 16,
            boxShadow: '0 8px 20px rgba(15,23,42,0.04)',
            border: '1px solid #edf2ff',
          }}
          bodyStyle={{ paddingTop: 12 }}
        >
          <Tabs defaultActiveKey="info" tabBarStyle={{ marginBottom: 16 }}>
            {/* TAB 1: Thông tin đơn hàng */}
            <Tabs.TabPane tab="Thông tin đơn hàng" key="info">
              <Row gutter={[16, 16]} align="stretch">
                {/* Thông tin cơ bản */}
                <Col xs={24} md={12} lg={12} style={{ display: 'flex' }}>
                  <Card
                    size="small"
                    title="Thông tin cơ bản"
                    style={{
                      borderRadius: 12,
                      borderColor: '#edf2ff',
                      flex: 1,
                      height: '100%',
                    }}
                  >
                    <Descriptions
                      column={1}
                      size="small"
                      colon={false}
                      labelStyle={{ fontWeight: 500 }}
                    >
                      <Descriptions.Item label="Mã đơn hàng">
                        {order?.maDonHang}
                      </Descriptions.Item>
                      <Descriptions.Item label="Loại đơn hàng">
                        <Tag color="cyan">
                          {ORDER_TYPE_MAP[order?.loaiDon] || order?.loaiDon}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Trạng thái đơn hàng">
                        <Tag color={orderStatusInfo.color}>
                          {orderStatusInfo.text}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Ngày tạo">
                        {formatDateTime(order?.ngayTao)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Ngày cập nhật">
                        {formatDateTime(order?.ngayCapNhat)}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>

                {/* Thông tin khách hàng */}
                <Col xs={24} md={12} lg={12} style={{ display: 'flex' }}>
                  <Card
                    size="small"
                    title="Thông tin khách hàng"
                    style={{
                      borderRadius: 12,
                      borderColor: '#edf2ff',
                      flex: 1,
                      height: '100%',
                    }}
                  >
                    <Descriptions
                      column={1}
                      size="small"
                      colon={false}
                      labelStyle={{ fontWeight: 500 }}
                    >
                      <Descriptions.Item label="Tên khách hàng">
                        {order?.tenKhachHang || 'Khách vãng lai'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Số điện thoại">
                        {order?.sdtKhachHang || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Email">
                        {order?.emailKhachHang || '-'}
                      </Descriptions.Item>
                    </Descriptions>

                    {/* Ô xám thông tin giao hàng */}
                    <div
                      style={{
                        marginTop: 12,
                        padding: 10,
                        background: '#f5f5f5',
                        borderRadius: 8,
                      }}
                    >
                      <Text strong style={{ display: 'block', marginBottom: 4 }}>
                        Thông tin giao hàng
                      </Text>
                      <div>
                        <Text strong>Người nhận: </Text>
                        <Text>{order?.tenNguoiNhan || order?.tenKhachHang || '-'}</Text>
                      </div>
                      <div>
                        <Text strong>Số điện thoại: </Text>
                        <Text>{order?.sdtNguoiNhan || order?.sdtKhachHang || '-'}</Text>
                      </div>
                    </div>
                  </Card>
                </Col>

                {/* Thông tin nhân viên */}
                <Col xs={24} md={12} lg={12} style={{ display: 'flex' }}>
                  <Card
                    size="small"
                    title="Thông tin nhân viên"
                    style={{
                      borderRadius: 12,
                      borderColor: '#edf2ff',
                      flex: 1,
                      height: '100%',
                    }}
                  >
                    <Descriptions
                      column={1}
                      size="small"
                      colon={false}
                      labelStyle={{ fontWeight: 500 }}
                    >
                      <Descriptions.Item label="Nhân viên tạo đơn">
                        {order?.tenNhanVien || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Mã nhân viên">
                        {order?.maNhanVien || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Số điện thoại">
                        {order?.sdtNhanVien || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Email">
                        {order?.emailNhanVien || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Ngày tạo">
                        {formatDateTime(order?.ngayTao)}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>

                {/* Tổng kết đơn hàng */}
                <Col xs={24} md={12} lg={12} style={{ display: 'flex' }}>
                  <Card
                    size="small"
                    title="Tổng kết đơn hàng"
                    style={{
                      borderRadius: 12,
                      borderColor: '#edf2ff',
                      flex: 1,
                      height: '100%',
                    }}
                    
                  >
                    {/* dòng 1: Tổng sản phẩm */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 4,
                      }}
                    >
                      <span>Tổng sản phẩm:</span>
                      <span>
                        <strong>{tongSanPham}</strong> sản phẩm
                      </span>
                    </div>

                    {/* dòng 2: Tổng tiền hàng */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 4,
                      }}
                    >
                      <span>Tổng tiền hàng:</span>
                      <span>{formatCurrency(order?.giaTriChuaGiam)}</span>
                    </div>

                    {/* dòng 3: Giảm giá voucher */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 8,
                      }}
                    >
                      <span>Giảm giá voucher:</span>
                      <span style={{ color: '#f11e1eff' }}>
                        - {formatCurrency(order?.giaTriGiamGia)}
                      </span>
                    </div>

                    {/* gạch ngang */}
                    <div
                      style={{
                        borderTop: '1px solid #f0f0f0',
                        margin: '8px 0',
                      }}
                    />

                    {/* dòng cuối: Tổng thanh toán */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontWeight: 600,
                      }}
                    >
                      <span>Tổng thanh toán:</span>
                      <span style={{ color: '#12b886' }}>
                        {formatCurrency(order?.tongTienThuHo)}
                      </span>
                    </div>
                  </Card>
                </Col>
              </Row>
            </Tabs.TabPane>

            {/* TAB 2: Sản phẩm */}
            <Tabs.TabPane tab="Sản phẩm" key="products">
              <Card
                size="small"
                title="Danh sách sản phẩm"
                style={{ borderRadius: 12, borderColor: '#edf2ff' }}
                extra={
                  <span>
                    Tổng số lượng:{' '}
                    <Text strong>{tongSanPham}</Text>
                  </span>
                }
              >
                <Table
                  rowKey="orderCtId"
                  columns={productColumns}
                  dataSource={order?.items || []}
                  pagination={false}
                />
                <div
                  style={{
                    marginTop: 16,
                    textAlign: 'right',
                    fontWeight: 600,
                  }}
                >
                  Tổng tiền hàng:{' '}
                  <span style={{ color: '#e67e22' }}>
                    {formatCurrency(order?.giaTriChuaGiam)}
                  </span>
                </div>
              </Card>
            </Tabs.TabPane>

            {/* TAB 3: Thanh toán */}
            <Tabs.TabPane tab="Thanh toán" key="payment">
              <Row gutter={[16, 16]}>
                {/* Trạng thái thanh toán */}
                <Col xs={24} md={12}>
                  <Card
                    size="small"
                    title="Trạng thái thanh toán"
                    extra={paymentStatusTag}
                    style={{ borderRadius: 12, borderColor: '#edf2ff' }}
                  >
                    <p style={{ marginBottom: 8 }}>
                      {isPaid
                        ? 'Đơn hàng đã được thanh toán đầy đủ'
                        : 'Đơn hàng chưa thanh toán đủ'}
                    </p>
                    <Progress
                      percent={paymentPercent}
                      status={isPaid ? 'success' : 'active'}
                      strokeColor={isPaid ? '#52c41a' : undefined}
                    />
                    <Descriptions
                      size="small"
                      column={1}
                      colon={false}
                      style={{ marginTop: 12 }}
                      labelStyle={{ fontWeight: 500 }}
                    >
                      <Descriptions.Item label="Tổng thanh toán">
                        {formatCurrency(mustPay)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Đã thanh toán">
                        {formatCurrency(totalPaid)}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>

                {/* Tổng kết thanh toán */}
                <Col xs={24} md={12}>
                  <Card
                    size="small"
                    title="Tổng kết thanh toán"
                    style={{ borderRadius: 12, borderColor: '#edf2ff' }}
                  >
                    <Descriptions
                      size="small"
                      column={1}
                      colon={false}
                      labelStyle={{ fontWeight: 500 }}
                    >
                      <Descriptions.Item label="Tổng tiền hàng">
                        {formatCurrency(order?.giaTriChuaGiam)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Giảm giá voucher">
                        - {formatCurrency(order?.giaTriGiamGia)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Tổng thanh toán">
                        <Text strong type="success">
                          {formatCurrency(mustPay)}
                        </Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Đã thanh toán">
                        <Text strong>{formatCurrency(totalPaid)}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Trạng thái">
                        {paymentStatusTag}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>
              </Row>

              <Card
                size="small"
                title="Phương thức thanh toán"
                style={{ marginTop: 16, borderRadius: 12, borderColor: '#edf2ff' }}
              >
                <Table
                  rowKey="id"
                  columns={paymentColumns}
                  dataSource={order?.payments || []}
                  pagination={false}
                />
              </Card>
            </Tabs.TabPane>

            {/* TAB 4: Trạng thái */}
            <Tabs.TabPane tab="Trạng thái" key="status">
              <Card
                size="small"
                title="Trạng thái đơn hàng"
                style={{ borderRadius: 12, borderColor: '#edf2ff' }}
              >
                <Descriptions
                  size="small"
                  column={1}
                  colon={false}
                  labelStyle={{ fontWeight: 500 }}
                >
                  <Descriptions.Item label="Trạng thái đơn hàng">
                    <Tag color={orderStatusInfo.color}>
                      {orderStatusInfo.text}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Trạng thái thanh toán">
                    {paymentStatusTag}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Tabs.TabPane>

            {/* TAB 5: Lịch sử thay đổi */}
            <Tabs.TabPane tab="Lịch sử thay đổi" key="history">
              <Card
                size="small"
                style={{ borderRadius: 12, borderColor: '#edf2ff' }}
              >
                <p style={{ margin: 0 }}>
                  Lịch sử thay đổi đơn hàng sẽ được hiển thị tại đây
                  (TODO: map OrderActionLog từ BE).
                </p>
              </Card>
            </Tabs.TabPane>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default OrderDetailComponent;
