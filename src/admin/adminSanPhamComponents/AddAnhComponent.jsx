import React, { useEffect, useRef, useState } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  message,
  Table,
  Image,
} from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";
import {
  getAnhByLaptopCt,
  uploadAnh,
  updateAnh,
} from "../../service/AnhService";

// ✅ chuẩn hoá url + chống cache
const normalizeImgUrl = (url) => {
  if (!url) return null;
  let u = String(url).trim().replaceAll("\\", "/");
  // cloudinary http -> https (tránh mixed content)
  if (u.startsWith("http://res.cloudinary.com/")) {
    u = u.replace("http://", "https://");
  }
  return u;
};

const bustCache = (src) =>
  src ? `${src}${src.includes("?") ? "&" : "?"}v=${Date.now()}` : null;


// nhận props giống AddSeri: idLaptopCt + onClose
const AddAnhComponent = ({ idLaptopCt: propIdLaptopCt, onClose }) => {
  const params = useParams();
  const navigate = useNavigate();
  const idLaptopCt = propIdLaptopCt || params.idLaptopCt;

  const [listAnh, setListAnh] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [uploading, setUploading] = useState(false);

  // lưu nhiều file mới chọn
  const [newFiles, setNewFiles] = useState([]);

  // input file ẩn dùng cho nút "Đổi ảnh"
  const hiddenFileInputRef = useRef(null);
  const [editingAnh, setEditingAnh] = useState(null); // {id, idAnh}

  // ===== Load list ảnh hiện tại =====
  const fetchList = async () => {
    if (!idLaptopCt) return;
    setLoadingList(true);
    try {
      const res = await getAnhByLaptopCt(idLaptopCt);
      const data = res?.data?.data || res?.data || [];
      setListAnh(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Lỗi load ảnh:", e);
      message.error("Không tải được danh sách ảnh.");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (!idLaptopCt) {
      message.error("Không tìm thấy idLaptopCt.");
      if (onClose) onClose();
      else navigate(-1);
      return;
    }
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idLaptopCt]);

  // ===== Chọn file mới (thêm) =====
  const handleChooseNewFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setNewFiles(files);
  };

  // ===== Upload các file mới =====
  const handleUploadNew = async () => {
    if (!newFiles.length) {
      return message.warning("Vui lòng chọn ít nhất một ảnh.");
    }

    try {
      setUploading(true);
      for (const file of newFiles) {
        await uploadAnh(idLaptopCt, file);
      }
      message.success("Upload ảnh thành công.");
      setNewFiles([]);
      // clear input
      const input = document.getElementById("upload-new-images");
      if (input) input.value = "";
      fetchList();
    } catch (e) {
      console.error("Lỗi upload ảnh:", e);
      message.error("Upload ảnh thất bại.");
    } finally {
      setUploading(false);
    }
  };

  // ===== Đổi ảnh: mở input ẩn =====
  const handleClickChangeImage = (record) => {
    setEditingAnh({ id: record.id, idAnh: record.idAnh });
    if (hiddenFileInputRef.current) {
      hiddenFileInputRef.current.value = "";
      hiddenFileInputRef.current.click();
    }
  };

  // ===== Khi chọn file để đổi ảnh =====
  const handleChangeImageFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !editingAnh) return;

    try {
      setUploading(true);
      await updateAnh(editingAnh.id, file, editingAnh.idAnh);
      message.success("Cập nhật ảnh thành công.");
      setEditingAnh(null);
      fetchList();
    } catch (err) {
      console.error("Lỗi cập nhật ảnh:", err);
      message.error("Cập nhật ảnh thất bại.");
    } finally {
      setUploading(false);
    }
  };

  // ===== Bảng list ảnh =====
  const columns = [
    {
      title: "STT",
      width: 70,
      align: "center",
      render: (_v, _r, index) => index + 1,
    },
    {
      title: "Mã ảnh",
      dataIndex: "idAnh",
      width: 140,
    },
    {
  title: "Ảnh",
  dataIndex: "imgURL",
  width: 160,
  render: (url) => {
    const src = normalizeImgUrl(url);
    return src ? (
      <Image
        src={bustCache(src)}   // ✅ chống cache khi update
        width={80}
        height={80}
        style={{ objectFit: "cover" }}
      />
    ) : (
      <span style={{ color: "#aaa" }}>(Chưa có)</span>
    );
  },
},
    {
      title: "URL",
      dataIndex: "imgURL",
      render: (url) => (
        <span style={{ wordBreak: "break-all", fontSize: 12 }}>{url}</span>
      ),
    },
    {
      title: "Hành động",
      width: 110,
      align: "center",
      render: (_, record) => (
        <Button
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleClickChangeImage(record)}
        >
          Đổi ảnh
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, display: "flex", justifyContent: "center" }}>
      <Card
        title="Quản lý ảnh biến thể"
        style={{ width: "100%", maxWidth: 900 }}
      >
        {/* Thông tin biến thể */}
        <Row style={{ marginBottom: 16 }}>
          <Col span={24}>
            <h4>Thông tin biến thể:</h4>
            <div>
              <b>ID biến thể:</b> {idLaptopCt}
            </div>
            <div>
              <b>Số ảnh hiện có:</b> {listAnh.length}
            </div>
          </Col>
        </Row>

        {/* Chọn ảnh mới để thêm */}
        <Row style={{ marginBottom: 16 }} gutter={12}>
          <Col span={18}>
            <div style={{ marginBottom: 4 }}>Chọn ảnh mới để thêm:</div>
            <input
              id="upload-new-images"
              type="file"
              accept="image/*"
              multiple
              onChange={handleChooseNewFiles}
            />
            {newFiles.length > 0 && (
              <div style={{ marginTop: 8, fontSize: 12, color: "#555" }}>
                Đã chọn <b>{newFiles.length}</b> ảnh.
              </div>
            )}
          </Col>
          <Col
            span={6}
            style={{ display: "flex", alignItems: "flex-end", marginTop: 4 }}
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleUploadNew}
              loading={uploading}
              style={{ width: "100%" }}
            >
              Upload ảnh
            </Button>
          </Col>
        </Row>

        {/* Danh sách ảnh */}
        <Row style={{ marginBottom: 8 }}>
          <Col span={24}>
            <h4>Danh sách ảnh:</h4>
          </Col>
        </Row>

        <Table
          rowKey={(r) => r.id}
          dataSource={listAnh}
          columns={columns}
          loading={loadingList}
          size="small"
          bordered
          pagination={false}
          locale={{ emptyText: "Chưa có ảnh nào" }}
        />

        <div style={{ textAlign: "right", marginTop: 16 }}>
          <Button
            onClick={() => {
              if (onClose) onClose();
              else navigate(-1);
            }}
            style={{ marginRight: 8 }}
          >
            Đóng
          </Button>
        </div>

        {/* input ẩn dùng để chọn file khi bấm "Đổi ảnh" */}
        <input
          type="file"
          accept="image/*"
          ref={hiddenFileInputRef}
          style={{ display: "none" }}
          onChange={handleChangeImageFile}
        />
      </Card>
    </div>
  );
};

export default AddAnhComponent;
