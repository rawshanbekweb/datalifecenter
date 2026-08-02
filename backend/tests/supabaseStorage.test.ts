import { Readable } from 'stream';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Supabase Storage adapteri sof HTTP qatlami — bu yerda tarmoqqa chiqmasdan,
// fetch'ni almashtirib tekshiramiz: qaysi manzilga, qanday tana bilan boradi
// va javob qanday o'qiladi.
//
// Modul env'ni import paytida o'qiydi, shuning uchun har testda env stub qilinib
// modul qayta import qilinadi (vi.resetModules).

const SUPABASE_URL = 'https://proj.supabase.co';
const API = `${SUPABASE_URL}/storage/v1`;

type FetchCall = { url: string; init: RequestInit };

let calls: FetchCall[] = [];

// Yuklash manbai — fayl o'rniga xotiradagi baytlar. `open()` har chaqirilganda
// YANGI oqim qaytaradi: adapter so'rovni qayta yuborishi mumkin (bucket
// yaratilgandan keyin), bir marta o'qilgan oqim esa qayta o'qilmaydi.
const BYTES = Buffer.from('bytes');

function source(): { open: () => Readable; size: number; opened: () => number } {
  let opens = 0;
  return {
    open: () => {
      opens += 1;
      return Readable.from(BYTES);
    },
    size: BYTES.length,
    opened: () => opens,
  };
}

function mockFetch(handler: (url: string, init: RequestInit) => { status?: number; body?: unknown }) {
  vi.stubGlobal('fetch', async (input: string | URL, init: RequestInit = {}) => {
    const url = String(input);
    calls.push({ url, init });
    const { status = 200, body = {} } = handler(url, init);
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

async function loadModule() {
  vi.resetModules();
  vi.stubEnv('SUPABASE_URL', SUPABASE_URL);
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key');
  vi.stubEnv('SUPABASE_BUCKET_IMAGES', 'imgs');
  vi.stubEnv('SUPABASE_BUCKET_VIDEOS', 'vids');
  return import('../src/services/storage/supabase');
}

beforeEach(() => {
  calls = [];
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('Supabase Storage adapteri', () => {
  it('rasmni yuklab, ochiq (public) URL qaytaradi', async () => {
    mockFetch(() => ({ body: { Key: 'imgs/rasm.jpg' } }));
    const supabase = await loadModule();

    const url = await supabase.upload(source(), 'images', 'rasm.jpg', 'image/jpeg');

    expect(url).toBe(`${API}/object/public/imgs/rasm.jpg`);
    expect(calls[0].url).toBe(`${API}/object/imgs/rasm.jpg`);
    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer service-role-key');
    // Tana oqim bo'lgani uchun hajm qo'lda beriladi — bo'lmasa so'rov chunked ketadi
    expect(headers['Content-Length']).toBe(String(BYTES.length));
  });

  it('video uchun imzosiz kanonik URL qaytaradi (public emas)', async () => {
    mockFetch(() => ({ body: {} }));
    const supabase = await loadModule();

    const url = await supabase.upload(source(), 'videos', 'dars.mp4', 'video/mp4');

    expect(url).toBe(`${API}/object/vids/dars.mp4`);
    expect(url).not.toContain('/public/');
  });

  // DIQQAT: bu javob shakli haqiqiy Supabase'dan olingan — bucket yo'qligida
  // HTTP 400 keladi va "404" faqat tananing ichida bo'ladi. Avval kod HTTP
  // statusga qarab tekshirgani uchun bucket avtomatik yaratilmasdi.
  const bucketYoq = { status: 400, body: { statusCode: '404', error: 'Bucket not found', code: 'NoSuchBucket' } };

  it('bucket yo\'q bo\'lsa yaratib, yuklashni qaytadan uradi', async () => {
    let uploadAttempts = 0;
    mockFetch((url, init) => {
      if (url.endsWith('/bucket') && init.method === 'POST') return { body: { name: 'imgs' } };
      uploadAttempts += 1;
      return uploadAttempts === 1 ? bucketYoq : { body: {} };
    });
    const supabase = await loadModule();

    const src = source();
    const url = await supabase.upload(src, 'images', 'rasm.jpg', 'image/jpeg');

    expect(url).toBe(`${API}/object/public/imgs/rasm.jpg`);
    expect(uploadAttempts).toBe(2);
    // Ikkinchi urinish uchun oqim QAYTADAN ochilishi shart — bir marta o'qilgani
    // ikkinchi so'rovda bo'sh tana bo'lib ketardi
    expect(src.opened()).toBe(2);
    // Rasm bucketi ochiq, video bucketi yopiq bo'lib yaratilishi kerak
    const created = calls.find((c) => c.url.endsWith('/bucket'));
    expect(JSON.parse(String(created?.init.body))).toMatchObject({ id: 'imgs', public: true });
  });

  it('video bucketini YOPIQ qilib yaratadi', async () => {
    let first = true;
    mockFetch((url) => {
      if (url.endsWith('/bucket')) return { body: {} };
      if (first) {
        first = false;
        return bucketYoq;
      }
      return { body: {} };
    });
    const supabase = await loadModule();

    await supabase.upload(source(), 'videos', 'dars.mp4', 'video/mp4');

    const created = calls.find((c) => c.url.endsWith('/bucket'));
    expect(JSON.parse(String(created?.init.body))).toMatchObject({ id: 'vids', public: false });
  });

  it('o\'z URL\'ini bucket va yo\'lga ajratadi, begonasini rad etadi', async () => {
    mockFetch(() => ({ body: {} }));
    const supabase = await loadModule();

    expect(supabase.parseUrl(`${API}/object/public/imgs/rasm.jpg`)).toEqual({ bucket: 'imgs', path: 'rasm.jpg' });
    expect(supabase.parseUrl(`${API}/object/vids/dars.mp4`)).toEqual({ bucket: 'vids', path: 'dars.mp4' });
    expect(supabase.parseUrl('https://res.cloudinary.com/x/image/upload/v1/a.jpg')).toBeNull();
    expect(supabase.parseUrl('https://youtube.com/watch?v=abc')).toBeNull();
    expect(supabase.parseUrl('/uploads/images/a.jpg')).toBeNull();
  });

  it('bir nechta videoni BITTA so\'rovda imzolaydi', async () => {
    mockFetch((url) => {
      expect(url).toBe(`${API}/object/sign/vids`);
      return {
        body: [
          { path: 'a.mp4', signedURL: '/object/sign/vids/a.mp4?token=t1', error: null },
          { path: 'b.mp4', signedURL: '/object/sign/vids/b.mp4?token=t2', error: null },
        ],
      };
    });
    const supabase = await loadModule();

    const signed = await supabase.signUrls(
      [
        { bucket: 'vids', path: 'a.mp4' },
        { bucket: 'vids', path: 'b.mp4' },
      ],
      3600
    );

    expect(calls).toHaveLength(1);
    expect(JSON.parse(String(calls[0].init.body))).toEqual({ expiresIn: 3600, paths: ['a.mp4', 'b.mp4'] });
    expect(signed.get('vids/a.mp4')).toBe(`${API}/object/sign/vids/a.mp4?token=t1`);
    expect(signed.get('vids/b.mp4')).toBe(`${API}/object/sign/vids/b.mp4?token=t2`);
  });

  it('imzolash xato bersa yiqilmaydi, bo\'sh jadval qaytaradi', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFetch(() => ({ status: 500, body: { message: 'server xatosi' } }));
    const supabase = await loadModule();

    const signed = await supabase.signUrls([{ bucket: 'vids', path: 'a.mp4' }], 3600);

    expect(signed.size).toBe(0);
  });

  it('boshqa xatoda bucket yaratishga urinmaydi', async () => {
    mockFetch(() => ({ status: 403, body: { message: 'ruxsat yo\'q' } }));
    const supabase = await loadModule();

    await expect(supabase.upload(source(), 'images', 'a.jpg', 'image/jpeg')).rejects.toThrow(/403/);
    expect(calls.some((c) => c.url.endsWith('/bucket'))).toBe(false);
  });

  // Supabase loyihasining global fayl chekloviga (Free rejada 50 MB) tushgan
  // yuklash — "qayta urinib ko'ring" emas, alohida xato bo'lishi kerak
  it('hajm chekloviga tushsa StorageLimitError beradi', async () => {
    mockFetch(() => ({ status: 413, body: { statusCode: '413', error: 'Payload too large', message: 'The object exceeded the maximum allowed size' } }));
    const supabase = await loadModule();

    await expect(supabase.upload(source(), 'videos', 'dars.mp4', 'video/mp4')).rejects.toBeInstanceOf(
      supabase.StorageLimitError
    );
    // Bucket yaratishga urinmaydi — muammo bucketda emas
    expect(calls.some((c) => c.url.endsWith('/bucket'))).toBe(false);
  });

  it('o\'chirishda 404 ni xato deb hisoblamaydi', async () => {
    mockFetch(() => ({ status: 404, body: {} }));
    const supabase = await loadModule();

    await expect(supabase.remove({ bucket: 'imgs', path: 'yoq.jpg' })).resolves.toBeUndefined();
    expect(calls[0].init.method).toBe('DELETE');
  });
});
