import { useNavigate, useParams } from 'react-router-dom'
import React, { useEffect, useState } from 'react'
import { addEmployee, getVoucher, updateVoucher,checkMaTrung } from '../../service/PhieuGiamGiaService'

const PhieuGiamGiaComponent = () => {


    const [idPhieugiamgia, setidPhieugiamgia] = useState('')
    const [ten, setten] = useState('')
    const [soLuong, setsoLuong] = useState('')
    const [kieuGiamGia, setkieuGiamGia] = useState('')
    const [giaTriGiam, setgiaTriGiam] = useState('')
    const [ngayBatDau, setngayBatDau] = useState('')
    const [ngayKetThuc, setngayKetThuc] = useState('')
    const [giaTriMin, setgiaTriMin] = useState('')
    const [giaTriMax, setgiaTriMax] = useState('')
    const [moTa, setmoTa] = useState('')
    const [errors, setErrors] = useState({});



    const { idPhieugiamgia: paramid } = useParams();

    const navigator = useNavigate();

    useEffect(() => {

        if (paramid) {

            getVoucher(paramid).then((respone) => {


                setidPhieugiamgia(respone.data.idPhieugiamgia)
                setten(respone.data.ten)
                setsoLuong(respone.data.soLuong)
                setkieuGiamGia(respone.data.kieuGiamGia)
                setgiaTriGiam(respone.data.giaTriGiam)
                setngayBatDau(respone.data.ngayBatDau)
                setngayKetThuc(respone.data.ngayKetThuc)
                setgiaTriMin(respone.data.giaTriMin)
                setgiaTriMax(respone.data.giaTriMax)
                setmoTa(respone.data.moTa)

            })


        }



    }, [paramid])


    function handleidPhieuGiamGia(v) {


        setidPhieugiamgia(v.target.value);

    }

    function handleTen(v) {


        setten(v.target.value);

    }

    function handleSoLuong(v) {


        setsoLuong(v.target.value);

    }

    function handleKieuGiamGia(v) {


        setkieuGiamGia(v.target.value);

    }

    function handleGiaTriGiam(v) {


        setgiaTriGiam(v.target.value);

    }

    function handleNgayBatDau(v) {


        setngayBatDau(v.target.value);

    }

    function handleNgayKetThuc(v) {


        setngayKetThuc(v.target.value);

    }


    function handleGiaTriMin(v) {


        setgiaTriMin(v.target.value);

    }

    function handleGiaTriMax(v) {


        setgiaTriMax(v.target.value);

    }

    function handleMoTa(v) {


        setmoTa(v.target.value);

    }



    const saveOrUpdateVoucher = async (v) => {


        v.preventDefault();


        const errors = await validateFields();
        if (Object.keys(errors).length > 0) {
            setErrors(errors);
            return;
        }

        setErrors({});



        const voucher = { idPhieugiamgia, ten, soLuong, kieuGiamGia, giaTriGiam, ngayBatDau, ngayKetThuc, giaTriMin, giaTriMax, moTa }
        console.log(voucher)

        if (paramid) {

            const isConfirmed = window.confirm("Bạn có muốn cập nhật phiếu giảm giá không?");

            if (!isConfirmed) return;

            updateVoucher(paramid, voucher)
                .then((respone) => {

                    console.log(respone.date);
                    navigator('/admin/phieu-giam-gia')



                }).catch(error => {
                    console.error(error);
                })


        } else {

            const isConfirmed = window.confirm("Bạn có chắc muốn thêm phiếu giảm giá không?");
            if (!isConfirmed) return;

            addEmployee(voucher).then((respone) => {


                console.log(respone.data)
                navigator('/admin/phieu-giam-gia')

            }).catch(error => {
                console.error(error);
            })

        }


    }



    function pageTitle() {

        if (paramid) {

            return <h2 className='text-center'>Update Voucher</h2>
        } else {

            return <h2 className='text-center'>Thêm phiếu giảm giá</h2>


        }

    }

    

    const validateFields = async () => {
        const newErrors = {};
        const today = new Date().toISOString().split('T')[0]; // yyyy-MM-dd
        



        // Validate trống
        if (!idPhieugiamgia.trim()) {
            newErrors.idPhieugiamgia = "Mã không được để trống";
        } else {
            try {
                const res = await checkMaTrung(idPhieugiamgia);
                if (res.data === true && !paramid) { // Chỉ check khi thêm mới
                    newErrors.idPhieugiamgia = "Mã phiếu đã tồn tại";
                }
            } catch (err) {
                console.error(err);
            }
          }

          


        if (!ten.trim()) newErrors.ten = "Tên không được để trống";
        if (!soLuong) newErrors.soLuong = "Số lượng không được để trống";
        if (!kieuGiamGia.trim()) newErrors.kieuGiamGia = "Kiểu giảm giá không được để trống";
        if (!giaTriGiam) newErrors.giaTriGiam = "Giá trị giảm không được để trống";
        if (!ngayBatDau) newErrors.ngayBatDau = "Ngày bắt đầu không được để trống";
        if (!ngayKetThuc) newErrors.ngayKetThuc = "Ngày kết thúc không được để trống";
        if (!giaTriMin) newErrors.giaTriMin = "Giá trị tối thiểu không được để trống";
        if (!giaTriMax) newErrors.giaTriMax = "Giá trị tối đa không được để trống";
        if (!moTa) newErrors.moTa = "Mô tả không được để trống";

        // Số lượng ≥ 1
        if (soLuong && parseInt(soLuong) < 1) {
            newErrors.soLuong = "Số lượng phải ≥ 1";
        }

        // Giá trị giảm > 0
        if (giaTriGiam && parseFloat(giaTriGiam) <= 0) {
            newErrors.giaTriGiam = "Giá trị giảm phải > 0";
        }

        // Ngày bắt đầu phải trước ngày kết thúc
        if (ngayBatDau && ngayKetThuc && ngayBatDau > ngayKetThuc) {
            newErrors.ngayBatDau = "Ngày bắt đầu phải trước ngày kết thúc";
            newErrors.ngayKetThuc = "Ngày kết thúc phải sau ngày bắt đầu";
        }

        // Ngày bắt đầu không được trong quá khứ
        if (ngayBatDau && ngayBatDau < today) {
            newErrors.ngayBatDau = "Ngày bắt đầu không được ở quá khứ";
        }

        // Giá trị tối thiểu và tối đa phải > 0
        if (giaTriMin && parseFloat(giaTriMin) <= 0) {
            newErrors.giaTriMin = "Giá trị tối thiểu phải > 0";
        }
        if (giaTriMax && parseFloat(giaTriMax) <= 0) {
            newErrors.giaTriMax = "Giá trị tối đa phải > 0";
        }

        // Giá trị tối thiểu phải nhỏ hơn giá trị tối đa
        if (giaTriMin && giaTriMax && parseFloat(giaTriMin) >= parseFloat(giaTriMax)) {
            newErrors.giaTriMin = "Giá trị tối thiểu phải nhỏ hơn giá trị tối đa";
        }

        return newErrors;
      };



    return (


        <div className='container'>

            <div className='row'>

                <div className='card col-md-6 offset-md-3 offset-md-3 '>

                    {

                        pageTitle()
                    }

                    <div className='card-body'>

                        <form>


                            <div className='form-group mb-2'>

                                <label className='form-label'>Mã</label>
                                <input type='text' className='form-control' name='idPhieugiamgia' value={idPhieugiamgia} onChange={handleidPhieuGiamGia}></input>
                                {errors.idPhieugiamgia && <div className="text-danger">{errors.idPhieugiamgia}</div>}

                            </div>

                            <div className='form-group mb-2'>

                                <label className='form-label'>Tên</label>
                                <input type='text' className='form-control' name='ten' value={ten} onChange={handleTen}></input>
                                {errors.ten && <div className="text-danger">{errors.ten}</div>}

                            </div>


                            <div className='form-group mb-2'>

                                <label className='form-label'>Số lượng</label>
                                <input type='text' className='form-control' name='soLuong' value={soLuong} onChange={handleSoLuong}></input>
                                {errors.soLuong && <div className="text-danger">{errors.soLuong}</div>}

                            </div>

                            <div className='form-group mb-2'>

                                <label className='form-label'>Kiểu giảm giá</label>
                                <input type='text' className='form-control' name='kieuGiamGia' value={kieuGiamGia} onChange={handleKieuGiamGia}></input>
                                {errors.kieuGiamGia && <div className="text-danger">{errors.kieuGiamGia}</div>}
                            </div>

                            <div className='form-group mb-2'>

                                <label className='form-label'>Giá trị giảm</label>
                                <input type='text' className='form-control' name='giaTriGiam' value={giaTriGiam} onChange={handleGiaTriGiam}></input>
                                {errors.giaTriGiam && <div className="text-danger">{errors.giaTriGiam}</div>}
                            </div>

                            <div className='form-group mb-2'>

                                <label className='form-label'>Ngày bắt đầu</label>
                                <input type='date' className='form-control' name='ngayBatDau' value={ngayBatDau} onChange={handleNgayBatDau}></input>
                                {errors.ngayBatDau && <div className="text-danger">{errors.ngayBatDau}</div>}
                            </div>

                            <div className='form-group mb-2'>

                                <label className='form-label'>Ngày kết thúc</label>
                                <input type='date' className='form-control' name='ngayKetThuc' value={ngayKetThuc} onChange={handleNgayKetThuc}></input>
                                {errors.ngayKetThuc && <div className="text-danger">{errors.ngayKetThuc}</div>}
                            </div>

                            <div className='form-group mb-2'>

                                <label className='form-label'>Giá trị tối thiểu</label>
                                <input type='text' className='form-control' name='giaTriMin' value={giaTriMin} onChange={handleGiaTriMin}></input>
                                {errors.giaTriMin && <div className="text-danger">{errors.giaTriMin}</div>}
                            </div>

                            <div className='form-group mb-2'>

                                <label className='form-label'>Giá trị tối đa</label>
                                <input type='text' className='form-control' name='giaTriMax' value={giaTriMax} onChange={handleGiaTriMax}></input>
                                {errors.giaTriMax && <div className="text-danger">{errors.giaTriMax}</div>}
                            </div>

                            <div className='form-group mb-2'>

                                <label className='form-label'>Mô tả</label>
                                <input type='text' className='form-control' name='moTa' value={moTa} onChange={handleMoTa}></input>
                                {errors.moTa && <div className="text-danger">{errors.moTa}</div>}
                            </div>


                            <button className='btn btn-success' onClick={saveOrUpdateVoucher}>Xác nhận</button>

                        </form>

                    </div>


                </div>


            </div>


        </div>



    )



}

export default PhieuGiamGiaComponent