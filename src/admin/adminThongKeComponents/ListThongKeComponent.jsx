import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Progress, Table, Tag, Button, Space, Spin, message, DatePicker, Tabs, Modal } from 'antd'
import {
  UserOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  RiseOutlined,
  TeamOutlined,
  WalletOutlined,
  TrophyOutlined,
  ShopOutlined,
  GlobalOutlined,
} from '@ant-design/icons'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getThongKeTongQuan, getThongKe12Thang, getThongKeTheoThang, getThongKeSoSanhHaiNgay } from '../../service/ThongKeService'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

const ListThongKeComponent = () => {
  const [loading, setLoading] = useState(true);
  const [thongKeData, setThongKeData] = useState(null);
  const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [activeTabKey, setActiveTabKey] = useState('all');
  const [timeFilter, setTimeFilter] = useState('month'); // 'day', 'month', 'year'
  const [chartLoading, setChartLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState('day'); // 'day', 'month', 'year'
  const [tempDateRange, setTempDateRange] = useState([null, null]);
  const [monthlyChartDataFromAPI, setMonthlyChartDataFromAPI] = useState(null);
  const [selectedYears, setSelectedYears] = useState({ nam1: dayjs().year() - 1, nam2: dayjs().year() });
  const [monthlyDayComparisonData, setMonthlyDayComparisonData] = useState(null);
  const [selectedMonths, setSelectedMonths] = useState({ thang1: null, thang2: null });
  const [dailyComparisonData, setDailyComparisonData] = useState(null);
  const [selectedDays, setSelectedDays] = useState({ ngay1: null, ngay2: null });
  const [top10Laptops, setTop10Laptops] = useState({ 
    period1: [], 
    period2: [], 
    label1: '', 
    label2: '' 
  });

  useEffect(() => {
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || 'null');
      if (!user || !['ADMIN', 'NHAN_VIEN'].includes(user.role)) {
        console.warn('User không có quyền truy cập trang thống kê');
      }
    } catch (error) {
      console.error('Lỗi khi kiểm tra quyền:', error);
    }
    
    // Gọi API lấy thống kê - chỉ load 1 lần khi mount
    fetchThongKe();
    
    // Load dữ liệu biểu đồ mặc định cho tháng (năm hiện tại và năm trước)
    fetchDefaultMonthlyData();
  }, []);

  // Load dữ liệu biểu đồ mặc định
  const fetchDefaultMonthlyData = async () => {
    try {
      // Load dữ liệu so sánh 2 tháng (tháng trước và tháng hiện tại)
      const currentMonth = dayjs();
      const previousMonth = dayjs().subtract(1, 'month');
      
      const nam1 = previousMonth.year();
      const thang1Num = previousMonth.month() + 1; // dayjs month is 0-based
      const nam2 = currentMonth.year();
      const thang2Num = currentMonth.month() + 1; // dayjs month is 0-based
      
      try {
        const monthResponse = await getThongKeTheoThang(nam1, thang1Num, nam2, thang2Num);
        
        if (monthResponse.data && Array.isArray(monthResponse.data)) {
          // Map dữ liệu từ API sang format cho biểu đồ
          const mappedMonthData = monthResponse.data.map(item => ({
            period: `Ngày ${item.label}`,
            thang1: item.value1 || 0,
            thang2: item.value2 || 0,
            day: item.label
          }));
          
          setMonthlyDayComparisonData(mappedMonthData);
          setSelectedMonths({ 
            thang1: previousMonth.format('MM/YYYY'), 
            thang2: currentMonth.format('MM/YYYY') 
          });
          
          // Tổng hợp top 10 laptop từ tất cả các ngày của cả 2 tháng
          const allLaptops1 = new Map();
          const allLaptops2 = new Map();
          
          console.log('Default month data:', monthResponse.data);
          
          monthResponse.data.forEach((item, index) => {
            console.log(`Default month item ${index}:`, item);
            console.log(`Default month item ${index} topLaptop1:`, item.topLaptop1);
            console.log(`Default month item ${index} topLaptop2:`, item.topLaptop2);
            
            // Tổng hợp cho tháng 1
            if (item.topLaptop1 && Array.isArray(item.topLaptop1) && item.topLaptop1.length > 0) {
              item.topLaptop1.forEach(laptop => {
                if (laptop && laptop.idLaptop) {
                  const existing = allLaptops1.get(laptop.idLaptop);
                  if (existing) {
                    existing.soLuongBan += laptop.soLuongBan || 0;
                  } else {
                    allLaptops1.set(laptop.idLaptop, {
                      idLaptop: laptop.idLaptop,
                      tenSanPham: laptop.tenSanPham || 'N/A',
                      soLuongBan: laptop.soLuongBan || 0
                    });
                  }
                }
              });
            }
            
            // Tổng hợp cho tháng 2
            if (item.topLaptop2 && Array.isArray(item.topLaptop2) && item.topLaptop2.length > 0) {
              item.topLaptop2.forEach(laptop => {
                if (laptop && laptop.idLaptop) {
                  const existing = allLaptops2.get(laptop.idLaptop);
                  if (existing) {
                    existing.soLuongBan += laptop.soLuongBan || 0;
                  } else {
                    allLaptops2.set(laptop.idLaptop, {
                      idLaptop: laptop.idLaptop,
                      tenSanPham: laptop.tenSanPham || 'N/A',
                      soLuongBan: laptop.soLuongBan || 0
                    });
                  }
                }
              });
            }
          });
          
          // Sắp xếp và lấy top 10 cho mỗi tháng
          const sortedLaptops1 = Array.from(allLaptops1.values())
            .sort((a, b) => b.soLuongBan - a.soLuongBan)
            .slice(0, 10);
          
          const sortedLaptops2 = Array.from(allLaptops2.values())
            .sort((a, b) => b.soLuongBan - a.soLuongBan)
            .slice(0, 10);
          
          console.log('Default sorted laptops 1:', sortedLaptops1);
          console.log('Default sorted laptops 2:', sortedLaptops2);
          
          setTop10Laptops({
            period1: sortedLaptops1,
            period2: sortedLaptops2,
            label1: `Tháng ${previousMonth.format('MM/YYYY')}`,
            label2: `Tháng ${currentMonth.format('MM/YYYY')}`
          });
        }
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu tháng mặc định:', error);
        // Fallback: dùng dữ liệu giả nếu API lỗi
        const monthComparisonData = generateMonthlyDayComparisonData(previousMonth, currentMonth);
        setMonthlyDayComparisonData(monthComparisonData);
        setSelectedMonths({ 
          thang1: previousMonth.format('MM/YYYY'), 
          thang2: currentMonth.format('MM/YYYY') 
        });
      }

      // Load dữ liệu so sánh 2 năm (năm trước và năm hiện tại)
      const currentYear = dayjs().year();
      const previousYear = currentYear - 1;
      
      const response = await getThongKe12Thang(previousYear, currentYear);
      
      console.log('Default yearly data:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        // Map dữ liệu từ API sang format cho biểu đồ
        // API trả về: {label: tháng, value1: doanh số năm 1, value2: doanh số năm 2, topLaptop1, topLaptop2}
        const mappedData = response.data.map(item => ({
          period: `Tháng ${item.label}`,
          namBatDau: item.value1 || 0,
          namKetThuc: item.value2 || 0,
        }));
        
        setMonthlyChartDataFromAPI(mappedData);
        setSelectedYears({ nam1: previousYear, nam2: currentYear });
        
        // Tổng hợp top 10 laptop từ tất cả các tháng của cả 2 năm
        const allLaptops1 = new Map();
        const allLaptops2 = new Map();
        
        response.data.forEach(item => {
          // Tổng hợp cho năm 1
          if (item.topLaptop1 && Array.isArray(item.topLaptop1)) {
            item.topLaptop1.forEach(laptop => {
              if (laptop && laptop.idLaptop) {
                const existing = allLaptops1.get(laptop.idLaptop);
                if (existing) {
                  existing.soLuongBan += laptop.soLuongBan || 0;
                } else {
                  allLaptops1.set(laptop.idLaptop, {
                    idLaptop: laptop.idLaptop,
                    tenSanPham: laptop.tenSanPham || 'N/A',
                    soLuongBan: laptop.soLuongBan || 0
                  });
                }
              }
            });
          }
          
          // Tổng hợp cho năm 2
          if (item.topLaptop2 && Array.isArray(item.topLaptop2)) {
            item.topLaptop2.forEach(laptop => {
              if (laptop && laptop.idLaptop) {
                const existing = allLaptops2.get(laptop.idLaptop);
                if (existing) {
                  existing.soLuongBan += laptop.soLuongBan || 0;
                } else {
                  allLaptops2.set(laptop.idLaptop, {
                    idLaptop: laptop.idLaptop,
                    tenSanPham: laptop.tenSanPham || 'N/A',
                    soLuongBan: laptop.soLuongBan || 0
                  });
                }
              }
            });
          }
        });
        
        // Sắp xếp và lấy top 10 cho mỗi năm
        const sortedLaptops1 = Array.from(allLaptops1.values())
          .sort((a, b) => b.soLuongBan - a.soLuongBan)
          .slice(0, 10);
        
        const sortedLaptops2 = Array.from(allLaptops2.values())
          .sort((a, b) => b.soLuongBan - a.soLuongBan)
          .slice(0, 10);
        
        setTop10Laptops({
          period1: sortedLaptops1,
          period2: sortedLaptops2,
          label1: `Năm ${previousYear}`,
          label2: `Năm ${currentYear}`
        });
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu biểu đồ mặc định:', error);
      // Không hiển thị lỗi cho người dùng, sẽ dùng dữ liệu giả
    }
  };

  const fetchThongKe = async () => {
    try {
      setLoading(true);
      const params = {
        startDate: dateRange[0]?.format('YYYY-MM-DD'),
        endDate: dateRange[1]?.format('YYYY-MM-DD')
      };
      const response = await getThongKeTongQuan(params);
      if (response.data && response.data.data) {
        setThongKeData(response.data.data);
      }
    } catch (error) {
      console.error('Lỗi khi lấy thống kê:', error);
      message.error('Không thể tải dữ liệu thống kê');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý thay đổi khoảng ngày
  const handleDateRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      setDateRange(dates);
    }
  };

  // Xử lý khi click vào button lọc thời gian - hiển thị modal
  const handleTimeFilterChange = (filter) => {
    setModalType(filter);
    setTimeFilter(filter);
    
    // Set giá trị mặc định cho tempDateRange
    const now = dayjs();
    let defaultRange;
    
    switch (filter) {
      case 'day':
        defaultRange = [now.startOf('day'), now.endOf('day')];
        break;
      case 'month':
        defaultRange = [now.startOf('month'), now.endOf('month')];
        break;
      case 'year':
        defaultRange = [now.startOf('year'), now.endOf('year')];
        break;
      default:
        defaultRange = [now.startOf('month'), now.endOf('month')];
    }
    
    setTempDateRange(defaultRange);
    setIsModalVisible(true);
  };

  // Xử lý khi submit form từ modal
  const handleModalOk = async () => {
    if (!tempDateRange[0] || !tempDateRange[1]) {
      message.warning('Vui lòng chọn khoảng thời gian!');
      return;
    }
    
    setIsModalVisible(false);
    setChartLoading(true);
    setDateRange(tempDateRange);
    
    try {
      if (modalType === 'month') {
        // So sánh 2 tháng theo ngày
        const thang1 = tempDateRange[0];
        const thang2 = tempDateRange[1];
        
        const nam1 = thang1.year();
        const thang1Num = thang1.month() + 1; // dayjs month is 0-based
        const nam2 = thang2.year();
        const thang2Num = thang2.month() + 1; // dayjs month is 0-based
        
        const response = await getThongKeTheoThang(nam1, thang1Num, nam2, thang2Num);
        
        console.log('Response from API (month):', response.data);
        
        if (response.data && Array.isArray(response.data)) {
          // Map dữ liệu từ API sang format cho biểu đồ
          // API trả về: {label: ngày, value1: doanh số tháng 1, value2: doanh số tháng 2}
          const mappedData = response.data.map(item => ({
            period: `Ngày ${item.label}`,
            thang1: item.value1 || 0,
            thang2: item.value2 || 0,
            day: item.label
          }));
          
          setMonthlyDayComparisonData(mappedData);
          setSelectedMonths({ 
            thang1: thang1.format('MM/YYYY'), 
            thang2: thang2.format('MM/YYYY') 
          });
          
          // Tổng hợp top 10 laptop từ tất cả các ngày của cả 2 tháng
          const allLaptops1 = new Map();
          const allLaptops2 = new Map();
          
          console.log('Processing month data:', response.data);
          
          response.data.forEach((item, index) => {
            console.log(`Item ${index}:`, item);
            console.log(`Item ${index} topLaptop1:`, item.topLaptop1);
            console.log(`Item ${index} topLaptop2:`, item.topLaptop2);
            
            // Tổng hợp cho tháng 1
            if (item.topLaptop1 && Array.isArray(item.topLaptop1) && item.topLaptop1.length > 0) {
              item.topLaptop1.forEach(laptop => {
                if (laptop && laptop.idLaptop) {
                  const existing = allLaptops1.get(laptop.idLaptop);
                  if (existing) {
                    existing.soLuongBan += laptop.soLuongBan || 0;
                  } else {
                    allLaptops1.set(laptop.idLaptop, {
                      idLaptop: laptop.idLaptop,
                      tenSanPham: laptop.tenSanPham || 'N/A',
                      soLuongBan: laptop.soLuongBan || 0
                    });
                  }
                }
              });
            }
            
            // Tổng hợp cho tháng 2
            if (item.topLaptop2 && Array.isArray(item.topLaptop2) && item.topLaptop2.length > 0) {
              item.topLaptop2.forEach(laptop => {
                if (laptop && laptop.idLaptop) {
                  const existing = allLaptops2.get(laptop.idLaptop);
                  if (existing) {
                    existing.soLuongBan += laptop.soLuongBan || 0;
                  } else {
                    allLaptops2.set(laptop.idLaptop, {
                      idLaptop: laptop.idLaptop,
                      tenSanPham: laptop.tenSanPham || 'N/A',
                      soLuongBan: laptop.soLuongBan || 0
                    });
                  }
                }
              });
            }
          });
          
          console.log('All laptops 1:', Array.from(allLaptops1.values()));
          console.log('All laptops 2:', Array.from(allLaptops2.values()));
          
          // Sắp xếp và lấy top 10 cho mỗi tháng
          const sortedLaptops1 = Array.from(allLaptops1.values())
            .sort((a, b) => b.soLuongBan - a.soLuongBan)
            .slice(0, 10);
          
          const sortedLaptops2 = Array.from(allLaptops2.values())
            .sort((a, b) => b.soLuongBan - a.soLuongBan)
            .slice(0, 10);
          
          console.log('Sorted laptops 1:', sortedLaptops1);
          console.log('Sorted laptops 2:', sortedLaptops2);
          
          setTop10Laptops({
            period1: sortedLaptops1,
            period2: sortedLaptops2,
            label1: `Tháng ${thang1.format('MM/YYYY')}`,
            label2: `Tháng ${thang2.format('MM/YYYY')}`
          });
          
          message.success(`Đã tải dữ liệu so sánh tháng ${thang1.format('MM/YYYY')} và ${thang2.format('MM/YYYY')}`);
        }
      } else if (modalType === 'year') {
        // So sánh 2 năm theo 12 tháng
        const nam1 = tempDateRange[0].year();
        const nam2 = tempDateRange[1].year();
        
        const response = await getThongKe12Thang(nam1, nam2);
        
        console.log('Response from API:', response.data);
        
        if (response.data && Array.isArray(response.data)) {
          // Map dữ liệu từ API sang format cho biểu đồ
          // API trả về: {label: tháng, value1: doanh số năm 1, value2: doanh số năm 2, topLaptop1, topLaptop2}
          const mappedData = response.data.map(item => ({
            period: `Tháng ${item.label}`,
            namBatDau: item.value1 || 0,
            namKetThuc: item.value2 || 0,
          }));
          
          setMonthlyChartDataFromAPI(mappedData);
          setSelectedYears({ nam1, nam2 });
          
          // Tổng hợp top 10 laptop từ tất cả các tháng của cả 2 năm
          const allLaptops1 = new Map();
          const allLaptops2 = new Map();
          
          response.data.forEach(item => {
            // Tổng hợp cho năm 1
            if (item.topLaptop1 && Array.isArray(item.topLaptop1)) {
              item.topLaptop1.forEach(laptop => {
                if (laptop && laptop.idLaptop) {
                  const existing = allLaptops1.get(laptop.idLaptop);
                  if (existing) {
                    existing.soLuongBan += laptop.soLuongBan || 0;
                  } else {
                    allLaptops1.set(laptop.idLaptop, {
                      idLaptop: laptop.idLaptop,
                      tenSanPham: laptop.tenSanPham || 'N/A',
                      soLuongBan: laptop.soLuongBan || 0
                    });
                  }
                }
              });
            }
            
            // Tổng hợp cho năm 2
            if (item.topLaptop2 && Array.isArray(item.topLaptop2)) {
              item.topLaptop2.forEach(laptop => {
                if (laptop && laptop.idLaptop) {
                  const existing = allLaptops2.get(laptop.idLaptop);
                  if (existing) {
                    existing.soLuongBan += laptop.soLuongBan || 0;
                  } else {
                    allLaptops2.set(laptop.idLaptop, {
                      idLaptop: laptop.idLaptop,
                      tenSanPham: laptop.tenSanPham || 'N/A',
                      soLuongBan: laptop.soLuongBan || 0
                    });
                  }
                }
              });
            }
          });
          
          // Sắp xếp và lấy top 10 cho mỗi năm
          const sortedLaptops1 = Array.from(allLaptops1.values())
            .sort((a, b) => b.soLuongBan - a.soLuongBan)
            .slice(0, 10);
          
          const sortedLaptops2 = Array.from(allLaptops2.values())
            .sort((a, b) => b.soLuongBan - a.soLuongBan)
            .slice(0, 10);
          
          setTop10Laptops({
            period1: sortedLaptops1,
            period2: sortedLaptops2,
            label1: `Năm ${nam1}`,
            label2: `Năm ${nam2}`
          });
          
          message.success(`Đã tải dữ liệu so sánh năm ${nam1} và năm ${nam2}`);
        }
      } else if (modalType === 'day') {
        // So sánh 2 ngày
        const ngay1 = tempDateRange[0];
        const ngay2 = tempDateRange[1];
        
        const response = await getThongKeSoSanhHaiNgay(ngay1, ngay2);
        
        console.log('Response from API (day):', response.data);
        
        if (response.data && Array.isArray(response.data) && response.data.length === 2) {
          // API trả về 2 objects: [{label: ngày1, value1: doanh số ngày1, value2: 0, topLaptop1}, {label: ngày2, value1: 0, value2: doanh số ngày2, topLaptop2}]
          const ngay1Data = response.data[0];
          const ngay2Data = response.data[1];
          
          const mappedData = [
            {
              period: ngay1.format('DD/MM/YYYY'),
              doanhThu: ngay1Data.value1 || 0,
              label: `Ngày ${ngay1Data.label}`
            },
            {
              period: ngay2.format('DD/MM/YYYY'),
              doanhThu: ngay2Data.value2 || 0,
              label: `Ngày ${ngay2Data.label}`
            }
          ];
          
          setDailyComparisonData(mappedData);
          setSelectedDays({
            ngay1: ngay1.format('DD/MM/YYYY'),
            ngay2: ngay2.format('DD/MM/YYYY')
          });
          
          console.log('Day 1 data:', ngay1Data);
          console.log('Day 2 data:', ngay2Data);
          console.log('Day 1 topLaptop1:', ngay1Data.topLaptop1);
          console.log('Day 2 topLaptop2:', ngay2Data.topLaptop2);
          
          // Lấy top 10 laptop từ 2 ngày
          const topLaptops1 = (ngay1Data.topLaptop1 && Array.isArray(ngay1Data.topLaptop1) && ngay1Data.topLaptop1.length > 0) 
            ? ngay1Data.topLaptop1.slice(0, 10) 
            : [];
          
          const topLaptops2 = (ngay2Data.topLaptop2 && Array.isArray(ngay2Data.topLaptop2) && ngay2Data.topLaptop2.length > 0) 
            ? ngay2Data.topLaptop2.slice(0, 10) 
            : [];
          
          console.log('Top laptops 1:', topLaptops1);
          console.log('Top laptops 2:', topLaptops2);
          
          setTop10Laptops({
            period1: topLaptops1,
            period2: topLaptops2,
            label1: `Ngày ${ngay1.format('DD/MM/YYYY')}`,
            label2: `Ngày ${ngay2.format('DD/MM/YYYY')}`
          });
          
          message.success(`Đã tải dữ liệu so sánh ngày ${ngay1.format('DD/MM/YYYY')} và ${ngay2.format('DD/MM/YYYY')}`);
        }
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu biểu đồ:', error);
      message.error('Không thể tải dữ liệu biểu đồ');
    } finally {
      setChartLoading(false);
    }
  };

  // Xử lý khi hủy modal
  const handleModalCancel = () => {
    setIsModalVisible(false);
    setTempDateRange([null, null]);
  };

  // Format số tiền
  const formatCurrency = (value) => {
    if (!value) return '0';
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  // Dữ liệu biểu đồ theo NGÀY - So sánh 2 ngày được chọn
  const getDailyComparisonData = () => {
    // Sử dụng dữ liệu từ API nếu có
    if (dailyComparisonData && dailyComparisonData.length === 2) {
      return dailyComparisonData;
    }
    
    // Fallback: dữ liệu giả nếu chưa có dữ liệu từ API
    const startDate = dateRange[0]?.format('DD/MM/YYYY') || '01/11/2024';
    const endDate = dateRange[1]?.format('DD/MM/YYYY') || '30/11/2024';
    
    const startValue = 2500000 + Math.random() * 1000000;
    const endValue = 3000000 + Math.random() * 1500000;
    
    return [
      { 
        period: startDate, 
        doanhThu: Math.round(startValue),
        label: 'Ngày bắt đầu'
      },
      { 
        period: endDate, 
        doanhThu: Math.round(endValue),
        label: 'Ngày kết thúc'
      },
    ];
  };

  // Tạo dữ liệu so sánh 2 tháng theo ngày (30 ngày)
  const generateMonthlyDayComparisonData = (thang1, thang2) => {
    const daysInMonth = 30; // Sử dụng 30 ngày
    const data = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      // Giả lập dữ liệu (có thể thay bằng API call)
      const thang1Value = Math.random() * 3000000 + 500000;
      const thang2Value = Math.random() * 3000000 + 500000;
      
      data.push({
        period: `Ngày ${day}`,
        thang1: Math.round(thang1Value),
        thang2: Math.round(thang2Value),
        day: day
      });
    }
    
    return data;
  };

  // Tính % chênh lệch giữa 2 ngày
  const getDailyComparison = () => {
    const data = getDailyComparisonData();
    if (data.length === 2) {
      const diff = data[1].doanhThu - data[0].doanhThu;
      const percent = ((diff / data[0].doanhThu) * 100).toFixed(1);
      return {
        diff,
        percent,
        isIncrease: diff > 0
      };
    }
    return null;
  };

  // Dữ liệu biểu đồ theo THÁNG - 12 tháng
  const monthlyChartDataRaw = [
    { period: 'Tháng 1', namBatDau: 45000000, namKetThuc: 52000000 },
    { period: 'Tháng 2', namBatDau: 78000000, namKetThuc: 65000000 },
    { period: 'Tháng 3', namBatDau: 62000000, namKetThuc: 71000000 },
    { period: 'Tháng 4', namBatDau: 54000000, namKetThuc: 58000000 },
    { period: 'Tháng 5', namBatDau: 69000000, namKetThuc: 74000000 },
    { period: 'Tháng 6', namBatDau: 71000000, namKetThuc: 68000000 },
    { period: 'Tháng 7', namBatDau: 58000000, namKetThuc: 63000000 },
    { period: 'Tháng 8', namBatDau: 82000000, namKetThuc: 79000000 },
    { period: 'Tháng 9', namBatDau: 67000000, namKetThuc: 72000000 },
    { period: 'Tháng 10', namBatDau: 75000000, namKetThuc: 81000000 },
    { period: 'Tháng 11', namBatDau: 88000000, namKetThuc: 92000000 },
    { period: 'Tháng 12', namBatDau: 95000000, namKetThuc: 98000000 },
  ];

  // Dữ liệu biểu đồ theo NĂM - 10 năm
  const yearlyChartDataRaw = [
    { period: '2015', namBatDau: 350000000, namKetThuc: 420000000 },
    { period: '2016', namBatDau: 480000000, namKetThuc: 520000000 },
    { period: '2017', namBatDau: 580000000, namKetThuc: 630000000 },
    { period: '2018', namBatDau: 650000000, namKetThuc: 720000000 },
    { period: '2019', namBatDau: 750000000, namKetThuc: 810000000 },
    { period: '2020', namBatDau: 680000000, namKetThuc: 750000000 },
    { period: '2021', namBatDau: 820000000, namKetThuc: 890000000 },
    { period: '2022', namBatDau: 950000000, namKetThuc: 1020000000 },
    { period: '2023', namBatDau: 1080000000, namKetThuc: 1150000000 },
    { period: '2024', namBatDau: 1200000000, namKetThuc: 1280000000 },
  ];

  // Chọn dữ liệu phù hợp theo timeFilter
  const getChartData = (type) => {
    // Xử lý riêng cho so sánh 2 ngày
    if (timeFilter === 'day') {
      const dailyData = getDailyComparisonData();
      if (type === 'all') {
        return dailyData;
      } else if (type === 'online') {
        return dailyData.map(item => ({
          ...item,
          doanhThu: Math.round(item.doanhThu * 0.6),
        }));
      } else { // offline
        return dailyData.map(item => ({
          ...item,
          doanhThu: Math.round(item.doanhThu * 0.4),
        }));
      }
    }

    // Xử lý cho tháng - so sánh 2 tháng theo ngày
    if (timeFilter === 'month') {
      const monthData = monthlyDayComparisonData || generateMonthlyDayComparisonData(
        dayjs().subtract(1, 'month'),
        dayjs()
      );
      
      if (type === 'all') {
        return monthData.map(item => ({
          period: item.period,
          thang1: item.thang1,
          thang2: item.thang2,
        }));
      } else if (type === 'online') {
        return monthData.map(item => ({
          period: item.period,
          thang1: Math.round(item.thang1 * 0.6),
          thang2: Math.round(item.thang2 * 0.6),
        }));
      } else { // offline
        return monthData.map(item => ({
          period: item.period,
          thang1: Math.round(item.thang1 * 0.4),
          thang2: Math.round(item.thang2 * 0.4),
        }));
      }
    }

    // Xử lý cho năm - so sánh 2 năm qua 12 tháng
    if (timeFilter === 'year') {
      const rawData = monthlyChartDataFromAPI || monthlyChartDataRaw;
      
      if (type === 'all') {
        return rawData;
      } else if (type === 'online') {
        return rawData.map(item => ({
          period: item.period,
          namBatDau: Math.round(item.namBatDau * 0.6),
          namKetThuc: Math.round(item.namKetThuc * 0.6),
        }));
      } else { // offline
        return rawData.map(item => ({
          period: item.period,
          namBatDau: Math.round(item.namBatDau * 0.4),
          namKetThuc: Math.round(item.namKetThuc * 0.4),
        }));
      }
    }

    // Fallback
    return [];
  };

  // Custom tooltip cho biểu đồ
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'white',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>
            {payload[0].payload.label || payload[0].payload.period}
          </p>
          {payload.map((entry, index) => (
            <p key={index} style={{ margin: '4px 0', color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)} VNĐ
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const statisticsData = [
    {
      title: 'Tổng Doanh Thu',
      value: thongKeData?.tongDoanhThu || 0,
      prefix: <DollarOutlined />,
      suffix: ' VNĐ',
      valueStyle: { color: '#3f8600' },
    },
    {
      title: 'Tổng Đơn Hàng',
      value: thongKeData?.tongDonHang || 0,
      prefix: <ShoppingCartOutlined />,
      suffix: ' đơn',
      valueStyle: { color: '#1890ff' },
    },
    {
      title: 'Tổng Khách Hàng',
      value: thongKeData?.tongKhachHang || 0,
      prefix: <UserOutlined />,
      suffix: ' người',
      valueStyle: { color: '#722ed1' },
    },
    {
      title: 'Tăng Trưởng',
      value: thongKeData?.tangTruong || 0,
      prefix: <RiseOutlined />,
      suffix: '%',
      valueStyle: { color: '#cf1322' },
    },
  ]

  const progressGroupData1 = [
    { title: 'Thứ Hai', value1: 34, value2: 78 },
    { title: 'Thứ Ba', value1: 56, value2: 94 },
    { title: 'Thứ Tư', value1: 12, value2: 67 },
    { title: 'Thứ Năm', value1: 43, value2: 91 },
    { title: 'Thứ Sáu', value1: 22, value2: 73 },
    { title: 'Thứ Bảy', value1: 53, value2: 82 },
    { title: 'Chủ Nhật', value1: 9, value2: 69 },
  ]

  const progressGroupData2 = [
    { title: 'Nam', value: 53, icon: <UserOutlined /> },
    { title: 'Nữ', value: 43, icon: <TeamOutlined /> },
  ]

  const progressGroupData3 = [
    { title: 'Tìm Kiếm Tự Nhiên', percent: 56, value: '191,235' },
    { title: 'Facebook', percent: 15, value: '51,223' },
    { title: 'Twitter', percent: 11, value: '37,564' },
    { title: 'LinkedIn', percent: 8, value: '27,319' },
  ]

  // Dữ liệu bảng
  const tableData = [
    {
      key: '1',
      user: {
        name: 'Nguyễn Văn A',
        new: true,
        registered: '01/01/2024',
      },
      country: 'Việt Nam',
      usage: {
        value: 50,
        period: '11/06/2024 - 10/07/2024',
        color: '#52c41a',
      },
      payment: 'Thẻ Mastercard',
      activity: '10 giây trước',
    },
    {
      key: '2',
      user: {
        name: 'Trần Thị B',
        new: false,
        registered: '01/01/2024',
      },
      country: 'Việt Nam',
      usage: {
        value: 22,
        period: '11/06/2024 - 10/07/2024',
        color: '#1890ff',
      },
      payment: 'Thẻ Visa',
      activity: '5 phút trước',
    },
    {
      key: '3',
      user: {
        name: 'Lê Văn C',
        new: true,
        registered: '01/01/2024',
      },
      country: 'Việt Nam',
      usage: {
        value: 74,
        period: '11/06/2024 - 10/07/2024',
        color: '#faad14',
      },
      payment: 'Ví Điện Tử',
      activity: '1 giờ trước',
    },
    {
      key: '4',
      user: {
        name: 'Phạm Thị D',
        new: true,
        registered: '01/01/2024',
      },
      country: 'Việt Nam',
      usage: {
        value: 98,
        period: '11/06/2024 - 10/07/2024',
        color: '#f5222d',
      },
      payment: 'PayPal',
      activity: 'Tháng trước',
    },
    {
      key: '5',
      user: {
        name: 'Hoàng Văn E',
        new: true,
        registered: '01/01/2024',
      },
      country: 'Việt Nam',
      usage: {
        value: 22,
        period: '11/06/2024 - 10/07/2024',
        color: '#722ed1',
      },
      payment: 'Ví Điện Tử',
      activity: 'Tuần trước',
    },
    {
      key: '6',
      user: {
        name: 'Đỗ Thị F',
        new: true,
        registered: '01/01/2024',
      },
      country: 'Việt Nam',
      usage: {
        value: 43,
        period: '11/06/2024 - 10/07/2024',
        color: '#52c41a',
      },
      payment: 'Thẻ Amex',
      activity: 'Tuần trước',
    },
  ]

  const columns = [
    {
      title: 'Người Dùng',
      dataIndex: 'user',
      key: 'user',
      render: (user) => (
        <div>
          <div>{user.name}</div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
            <Tag color={user.new ? 'green' : 'default'}>{user.new ? 'Mới' : 'Cũ'}</Tag> | Đăng ký: {user.registered}
          </div>
        </div>
      ),
    },
    {
      title: 'Quốc Gia',
      dataIndex: 'country',
      key: 'country',
      align: 'center',
    },
    {
      title: 'Sử Dụng',
      dataIndex: 'usage',
      key: 'usage',
      render: (usage) => (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontWeight: 600 }}>{usage.value}%</span>
            <span style={{ fontSize: '12px', color: '#8c8c8c', marginLeft: 12 }}>
              {usage.period}
            </span>
          </div>
          <Progress percent={usage.value} strokeColor={usage.color} size="small" />
        </div>
      ),
    },
    {
      title: 'Phương Thức Thanh Toán',
      dataIndex: 'payment',
      key: 'payment',
      align: 'center',
      render: (payment) => (
        <div>
          <WalletOutlined style={{ fontSize: 20, marginRight: 8 }} />
          {payment}
        </div>
      ),
    },
    
    {
      title: 'Hoạt Động',
      dataIndex: 'activity',
      key: 'activity',
      render: (activity) => (
        <div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>Đăng nhập lần cuối</div>
          <div style={{ fontWeight: 600 }}>{activity}</div>
        </div>
      ),
    },
  ]

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statisticsData.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={stat.prefix}
                suffix={stat.suffix}
                valueStyle={stat.valueStyle}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Chart Card with Tabs */}
      <Card
        style={{ marginBottom: 24 }}
        title="Doanh Số"
        extra={
          <Space>
            <Button
              type={timeFilter === 'day' ? 'primary' : 'default'}
              onClick={() => handleTimeFilterChange('day')}
              size="small"
            >
              Ngày
            </Button>
            <Button
              type={timeFilter === 'month' ? 'primary' : 'default'}
              onClick={() => handleTimeFilterChange('month')}
              size="small"
            >
              Tháng
            </Button>
            <Button
              type={timeFilter === 'year' ? 'primary' : 'default'}
              onClick={() => handleTimeFilterChange('year')}
              size="small"
            >
              Năm
            </Button>
          </Space>
        }
      >
        <Tabs
          activeKey={activeTabKey}
          onChange={setActiveTabKey}
          items={[
            {
              key: 'all',
              label: (
                <span>
                  <TrophyOutlined style={{ marginRight: 8 }} />
                  Tổng thể
                </span>
              ),
              children: (
                <>
                  <Spin spinning={chartLoading} tip="Đang tải dữ liệu...">
                    <div style={{ padding: '20px 0' }}>
                      <ResponsiveContainer width="100%" height={400}>
                        {timeFilter === 'month' ? (
                          <LineChart
                            data={getChartData('all')}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="period" 
                              tick={{ fontSize: 11 }}
                              angle={-45}
                              textAnchor="end"
                              height={80}
                              interval={2}
                            />
                            <YAxis 
                              tick={{ fontSize: 12 }}
                              tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend 
                              wrapperStyle={{ paddingTop: '20px' }}
                              iconType="line"
                            />
                            <Line 
                              type="monotone"
                              dataKey="thang1" 
                              stroke="#1e5a7d" 
                              strokeWidth={3}
                              name={`Tháng ${selectedMonths.thang1 || 'Trước'}`}
                              dot={{ fill: '#1e5a7d', r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                            <Line 
                              type="monotone"
                              dataKey="thang2" 
                              stroke="#e53935" 
                              strokeWidth={3}
                              name={`Tháng ${selectedMonths.thang2 || 'Sau'}`}
                              dot={{ fill: '#e53935', r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        ) : (
                          <BarChart
                            data={getChartData('all')}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="period" 
                              tick={{ fontSize: 12 }}
                              angle={timeFilter === 'year' ? -45 : 0}
                              textAnchor={timeFilter === 'year' ? 'end' : 'middle'}
                              height={timeFilter === 'year' ? 80 : 60}
                            />
                            <YAxis 
                              tick={{ fontSize: 12 }}
                              tickFormatter={(value) => {
                                if (timeFilter === 'day') return `${(value / 1000000).toFixed(1)}M`;
                                if (timeFilter === 'year') return `${(value / 1000000).toFixed(0)}M`;
                                return `${(value / 1000000000).toFixed(1)}B`;
                              }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend 
                              wrapperStyle={{ paddingTop: '20px' }}
                              iconType="rect"
                            />
                            {timeFilter === 'day' ? (
                              <Bar 
                                dataKey="doanhThu" 
                                fill="#1e5a7d" 
                                name="Doanh thu"
                                radius={[8, 8, 0, 0]}
                                barSize={100}
                              />
                            ) : (
                              <>
                                <Bar 
                                  dataKey="namBatDau" 
                                  fill="#1e5a7d" 
                                  name={`Năm ${selectedYears.nam1}`}
                                  radius={[4, 4, 0, 0]}
                                />
                                <Bar 
                                  dataKey="namKetThuc" 
                                  fill="#e53935" 
                                  name={`Năm ${selectedYears.nam2}`}
                                  radius={[4, 4, 0, 0]}
                                />
                              </>
                            )}
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  </Spin>

                  {/* Thông tin so sánh 2 ngày */}
                  {timeFilter === 'day' && getDailyComparison() && (
                    <div style={{ 
                      marginTop: 24, 
                      padding: '20px', 
                      background: getDailyComparison().isIncrease ? '#f6ffed' : '#fff2e8',
                      borderRadius: 8,
                      border: `1px solid ${getDailyComparison().isIncrease ? '#b7eb8f' : '#ffd591'}`
                    }}>
                      <Row align="middle" justify="center">
                        <Col>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 16, color: '#8c8c8c', marginBottom: 8 }}>
                              Chênh lệch doanh thu
            </div>
                            <div style={{ fontSize: 28, fontWeight: 'bold', color: getDailyComparison().isIncrease ? '#52c41a' : '#fa8c16' }}>
                              {getDailyComparison().isIncrease ? '+' : ''}{formatCurrency(getDailyComparison().diff)} VNĐ
          </div>
                            <div style={{ fontSize: 18, color: getDailyComparison().isIncrease ? '#52c41a' : '#fa8c16', marginTop: 4 }}>
                              ({getDailyComparison().isIncrease ? '+' : ''}{getDailyComparison().percent}%)
          </div>
        </div>
                        </Col>
                      </Row>
                    </div>
                  )}

                </>
              ),
            },
            {
              key: 'online',
              label: (
                <span>
                  <GlobalOutlined style={{ marginRight: 8 }} />
                  Online
                </span>
              ),
              children: (
                <>
                  <Spin spinning={chartLoading} tip="Đang tải dữ liệu...">
                    <div style={{ padding: '20px 0' }}>
                      <ResponsiveContainer width="100%" height={400}>
                        {timeFilter === 'month' ? (
                          <LineChart
                            data={getChartData('online')}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="period" 
                              tick={{ fontSize: 11 }}
                              angle={-45}
                              textAnchor="end"
                              height={80}
                              interval={2}
                            />
                            <YAxis 
                              tick={{ fontSize: 12 }}
                              tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend 
                              wrapperStyle={{ paddingTop: '20px' }}
                              iconType="line"
                            />
                            <Line 
                              type="monotone"
                              dataKey="thang1" 
                              stroke="#1890ff" 
                              strokeWidth={3}
                              name={`Tháng ${selectedMonths.thang1 || 'Trước'} (Online)`}
                              dot={{ fill: '#1890ff', r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                            <Line 
                              type="monotone"
                              dataKey="thang2" 
                              stroke="#40a9ff" 
                              strokeWidth={3}
                              name={`Tháng ${selectedMonths.thang2 || 'Sau'} (Online)`}
                              dot={{ fill: '#40a9ff', r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        ) : (
                          <BarChart
                            data={getChartData('online')}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="period" 
                              tick={{ fontSize: 12 }}
                              angle={timeFilter === 'year' ? -45 : 0}
                              textAnchor={timeFilter === 'year' ? 'end' : 'middle'}
                              height={timeFilter === 'year' ? 80 : 60}
                            />
                            <YAxis 
                              tick={{ fontSize: 12 }}
                              tickFormatter={(value) => {
                                if (timeFilter === 'day') return `${(value / 1000000).toFixed(1)}M`;
                                if (timeFilter === 'year') return `${(value / 1000000).toFixed(0)}M`;
                                return `${(value / 1000000000).toFixed(1)}B`;
                              }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend 
                              wrapperStyle={{ paddingTop: '20px' }}
                              iconType="rect"
                            />
                            {timeFilter === 'day' ? (
                              <Bar 
                                dataKey="doanhThu" 
                                fill="#1890ff" 
                                name="Doanh thu (Online)"
                                radius={[8, 8, 0, 0]}
                                barSize={100}
                              />
                            ) : (
                              <>
                                <Bar 
                                  dataKey="namBatDau" 
                                  fill="#1890ff" 
                                  name={`Năm ${selectedYears.nam1} (Online)`}
                                  radius={[4, 4, 0, 0]}
                                />
                                <Bar 
                                  dataKey="namKetThuc" 
                                  fill="#40a9ff" 
                                  name={`Năm ${selectedYears.nam2} (Online)`}
                                  radius={[4, 4, 0, 0]}
                                />
                              </>
                            )}
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  </Spin>

                </>
              ),
            },
            {
              key: 'offline',
              label: (
                <span>
                  <ShopOutlined style={{ marginRight: 8 }} />
                  Offline
                </span>
              ),
              children: (
                <>
                  <Spin spinning={chartLoading} tip="Đang tải dữ liệu...">
                    <div style={{ padding: '20px 0' }}>
                      <ResponsiveContainer width="100%" height={400}>
                        {timeFilter === 'month' ? (
                          <LineChart
                            data={getChartData('offline')}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="period" 
                              tick={{ fontSize: 11 }}
                              angle={-45}
                              textAnchor="end"
                              height={80}
                              interval={2}
                            />
                            <YAxis 
                              tick={{ fontSize: 12 }}
                              tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend 
                              wrapperStyle={{ paddingTop: '20px' }}
                              iconType="line"
                            />
                            <Line 
                              type="monotone"
                              dataKey="thang1" 
                              stroke="#faad14" 
                              strokeWidth={3}
                              name={`Tháng ${selectedMonths.thang1 || 'Trước'} (Offline)`}
                              dot={{ fill: '#faad14', r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                            <Line 
                              type="monotone"
                              dataKey="thang2" 
                              stroke="#ffc53d" 
                              strokeWidth={3}
                              name={`Tháng ${selectedMonths.thang2 || 'Sau'} (Offline)`}
                              dot={{ fill: '#ffc53d', r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        ) : (
                          <BarChart
                            data={getChartData('offline')}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="period" 
                              tick={{ fontSize: 12 }}
                              angle={timeFilter === 'year' ? -45 : 0}
                              textAnchor={timeFilter === 'year' ? 'end' : 'middle'}
                              height={timeFilter === 'year' ? 80 : 60}
                            />
                            <YAxis 
                              tick={{ fontSize: 12 }}
                              tickFormatter={(value) => {
                                if (timeFilter === 'day') return `${(value / 1000000).toFixed(1)}M`;
                                if (timeFilter === 'year') return `${(value / 1000000).toFixed(0)}M`;
                                return `${(value / 1000000000).toFixed(1)}B`;
                              }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend 
                              wrapperStyle={{ paddingTop: '20px' }}
                              iconType="rect"
                            />
                            {timeFilter === 'day' ? (
                              <Bar 
                                dataKey="doanhThu" 
                                fill="#faad14" 
                                name="Doanh thu (Offline)"
                                radius={[8, 8, 0, 0]}
                                barSize={100}
                              />
                            ) : (
                              <>
                                <Bar 
                                  dataKey="namBatDau" 
                                  fill="#faad14" 
                                  name={`Năm ${selectedYears.nam1} (Offline)`}
                                  radius={[4, 4, 0, 0]}
                                />
                                <Bar 
                                  dataKey="namKetThuc" 
                                  fill="#ffc53d" 
                                  name={`Năm ${selectedYears.nam2} (Offline)`}
                                  radius={[4, 4, 0, 0]}
                                />
                              </>
                            )}
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  </Spin>

                </>
              ),
            },
          ]}
        />
      </Card>

      {/* Top 10 Sản Phẩm Bán Chạy Nhất */}
      <Card 
        title={
          <span>
            <TrophyOutlined style={{ marginRight: 8, color: '#faad14' }} />
            Top 10 Sản Phẩm Bán Chạy Nhất
          </span>
        } 
        style={{ marginBottom: 24 }}
      >
        {(() => {
          // Gộp dữ liệu từ cả 2 kỳ
          const period1Map = new Map();
          const period2Map = new Map();
          
          (top10Laptops.period1 || []).forEach(laptop => {
            if (laptop && laptop.idLaptop) {
              period1Map.set(laptop.idLaptop, laptop);
            }
          });
          
          (top10Laptops.period2 || []).forEach(laptop => {
            if (laptop && laptop.idLaptop) {
              period2Map.set(laptop.idLaptop, laptop);
            }
          });
          
          // Lấy tất cả sản phẩm unique từ cả 2 kỳ
          const allProductIds = new Set([
            ...Array.from(period1Map.keys()),
            ...Array.from(period2Map.keys())
          ]);
          
          // Tạo danh sách sản phẩm với dữ liệu từ cả 2 kỳ
          const mergedData = Array.from(allProductIds).map(idLaptop => {
            const laptop1 = period1Map.get(idLaptop);
            const laptop2 = period2Map.get(idLaptop);
            
            return {
              idLaptop: idLaptop,
              tenSanPham: laptop1?.tenSanPham || laptop2?.tenSanPham || 'N/A',
              soLuongBan1: laptop1?.soLuongBan || 0,
              soLuongBan2: laptop2?.soLuongBan || 0,
              totalBan: (laptop1?.soLuongBan || 0) + (laptop2?.soLuongBan || 0)
            };
          });
          
          // Sắp xếp theo tổng số lượng bán và lấy top 10
          const sortedData = mergedData
            .sort((a, b) => b.totalBan - a.totalBan)
            .slice(0, 10)
            .map((item, index) => ({
              ...item,
              stt: index + 1
            }));
          
          return (
            <Table
              dataSource={sortedData}
              columns={[
                {
                  title: 'STT',
                  dataIndex: 'stt',
                  key: 'stt',
                  width: 60,
                  align: 'center',
                  render: (stt) => (
                    <span style={{ 
                      display: 'inline-block',
                      width: 30,
                      height: 30,
                      lineHeight: '30px',
                      borderRadius: '50%',
                      background: stt <= 3 ? '#faad14' : '#f0f0f0',
                      color: stt <= 3 ? '#fff' : '#000',
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}>
                      {stt}
                    </span>
                  )
                },
                {
                  title: 'Tên Sản Phẩm',
                  dataIndex: 'tenSanPham',
                  key: 'tenSanPham',
                  render: (text) => (
                    <span style={{ fontWeight: 500 }}>{text || 'N/A'}</span>
                  )
                },
                {
                  title: top10Laptops.label1 || 'Kỳ 1',
                  dataIndex: 'soLuongBan1',
                  key: 'soLuongBan1',
                  align: 'right',
                  width: 150,
                  render: (value) => (
                    <span style={{ 
                      fontSize: '14px', 
                      fontWeight: 600,
                      color: '#1890ff'
                    }}>
                      {formatCurrency(value)}
                    </span>
                  )
                },
                {
                  title: top10Laptops.label2 || 'Kỳ 2',
                  dataIndex: 'soLuongBan2',
                  key: 'soLuongBan2',
                  align: 'right',
                  width: 150,
                  render: (value) => (
                    <span style={{ 
                      fontSize: '14px', 
                      fontWeight: 600,
                      color: '#fa8c16'
                    }}>
                      {formatCurrency(value)}
                    </span>
                  )
                }
              ]}
              pagination={false}
              size="middle"
              locale={{
                emptyText: (top10Laptops.label1 || top10Laptops.label2) ? 'Không có dữ liệu' : 'Đang tải dữ liệu...'
              }}
            />
          );
        })()}
      </Card>

      {/* Thống kê đơn hàng theo trạng thái */}
      <Card title="Thống Kê Đơn Hàng Theo Trạng Thái" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={4.8}>
            <Card>
              <Statistic
                title="Chờ Xác Nhận"
                value={thongKeData?.donHangChoXacNhan || 0}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4.8}>
            <Card>
              <Statistic
                title="Đang Xử Lý"
                value={thongKeData?.donHangDangXuLy || 0}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4.8}>
            <Card>
              <Statistic
                title="Đang Giao"
                value={thongKeData?.donHangDangGiao || 0}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4.8}>
            <Card>
              <Statistic
                title="Hoàn Thành"
                value={thongKeData?.donHangHoanThanh || 0}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4.8}>
            <Card>
              <Statistic
                title="Đã Hủy"
                value={thongKeData?.donHangDaHuy || 0}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Users Table */}
      <Card title="Người Dùng & Hoạt Động">
        <Table
          columns={columns}
          dataSource={tableData}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* Modal chọn khoảng thời gian */}
      <Modal
        title={`So Sánh Thời Gian ${modalType === 'day' ? 'Ngày' : modalType === 'month' ? 'Tháng' : 'Năm'}`}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText="Xác nhận"
        cancelText="Hủy"
        centered
        width={500}
      >
        <div style={{ padding: '20px 0' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {modalType === 'day' && (
              <>
                <div>
                  <div style={{ marginBottom: 8, fontWeight: 500 }}>Ngày bắt đầu:</div>
                  <DatePicker
                    value={tempDateRange[0]}
                    onChange={(date) => setTempDateRange([date, tempDateRange[1]])}
                    format="DD/MM/YYYY"
                    placeholder="Chọn ngày bắt đầu"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <div style={{ marginBottom: 8, fontWeight: 500 }}>Ngày kết thúc:</div>
                  <DatePicker
                    value={tempDateRange[1]}
                    onChange={(date) => setTempDateRange([tempDateRange[0], date])}
                    format="DD/MM/YYYY"
                    placeholder="Chọn ngày kết thúc"
                    style={{ width: '100%' }}
                  />
                </div>
              </>
            )}

            {modalType === 'month' && (
              <>
                <div>
                  <div style={{ marginBottom: 8, fontWeight: 500 }}>Tháng bắt đầu:</div>
                  <DatePicker
                    value={tempDateRange[0]}
                    onChange={(date) => setTempDateRange([date, tempDateRange[1]])}
                    picker="month"
                    format="MM/YYYY"
                    placeholder="Chọn tháng bắt đầu"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <div style={{ marginBottom: 8, fontWeight: 500 }}>Tháng kết thúc:</div>
                  <DatePicker
                    value={tempDateRange[1]}
                    onChange={(date) => setTempDateRange([tempDateRange[0], date])}
                    picker="month"
                    format="MM/YYYY"
                    placeholder="Chọn tháng kết thúc"
                    style={{ width: '100%' }}
                  />
                </div>
              </>
            )}

            {modalType === 'year' && (
              <>
                <div>
                  <div style={{ marginBottom: 8, fontWeight: 500 }}>Năm bắt đầu:</div>
                  <DatePicker
                    value={tempDateRange[0]}
                    onChange={(date) => setTempDateRange([date, tempDateRange[1]])}
                    picker="year"
                    format="YYYY"
                    placeholder="Chọn năm bắt đầu"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <div style={{ marginBottom: 8, fontWeight: 500 }}>Năm kết thúc:</div>
                  <DatePicker
                    value={tempDateRange[1]}
                    onChange={(date) => setTempDateRange([tempDateRange[0], date])}
                    picker="year"
                    format="YYYY"
                    placeholder="Chọn năm kết thúc"
                    style={{ width: '100%' }}
                  />
                </div>
              </>
            )}
          </Space>
        </div>
      </Modal>
    </div>
  )
}

export default ListThongKeComponent
