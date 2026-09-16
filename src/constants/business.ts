export const TASK_STATUSES = [
  {value: 1, label: 'Mới tạo'},
  {value: 2, label: 'Đang xử lý'},
  {value: 3, label: 'Hoàn thành'},
  {value: 4, label: 'Hủy bỏ'},
] as const;

export const PROJECT_STATUSES = [
  {value: 0, label: 'Mới tạo'},
  {value: 1, label: 'Đang thực hiện'},
  {value: 3, label: 'Đã hoàn thành'},
  {value: 4, label: 'Hủy bỏ'},
] as const;

export const TASK_TYPE_FILTERS = [
  {value: '', label: 'Tất cả'},
  {value: 'me', label: 'Của tôi'},
  {value: 'others', label: 'Đã giao'},
] as const;

export const MAX_ATTACHMENT_COUNT = 5;
export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

export const ALLOWED_ATTACHMENT_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'bmp',
  'svg',
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'txt',
  'csv',
  'zip',
  'rar',
];
