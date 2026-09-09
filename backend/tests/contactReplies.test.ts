import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../src/utils/ApiError';

const { sendContactReplyEmailMock } = vi.hoisted(() => ({
  sendContactReplyEmailMock: vi.fn(),
}));

vi.mock('../src/services/email.service', async () => {
  const actual = await vi.importActual<typeof import('../src/services/email.service')>(
    '../src/services/email.service',
  );
  return { ...actual, sendContactReplyEmail: sendContactReplyEmailMock };
});

import { app, createUser, loginAgent, prisma, resetDb } from './helpers';

let adminAgent: Awaited<ReturnType<typeof loginAgent>>;
let studentAgent: Awaited<ReturnType<typeof loginAgent>>;

async function createContactMessage(): Promise<string> {
  const response = await request(app)
    .post('/api/contact')
    .send({
      name: 'Azamat Yakubbaev',
      email: 'azamat@example.com',
      phone: '+998953481014',
      subject: 'course',
      message: "Kurs haqida ma'lumot kerak",
    })
    .expect(201);
  return response.body.data.id;
}

beforeAll(async () => {
  await resetDb();
  await createUser('admin@datalife.uz', 'ADMIN', 'Data Life Admin');
  await createUser('student@reply.uz', 'STUDENT', 'Oddiy Talaba');
  adminAgent = await loginAgent('admin@datalife.uz');
  studentAgent = await loginAgent('student@reply.uz');
});

beforeEach(() => {
  sendContactReplyEmailMock.mockReset();
  sendContactReplyEmailMock.mockResolvedValue(undefined);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Aloqa xabariga email orqali javob', () => {
  it('admin javobi yuborilgach matn va REPLIED holati saqlanadi', async () => {
    const id = await createContactMessage();
    const response = await adminAgent
      .post(`/api/contact/${id}/reply`)
      .send({ reply: 'Salom! Kurs bo‘yicha administratorimiz siz bilan bog‘lanadi.' })
      .expect(200);

    expect(sendContactReplyEmailMock).toHaveBeenCalledWith(expect.objectContaining({
      to: 'azamat@example.com',
      recipientName: 'Azamat Yakubbaev',
      originalSubject: 'course',
      replyTo: { email: 'admin@datalife.uz', name: 'Data Life Admin' },
    }));
    expect(response.body.data.status).toBe('REPLIED');
    expect(response.body.data.reply).toContain('administratorimiz');
    expect(response.body.data.repliedAt).toBeTruthy();
  });

  it('email xizmati rad etsa murojaat javob berilgan deb belgilanmaydi', async () => {
    const id = await createContactMessage();
    sendContactReplyEmailMock.mockRejectedValueOnce(
      new ApiError(502, 'Email yuborilmadi', 'EMAIL_DELIVERY_FAILED'),
    );

    await adminAgent
      .post(`/api/contact/${id}/reply`)
      .send({ reply: 'Bu javob saqlanmasligi kerak' })
      .expect(502);

    const stored = await prisma.contactMessage.findUniqueOrThrow({ where: { id } });
    expect(stored.status).toBe('NEW');
    expect(stored.reply).toBeNull();
    expect(stored.repliedAt).toBeNull();
  });

  it('bo‘sh javobni rad etadi', async () => {
    const id = await createContactMessage();
    await adminAgent.post(`/api/contact/${id}/reply`).send({ reply: '   ' }).expect(400);
    expect(sendContactReplyEmailMock).not.toHaveBeenCalled();
  });

  it('admin bo‘lmagan foydalanuvchi javob yubora olmaydi', async () => {
    const id = await createContactMessage();
    await studentAgent.post(`/api/contact/${id}/reply`).send({ reply: 'Begona javob' }).expect(403);
    await request(app).post(`/api/contact/${id}/reply`).send({ reply: 'Anonim javob' }).expect(401);
    expect(sendContactReplyEmailMock).not.toHaveBeenCalled();
  });
});
