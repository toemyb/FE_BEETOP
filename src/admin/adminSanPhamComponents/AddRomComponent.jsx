import React, {useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { addRom, getAllById, updateRom } from '../../service/RomService'
const AddRomComponent = () => {
    const [idSsd, setidSsd] = useState('');
    const [dungLuongSsd, setdungLuongSsd] = useState('');
    const [loaiSsd, setloaiSsd] = useState('');
    const [tocDoDoc, settocDoDoc] = useState('');
    const [tocDoGhi, settocDoGhi] = useState('');
    const [moTa, setMoTa] = useState('');
    const [trangThai, setTrangThai] = useState('');
    
    const { id } = useParams();
    const navigator = useNavigate();

    useEffect(() => {
        if (id) {
            getAllById(id)
            .then((response) => {
              const doHoa = response.data.data;
              setidSsd(doHoa.idSsd);
              setdungLuongSsd(doHoa.dungLuongSsd);
              setloaiSsd(doHoa.loaiSsd);
              settocDoDoc(doHoa.tocDoDoc);
              settocDoGhi(doHoa.tocDoGhi);
              setMoTa(doHoa.moTa);
              setTrangThai(doHoa.trangThai);
            })
            .catch((error) => {
              console.error("Lỗi khi lấy dữ liệu Đồ Họa:", error);
            });
        }
      }, [id]);


    function pageTitle() {

        if (id) {

            return <h2 className='text-center'>Update Employee</h2>
        } else {

            return <h2 className='text-center'>Add Employee</h2>
        }


    }
    
    function saveOrUpdateDohoa(e) {


        e.preventDefault();

        const doHoa = {
            idSsd,
            dungLuongSsd,
            loaiSsd,
            tocDoDoc,
            tocDoGhi,
            moTa,
            trangThai }
        console.log(doHoa)


        if (id) {

            const doHoa = {
                id: id,
                idSsd,
                dungLuongSsd,
                loaiSsd,
                tocDoDoc,
                tocDoGhi,
                moTa,
                trangThai
              };
              
              if (id) {
                updateRom(doHoa)
                  .then((response) => {
                    console.log("Cập nhật thành công:", response.data);
                    navigator('/admin/rom');
                  })
                  .catch((error) => {
                    console.error("Lỗi khi cập nhật:", error);
                  });
              }
        } else {

          addRom(doHoa).then((response) => {


                console.log(response.data);
                navigator('/admin/rom')

            }).catch(error => {

                console.error(error)
            })

        }



    }



  return (
<div className='container'>
  <div className='row'>
    <div className="card col-md-6 offset-md-3 offset-md-3">
      {pageTitle()}
      <div className='card-body'>
        <form>

          <div className='form-group mb-2'>
            <label className='form-label'>Mã Đồ Họa</label>
            <input
              type='text'
              className='form-control'
              name='idSsd'
              value={idSsd}
              onChange={(e) => setidSsd(e.target.value)}
            />
          </div>

          <div className='form-group mb-2'>
            <label className='form-label'>Hãng Card Onboard</label>
            <input
              type='text'
              className='form-control'
              name='dungLuongSsd'
              value={dungLuongSsd}
              onChange={(e) => setdungLuongSsd(e.target.value)}
            />
          </div>

          <div className='form-group mb-2'>
            <label className='form-label'>Model Card Onboard</label>
            <input
              type='text'
              className='form-control'
              name='loaiSsd'
              value={loaiSsd}
              onChange={(e) => setloaiSsd(e.target.value)}
            />
          </div>

          <div className='form-group mb-2'>
            <label className='form-label'>Tên Đầy Đủ</label>
            <input
              type='text'
              className='form-control'
              name='tocDoDoc'
              value={tocDoDoc}
              onChange={(e) => settocDoDoc(e.target.value)}
            />
          </div>

          <div className='form-group mb-2'>
            <label className='form-label'>Loại Card</label>
            <input
              type='text'
              className='form-control'
              name='tocDoGhi'
              value={tocDoGhi}
              onChange={(e) => settocDoGhi(e.target.value)}
            />
          </div>

          <div className='form-group mb-2'>
            <label className='form-label'>Mô Tả</label>
            <input
              type='text'
              className='form-control'
              name='moTa'
              value={moTa}
              onChange={(e) => setMoTa(e.target.value)}
            />
          </div>

          <div className='form-group mb-2'>
            <label className='form-label'>Trạng Thái</label>
            <select
              className='form-control'
              name='trangThai'
              value={trangThai}
              onChange={(e) => setTrangThai(e.target.value)}
            >
              <option value={1}>Hiện</option>
              <option value={0}>Ẩn</option>
            </select>
          </div>

          <button className='btn btn-success' onClick={saveOrUpdateDohoa}>
            Submit
          </button>
        </form>
      </div>
    </div>
  </div>
</div>
    
  )
}
export default AddRomComponent