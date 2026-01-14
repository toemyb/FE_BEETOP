import React, { useEffect, useMemo, useState } from "react";
import { Table, Tag, Space, Button, Modal, Input, Select } from "antd";
import {
  ReloadOutlined,
  EditOutlined,
  PlusOutlined,
  PictureOutlined,
  QrcodeOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { getLaptopCTByLaptop } from "../../service/LapTopCTService";
import { getAnhByLaptopCt } from "../../service/AnhService";
import AddSeriComponent from "./AddSeriComponent";
import AddAnhComponent from "./AddAnhComponent";
import ListSeriComponent from "./ListSeriComponent";

// ✅ tạo QR + zip + tải file
import QRCode from "qrcode";
import JSZip from "jszip";
import { saveAs } from "file-saver";

// ✅ DÙNG ĐÚNG service của bạn
import { getSeriByLaptopCt } from "../../service/SeriService";

// ✅ option api bạn đưa (bộ lọc)
import { getAllDoHoa, getAllRam, getAllRom, getAllMauSac } from "../../service/OptionService";

const { Option } = Select;

// ✅ helper lấy label an toàn (tránh undefined)
const pickLabel = (obj, keys = []) => {
  if (!obj) return "";
  for (const k of keys) {
    const v = obj?.[k];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
};

// ✅ chuẩn hoá url ảnh (cloudinary http -> https)
const normalizeImgUrl = (url) => {
  if (!url) return null;
  let u = String(url).trim().replaceAll("\\", "/");
  if (u.startsWith("http://res.cloudinary.com/")) {
    u = u.replace("http://", "https://");
  }
  return u;
};

// ✅ confirm chuẩn (antd)
const confirmCentered = ({ title, content, onOk }) =>
  Modal.confirm({
    title,
    content,
    centered: true,
    okText: "Đồng ý",
    cancelText: "Hủy",
    onOk,
  });

const ListLaptopCTComponent = () => {
  const navigate = useNavigate();
  const { idLaptop } = useParams();

  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ role flag
  const [role, setRole] = useState(null);
  const isEmployee = role === "NHAN_VIEN" || role === "ROLE_NHAN_VIEN";

  // ✅ FILTER + SEARCH
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState({
    ram: "",
    ssd: "",
    doHoa: "",
    mauSac: "",
  });

  // ✅ option lists for combobox
  const [ramList, setRamList] = useState([]);
  const [ssdList, setSsdList] = useState([]);
  const [doHoaList, setDoHoaList] = useState([]);
  const [mauSacList, setMauSacList] = useState([]);

  // modal thêm seri
  const [openSeriModal, setOpenSeriModal] = useState(false);

  // modal quản lý ảnh
  const [openAnhModal, setOpenAnhModal] = useState(false);

  // modal danh sách seri & QR
  const [openSeriListModal, setOpenSeriListModal] = useState(false);

  // id biến thể đang thao tác
  const [currentLaptopCtId, setCurrentLaptopCtId] = useState(null);

  // ✅ trạng thái tải QR theo từng row
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchOptions = async () => {
    try {
      const [ramRes, ssdRes, doHoaRes, mauSacRes] = await Promise.all([
        getAllRam(),
        getAllRom(),
        getAllDoHoa(),
        getAllMauSac(),
      ]);

      // tùy backend trả về: data.data / data.content / data
      const pickList = (res) =>
        res?.data?.data?.content ||
        res?.data?.content ||
        res?.data?.data ||
        res?.data ||
        [];

      const ramData = pickList(ramRes);
      const ssdData = pickList(ssdRes);
      const doHoaData = pickList(doHoaRes);
      const mauSacData = pickList(mauSacRes);

      setRamList(Array.isArray(ramData) ? ramData : []);
      setSsdList(Array.isArray(ssdData) ? ssdData : []);
      setDoHoaList(Array.isArray(doHoaData) ? doHoaData : []);
      setMauSacList(Array.isArray(mauSacData) ? mauSacData : []);
    } catch (err) {
      console.error("❌ Lỗi tải options filter:", err);
      toast.error("Không tải được dữ liệu bộ lọc.");
    }
  };

  const fetchData = async () => {
    if (!idLaptop) {
      toast.error("Không tìm thấy ID laptop. Vui lòng quay lại danh sách sản phẩm!");
      navigate("/admin/lap-top");
      return;
    }

    setLoading(true);
    try {
      // 1) list biến thể
      const response = await getLaptopCTByLaptop(idLaptop);

      const raw = Array.isArray(response?.data?.data)
        ? response.data.data
        : Array.isArray(response?.data)
        ? response.data
        : [];

      const mapped = raw.map((item) => ({
        id: item.id, // idLaptopCt
        idLaptop: item.idLaptop,
        idLaptopCT: item.idLaptopCT,
        ram: item.tenRam,
        ssd: item.tenSsd,
        cpu: item.tenCpu,
        doHoa: item.tenDohoa,
        mauSac: item.tenMauSac,
        giaBan: item.giaBan,
        moTa: item.moTa,
        trangThai: item.trangThai,
        ngayTao: item.ngayTao,
        ngayCapNhat: item.ngayCapNhat,
        soLuongSeri: item.soLuongSeri ?? 0,
      }));

      // 2) ảnh thumbnail cho mỗi biến thể
      const withImage = await Promise.all(
        mapped.map(async (v) => {
          try {
            const resAnh = await getAnhByLaptopCt(v.id);
            const listAnh = resAnh?.data?.data || resAnh?.data || [];
            const first = Array.isArray(listAnh) && listAnh.length > 0 ? listAnh[0] : null;

            return { ...v, anhUrl: normalizeImgUrl(first?.imgURL) };
          } catch (e) {
            console.error("Lỗi load ảnh cho biến thể", v.id, e);
            return { ...v, anhUrl: null };
          }
        })
      );

      setVariants(withImage);
    } catch (err) {
      console.error("❌ Lỗi khi tải danh sách biến thể laptop:", err);
      toast.error("Không tải được danh sách biến thể.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // ✅ lấy role từ sessionStorage
    try {
      const raw = sessionStorage.getItem("user");
      const user = raw ? JSON.parse(raw) : null;
      setRole(user?.role || null);
    } catch {
      setRole(null);
    }

    fetchOptions();
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idLaptop]);

  // ✅ sanitize tên file
  const sanitizeFileName = (s = "") =>
    String(s).replace(/[\\/:*?"<>|]/g, "_").replace(/\s+/g, "_").slice(0, 80);

  // ✅ ưu tiên idSeri (chuẩn BE bạn hay trả)
  const pickSeriCode = (s) => s?.idSeri || s?.maSeri || s?.seriCode || s?.code || s?.tenSeri || s?.id || "";

  // ✅ Tải ZIP QR cho 1 biến thể (idLaptopCt)
  const downloadAllQrForLaptopCt = async (idLaptopCt, labelForFile = "") => {
    const toastId = toast.loading("Đang tạo ZIP QR…");
    try {
      setDownloadingId(idLaptopCt);

      const res = await getSeriByLaptopCt(idLaptopCt);
      const list = res?.data?.data || res?.data || [];
      const seris = Array.isArray(list) ? list : [];

      if (!seris.length) {
        toast.update(toastId, {
          render: "Biến thể này chưa có seri.",
          type: "warning",
          isLoading: false,
          autoClose: 2000,
        });
        return;
      }

      const zip = new JSZip();
      const folderName = sanitizeFileName(labelForFile || `LaptopCT_${idLaptopCt}`);
      const folder = zip.folder(folderName);

      // ✅ thêm seri.txt
      folder.file("seri.txt", seris.map((s) => pickSeriCode(s)).filter(Boolean).join("\n"));

      // ✅ generate QR từng seri -> PNG
      for (let i = 0; i < seris.length; i++) {
        const code = pickSeriCode(seris[i]);
        if (!code) continue;

        const dataUrl = await QRCode.toDataURL(code, {
          width: 512,
          margin: 1,
          errorCorrectionLevel: "M",
        });

        const base64 = dataUrl.split(",")[1];
        folder.file(`${sanitizeFileName(code)}.png`, base64, { base64: true });

        if ((i + 1) % 20 === 0 || i === seris.length - 1) {
          toast.update(toastId, {
            render: `Đang tạo QR… (${i + 1}/${seris.length})`,
            type: "info",
            isLoading: true,
          });
        }
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const today = new Date().toISOString().slice(0, 10);
      saveAs(blob, `QR_${folderName}_${today}.zip`);

      toast.update(toastId, {
        render: `Đã tải ZIP QR (${seris.length} seri).`,
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });
    } catch (e) {
      console.error(e);
      toast.update(toastId, {
        render: "Không tải được QR seri (lỗi tạo ZIP/QR).",
        type: "error",
        isLoading: false,
        autoClose: 2500,
      });
    } finally {
      setDownloadingId(null);
    }
  };

  // ✅ danh sách hiển thị sau khi search + filter
  const filteredVariants = useMemo(() => {
    const text = searchText.trim().toLowerCase();

    const matchText = (val) => String(val ?? "").toLowerCase().includes(text);
    const eqNorm = (a, b) =>
      String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();

    return variants.filter((v) => {
      const okSearch =
        !text ||
        matchText(v.id) ||
        matchText(v.idLaptopCT) ||
        matchText(v.ram) ||
        matchText(v.ssd) ||
        matchText(v.cpu) ||
        matchText(v.doHoa) ||
        matchText(v.mauSac);

      const okRam = !filters.ram || eqNorm(v.ram, filters.ram);
      const okSsd = !filters.ssd || eqNorm(v.ssd, filters.ssd);
      const okDoHoa = !filters.doHoa || eqNorm(v.doHoa, filters.doHoa);
      const okMau = !filters.mauSac || eqNorm(v.mauSac, filters.mauSac);

      return okSearch && okRam && okSsd && okDoHoa && okMau;
    });
  }, [variants, searchText, filters]);

  const columns = [
    {
      title: "STT",
      width: 60,
      render: (_v, _r, index) => index + 1,
    },
    {
      title: "Ảnh",
      dataIndex: "anhUrl",
      width: 90,
      render: (url) =>
        url ? (
          <img
            src={url}
            alt="Ảnh biến thể"
            style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 4 }}
          />
        ) : (
          <span style={{ color: "#aaa" }}>(Chưa có)</span>
        ),
    },
    {
      title: "Mã biến thể",
      dataIndex: "idLaptopCT",
      width: 160,
      render: (val) => val || <span style={{ color: "#aaa" }}>(Chưa gán mã)</span>,
    },
    { title: "RAM", dataIndex: "ram", width: 100 },
    { title: "SSD", dataIndex: "ssd", width: 100 },
    { title: "CPU", dataIndex: "cpu", width: 180 },
    { title: "Đồ họa", dataIndex: "doHoa", width: 180 },
    { title: "Màu sắc", dataIndex: "mauSac", width: 120 },
    {
      title: "Giá bán",
      dataIndex: "giaBan",
      width: 140,
      render: (val) =>
        val != null ? `${Number(val).toLocaleString("vi-VN")} ₫` : <span style={{ color: "#aaa" }}>-</span>,
    },
    {
      title: "Số lượng seri",
      dataIndex: "soLuongSeri",
      width: 130,
      align: "center",
      render: (val) => val ?? 0,
    },
    {
      title: "Trạng thái",
      dataIndex: "trangThai",
      width: 110,
      render: (val) => (val === 1 ? <Tag color="green">Kinh doanh</Tag> : <Tag color="red">Ngừng</Tag>),
    },
    {
      title: "Mô tả",
      dataIndex: "moTa",
      width: 260,
      render: (val) => val || <span style={{ color: "#aaa" }}>(Không có)</span>,
    },
    {
      title: "Hành động",
      fixed: "right",
      width: 320,
      render: (_, record) => (
        <Space>
          {!isEmployee && (
            <Button icon={<EditOutlined />} type="text" onClick={() => navigate(`/admin/lap-top-ct/edit/${record.id}`)} />
          )}

          {!isEmployee && (
            <Button
              icon={<PictureOutlined />}
              type="text"
              title="Quản lý ảnh"
              onClick={() => {
                setCurrentLaptopCtId(record.id);
                setOpenAnhModal(true);
              }}
            />
          )}

          {!isEmployee && (
            <Button
              icon={<PlusOutlined />}
              type="text"
              title="Thêm seri"
              onClick={() => {
                setCurrentLaptopCtId(record.id);
                setOpenSeriModal(true);
              }}
            />
          )}

          <Button
            icon={<QrcodeOutlined />}
            type="text"
            title="Danh sách seri & QR"
            onClick={() => {
              setCurrentLaptopCtId(record.id);
              setOpenSeriListModal(true);
            }}
          />

          <Button
            icon={<DownloadOutlined />}
            type="text"
            title="Tải tất cả QR seri (ZIP)"
            loading={downloadingId === record.id}
            onClick={() => downloadAllQrForLaptopCt(record.id, record.idLaptopCT || `LaptopCT_${record.id}`)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2>Danh sách biến thể Laptop</h2>

      <Space style={{ marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <Button icon={<ReloadOutlined />} onClick={fetchData} style={{ background: "#FFD700", color: "#000" }}>
          Làm mới
        </Button>

        <Button onClick={() => navigate("/admin/lap-top")}>Quay lại danh sách laptop</Button>

        {!isEmployee && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(`/admin/lap-top-ct/add/${idLaptop}`)}>
            Thêm biến thể
          </Button>
        )}
      </Space>

      {/* ✅ SEARCH + FILTER UI (merge từ bản 1) */}
      <Space style={{ marginBottom: 16, flexWrap: "wrap", gap: 12 }} size="middle">
        <Input
          placeholder="Tìm theo ID, mã biến thể, RAM, SSD, CPU, đồ họa, màu sắc..."
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 360 }}
        />

        <Select
          placeholder="RAM"
          style={{ width: 160 }}
          allowClear
          value={filters.ram || undefined}
          onChange={(val) => setFilters((p) => ({ ...p, ram: val || "" }))}
        >
          {ramList
            .map((i) => {
              const label = pickLabel(i, ["dungLuongRam", "idLoaiRam", "tenRam", "ten"]);
              if (!label) return null;
              const key = i?.id ?? i?.idLoaiRam ?? label;
              return (
                <Option key={String(key)} value={label}>
                  {label}
                </Option>
              );
            })
            .filter(Boolean)}
        </Select>

        <Select
          placeholder="SSD"
          style={{ width: 160 }}
          allowClear
          value={filters.ssd || undefined}
          onChange={(val) => setFilters((p) => ({ ...p, ssd: val || "" }))}
        >
          {ssdList
            .map((i) => {
              const label = pickLabel(i, ["dungLuongSsd", "idSsd", "tenSsd", "ten"]);
              if (!label) return null;
              const key = i?.id ?? i?.idSsd ?? label;
              return (
                <Option key={String(key)} value={label}>
                  {label}
                </Option>
              );
            })
            .filter(Boolean)}
        </Select>

        <Select
          placeholder="Đồ họa"
          style={{ width: 220 }}
          allowClear
          value={filters.doHoa || undefined}
          onChange={(val) => setFilters((p) => ({ ...p, doHoa: val || "" }))}
        >
          {doHoaList.map((i) => {
            const label = pickLabel(i, ["tenDayDu", "tenDohoa", "ten", "name", "idDohoa"]);
            if (!label) return null;
            return (
              <Option key={String(i?.id ?? label)} value={String(label)}>
                {label}
              </Option>
            );
          })}
        </Select>

        <Select
          placeholder="Màu sắc"
          style={{ width: 160 }}
          allowClear
          value={filters.mauSac || undefined}
          onChange={(val) => setFilters((p) => ({ ...p, mauSac: val || "" }))}
        >
          {mauSacList.map((i) => {
            const label = pickLabel(i, ["tenMauSac", "ten", "name"]);
            if (!label) return null;
            return (
              <Option key={String(i?.id ?? label)} value={String(label)}>
                {label}
              </Option>
            );
          })}
        </Select>

        <Button
          onClick={() =>
            confirmCentered({
              title: "Xóa bộ lọc?",
              content: "Bạn có chắc muốn xóa toàn bộ bộ lọc và ô tìm kiếm không?",
              onOk: () => {
                setSearchText("");
                setFilters({ ram: "", ssd: "", doHoa: "", mauSac: "" });
                toast.info("Đã xóa bộ lọc.");
              },
            })
          }
        >
          Xóa lọc
        </Button>
      </Space>

      <Table
        rowKey="id"
        dataSource={filteredVariants}
        columns={columns}
        loading={loading}
        bordered
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1200 }}
        locale={{ emptyText: "Chưa có dữ liệu biến thể" }}
      />

      {/* MODAL THÊM SERI */}
      <Modal
        open={openSeriModal}
        onCancel={() => setOpenSeriModal(false)}
        footer={null}
        width={900}
        destroyOnClose
        title="Quản lý Serial Numbers"
      >
        {currentLaptopCtId && (
          <AddSeriComponent
            idLaptopCt={currentLaptopCtId}
            onClose={() => {
              setOpenSeriModal(false);
              fetchData();
            }}
          />
        )}
      </Modal>

      {/* MODAL QUẢN LÝ ẢNH */}
      <Modal
        open={openAnhModal}
        onCancel={() => setOpenAnhModal(false)}
        footer={null}
        width={900}
        destroyOnClose
        title="Quản lý ảnh biến thể"
      >
        {currentLaptopCtId && (
          <AddAnhComponent
            idLaptopCt={currentLaptopCtId}
            onClose={() => {
              setOpenAnhModal(false);
              fetchData(); // ✅ đóng modal ảnh xong refresh thumbnail luôn
            }}
          />
        )}
      </Modal>

      {/* MODAL DANH SÁCH SERI & QR */}
      <Modal
        open={openSeriListModal}
        onCancel={() => setOpenSeriListModal(false)}
        footer={null}
        width={900}
        destroyOnClose
        title="Danh sách Serial Numbers & QR"
      >
        {currentLaptopCtId && <ListSeriComponent idLaptopCt={currentLaptopCtId} />}
      </Modal>
    </div>
  );
};

export default ListLaptopCTComponent;
