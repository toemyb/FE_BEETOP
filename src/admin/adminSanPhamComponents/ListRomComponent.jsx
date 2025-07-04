import React, { useState,useEffect } from 'react'
import { listRom} from '../../service/RomService'
import { useNavigate } from 'react-router-dom'
import { Button } from 'antd'


const ListRomComponent = () => {
const[dohoa,setListdoHoa] = useState([])

const navigator = useNavigate();

    useEffect(() => {

      listRom().then((response) => {
        console.log('API trả về:', response.data);
        setListdoHoa(response.data.content);
    }).catch(error => {

        console.error(error);
    })

}, [])

function addNewRom(){
  navigator('/admin/add-rom')
}
function updateRom(id) {


  navigator(`/admin/update-rom/${id}`)


}
  return (
  
    <div>
    <button onClick={addNewRom}>Add</button>
    <table className="table table-striped">
      <thead>
        <tr>
          <th>STT</th>
          <th>Mã Rom</th>
          <th>Dung lượng ssd</th>
          <th>Loại ssd</th>
          <th>Tốc độ đọc </th>
          <th>Tốc độ ghi</th>
          <th>Mô tả</th>
          <th>Trạng thái</th>
          <th>Hành động</th>
        </tr>
      </thead>
      <tbody>
        {
          dohoa.map((item, index) => (
            <tr key={item.id}>
              <td>{index + 1}</td>
              <td>{item.idSsd}</td>
              <td>{item.dungLuongSsd}</td>
              <td>{item.loaiSsd}</td>
              <td>{item.tocDoDoc}</td>
              <td>{item.tocDoGhi}</td>
              <td>{item.moTa}</td>
              <td>{item.trangThai === 1 ? "Hoạt động" : "Ngưng"}</td>
              <td>
                <button
                  className="btn btn-warning"
                  onClick={() => updateRom(item.id)}
                >
                  Update
                </button>
              </td>
            </tr>
          ))
        }
      </tbody>
    </table>
  </div>
  

  )
}
export default ListRomComponent