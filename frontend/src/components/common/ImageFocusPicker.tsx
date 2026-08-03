import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Crosshair, RotateCcw } from 'lucide-react';
import { clampFocus, DEFAULT_FOCUS, FOCUS_BASE_POSITION, focusPan } from '../../utils/imageFocus';

interface ImageFocusPickerProps {
  /** Rasm manzili — bo'sh bo'lsa komponent umuman ko'rinmaydi */
  url: string;
  focusX: number;
  focusY: number;
  onChange: (focusX: number, focusY: number) => void;
}

// Klaviatura bilan sozlashda bir bosishga necha foiz siljishi
const STEP = 2;

/**
 * Rasmning fokus nuqtasini tanlash.
 *
 * NEGA KERAK: sayt bo'ylab rasmlar doira yoki kvadrat kadrlarda ko'rsatiladi
 * (`object-fit: cover`), ya'ni ortiqcha qismi kesiladi. Sukutdagi markazdan
 * kesish portret suratlarda yuzni kadrdan chiqarib yuboradi. Bu yerda admin
 * rasm ustiga bosib "shu joy markazda qolsin" deb belgilaydi va natijani
 * darhol ko'radi.
 *
 * Sichqoncha, barmoq (pointer) va klaviatura — uchalasi bilan ham ishlaydi.
 */
export default function ImageFocusPicker({ url, focusX, focusY, onChange }: ImageFocusPickerProps): React.ReactElement | null {
  const { t } = useTranslation();
  const areaRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<boolean>(false);
  const [broken, setBroken] = useState<boolean>(false);

  // Rasm yo'q yoki ochilmadi — kadrlaydigan narsa yo'q
  if (!url || broken) return null;

  const applyFromPointer = (clientX: number, clientY: number): void => {
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;
    onChange(
      clampFocus(((clientX - rect.left) / rect.width) * 100),
      clampFocus(((clientY - rect.top) / rect.height) * 100)
    );
  };

  const onKeyDown = (e: React.KeyboardEvent): void => {
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-STEP, 0],
      ArrowRight: [STEP, 0],
      ArrowUp: [0, -STEP],
      ArrowDown: [0, STEP],
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    onChange(clampFocus(focusX + move[0]), clampFocus(focusY + move[1]));
  };

  const isDefault = focusX === DEFAULT_FOCUS && focusY === DEFAULT_FOCUS;
  const position = `${focusX}% ${focusY}%`;

  return (
    <div style={{ marginTop: 8, padding: 12, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <Crosshair size={13} style={{ color: '#0ea5e9', flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>{t('imageFocus.title')}</span>
        {!isDefault && (
          <button type="button" onClick={() => onChange(DEFAULT_FOCUS, DEFAULT_FOCUS)}
            style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', fontSize: 11.5, color: '#64748b', padding: 0 }}>
            <RotateCcw size={11} /> {t('imageFocus.reset')}
          </button>
        )}
      </div>

      <p style={{ fontSize: 11.5, color: '#64748b', lineHeight: 1.6, marginBottom: 9 }}>{t('imageFocus.hint')}</p>

      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* To'liq rasm — kesilmagan holda ko'rsatiladi, shuning uchun bosilgan
            nuqta rasmning haqiqiy nuqtasiga to'g'ri keladi */}
        <div
          ref={areaRef}
          role="application"
          tabIndex={0}
          aria-label={t('imageFocus.title')}
          onKeyDown={onKeyDown}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            setDragging(true);
            applyFromPointer(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => { if (dragging) applyFromPointer(e.clientX, e.clientY); }}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
          style={{ position: 'relative', display: 'block', maxWidth: 220, borderRadius: 10, overflow: 'hidden', cursor: 'crosshair', touchAction: 'none', lineHeight: 0, border: '1px solid #e2e8f0' }}
        >
          <img src={url} alt="" onError={() => setBroken(true)}
            style={{ display: 'block', width: '100%', height: 'auto', maxHeight: 220, objectFit: 'contain', background: '#fff' }} />
          {/* Nishon — ichkarida oq halqa, tashqarisida quyuq soya: ham yorug',
              ham qorong'i rasmda ko'rinib turadi */}
          <span aria-hidden="true"
            style={{ position: 'absolute', left: `${focusX}%`, top: `${focusY}%`, width: 20, height: 20, marginLeft: -10, marginTop: -10, borderRadius: '50%', border: '2px solid #fff', boxShadow: '0 0 0 2px rgba(15,23,42,0.55)', pointerEvents: 'none' }} />
        </div>

        {/* Natija — saytdagi haqiqiy kadrlar bilan bir xil o'lchamda */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <figure style={{ textAlign: 'center' }}>
            <img src={url} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', objectPosition: position, border: '2px solid #e2e8f0', display: 'block' }} />
            <figcaption style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 4 }}>{t('imageFocus.previewRound')}</figcaption>
          </figure>
          {/* Bosh sahifadagi yirik karta bilan AYNAN bir xil chiziladi
              (BigPersonCard): rasm kesilmaydi (`scale-down`), pastga tayanadi
              va fokus `transform` bo'lib tushadi. Avval bu yerda `cover`
              ishlatilardi — admin ko'rgan natija saytdagidan boshqa edi. */}
          <figure style={{ textAlign: 'center' }}>
            <div style={{ position: 'relative', width: 76, height: 95, borderRadius: 10, overflow: 'hidden', border: '2px solid #e2e8f0', background: 'linear-gradient(180deg,#f1f5f9 0%,#e2e8f0 100%)' }}>
              <span style={{ position: 'absolute', inset: 0, transform: focusPan({ focusX, focusY }) }}>
                <img src={url} alt="" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: '90%', objectFit: 'scale-down', objectPosition: FOCUS_BASE_POSITION, display: 'block' }} />
              </span>
            </div>
            <figcaption style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 4 }}>{t('imageFocus.previewCard')}</figcaption>
          </figure>
        </div>
      </div>
    </div>
  );
}
