export const validateLogin = (phone: string, password: string) => {
  if (!phone.trim() || !password.trim()) {
    return 'Vui lòng nhập đầy đủ số điện thoại và mật khẩu.';
  }
  return null;
};

export const validateTaskForm = (
  name: string,
  startDate: Date | null,
  endDate: Date | null,
) => {
  if (!name.trim()) return 'Vui lòng nhập tiêu đề công việc.';
  if (!startDate || !endDate) return 'Vui lòng chọn thời gian bắt đầu và hạn chót.';
  if (startDate.getTime() > endDate.getTime()) {
    return 'Hạn chót phải sau thời gian bắt đầu.';
  }
  return null;
};
