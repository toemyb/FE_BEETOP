import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Divider,
  Row,
  Col,
  Upload,
  Table,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  getAllDoHoa,
  getAllRam,
  getAllRom,
  getAllCpu,
  getAllManHinh,
  getAllPin,
  getAllKichThuoc,
  getAllHeDieuHanh,
  getAllMauSac,
} from '../../service/OptionService';
import { addLaptop } from '../../service/LapTopService';
import useToast from '../../hooks/useNotify';

const { Option } = Select;

const AddLaptopForm = () => {
  const [form] = Form.useForm();
  const [variants, setVariants] = useState([]);
  const [selectedRowKeysMap, setSelectedRowKeysMap] = useState({});
  const [variantForm, setVariantForm] = useState({
    ramIds: [],
    romIds: [],
    cpuIds: [],
    doHoaIds: [],
    colorIds: [],
  });

  const [ramList, setRamList] = useState([]);
  const [romList, setRomList] = useState([]);
  const [cpuList, setCpuList] = useState([]);
  const [doHoaList, setDoHoaList] = useState([]);
  const [manHinhList, setManHinhList] = useState([]);
  const [pinList, setPinList] = useState([]);
  const [kichThuocList, setKichThuocList] = useState([]);
  const [heDieuHanhList, setHeDieuHanhList] = useState([]);
  const [mauSacList, setMauSacList] = useState([]);

  const { success, error, warning } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [
          ramRes, romRes, cpuRes, doHoaRes,
          manHinhRes, pinRes, kichThuocRes,
          heDieuHanhRes, mauSacRes,
        ] = await Promise.all([
          getAllRam(),
          getAllRom(),
          getAllCpu(),
          getAllDoHoa(),
          getAllManHinh(),
          getAllPin(),
          getAllKichThuoc(),
          getAllHeDieuHanh(),
          getAllMauSac(),
        ]);

        setRamList(ramRes.data.content || []);
        setRomList(romRes.data.content || []);
        setCpuList(cpuRes.data.content || []);
        setDoHoaList(doHoaRes.data.content || []);
        setManHinhList(manHinhRes.data.content || []);
        setPinList(pinRes.data.content || []);
        setKichThuocList(
          (kichThuocRes.data.content || []).map((k) => ({
            id: k.id,
            kichThuoc: `${k.chieuDai} x ${k.chieuRong} x ${k.chieuCao} - ${k.khoiLuong}kg`,
          }))
        );
        setHeDieuHanhList(heDieuHanhRes.data.content || []);
        setMauSacList(mauSacRes.data.content || []);
      } catch {
        error('Không thể tải dữ liệu combobox');
      }
    };

    fetchOptions();
  }, [error]);

  const selectProps = {
    dropdownStyle: { maxHeight: 160, overflowY: 'auto' },
    getPopupContainer: (trigger) => trigger.parentNode,
    mode: 'multiple',
  };

  const getRamLabel = (id) => ramList.find((r) => r.id === id)?.dungLuongRam || '';
  const getRomLabel = (id) => romList.find((r) => r.id === id)?.dungLuongSsd || '';

  const handleAddVariant = () => {
    const { ramIds, romIds, cpuIds, doHoaIds, colorIds } = variantForm;

    if (!ramIds.length || !romIds.length || !cpuIds.length || !doHoaIds.length || !colorIds.length) {
      return warning('Vui lòng nhập đủ thông tin biến thể');
    }

    const newVariants = [];

    ramIds.forEach((ramId) => {
      romIds.forEach((romId) => {
        cpuIds.forEach((cpuId) => {
          doHoaIds.forEach((doHoaId) => {
            colorIds.forEach((colorId) => {
              const ramLabel = getRamLabel(ramId);
              const romLabel = getRomLabel(romId);
              newVariants.push({
                idPhienBan: `PB${Math.random().toString(36).substring(2, 10)}`,
                ramId,
                romId,
                cpuId,
                doHoaId,
                colorId,
                giaBan: 24990000,
                moTa: `Bản RAM ${ramLabel} SSD ${romLabel}`,
                trangThai: 1,
              });
            });
          });
        });
      });
    });

    setVariants([...variants, ...newVariants]);
    setVariantForm({
      ramIds: [],
      romIds: [],
      cpuIds: [],
      doHoaIds: [],
      colorIds: [],
    });
  };

  const handleDeleteVariant = (idPhienBan) => {
    setVariants((prev) => prev.filter((v) => v.idPhienBan !== idPhienBan));
  };

  const handleDeleteSelectedRows = (groupKey) => {
    const selectedKeys = selectedRowKeysMap[groupKey] || [];
    if (!selectedKeys.length) {
      return warning('Vui lòng chọn phiên bản cần xóa');
    }

    setVariants((prev) =>
      prev.filter(
        (item) => !(item.ramId + '-' + item.romId === groupKey && selectedKeys.includes(item.idPhienBan))
      )
    );

    setSelectedRowKeysMap((prev) => ({ ...prev, [groupKey]: [] }));
  };

  const handleFinish = async (values) => {
    const payload = {
      nguoiTao: 'ADMIN',
      laptop: {
        tenSanPham: values.tenSanPham,
        moTa: values.moTa,
        trangThai: parseInt(values.trangThai),
      },
      laptopChiTiet: {
        idManHinh: values.manHinh,
        idPin: values.pin,
        idKichThuoc: values.kichThuoc,
        idHeDieuHanh: values.heDieuHanh,
        moTa: values.moTa,
        trangThai: parseInt(values.trangThai),
      },
      combinations: variants.map((v) => ({
        idPhienBan: v.idPhienBan,
        ramId: v.ramId,
        romId: v.romId,
        cpuId: v.cpuId,
        doHoaId: v.doHoaId,
        mauSacId: v.colorId,
        moTa: 'Tự động sinh',
        trangThai: 1,
      })),
    };

    try {
      await addLaptop(payload);
      success('Thêm sản phẩm thành công!');
      form.resetFields();
      setVariants([]);
      setSelectedRowKeysMap({});
      navigate('/admin/lap-top'); // ✅ chuyển về trang danh sách
    } catch (err) {
      console.error('Lỗi khi gọi API:', err);
      error('Không thể thêm sản phẩm!');
    }
  };

  const groupByRamRom = variants.reduce((acc, item) => {
    const key = `${item.ramId}-${item.romId}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div style={{ padding: 24, display: 'flex', justifyContent: 'center' }}>
      <div style={{ maxWidth: 1200, width: '100%' }}>
        <h2 style={{ textAlign: 'center' }}>THÊM SẢN PHẨM</h2>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{ trangThai: '1', heDieuHanh: '' }}
        >
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item name="tenSanPham" label="Tên Sản Phẩm" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="moTa" label="Mô Tả">
                <Input.TextArea rows={1} />
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item name="manHinh" label="Màn Hình">
                <Select {...selectProps} mode="default">
                  {manHinhList.map((i) => (
                    <Option key={i.id} value={i.id}>{i.doPhanGiai}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="pin" label="Pin">
                <Select {...selectProps} mode="default">
                  {pinList.map((i) => (
                    <Option key={i.id} value={i.id}>{i.dungLuong}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="kichThuoc" label="Kích Thước">
                <Select {...selectProps} mode="default">
                  {kichThuocList.map((i) => (
                    <Option key={i.id} value={i.id}>{i.kichThuoc}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="heDieuHanh" label="Hệ Điều Hành">
                <Select {...selectProps} mode="default">
                  {heDieuHanhList.map((i) => (
                    <Option key={i.id} value={i.id}>{i.ten}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="trangThai" label="Trạng Thái">
                <Select>
                  <Option value="0">Kinh Doanh</Option>
                  <Option value="1">Ngưng</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">THÊM PHIÊN BẢN</Divider>
          <Row gutter={[16, 16]}>
            <Col span={4}><label>RAM</label><Select {...selectProps} value={variantForm.ramIds} onChange={(val) => setVariantForm({ ...variantForm, ramIds: val })} style={{ width: '100%' }}>{ramList.map(item => <Option key={item.id} value={item.id}>{item.dungLuongRam}</Option>)}</Select></Col>
            <Col span={4}><label>ROM</label><Select {...selectProps} value={variantForm.romIds} onChange={(val) => setVariantForm({ ...variantForm, romIds: val })} style={{ width: '100%' }}>{romList.map(item => <Option key={item.id} value={item.id}>{item.dungLuongSsd}</Option>)}</Select></Col>
            <Col span={4}><label>CPU</label><Select {...selectProps} value={variantForm.cpuIds} onChange={(val) => setVariantForm({ ...variantForm, cpuIds: val })} style={{ width: '100%' }}>{cpuList.map(item => <Option key={item.id} value={item.id}>{item.ten}</Option>)}</Select></Col>
            <Col span={4}><label>Đồ Họa</label><Select {...selectProps} value={variantForm.doHoaIds} onChange={(val) => setVariantForm({ ...variantForm, doHoaIds: val })} style={{ width: '100%' }}>{doHoaList.map(item => <Option key={item.id} value={item.id}>{item.tenDayDu}</Option>)}</Select></Col>
            <Col span={4}><label>Màu Sắc</label><Select {...selectProps} value={variantForm.colorIds} onChange={(val) => setVariantForm({ ...variantForm, colorIds: val })} style={{ width: '100%' }}>{mauSacList.map(item => <Option key={item.id} value={item.id}>{item.ten}</Option>)}</Select></Col>
            <Col span={4}><Button type="primary" onClick={handleAddVariant} style={{ width: '100%', marginTop: 22 }}>Hoàn Tất</Button></Col>
          </Row>

          {Object.entries(groupByRamRom).map(([key, items]) => {
            const ramLabel = getRamLabel(items[0].ramId);
            const romLabel = getRomLabel(items[0].romId);

            const rowSelection = {
              selectedRowKeys: selectedRowKeysMap[key] || [],
              onChange: (selectedKeys) => {
                setSelectedRowKeysMap((prev) => ({ ...prev, [key]: selectedKeys }));
              },
            };

            return (
              <div key={key} style={{ marginTop: 24, padding: 12, border: '1px solid #ccc', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={selectedRowKeysMap[key]?.length === items.length && items.length > 0}
                      onChange={(e) => {
                        setSelectedRowKeysMap((prev) => ({
                          ...prev,
                          [key]: e.target.checked ? items.map((i) => i.idPhienBan) : [],
                        }));
                      }}
                    />
                    <h3 style={{ margin: 0 }}>PHIÊN BẢN {ramLabel}/{romLabel}</h3>
                  </div>
                  <Button danger onClick={() => handleDeleteSelectedRows(key)}>Xóa Phiên Bản</Button>
                </div>

                <Table
                  size="small"
                  bordered
                  pagination={false}
                  rowKey="idPhienBan"
                  rowSelection={rowSelection}
                  columns={[
                    { title: 'STT', render: (_, __, index) => index + 1 },
                    {
                      title: 'Tên Sản Phẩm',
                      render: (_, row) => {
                        const name = form.getFieldValue('tenSanPham') || '';
                        const cpu = cpuList.find((c) => c.id === row.cpuId)?.ten || '';
                        const gpu = doHoaList.find((d) => d.id === row.doHoaId)?.tenDayDu || '';
                        return `${name} ${cpu} ${gpu} ${ramLabel}/${romLabel}`;
                      },
                    },
                    {
                      title: 'Màu Sắc',
                      render: (_, row) => mauSacList.find((m) => m.id === row.colorId)?.ten || '',
                    },
                    {
                      title: 'Thao Tác',
                      render: (_, row) => (
                        <Button danger size="small" onClick={() => handleDeleteVariant(row.idPhienBan)}>
                          Xóa
                        </Button>
                      ),
                    },
                  ]}
                  dataSource={items}
                />
              </div>
            );
          })}

          <Divider orientation="left">ẢNH</Divider>
          <Form.Item name="image">
            <Upload>
              <Button icon={<UploadOutlined />}>UPLOAD ẢNH</Button>
            </Upload>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              Lưu Sản Phẩm
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default AddLaptopForm;
