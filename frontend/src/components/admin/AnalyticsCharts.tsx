/* oxlint-disable react/only-export-components -- ranglar jadvali grafiklar bilan bitta joyda tursin */
import { useState } from 'react';
import { formatNumber } from '../../utils/format';

/**
 * Monitoring sahifasining grafiklari — SVG'da qo'lda chizilgan.
 *
 * Grafik kutubxonasi ATAYIN qo'shilmadi: bu yerda kerak bo'lgani ikkita
 * shakl (ustunlar va uchqun chizig'i), ular esa ~150 qator SVG. Recharts
 * yoki d3 bundle'ga yuzlab kilobayt qo'shardi va admin panel sahifasi
 * shundoq ham eng og'iri.
 *
 * QOIDALAR (buzilmasin):
 * — Bitta grafikda bitta o'lchov. Ko'rishlar va yozilishlar bir kartaga
 *   ikkita o'q bilan chizilmaydi: miqyoslari har xil, taqqoslash yolg'on
 *   chiqadi. Shuning uchun tepada o'lchov tanlanadi, grafik bitta qoladi.
 * — Matn hech qachon ma'lumot rangida bo'lmaydi; rang faqat markerda.
 */

/** Har o'lchovning o'z rangi — filtr o'zgarganda rang KO'CHMAYDI */
export const METRIC_COLORS = {
  views: '#0891b2',
  likes: '#f43f5e',
  users: '#9333ea',
  enrollments: '#16a34a',
} as const;

export type MetricKey = keyof typeof METRIC_COLORS;

const GRID = '#e2e8f0';
const INK_MUTED = '#94a3b8';

// ---------------------------------------------------------------- Sparkline

interface SparklineProps {
  values: number[];
  color: string;
}

/**
 * Karta ichidagi mayda tendensiya chizig'i — o'q va raqamsiz.
 * U aniq qiymatni emas, shaklni ko'rsatadi; raqam kartaning o'zida turadi.
 */
export function Sparkline({ values, color }: SparklineProps): React.ReactElement {
  const width = 120;
  const height = 32;
  const max = Math.max(...values, 1);

  const points = values.map((value, i) => {
    const x = values.length === 1 ? width : (i / (values.length - 1)) * width;
    // 2px chiziq qalinligi kadrga sig'ishi uchun tepa-pastdan 2px qoldiriladi
    const y = height - 2 - (value / max) * (height - 4);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" style={{ display:'block' }}>
      <polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
    </svg>
  );
}

// -------------------------------------------------------------- ColumnChart

export interface ColumnPoint {
  label: string;
  /** Ekranga chiqadigan to'liq sana — ko'rsatkichda ko'rinadi */
  fullLabel: string;
  value: number;
}

interface ColumnChartProps {
  points: ColumnPoint[];
  color: string;
  /** Ko'rsatkichdagi qiymat nomi ("Ko'rishlar") */
  valueLabel: string;
  emptyText: string;
}

/**
 * O'qdagi belgilar yumaloq sonlarga tekislanadi (0 / 50 / 100).
 * Qadamlar ichida 2.5 yo'q: o'rta belgi max/2 bo'lgani uchun 25 kabi cho'qqi
 * "12.5" ni berardi va u yaxlitlanib chiziqdan siljib qolardi.
 */
function niceMax(value: number): number {
  if (value <= 5) return 5;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const steps = [1, 2, 5, 10];
  return magnitude * (steps.find((step) => value <= magnitude * step) ?? 10);
}

const PLOT_HEIGHT = 190;

/**
 * Kunlik ustunlar. Vaqt bo'yicha o'zgarish uchun ustun tanlangan (chiziq emas):
 * kunlar diskret va ko'pincha nolga tushadi — chiziq ularni bir-biriga
 * ulab, bo'lmagan "oqim"ni ko'rsatardi.
 *
 * SVG emas, oddiy HTML: cho'ziladigan viewBox ustunning yumaloq uchini ham,
 * qalinligini ham buzib yuborardi (90 kunlik va 7 kunlik davrda bir xil
 * ko'rinmasdi). Foizli balandlik va piksel kenglik bu muammoni yechadi.
 */
export function ColumnChart({ points, color, valueLabel, emptyText }: ColumnChartProps): React.ReactElement {
  const [hover, setHover] = useState<number | null>(null);

  const total = points.reduce((sum, p) => sum + p.value, 0);
  if (!points.length || total === 0) {
    return (
      <div style={{ height:PLOT_HEIGHT, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <p style={{ fontSize:13, color:INK_MUTED }}>{emptyText}</p>
      </div>
    );
  }

  const max = niceMax(Math.max(...points.map((p) => p.value)));
  const ticks = [max, max / 2, 0];
  const active = hover !== null ? points[hover] : null;

  return (
    <div style={{ position:'relative', paddingLeft:46 }}>
      {/* O'q belgilari */}
      <div style={{ position:'absolute', left:0, top:0, width:38, height:PLOT_HEIGHT, pointerEvents:'none' }}>
        {ticks.map((tick, i) => (
          <p key={tick} style={{
            position:'absolute', top:(i * PLOT_HEIGHT) / (ticks.length - 1) - 6, right:0,
            fontSize:10.5, color:INK_MUTED, fontVariantNumeric:'tabular-nums',
          }}>{formatNumber(Math.round(tick))}</p>
        ))}
      </div>

      <div style={{ position:'relative', height:PLOT_HEIGHT }} onMouseLeave={() => setHover(null)}>
        {/* To'r — sirtdan bir qadam farq qiladigan ingichka chiziqlar */}
        {ticks.map((tick, i) => (
          <div key={tick} style={{
            position:'absolute', left:0, right:0, top:(i * PLOT_HEIGHT) / (ticks.length - 1),
            borderTop:`1px solid ${GRID}`,
          }} />
        ))}

        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'flex-end' }}>
          {points.map((point, i) => {
            const isHover = hover === i;
            return (
              // Ushlash maydoni ustundan keng — mayda ustunga ham tegish oson
              <div key={point.label} onMouseEnter={() => setHover(i)}
                style={{
                  flex:1, height:'100%', display:'flex', alignItems:'flex-end', justifyContent:'center',
                  background: isHover ? `${color}12` : 'transparent',
                }}>
                <div style={{
                  // Yonma-yon ustunlar orasida 2px sirt bo'shlig'i qoladi
                  width:'calc(100% - 2px)', maxWidth:24,
                  height:`${(point.value / max) * 100}%`,
                  background:color, borderRadius:'4px 4px 0 0',
                  opacity: hover === null || isHover ? 1 : 0.45,
                  transition:'opacity 0.12s',
                }} />
              </div>
            );
          })}
        </div>

        {/* Ko'rsatkich chizma maydoni ichida — ustun markazi bilan foizda tekislanadi */}
        {active && (
          <div style={{
            position:'absolute', top:2, left:`${((hover! + 0.5) / points.length) * 100}%`,
            transform:'translateX(-50%)',
            background:'#0f172a', color:'#fff', borderRadius:9, padding:'7px 10px', pointerEvents:'none',
            whiteSpace:'nowrap', boxShadow:'0 6px 20px rgba(15,23,42,0.22)', zIndex:5,
          }}>
            <p style={{ fontSize:11, opacity:0.75 }}>{active.fullLabel}</p>
            <p style={{ fontSize:12.5, fontWeight:700, display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:color, display:'inline-block' }} />
              {valueLabel}: {formatNumber(active.value)}
            </p>
          </div>
        )}
      </div>

      <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
        <span style={{ fontSize:10.5, color:INK_MUTED }}>{points[0].fullLabel}</span>
        <span style={{ fontSize:10.5, color:INK_MUTED }}>{points[points.length - 1].fullLabel}</span>
      </div>
    </div>
  );
}

// ------------------------------------------------------------ TypeBreakdown

export interface BreakdownRow {
  label: string;
  value: number;
  color: string;
}

/**
 * Turlar bo'yicha taqsimot — gorizontal ustunlar.
 * Doiraviy diagramma emas: 4 ta yaqin qiymatni burchak bo'yicha taqqoslab
 * bo'lmaydi, uzunlik esa bir qarashda o'qiladi.
 */
export function TypeBreakdown({ rows, emptyText }: { rows: BreakdownRow[]; emptyText: string }): React.ReactElement {
  const max = Math.max(...rows.map((r) => r.value), 1);

  if (!rows.length) {
    return <p style={{ fontSize:13, color:INK_MUTED }}>{emptyText}</p>;
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {rows.map((row) => (
        <div key={row.label}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
            <span style={{ width:8, height:8, borderRadius:2, background:row.color, flexShrink:0 }} />
            <p style={{ flex:1, minWidth:0, fontSize:12.5, fontWeight:600, color:'#334155' }}>{row.label}</p>
            <p style={{ fontSize:12.5, fontWeight:700, color:'#0f172a', fontVariantNumeric:'tabular-nums' }}>
              {formatNumber(row.value)}
            </p>
          </div>
          <div style={{ height:8, borderRadius:4, background:'#f1f5f9', overflow:'hidden' }}>
            <div style={{ width:`${(row.value / max) * 100}%`, height:'100%', background:row.color, borderRadius:4 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
