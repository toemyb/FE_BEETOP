import React, { useState, useEffect } from 'react';
import {
  Table, Button, Input, Space, Row, Col, Typography, Card, Empty
} from 'antd';
import { listThuongHieu } from '../../service/ThuongHieuService';
import AddThuongHieuModal from './AddThuongHieuComponent';
import AdminBreadcrumb from '../components/Breadcrumb';

const { Title } = Typography;

const ListThuongHieuComponent = () => {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [sortOption, setSortOption] = useState('default');

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await listThuongHieu();
      const list = res?.data?.content || res?.data || [];
      setData(list);
      setFiltered(list);
    } catch (err) {
      console.error('Không thể tải dữ liệu thương hiệu', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let temp = [...data];
    const q = searchText.trim().toLowerCase();
    if (q) {
      temp = temp.filter((i) => i.ten?.toLowerCase().includes(q));
    }

    if (sortOption === 'az') {
      temp.sort((a, b) => (a.ten || '').localeCompare(b.ten || ''));
    } else if (sortOption === 'za') {
      temp.sort((a, b) => (b.ten || '').localeCompare(a.ten || ''));
    }

    setFiltered(temp);
  }, [searchText, sortOption, data]);

  const handleRefresh = () => {
    setSearchText('');
    setSortOption('default');
    fetchData();
  };

  const openModal = (id = null) => {
    setEditingId(id);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingId(null);
    fetchData();
  };

  const columns = [
    {
      title: 'STT',
      width: 80,
      align: 'center',
      render: (_v, _r, i) => (pagination.current - 1) * pagination.pageSize + i + 1,
    },
    {
      title: 'Tên Thương Hiệu',
      dataIndex: 'ten',
      align: 'center',
      render: (text) => <strong>{text || '—'}</strong>,
    },
    {
      title: 'Mô tả',
      dataIndex: 'moTa',
      align: 'center',
      render: (val) => val || '—',
    },
    {
      title: 'Hành động',
      align: 'center',
      width: 120,
      render: (_v, record) => (
        <Button type="link" onClick={() => openModal(record.id)}>
          Sửa
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px 32px' }}>
      <AdminBreadcrumb items={[{ label: 'Thương hiệu' }]} />

      <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              Danh sách thương hiệu
            </Title>
          </Col>
          <Col>
            <Button type="primary" onClick={() => openModal()} style={{ fontWeight: 500 }}>
              + Thêm Thương Hiệu
            </Button>
          </Col>
        </Row>

        <Space
          style={{
            marginBottom: 16,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            justifyContent: 'space-between',
          }}
          size="middle"
        >
          <Input
            placeholder="Tìm kiếm tên thương hiệu..."
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
          />
          <Button onClick={handleRefresh} style={{ background: '#FFD700', color: '#000' }}>
            Làm Mới
          </Button>
        </Space>

        <Table
          rowKey={(r) => r.id}
          columns={columns}
          dataSource={filtered}
          loading={loading}
          bordered
          locale={{
            emptyText: (
              <Empty description="Không có dữ liệu" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ),
          }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: filtered.length,
            showSizeChanger: true,
            pageSizeOptions: ['5', '10', '20', '50'],
            style: { textAlign: 'center', marginTop: 16 },
          }}
          onChange={(pag) => setPagination({ current: pag.current, pageSize: pag.pageSize })}
        />
      </Card>

      {modalVisible && (
        <AddThuongHieuModal
          open={modalVisible}
          id={editingId}
          onClose={closeModal}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
};

export default ListThuongHieuComponent;
