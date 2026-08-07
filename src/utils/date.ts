export const toApiDateTime = (date: Date | null) => {
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export const fromUnixSeconds = (timestamp?: number | string | null) => {
  if (!timestamp) return null;
  return new Date(Number(timestamp) * 1000);
};

export const formatDateTime = (timestamp?: number | string | null) => {
  const date = fromUnixSeconds(timestamp);
  if (!date) return 'Chua cap nhat';
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const isOverdue = (timestamp?: number | null, status?: number) => {
  if (!timestamp || status === 3 || status === 4) return false;
  return timestamp < Math.floor(Date.now() / 1000);
};

export const isNearDeadline = (timestamp?: number | null) => {
  if (!timestamp) return false;
  const diff = timestamp - Math.floor(Date.now() / 1000);
  return diff >= 0 && diff <= 86400;
};
