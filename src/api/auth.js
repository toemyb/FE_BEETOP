export async function login(tenDangNhap, matKhau) {
  const response = await fetch('/auth/signin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Để nhận cookie từ backend
    body: JSON.stringify({ tenDangNhap, matKhau }),
  });

  if (!response.ok) {
    // Xử lý lỗi, có thể lấy message từ response.json()
    const error = await response.json();
    throw new Error(error.message || 'Đăng nhập thất bại');
  }

  return response.json();
}