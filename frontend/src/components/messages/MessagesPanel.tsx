import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ChevronUp, MessageSquarePlus, Search, Send, Shield, X } from 'lucide-react';
import {
  ChatMessage,
  ContactCard,
  ConversationSummary,
  ConversationThread,
  getConversation,
  listConversations,
  listMessageContacts,
  markConversationRead,
  sendMessage,
  startConversation,
} from '../../api/messages';
import { subscribeNotifications } from '../../api/notifications';
import { useAuth } from '../../hooks/useAuth';
import Loading from '../common/Loading';
import { useToast } from '../common/Feedback';

/**
 * Talaba, mentor va admin kabinetlaridagi YAGONA yozishma oynasi.
 *
 * Uchta kabinet uchun uchta nusxa yozish o'rniga bitta komponent: ruxsat
 * qoidalari baribir serverda, UI esa har uch rolda bir xil (chap tomonda
 * suhbatlar, o'ngda yozishma). Rolga qarab farq qiladigan yagona narsa —
 * aksent rangi va kimga yozish mumkinligi (uni server hal qiladi).
 *
 * JONLI YANGILANISH: yangi xabar Notification ham yaratadi, shuning uchun
 * mavjud SSE oqimidagi 'notify' hodisasi shu oynani ham yangilaydi —
 * alohida soket yoki qisqa oraliqli polling kerak emas.
 */

interface Props {
  /** Kabinet aksent rangi (talaba — moviy, mentor — binafsha, admin — ko'k) */
  accent?: string;
}

function timeLabel(iso: string, locale: string): string {
  const date = new Date(iso);
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  return sameDay
    ? date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

function initialsOf(name: string): string {
  return (name || '?').charAt(0).toUpperCase();
}

export default function MessagesPanel({ accent = '#0ea5e9' }: Props): React.ReactElement {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [thread, setThread] = useState<ConversationThread | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [threadLoading, setThreadLoading] = useState<boolean>(false);
  const [draft, setDraft] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [pickerOpen, setPickerOpen] = useState<boolean>(false);
  const [contacts, setContacts] = useState<ContactCard[]>([]);
  const [contactSearch, setContactSearch] = useState<string>('');
  const [loadingOlder, setLoadingOlder] = useState<boolean>(false);
  // Fon yangilanishidagi tarmoq xatosi butun oynani "xato" holatiga
  // o'tkazmasligi kerak — faqat birinchi yuklash muhim
  const loadedOnce = useRef<boolean>(false);
  const searchTimer = useRef<number | null>(null);

  // Bildirishnomadagi havola aynan kerakli suhbatni ochadi (?c=<id>)
  const activeId = searchParams.get('c');
  const bottomRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef<HTMLTextAreaElement>(null);

  const setActiveId = useCallback((id: string | null): void => {
    setSearchParams(id ? { c: id } : {}, { replace: true });
  }, [setSearchParams]);

  const loadConversations = useCallback((): void => {
    listConversations()
      .then((list) => { setConversations(list); setStatus('ready'); loadedOnce.current = true; })
      .catch(() => { if (!loadedOnce.current) setStatus('error'); });
  }, []);

  const loadThread = useCallback((id: string, showSpinner: boolean): void => {
    if (showSpinner) setThreadLoading(true);
    getConversation(id)
      .then((data) => {
        setThread(data);
        // Ochilgan suhbat o'qilgan hisoblanadi — belgini darhol tushiramiz
        if (data.unreadCount > 0) {
          setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)));
          markConversationRead(id).catch(() => {});
        }
      })
      .catch(() => setThread(null))
      .finally(() => setThreadLoading(false));
  }, []);

  useEffect(loadConversations, [loadConversations]);

  useEffect(() => {
    if (!activeId) { setThread(null); return; }
    // Eski yozishmani darhol tozalaymiz — aks holda yangi suhbat
    // yuklanguncha ekranda BOSHQA odamning xabarlari turib qolardi
    setThread(null);
    loadThread(activeId, true);
  }, [activeId, loadThread]);

  // Jonli yangilanish: yangi xabar kelganda ro'yxat ham, ochiq suhbat ham.
  //
  // Obuna FAQAT bir marta ochiladi: har bir SSE ulanishi serverda resurs
  // egallaydi va bitta foydalanuvchiga 5 tadan ortiq ulanishga ruxsat
  // berilmaydi — suhbat almashtirilganda qayta ulanilsa, qo'ng'iroq
  // (NotificationBell) ulanishi ham siqib chiqarilishi mumkin edi.
  // Shu sabab joriy suhbat id'si ref orqali o'qiladi.
  const activeIdRef = useRef<string | null>(activeId);
  activeIdRef.current = activeId;

  useEffect(() => {
    const refresh = (): void => {
      loadConversations();
      const current = activeIdRef.current;
      if (current) loadThread(current, false);
    };
    return subscribeNotifications(refresh);
  }, [loadConversations, loadThread]);

  // Yangi xabar kelganda oxiriga tushamiz.
  //
  // Bog'lanish ATAYIN oxirgi xabar id'siga: xabarlar SONI eski yozishmalar
  // yuklanganda ham o'zgaradi va o'shanda pastga sakrash foydalanuvchi
  // endigina ochgan eski xabarlarni ko'zdan yo'qotardi.
  const lastMessageId = thread?.messages[thread.messages.length - 1]?.id;
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [lastMessageId, thread?.id]);

  // Komponent yopilganda kutayotgan qidiruv so'rovi osilib qolmasin
  useEffect(() => () => {
    if (searchTimer.current !== null) window.clearTimeout(searchTimer.current);
  }, []);

  const openPicker = (): void => {
    setPickerOpen(true);
    listMessageContacts().then(setContacts).catch(() => setContacts([]));
  };

  const searchContacts = (value: string): void => {
    setContactSearch(value);
    // Qidiruv serverda bajariladi (admin ro'yxati uzun bo'lishi mumkin),
    // shuning uchun har bosilgan harf uchun so'rov yubormaymiz
    if (searchTimer.current !== null) window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => {
      searchTimer.current = null;
      listMessageContacts(value.trim() || undefined).then(setContacts).catch(() => {});
    }, 300);
  };

  // Eski xabarlar: yozishma uzun bo'lsa boshidan 40 tasi yuklanadi,
  // qolganini foydalanuvchi so'raganda olib kelamiz
  const loadOlder = async (): Promise<void> => {
    if (!thread || loadingOlder || thread.messages.length === 0) return;
    setLoadingOlder(true);
    try {
      const older = await getConversation(thread.id, thread.messages[0].createdAt);
      setThread((prev) => (prev && prev.id === older.id
        ? { ...prev, messages: [...older.messages, ...prev.messages], hasMore: older.hasMore }
        : prev));
    } catch {
      // yuklanmadi — mavjud xabarlar joyida qoladi
    } finally {
      setLoadingOlder(false);
    }
  };

  const send = async (): Promise<void> => {
    const body = draft.trim();
    if (!body || sending || !thread) return;
    setSending(true);
    try {
      const message = await sendMessage(thread.id, body);
      setDraft('');
      if (draftRef.current) draftRef.current.style.height = 'auto';
      setThread((prev) => (prev ? { ...prev, messages: [...prev.messages, message] } : prev));
      loadConversations();
    } catch (err: unknown) {
      toast.error((err as Error).message || t('common.error'));
    } finally {
      setSending(false);
    }
  };

  // Yangi suhbat: aniq odamga yoki administratsiyaga
  const startWith = async (target: { recipientId?: string; toAdmin?: boolean }, body: string): Promise<void> => {
    if (!body.trim()) return;
    setSending(true);
    try {
      const created = await startConversation({ ...target, body: body.trim() });
      setPickerOpen(false);
      // Yozishmani activeId effekti yuklaydi — bu yerda qo'shimcha
      // setThread qilinsa u darhol qayta so'ralib, ekran bir "sakrardi"
      setActiveId(created.id);
      loadConversations();
    } catch (err: unknown) {
      toast.error((err as Error).message || t('common.error'));
    } finally {
      setSending(false);
    }
  };

  const titleOf = (conversation: ConversationSummary): string =>
    conversation.kind === 'ADMIN' && !conversation.otherUser
      ? t('messages.administration')
      : conversation.otherUser?.name ?? t('messages.unknownUser');

  const subtitleOf = (conversation: ConversationSummary): string | null => {
    if (conversation.kind === 'ADMIN') {
      return conversation.otherUser ? t('messages.toAdminChannel') : null;
    }
    return conversation.otherUser ? t(`messages.roles.${conversation.otherUser.role}`) : null;
  };

  const totalUnread = useMemo(
    () => conversations.reduce((sum, c) => sum + c.unreadCount, 0),
    [conversations],
  );

  if (status === 'loading') return <Loading />;
  if (status === 'error') return <p style={{ color: '#dc2626', fontSize: 14 }}>{t('common.loadFailed')}</p>;

  const listColumn = (
    <div className="msg-list" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
        <p style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a', flex: 1 }}>
          {t('messages.conversations')}
          {totalUnread > 0 && (
            <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 800, color: '#fff', background: '#f43f5e', borderRadius: 20, padding: '2px 7px' }}>
              {totalUnread}
            </span>
          )}
        </p>
        <button onClick={openPicker} title={t('messages.newConversation')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 9, border: '1px solid #e2e8f0', background: '#fff', color: accent, cursor: 'pointer' }}>
          <MessageSquarePlus size={16} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {conversations.length === 0 && (
          <p style={{ padding: '18px 16px', fontSize: 13, color: '#94a3b8', lineHeight: 1.7 }}>{t('messages.emptyList')}</p>
        )}
        {conversations.map((conversation) => {
          const active = conversation.id === activeId;
          return (
            <button key={conversation.id} onClick={() => setActiveId(conversation.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
                padding: '11px 14px', border: 'none', borderBottom: '1px solid #f8fafc', cursor: 'pointer',
                background: active ? '#f8fafc' : '#fff',
                borderLeft: active ? `3px solid ${accent}` : '3px solid transparent',
              }}>
              <Avatar user={conversation.otherUser} kind={conversation.kind} accent={accent} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <p style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {titleOf(conversation)}
                  </p>
                  <span style={{ fontSize: 10.5, color: '#cbd5e1', flexShrink: 0 }}>
                    {timeLabel(conversation.lastMessageAt, i18n.language)}
                  </span>
                </div>
                <p style={{ fontSize: 11.5, color: conversation.unreadCount > 0 ? '#334155' : '#94a3b8', fontWeight: conversation.unreadCount > 0 ? 700 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {conversation.lastMessage?.body ?? subtitleOf(conversation) ?? ''}
                </p>
              </div>
              {conversation.unreadCount > 0 && (
                <span style={{ flexShrink: 0, fontSize: 10.5, fontWeight: 800, color: '#fff', background: '#f43f5e', borderRadius: 20, padding: '1px 6px' }}>
                  {conversation.unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  const threadColumn = (
    <div className="msg-thread" style={{ display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0 }}>
      {!thread && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          {threadLoading
            ? <Loading />
            : <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 1.8 }}>{t('messages.pickConversation')}</p>}
        </div>
      )}

      {thread && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
            <button className="msg-back" onClick={() => setActiveId(null)}
              style={{ display: 'none', width: 30, height: 30, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', cursor: 'pointer', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowLeft size={15} />
            </button>
            <Avatar user={thread.otherUser} kind={thread.kind} accent={accent} />
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a' }}>{titleOf(thread)}</p>
              {subtitleOf(thread) && <p style={{ fontSize: 11.5, color: '#94a3b8' }}>{subtitleOf(thread)}</p>}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10, background: '#f8fafc' }}>
            {threadLoading && <Loading />}
            {!threadLoading && thread.hasMore && (
              <button onClick={() => void loadOlder()} disabled={loadingOlder}
                style={{ alignSelf: 'center', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: accent, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: '5px 14px', cursor: 'pointer', opacity: loadingOlder ? 0.6 : 1 }}>
                <ChevronUp size={13} /> {loadingOlder ? t('common.loading') : t('messages.loadOlder')}
              </button>
            )}
            {!threadLoading && thread.messages.length === 0 && (
              <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>{t('messages.emptyThread')}</p>
            )}
            {thread.messages.map((message) => (
              <Bubble key={message.id} message={message} own={message.senderId === user?.id} accent={accent} locale={i18n.language} />
            ))}
            <div ref={bottomRef} />
          </div>

          <div style={{ display: 'flex', gap: 8, padding: '12px 14px', borderTop: '1px solid #f1f5f9', background: '#fff' }}>
            <textarea
              ref={draftRef}
              className="inp"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                // Uzun xabar 40px'lik qutiga tiqilib qolmasin — maydon o'sadi
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={(e) => {
                // Enter — yuborish, Shift+Enter — yangi qator (chatning odatiy xulqi)
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder={t('messages.placeholder')}
              rows={1}
              style={{ flex: 1, resize: 'none', minHeight: 40, maxHeight: 120 }}
            />
            <button onClick={() => void send()} disabled={sending || !draft.trim()} className="btn-primary"
              style={{ flexShrink: 0, opacity: sending || !draft.trim() ? 0.6 : 1 }}>
              <Send size={15} />
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      <div className="msg-grid card" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', height: 'calc(100vh - 190px)', minHeight: 420, overflow: 'hidden', padding: 0 }}>
        <div style={{ borderRight: '1px solid #f1f5f9', minWidth: 0, display: 'flex', flexDirection: 'column' }}>{listColumn}</div>
        {threadColumn}
      </div>

      {pickerOpen && (
        <ContactPicker
          contacts={contacts}
          search={contactSearch}
          onSearch={searchContacts}
          onClose={() => setPickerOpen(false)}
          onStart={(target, body) => void startWith(target, body)}
          // Admin administratsiyaning o'zi — bu yo'nalish unga ko'rsatilmaydi
          allowAdminChannel={user?.role !== 'ADMIN'}
          accent={accent}
          busy={sending}
        />
      )}

      <style>{`
        @media (max-width: 820px) {
          .msg-grid { grid-template-columns: 1fr !important; height: calc(100vh - 170px) !important; }
          .msg-grid > div:first-child { display: ${activeId ? 'none' : 'flex'} !important; border-right: none !important; }
          .msg-thread { display: ${activeId ? 'flex' : 'none'} !important; }
          .msg-back { display: flex !important; }
        }
      `}</style>
    </>
  );
}

function Avatar({ user, kind, accent }: { user: { name: string; avatarUrl: string | null } | null; kind: 'DIRECT' | 'ADMIN'; accent: string }): React.ReactElement {
  // Administratsiya kanali aniq odam emas — qalqon belgisi bilan ko'rsatiladi
  if (!user) {
    return (
      <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Shield size={15} />
      </div>
    );
  }
  if (user.avatarUrl) {
    return <img src={user.avatarUrl} alt={user.name} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  }
  return (
    <div style={{ width: 34, height: 34, borderRadius: '50%', background: kind === 'ADMIN' ? '#0f172a' : accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
      {initialsOf(user.name)}
    </div>
  );
}

function Bubble({ message, own, accent, locale }: { message: ChatMessage; own: boolean; accent: string; locale: string }): React.ReactElement {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: own ? 'flex-end' : 'flex-start' }}>
      {!own && (
        <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, marginBottom: 3, paddingLeft: 4 }}>{message.sender.name}</p>
      )}
      <div style={{
        maxWidth: '78%', padding: '9px 13px', borderRadius: 14,
        borderBottomRightRadius: own ? 4 : 14, borderBottomLeftRadius: own ? 14 : 4,
        background: own ? accent : '#fff', color: own ? '#fff' : '#0f172a',
        border: own ? 'none' : '1px solid #e2e8f0',
        fontSize: 13.5, lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      }}>
        {message.body}
      </div>
      <span style={{ fontSize: 10, color: '#cbd5e1', marginTop: 3, padding: '0 4px' }}>
        {timeLabel(message.createdAt, locale)}
      </span>
    </div>
  );
}

interface PickerProps {
  contacts: ContactCard[];
  search: string;
  onSearch: (value: string) => void;
  onClose: () => void;
  onStart: (target: { recipientId?: string; toAdmin?: boolean }, body: string) => void;
  /** Adminning ozi administratsiyaga yoza olmaydi — unga bu yonalish korsatilmaydi */
  allowAdminChannel: boolean;
  accent: string;
  busy: boolean;
}

/**
 * Yangi yozishma: avval kimga, keyin nima yozilishi.
 *
 * Birinchi xabar ATAYIN shu yerda soraladi. Ilgari kontakt bosilishi bilan
 * standart salomlashuv avtomatik yuborilardi — foydalanuvchi ozi yozmagan
 * xabar uning nomidan ketardi, suhbatdosh esa mazmunsiz salom olardi.
 * Endi suhbat faqat haqiqiy xabar bilan boshlanadi.
 */
function ContactPicker({ contacts, search, onSearch, onClose, onStart, allowAdminChannel, accent, busy }: PickerProps): React.ReactElement {
  const { t } = useTranslation();
  const [target, setTarget] = useState<{ recipientId?: string; toAdmin?: boolean; name: string } | null>(null);
  const [body, setBody] = useState<string>('');

  // Escape — modalni yopish (yoki tanlovga qaytish) odatiy kutilma
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape') return;
      if (target) setTarget(null);
      else onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [target, onClose]);

  const submit = (): void => {
    if (!target || !body.trim()) return;
    onStart({ recipientId: target.recipientId, toAdmin: target.toAdmin }, body);
  };

  return (
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} className="card"
        style={{ width: '100%', maxWidth: 420, maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
          {target && (
            <button onClick={() => setTarget(null)}
              style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ArrowLeft size={15} />
            </button>
          )}
          <p style={{ flex: 1, fontSize: 14, fontWeight: 800, color: '#0f172a', minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {target ? target.name : t('messages.newConversation')}
          </p>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <X size={15} />
          </button>
        </div>

        {target ? (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>{t('messages.firstMessageLabel')}</label>
            <textarea className="inp" value={body} autoFocus rows={4}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
              }}
              placeholder={t('messages.placeholder')} style={{ resize: 'vertical' }} />
            <button onClick={submit} disabled={busy || !body.trim()} className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', opacity: busy || !body.trim() ? 0.6 : 1 }}>
              <Send size={14} /> {busy ? t('common.sending') : t('messages.startAndSend')}
            </button>
          </div>
        ) : (
          <>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Search size={15} style={{ color: '#94a3b8', flexShrink: 0 }} />
              <input className="inp" value={search} onChange={(e) => onSearch(e.target.value)}
                placeholder={t('messages.searchContacts')} style={{ flex: 1 }} />
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {allowAdminChannel && (
                <button onClick={() => setTarget({ toAdmin: true, name: t('messages.administration') })}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '12px 16px', border: 'none', borderBottom: '1px solid #f8fafc', background: '#fff', cursor: 'pointer' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Shield size={15} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{t('messages.administration')}</p>
                    <p style={{ fontSize: 11.5, color: '#94a3b8' }}>{t('messages.administrationHint')}</p>
                  </div>
                </button>
              )}

              {contacts.length === 0 && (
                <p style={{ padding: '18px 16px', fontSize: 12.5, color: '#94a3b8', lineHeight: 1.7 }}>
                  {search.trim() ? t('messages.noSearchResults') : t('messages.noContacts')}
                </p>
              )}

              {contacts.map((contact) => (
                <button key={contact.id} onClick={() => setTarget({ recipientId: contact.id, name: contact.name })}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '11px 16px', border: 'none', borderBottom: '1px solid #f8fafc', background: '#fff', cursor: 'pointer' }}>
                  {contact.avatarUrl ? (
                    <img src={contact.avatarUrl} alt={contact.name} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
                      {initialsOf(contact.name)}
                    </div>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{contact.name}</p>
                    <p style={{ fontSize: 11.5, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {contact.context || t(`messages.roles.${contact.role}`)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
