export const validateLogin = (phone: string, password: string) => {
  if (!phone.trim() || !password.trim()) {
    return 'Vui long nhap day du so dien thoai va mat khau.';
  }
  return null;
};

export const validateTaskForm = (
  name: string,
  startDate: Date | null,
  endDate: Date | null,
) => {
  if (!name.trim()) return 'Vui long nhap tieu de cong viec.';
  if (!startDate || !endDate) return 'Vui long chon thoi gian bat dau va han chot.';
  if (startDate.getTime() > endDate.getTime()) {
    return 'Han chot phai sau thoi gian bat dau.';
  }
  return null;
};
