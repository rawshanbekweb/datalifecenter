import { apiFetch } from './client';

export type UserRole = 'STUDENT' | 'MENTOR' | 'ADMIN';

export interface MessageUser {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: UserRole;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  sender: MessageUser;
}

export interface ConversationSummary {
  id: string;
  /** ADMIN — administratsiya kanali (bir tomonda barcha adminlar) */
  kind: 'DIRECT' | 'ADMIN';
  /** Administratsiyaga yozgan foydalanuvchi uchun null — u "Administratsiya"ni ko'radi */
  otherUser: MessageUser | null;
  lastMessage: { body: string; createdAt: string; senderId: string } | null;
  lastMessageAt: string;
  unreadCount: number;
}

export interface ConversationThread extends ConversationSummary {
  messages: ChatMessage[];
  hasMore: boolean;
}

export interface ContactCard extends MessageUser {
  /** Nima uchun ro'yxatda — umumiy kurs nomi */
  context?: string | null;
}

export function listConversations(): Promise<ConversationSummary[]> {
  return apiFetch('/messages/conversations');
}

/** `before` — eski xabarlarni yuklash uchun (eng eski ko'ringan xabar vaqti). */
export function getConversation(id: string, before?: string): Promise<ConversationThread> {
  const query = before ? `?before=${encodeURIComponent(before)}` : '';
  return apiFetch(`/messages/conversations/${id}${query}`);
}

interface StartConversationInput {
  recipientId?: string;
  toAdmin?: boolean;
  body: string;
}

/** Suhbatni boshlaydi yoki mavjudini davom ettiradi (bir juftlikka bitta suhbat). */
export function startConversation(input: StartConversationInput): Promise<ConversationThread> {
  return apiFetch('/messages/conversations', { method: 'POST', body: JSON.stringify(input) });
}

export function sendMessage(conversationId: string, body: string): Promise<ChatMessage> {
  return apiFetch(`/messages/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}

/**
 * Suhbatni o'qilgan deb belgilaydi.
 *
 * Yon menyudagi o'qilmaganlar belgisi alohida komponentda — u SSE yoki
 * zaxira pollingni kutsa, foydalanuvchi xabarni o'qib bo'lgach ham belgi
 * bir necha daqiqa osilib turardi. Shu sabab shu yerdan hodisa yuboriladi.
 */
export const MESSAGES_READ_EVENT = 'datalife:messages-read';

export function markConversationRead(conversationId: string): Promise<{ read: boolean }> {
  return apiFetch<{ read: boolean }>(`/messages/conversations/${conversationId}/read`, { method: 'PATCH' })
    .then((res) => {
      window.dispatchEvent(new Event(MESSAGES_READ_EVENT));
      return res;
    });
}

export function getUnreadMessagesCount(): Promise<{ unreadCount: number }> {
  return apiFetch('/messages/unread-count');
}

/** Foydalanuvchi yoza oladigan odamlar (rolga qarab cheklangan). */
export function listMessageContacts(search?: string): Promise<ContactCard[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiFetch(`/messages/contacts${query}`);
}
