import {
  ALLOWED_ATTACHMENT_EXTENSIONS,
  MAX_ATTACHMENT_COUNT,
  MAX_ATTACHMENT_SIZE,
} from '../constants/business';
import {AttachedFile} from '../types/models';

export const isImageFile = (file?: AttachedFile) => {
  const type = String(file?.file_type || '').toLowerCase();
  const url = String(file?.file_url || '').toLowerCase();
  return (
    type === 'image' ||
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(type) ||
    /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(url)
  );
};

export const parseAttachments = (raw?: unknown): AttachedFile[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as AttachedFile[];
  if (typeof raw === 'object') return [raw as AttachedFile];
  const text = String(raw).trim();
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [
      {
        file_url: text,
        file_name: text.split('/').pop() || 'Tài liệu',
        file_type: isImageFile({file_url: text}) ? 'image' : 'document',
      },
    ];
  }
};

export const splitAttachments = (files: AttachedFile[]) => {
  const images = files.filter(isImageFile);
  const docs = files.filter(file => !isImageFile(file));
  return {images, docs};
};

export const validateAttachment = (
  file: {name?: string; fileName?: string; size?: number; fileSize?: number},
  currentCount: number,
) => {
  if (currentCount >= MAX_ATTACHMENT_COUNT) {
    return `Tối đa ${MAX_ATTACHMENT_COUNT} file đính kèm.`;
  }
  const size = file.size || file.fileSize || 0;
  if (size > MAX_ATTACHMENT_SIZE) {
    return 'File vượt quá giới hạn 10MB.';
  }
  const name = file.name || file.fileName || '';
  const ext = name.split('.').pop()?.toLowerCase();
  if (!ext || !ALLOWED_ATTACHMENT_EXTENSIONS.includes(ext)) {
    return 'Định dạng file không được hỗ trợ.';
  }
  return null;
};
