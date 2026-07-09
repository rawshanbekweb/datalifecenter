import fs from 'fs/promises';
import path from 'path';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from './helpers';
import { VIDEOS_DIR } from '../src/config/uploads';
import { signLocalVideoUrl } from '../src/utils/videoAccess';

const FILENAME = 'test-video-access.mp4';
const FILE_PATH = path.join(VIDEOS_DIR, FILENAME);

beforeAll(async () => {
  await fs.writeFile(FILE_PATH, 'fake-video-bytes');
});

afterAll(async () => {
  await fs.unlink(FILE_PATH).catch(() => {});
});

describe("Lokal video fayllarni himoyalash (signed URL)", () => {
  it('tokensiz so\'rov 403 qaytaradi', async () => {
    const res = await request(app).get(`/uploads/videos/${FILENAME}`).expect(403);
    expect(res.body.error.code).toBe('VIDEO_TOKEN_INVALID');
  });

  it("noto'g'ri imzo bilan 403 qaytaradi", async () => {
    await request(app)
      .get(`/uploads/videos/${FILENAME}?exp=${Math.floor(Date.now() / 1000) + 3600}&sig=deadbeef`)
      .expect(403);
  });

  it('muddati o\'tgan token bilan 403 qaytaradi', async () => {
    const signed = signLocalVideoUrl(`/uploads/videos/${FILENAME}`, -10);
    const query = signed.split('?')[1];
    await request(app).get(`/uploads/videos/${FILENAME}?${query}`).expect(403);
  });

  it("to'g'ri token bilan faylni qaytaradi", async () => {
    const signed = signLocalVideoUrl(`/uploads/videos/${FILENAME}`, 3600);
    const query = signed.split('?')[1];
    const res = await request(app).get(`/uploads/videos/${FILENAME}?${query}`).expect(200);
    expect(Buffer.isBuffer(res.body) ? res.body.toString() : res.text).toBe('fake-video-bytes');
  });

  it('boshqa fayl uchun yaratilgan token bu faylga ishlamaydi', async () => {
    const signed = signLocalVideoUrl('/uploads/videos/boshqa-fayl.mp4', 3600);
    const query = signed.split('?')[1];
    await request(app).get(`/uploads/videos/${FILENAME}?${query}`).expect(403);
  });
});
