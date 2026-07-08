import { API_URL } from './config';
import { getToken } from './token';

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

// fetch o'rniga XHR — yuklash jarayonini (progress) ko'rsatish uchun
export function uploadFile(
  file: File,
  kind: 'image' | 'video',
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/uploads/${kind}`);
    xhr.withCredentials = true;
    const token = getToken();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && body?.success) {
          resolve(body.data as UploadResult);
        } else {
          reject(new Error(body?.error?.message || 'Yuklashda xatolik yuz berdi'));
        }
      } catch {
        reject(new Error('Yuklashda xatolik yuz berdi'));
      }
    };

    xhr.onerror = () => reject(new Error("Serverga ulanib bo'lmadi"));
    xhr.ontimeout = () => reject(new Error('Yuklash vaqti tugadi'));

    const formData = new FormData();
    formData.append('file', file);
    xhr.send(formData);
  });
}
