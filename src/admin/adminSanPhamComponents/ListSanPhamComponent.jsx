import React, { useState } from 'react';
import {
  Table,
  Input,
  Button,
  Select,
  Space,
  Tag,
  Image,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  ReloadOutlined,
  DownloadOutlined,
  UploadOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';

const { Option } = Select;

const ListSanPhamComponent = () => {
  const [searchText, setSearchText] = useState('');

  const columns = [
    {
      title: 'STT',
      dataIndex: 'stt',
      width: 60,
    },
    {
      title: 'Ảnh',
      dataIndex: 'image',
      render: (src) => <Image src={src} width={50} />,
    },
    {
      title: 'Mã Sản Phẩm',
      dataIndex: 'ma',
    },
    {
      title: 'Tên Sản Phẩm',
      dataIndex: 'ten',
    },
    {
      title: 'Hãng',
      dataIndex: 'hang',
    },
    {
      title: 'Số Lượng',
      dataIndex: 'soLuong',
      render: (s, record) => `${s} (${record.phienBan} phiên bản)`,
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'trangThai',
      render: (val) =>
        val === 'active' ? (
          <Tag color="green">Kinh doanh</Tag>
        ) : (
          <Tag color="red">Ngưng</Tag>
        ),
    },
    {
      title: 'Thao Tác',
      render: (_, record) => (
        <Space>
          <Tooltip title="Sửa">
            <Button icon={<EditOutlined />} type="text" />
          </Tooltip>
          <Tooltip title="Xem">
            <Button icon={<EyeOutlined />} type="text" />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* Thanh công cụ */}
      <Space style={{ marginBottom: 16, flexWrap: 'wrap', justifyContent: 'space-between' }} align="start">
        <Space wrap>
          <Input
            placeholder="Tìm kiếm sản phẩm theo mã, tên"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
          />
          <Button icon={<ReloadOutlined />}>Làm Mới</Button>
        </Space>
        <Space wrap>
          <Button icon={<UploadOutlined />}>Import IMEI</Button>
          <Button icon={<DownloadOutlined />}>Tải Mẫu</Button>
          <Button icon={<FileExcelOutlined />}>Export Excel</Button>
          <Button type="primary" icon={<PlusOutlined />}>
            + Tạo sản phẩm
          </Button>
        </Space>
      </Space>

      {/* Bộ lọc */}
      <Space style={{ marginBottom: 16, flexWrap: 'wrap' }} size="middle">
        <Select placeholder="Chọn Danh Mục" style={{ width: 150 }} />
        <Select placeholder="Chọn Hãng" style={{ width: 150 }} />
        <Select placeholder="Chọn Hệ Điều Hành" style={{ width: 170 }} />
        <Select placeholder="Chọn Chip" style={{ width: 130 }} />
        <Select placeholder="Chọn Pin" style={{ width: 130 }} />
        <Select placeholder="Chọn Màn Hình" style={{ width: 160 }} />
        <Select placeholder="Trạng Thái" style={{ width: 120 }}>
          <Option value="all">Tất cả</Option>
          <Option value="active">Kinh doanh</Option>
          <Option value="inactive">Ngưng</Option>
        </Select>
        <Select placeholder="Sắp Xếp" style={{ width: 120 }}>
          <Option value="moi">Mới</Option>
          <Option value="cu">Cũ</Option>
        </Select>
        <Select defaultValue="10" style={{ width: 100 }}>
          <Option value="10">10/Pages</Option>
          <Option value="20">20/Pages</Option>
        </Select>
      </Space>

      {/* Bảng sản phẩm */}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={[]} // dữ liệu thật bạn thêm sau
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: 'Chưa có dữ liệu sản phẩm' }}
        bordered
      />
    </div>
  );
};

export default ListSanPhamComponent;
