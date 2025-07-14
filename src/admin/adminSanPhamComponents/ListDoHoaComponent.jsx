import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Input, Select, Space } from 'antd';
import { listDoHoa } from '../../service/DoHoaService';
import AddDoHoaModal from './AddDoHoaComponent';
import AdminBreadcrumb from '../components/Breadcrumb';

const { Option } = Select;

const ListDoHoaComponent = () => {
  const [dohoaList, setDohoaList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [filterTrangThai, setFilterTrangThai] = useState('all');
  const [sortOption, setSortOption] = useState('default');

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // ✅ Thêm state phân trang
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
      const res = await listDoHoa();
      const data = res.data.content || res.data;
      setDohoaList(data);
      setFilteredList(data);
    } catch {
      console.error('Không thể tải dữ liệu Đồ Họa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let temp = [...dohoaList];

    if (searchText.trim()) {
      temp = temp.filter(item =>
        item.tenDayDu?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (filterTrangThai !== 'all') {
      temp = temp.filter(item => item.trangThai === Number(filterTrangThai));
    }

    if (sortOption === 'az') {
      temp.sort((a, b) => a.tenDayDu.localeCompare(b.tenDayDu));
    } else if (sortOption === 'za') {
      temp.sort((a, b) => b.tenDayDu.localeCompare(a.tenDayDu));
    }

    setFilteredList(temp);
  }, [searchText, filterTrangThai, sortOption, dohoaList]);

  const handleRefresh = () => {
    setSearchText('');
    setFilterTrangThai('all');
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
      render: (_, __, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1, // ✅ STT theo trang
    },
    {
      title: 'Mã Đồ Họa',
      dataIndex: 'idDohoa',
    },
    {
      title: 'Hãng card onboard',
      dataIndex: 'hangcardOboard',
    },
    {
      title: 'Model card onboard',
      dataIndex: 'modelcardOboard',
    },
    {
      title: 'Tên đầy đủ',
      dataIndex: 'tenDayDu',
      render: text => <strong>{text}</strong>,
    },
    {
      title: 'Loại card',
      dataIndex: 'loaiCard',
    },
    {
      title: 'Bộ nhớ RAM',
      dataIndex: 'boNhoRam',
    },
    {
      title: 'Mô tả',
      dataIndex: 'moTa',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      render: val =>
        val === 1 ? <Tag color="green">Hoạt động</Tag> : <Tag color="red">Ngưng</Tag>,
    },
    {
      title: 'Hành động',
      render: (_, record) => (
        <Button type="link" onClick={() => openModal(record.id)}>
          Sửa
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <AdminBreadcrumb items={[{ label: 'Đồ họa' }]} />
      <h2>Danh sách đồ họa</h2>

      <Space style={{ marginBottom: 16, flexWrap: 'wrap', gap: 12 }} size="middle">
        <Input
          placeholder="Tìm kiếm tên đồ họa"
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 200 }}
        />

        <Button onClick={handleRefresh} style={{ background: '#FFD700', color: '#000' }}>
          Làm Mới
        </Button>

        <span>Trạng Thái:</span>
        <Select value={filterTrangThai} onChange={setFilterTrangThai} style={{ width: 120 }}>
          <Option value="all">Tất cả</Option>
          <Option value="1">Hoạt động</Option>
          <Option value="0">Ngưng</Option>
        </Select>

        <span>Sắp xếp:</span>
        <Select value={sortOption} onChange={setSortOption} style={{ width: 120 }}>
          <Option value="default">Mặc định</Option>
          <Option value="az">Tên A-Z</Option>
          <Option value="za">Tên Z-A</Option>
        </Select>

        <Button type="primary" onClick={() => openModal()}>
          + Thêm Đồ Họa
        </Button>
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredList}
        loading={loading}
        bordered
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: filteredList.length,
          showSizeChanger: true,
          pageSizeOptions: ['5', '10', '20', '50'],
        }}
        onChange={(pag) => {
          setPagination({
            current: pag.current,
            pageSize: pag.pageSize,
          });
        }}
      />

      {modalVisible && (
        <AddDoHoaModal
          open={modalVisible}
          id={editingId}
          onClose={closeModal}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
};

export default ListDoHoaComponent;
