/* oxlint-disable react/only-export-components -- provider bilan birga hook'lar ham shu fayldan eksport qilinadi */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, m } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Brauzerning xom alert/confirm/prompt oynalari o'rniga sayt dizayniga mos
// toast va modal tizimi. Ishlatish:
//   const toast = useToast();            toast.error(xabar) / toast.success(xabar)
//   const confirm = useConfirm();        if (!(await confirm(xabar, { danger: true }))) return;
//   const promptText = usePrompt();      const v = await promptText(xabar, { multiline: true });

type ToastKind = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

export interface ConfirmOptions {
  title?: string;
  confirmLabel?: string;
  danger?: boolean;
}

export interface PromptOptions {
  title?: string;
  placeholder?: string;
  multiline?: boolean;
  confirmLabel?: string;
}

type DialogState =
  | { kind: 'confirm'; message: string; opts: ConfirmOptions; resolve: (v: boolean) => void }
  | { kind: 'prompt'; message: string; opts: PromptOptions; resolve: (v: string | null) => void };

interface FeedbackApi {
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
  };
  confirm: (message: string, opts?: ConfirmOptions) => Promise<boolean>;
  prompt: (message: string, opts?: PromptOptions) => Promise<string | null>;
}

const FeedbackContext = createContext<FeedbackApi | null>(null);

const TOAST_STYLE: Record<ToastKind, { bg: string; border: string; color: string; icon: React.ReactElement }> = {
  success: { bg: '#f0fdf4', border: '#bbf7d0', color: '#166534', icon: <CheckCircle2 size={16} style={{ color: '#16a34a', flexShrink: 0 }} /> },
  error:   { bg: '#fef2f2', border: '#fecaca', color: '#991b1b', icon: <AlertTriangle size={16} style={{ color: '#dc2626', flexShrink: 0 }} /> },
  info:    { bg: '#f0f9ff', border: '#bae6fd', color: '#075985', icon: <Info size={16} style={{ color: '#0284c7', flexShrink: 0 }} /> },
};

function DialogCard({ dialog, onDone }: { dialog: DialogState; onDone: () => void }): React.ReactElement {
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);

  const cancel = useCallback((): void => {
    if (dialog.kind === 'confirm') dialog.resolve(false);
    else dialog.resolve(null);
    onDone();
  }, [dialog, onDone]);

  const submit = (): void => {
    if (dialog.kind === 'confirm') dialog.resolve(true);
    else dialog.resolve(value);
    onDone();
  };

  useEffect(() => {
    // Ochilganda mos elementga fokus: prompt'da kiritish maydoni, confirm'da tugma
    if (dialog.kind === 'prompt') (dialog.opts.multiline ? textareaRef : inputRef).current?.focus();
    else confirmBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') cancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialog, cancel]);

  const danger = dialog.kind === 'confirm' && dialog.opts.danger;
  const confirmLabel = dialog.opts.confirmLabel
    || (dialog.kind === 'confirm' ? (danger ? t('common.delete') : t('common.confirm')) : t('common.confirm'));

  return (
    <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
      onClick={cancel}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 8000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <m.div initial={{ opacity: 0, y: 14, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }} transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true"
        style={{ background: '#fff', borderRadius: 16, padding: 22, maxWidth: 420, width: '100%', boxShadow: '0 24px 64px rgba(15,23,42,0.25)' }}>
        {danger && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 12, background: '#fef2f2', marginBottom: 12 }}>
            <AlertTriangle size={20} style={{ color: '#dc2626' }} />
          </div>
        )}
        {dialog.opts.title && (
          <p style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>{dialog.opts.title}</p>
        )}
        <p style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.55, whiteSpace: 'pre-line' }}>{dialog.message}</p>

        {dialog.kind === 'prompt' && (
          dialog.opts.multiline ? (
            <textarea ref={textareaRef} className="inp" rows={3} value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={dialog.opts.placeholder}
              style={{ width: '100%', marginTop: 12, resize: 'vertical' }} />
          ) : (
            <input ref={inputRef} className="inp" value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
              placeholder={dialog.opts.placeholder}
              style={{ width: '100%', marginTop: 12 }} />
          )
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
          <button onClick={cancel} className="btn-outline" style={{ fontSize: 13, padding: '9px 16px' }}>
            {t('common.cancel')}
          </button>
          <button ref={confirmBtnRef} onClick={submit}
            className={danger ? undefined : 'btn-primary'}
            disabled={dialog.kind === 'prompt' && !value.trim()}
            style={danger
              ? { fontSize: 13, padding: '9px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, background: '#dc2626', color: '#fff' }
              : { fontSize: 13, padding: '9px 16px', opacity: dialog.kind === 'prompt' && !value.trim() ? 0.5 : 1 }}>
            {confirmLabel}
          </button>
        </div>
      </m.div>
    </m.div>
  );
}

export function FeedbackProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const nextId = useRef(1);

  const pushToast = useCallback((kind: ToastKind, message: string): void => {
    const id = nextId.current++;
    setToasts((list) => [...list, { id, kind, message }]);
    // Xato xabari o'qishga ko'proq vaqt talab qiladi
    const ttl = kind === 'error' ? 6000 : 3500;
    window.setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), ttl);
  }, []);

  const api = useMemo<FeedbackApi>(() => ({
    toast: {
      success: (message) => pushToast('success', message),
      error: (message) => pushToast('error', message),
      info: (message) => pushToast('info', message),
    },
    confirm: (message, opts = {}) =>
      new Promise<boolean>((resolve) => {
        setDialog((prev) => {
          // Bir vaqtda bitta dialog: eskisi bekor qilingan hisoblanadi
          if (prev) {
            if (prev.kind === 'confirm') prev.resolve(false);
            else prev.resolve(null);
          }
          return { kind: 'confirm', message, opts, resolve };
        });
      }),
    prompt: (message, opts = {}) =>
      new Promise<string | null>((resolve) => {
        setDialog((prev) => {
          if (prev) {
            if (prev.kind === 'confirm') prev.resolve(false);
            else prev.resolve(null);
          }
          return { kind: 'prompt', message, opts, resolve };
        });
      }),
  }), [pushToast]);

  return (
    <FeedbackContext.Provider value={api}>
      {children}
      {createPortal(
        <>
          <div style={{ position: 'fixed', top: 16, right: 16, left: 16, zIndex: 9000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, pointerEvents: 'none' }}>
            <AnimatePresence>
              {toasts.map((toastItem) => {
                const s = TOAST_STYLE[toastItem.kind];
                return (
                  <m.div key={toastItem.id} layout
                    initial={{ opacity: 0, y: -10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }} transition={{ duration: 0.18 }}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 8, maxWidth: 380, width: 'fit-content', background: s.bg, border: `1.5px solid ${s.border}`, borderRadius: 12, padding: '11px 12px', boxShadow: '0 10px 30px rgba(15,23,42,0.12)', pointerEvents: 'auto' }}>
                    {s.icon}
                    <p style={{ fontSize: 13, fontWeight: 600, color: s.color, lineHeight: 1.45, wordBreak: 'break-word' }}>{toastItem.message}</p>
                    <button onClick={() => setToasts((list) => list.filter((x) => x.id !== toastItem.id))}
                      style={{ display: 'flex', border: 'none', background: 'transparent', cursor: 'pointer', color: s.color, opacity: 0.55, padding: 2, marginLeft: 2 }}>
                      <X size={13} />
                    </button>
                  </m.div>
                );
              })}
            </AnimatePresence>
          </div>
          <AnimatePresence>
            {dialog && <DialogCard dialog={dialog} onDone={() => setDialog(null)} />}
          </AnimatePresence>
        </>,
        document.body,
      )}
    </FeedbackContext.Provider>
  );
}

function useFeedback(): FeedbackApi {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedback FeedbackProvider ichida chaqirilishi kerak');
  return ctx;
}

export function useToast(): FeedbackApi['toast'] {
  return useFeedback().toast;
}

export function useConfirm(): FeedbackApi['confirm'] {
  return useFeedback().confirm;
}

export function usePrompt(): FeedbackApi['prompt'] {
  return useFeedback().prompt;
}
