import React, { useEffect, useState } from 'react';
import { Table, Button, Input, Select, Space } from 'antd';
import { listKichthuoc } from '../../service/KichThuocService'; // (đổi tên file đúng của bạn)
import AddKichThuocModal from './AddKichThuocComponent';
import AdminBreadcrumb from '../components/Breadcrumb';

const { Option } = Select;

const s = (v) => String(v ?? '');
const lower = (v) => s(v).toLowerCase();
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

const ListKichThuocComponent = () => {
  const [ktList, setKtList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [sortOption, setSortOption] = useState('default');

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [pagination, setPagination] = useState({ current: 1, pageSize: 5 });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await listKichthuoc();
      // Chấp nhận nhiều shape: {code, data}, {content}, hoặc array thẳng
      const data =
        res?.data?.data ??
        res?.data?.content ??
        (Array.isArray(res?.data) ? res.data : []) ??
        [];
      setKtList(data);
      setFilteredList(data);
      setPagination((p) => ({ ...p, current: 1 }));
    } catch (e) {
      console.error('Không thể tải dữ liệu Kích thước', e);
      setKtList([]); setFilteredList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let temp = [...ktList];

    // 🔎 Tìm theo idKichThuoc hoặc giá trị số
    if (searchText.trim()) {
      const q = lower(searchText);
      temp = temp.filter((it) =>
        lower(it?.idKichThuoc).includes(q) ||
        lower(s(it?.chieuDai)).includes(q) ||
        lower(s(it?.chieuRong)).includes(q) ||
        lower(s(it?.chieuCao)).includes(q) ||
        lower(s(it?.khoiLuong)).includes(q)
      );
    }

    // ↕️ Sắp xếp
    switch (sortOption) {
      case 'id_az':
        temp.sort((a, b) => s(a?.idKichThuoc).localeCompare(s(b?.idKichThuoc)));
        break;
      case 'id_za':
        temp.sort((a, b) => s(b?.idKichThuoc).localeCompare(s(a?.idKichThuoc)));
        break;
      case 'dai_asc':
        temp.sort((a, b) => num(a?.chieuDai) - num(b?.chieuDai));
        break;
      case 'dai_desc':
        temp.sort((a, b) => num(b?.chieuDai) - num(a?.chieuDai));
        break;
      case 'rong_asc':
        temp.sort((a, b) => num(a?.chieuRong) - num(b?.chieuRong));
        break;
      case 'rong_desc':
        temp.sort((a, b) => num(b?.chieuRong) - num(a?.chieuRong));
        break;
      case 'cao_asc':
        temp.sort((a, b) => num(a?.chieuCao) - num(b?.chieuCao));
        break;
      case 'cao_desc':
        temp.sort((a, b) => num(b?.chieuCao) - num(a?.chieuCao));
        break;
      case 'kl_asc':
        temp.sort((a, b) => num(a?.khoiLuong) - num(b?.khoiLuong));
        break;
      case 'kl_desc':
        temp.sort((a, b) => num(b?.khoiLuong) - num(a?.khoiLuong));
        break;
      default:
        break;
    }

    setFilteredList(temp);
    setPagination((p) => ({ ...p, current: 1 }));
  }, [searchText, sortOption, ktList]);

  const handleRefresh = () => {
    setSearchText('');
    setSortOption('default');
    fetchData();
  };

  const openModal = (id = null) => { setEditingId(id); setModalVisible(true); };
  const closeModal = () => { setModalVisible(false); setEditingId(null); fetchData(); };

  const columns = [
    {
      title: 'STT',
      render: (_v, _r, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
      width: 80,
    },
    { title: 'Mã KT', dataIndex: 'idKichThuoc', width: 120 },
    { title: 'Chiều dài', dataIndex: 'chieuDai', render: (v) => `${num(v)} cm` },
    { title: 'Chiều rộng', dataIndex: 'chieuRong', render: (v) => `${num(v)} cm` },
    { title: 'Chiều cao', dataIndex: 'chieuCao', render: (v) => `${num(v)} cm` },
    { title: 'Khối lượng', dataIndex: 'khoiLuong', render: (v) => `${num(v)} kg` },
    {
      title: 'Hành động',
      render: (_v, record) => (
        <Button type="link" onClick={() => openModal(record?.id)}>
          Sửa
        </Button>
      ),
      width: 100,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <AdminBreadcrumb items={[{ label: 'Kích thước' }]} />
      <h2>Danh sách Kích thước</h2>

      <Space style={{ marginBottom: 16, flexWrap: 'wrap', gap: 12 }} size="middle">
        <Input
          placeholder="Tìm Mã KT / số đo / khối lượng"
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 260 }}
        />

        <Button onClick={handleRefresh} style={{ background: '#FFD700', color: '#000' }}>
          Làm Mới
        </Button>

        <span>Sắp xếp:</span>
        <Select value={sortOption} onChange={setSortOption} style={{ width: 200 }}>
          <Option value="default">Mặc định</Option>
          <Option value="id_az">Mã KT A-Z</Option>
          <Option value="id_za">Mã KT Z-A</Option>
          <Option value="dai_asc">Dài ↑</Option>
          <Option value="dai_desc">Dài ↓</Option>
          <Option value="rong_asc">Rộng ↑</Option>
          <Option value="rong_desc">Rộng ↓</Option>
          <Option value="cao_asc">Cao ↑</Option>
          <Option value="cao_desc">Cao ↓</Option>
          <Option value="kl_asc">Khối lượng ↑</Option>
          <Option value="kl_desc">Khối lượng ↓</Option>
        </Select>

        <Button type="primary" onClick={() => openModal()}>
          + Thêm Kích thước
        </Button>
      </Space>

      <Table
        rowKey={(r) => r?.id ?? r?.idKichThuoc}
        columns={columns}
        dataSource={filteredList}
        loading={loading}
        bordered
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: filteredList.length,
          showSizeChanger: true,
          pageSizeOptions: [5, 10, 20, 50],
        }}
        onChange={(pag) => {
          setPagination({ current: pag.current, pageSize: pag.pageSize });
        }}
      />

      {modalVisible && (
        <AddKichThuocModal
          open={modalVisible}
          id={editingId}
          onClose={closeModal}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
};

export default ListKichThuocComponent;
