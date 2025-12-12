// src/components/QrScannerModal.jsx
import React, { useEffect, useRef } from "react";
import QrScanner from "qr-scanner";

// Fix warning Canvas2D
QrScanner.DEFAULT_CANVAS_2D_CONTEXT_ATTRIBUTES = { willReadFrequently: true };

const QrScannerModal = ({ onScan, onClose }) => {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  // CHỐNG TRÙNG 100% – chỉ cho phép 1 lần quét trong 1500ms
  const lastScannedRef = useRef({ code: "", time: 0 });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const qrScanner = new QrScanner(
      video,
      (result) => {
        const code = result.data.trim().toUpperCase();
        const now = Date.now();

        // Nếu cùng 1 seri trong vòng 1.5 giây → bỏ qua
        if (code === lastScannedRef.current.code && now - lastScannedRef.current.time < 1500) {
          return;
        }

        // Cập nhật lần quét mới
        lastScannedRef.current = { code, time: now };

        // Gọi xử lý thêm seri
        onScan(code);

        // Tự động đóng modal sau khi quét thành công (như bạn muốn)
        setTimeout(onClose, 500);
      },
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
        maxScansPerSecond: 30,
        preferredCamera: "environment",
        // Tăng độ nhạy + vùng quét nhỏ hơn
        calculateScanRegion: (video) => {
          const size = Math.min(video.videoWidth, video.videoHeight) * 0.65;
          return {
            x: (video.videoWidth - size) / 2,
            y: (video.videoHeight - size) / 2,
            width: size,
            height: size,
          };
        },
      }
    );

    qrScanner.start();
    scannerRef.current = qrScanner;

    return () => {
      qrScanner.stop();
      qrScanner.destroy();
    };
  }, [onScan, onClose]);

  const handleClose = () => {
    scannerRef.current?.stop();
    scannerRef.current?.destroy();
    onClose();
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999}} onClick={handleClose}>
      <div style={{background:"#fff",borderRadius:20,width:380,maxWidth:"92%",padding:"20px 16px 16px",position:"relative",boxShadow:"0 20px 60px rgba(0,0,0,0.5)"}} onClick={e=>e.stopPropagation()}>
        <button onClick={handleClose} style={{position:"absolute",top:10,right:10,width:40,height:40,borderRadius:"50%",background:"#fff",border:"2px solid #ddd",fontSize:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",zIndex:10}}>
          ×
        </button>

        <h3 style={{textAlign:"center",margin:"0 0 16px",fontSize:"1.25rem",color:"#212529",fontWeight:600}}>
          Quét mã QR Seri
        </h3>

        <div style={{position:"relative"}}>
          <video
            ref={videoRef}
            style={{width:"100%",height:380,borderRadius:16,border:"6px solid #12b886",background:"#000"}}
          />
          {/* Khung quét nhỏ ở giữa */}
          <div style={{position:"absolute",top:"50%",left:"50%",width:200,height:200,border:"3px solid rgba(255,255,255,0.9)",borderRadius:16,boxShadow:"0 0 0 9999px rgba(0,0,0,0.5)",transform:"translate(-50%,-50%)",pointerEvents:"none"}} />
        </div>

        <p style={{textAlign:"center",marginTop:16,color:"#12b886",fontWeight:600,fontSize:"0.95rem"}}>
          Đưa mã vào khung – quét xong tự đóng
        </p>
      </div>
    </div>
  );
};

export default QrScannerModal;