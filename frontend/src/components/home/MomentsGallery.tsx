import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageIcon } from 'lucide-react';
import { ImageFocus } from '../../utils/imageFocus';

/**
 * "DATA LIFE'da bir kun" — bosh sahifadagi uzluksiz oqadigan rasm lentasi.
 *
 * Suratlar to'xtamasdan chapga oqib turadi; chetlarda keyingisi kirib,
 * oldingisi chiqib ketayotgani ko'rinadi. Sichqoncha ustiga kelganda oqim
 * to'xtaydi.
 *
 * KADR: lenta balandligi bir xil, har rasmning KENGLIGI o'z nisbatidan
 * kelib chiqadi (`height: 100%; width: auto`). Shu sabab hech bir rasm
 * kesilmaydi va yon tomonlarda bo'sh chekka ham qolmaydi — vertikal surat
 * tor, gorizontali keng bo'lib chiqadi.
 *
 * NEGA `object-fit: cover` EMAS: u kadrni to'ldirish uchun rasmning bir
 * qismini kesib tashlaydi. Foydalanuvchi uchun ofis suratidagi odamlarning
 * kesilib qolishi asosiy e'tiroz edi.
 */

export interface MomentItem extends ImageFocus {
  id: string;
  imageUrl: string;
  title: string;
  caption?: string | null;
  happenedAt?: string | null;
}

interface MomentsGalleryProps {
  items: MomentItem[];
}

// Lenta balandligi (px) va suratlar orasidagi masofa
const ROW_HEIGHT = 380;
const GAP = 14;
// Oqim tezligi — sekundiga necha piksel siljiydi
const SPEED_PX_PER_SEC = 34;

function formatDay(value: string | null | undefined, locale: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'long' });
}

/**
 * Surat qo'shilmagandagi shablon — sokin, oq, shunchaki joyni belgilaydi.
 * Ayni paytda birinchi so'rov kelguncha ko'rinadigan holat ham shu, shuning
 * uchun sahifa ochilganda joy sakramaydi.
 */
function EmptyBand(): React.ReactElement {
  const { t } = useTranslation();
  return (
    <div style={{
      height: ROW_HEIGHT, borderRadius: 18, background: '#ffffff',
      border: '1.5px dashed #e2e8f0', boxShadow: '0 8px 28px rgba(15,23,42,0.06)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 12, padding: 28, textAlign: 'center',
    }}>
      <span style={{
        width: 54, height: 54, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f8fafc', border: '1px solid #e2e8f0',
      }}>
        <ImageIcon size={22} style={{ color: '#cbd5e1' }} />
      </span>
      <div>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#475569', lineHeight: 1.4 }}>
          {t('home.moments.emptyTitle')}
        </p>
        <p style={{ fontSize: 12.5, color: '#94a3b8', lineHeight: 1.65, marginTop: 5, maxWidth: 240 }}>
          {t('home.moments.emptyText')}
        </p>
      </div>
    </div>
  );
}

function Photo({ item, locale }: { item: MomentItem; locale: string }): React.ReactElement {
  const day = formatDay(item.happenedAt, locale);
  return (
    <figure style={{
      position: 'relative', height: '100%', flexShrink: 0, borderRadius: 16, overflow: 'hidden',
      background: '#f1f5f9', boxShadow: '0 8px 26px rgba(15,23,42,0.14)',
    }}>
      {/* height:100% + width:auto — rasm o'z nisbatini saqlaydi, kesilmaydi */}
      <img src={item.imageUrl} alt={item.title} loading="lazy" decoding="async"
        style={{ height: '100%', width: 'auto', display: 'block', maxWidth: 'none' }} />

      <figcaption style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, padding: '26px 14px 12px', color: '#fff',
        background: 'linear-gradient(180deg, rgba(15,23,42,0) 0%, rgba(15,23,42,0.8) 100%)',
      }}>
        {day && <p style={{ fontSize: 10.5, opacity: 0.85, marginBottom: 2, fontFamily: 'var(--font-mono)' }}>{day}</p>}
        <p style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.35, textShadow: '0 1px 10px rgba(0,0,0,0.45)' }}>
          {item.title}
        </p>
      </figcaption>
    </figure>
  );
}

export default function MomentsGallery({ items }: MomentsGalleryProps): React.ReactElement {
  const { i18n } = useTranslation();
  const setRef = useRef<HTMLDivElement>(null);
  const [setWidth, setSetWidth] = useState<number>(0);

  // Bitta to'plamning kengligini o'lchaymiz: halqa aynan shu masofaga
  // siljiganda ikkinchi nusxa birinchisining o'rniga tushadi va ulanish
  // ko'rinmaydi. Rasm yuklangach kenglik o'zgargani uchun ResizeObserver.
  useEffect(() => {
    const el = setRef.current;
    if (!el) return;
    const update = (): void => setSetWidth(el.scrollWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [items]);

  if (items.length === 0) return <EmptyBand />;

  // Surat kam bo'lsa halqa uzilib qolmasligi uchun to'plam bir necha marta
  // takrorlanadi — ekran kengligidan oshgunicha
  const copies = items.length >= 4 ? 2 : Math.max(2, Math.ceil(6 / items.length));
  const duration = setWidth > 0 ? setWidth / SPEED_PX_PER_SEC : 0;

  const row = (ref?: React.Ref<HTMLDivElement>, key?: string): React.ReactElement => (
    <div key={key} ref={ref} style={{ display: 'flex', gap: GAP, height: '100%' }}>
      {items.map((it: MomentItem) => <Photo key={it.id} item={it} locale={i18n.language} />)}
    </div>
  );

  return (
    <div className="dl-flow-wrap" style={{ height: ROW_HEIGHT, overflow: 'hidden' }}>
      <div
        className="dl-flow"
        style={{
          display: 'flex', gap: GAP, height: '100%', width: 'max-content',
          // Kenglik o'lchanmaguncha animatsiya boshlanmaydi (aks holda
          // birinchi kadrda sakrab ketardi)
          ...(duration > 0
            ? ({ ['--dl-flow-x' as string]: `-${setWidth + GAP}px`, ['--dl-flow-dur' as string]: `${duration}s` })
            : { animation: 'none' }),
        }}
      >
        {row(setRef, 'set-0')}
        {Array.from({ length: copies - 1 }, (_, i) => row(undefined, `set-${i + 1}`))}
      </div>
    </div>
  );
}
