export const TASK_STATUSES = [
  {value: 1, label: 'Moi tao'},
  {value: 2, label: 'Dang xu ly'},
  {value: 3, label: 'Hoan thanh'},
  {value: 4, label: 'Huy bo'},
] as const;

export const PROJECT_STATUSES = [
  {value: 0, label: 'Moi tao'},
  {value: 1, label: 'Dang thuc hien'},
  {value: 3, label: 'Tam dung'},
  {value: 4, label: 'Ket thuc'},
] as const;

export const TASK_TYPE_FILTERS = [
  {value: '', label: 'Tat ca'},
  {value: 'assigned_to_me', label: 'Cua toi'},
  {value: 'created_by_me', label: 'Da giao'},
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
