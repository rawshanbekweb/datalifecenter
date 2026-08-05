import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Heart, Users, GraduationCap, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  getAdminAnalytics, AdminAnalytics, AnalyticsDays, AnalyticsTopItem, EngagementTarget,
} from '../../api/admin';
import { formatNumber, formatDate } from '../../utils/format';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import Loading from '../../components/common/Loading';
import {
  ColumnChart, Sparkline, TypeBreakdown, METRIC_COLORS, MetricKey, ColumnPoint,
} from '../../components/admin/AnalyticsCharts';

const RANGES: AnalyticsDays[] = [7, 30, 90];

interface MetricSpec {
  key: MetricKey;
  labelKey: string;
  icon: React.ComponentType<{ size?: number | string; style?: React.CSSProperties }>;
}

const METRICS: MetricSpec[] = [
  { key:'views',       labelKey:'admin.analytics.views',       icon:Eye },
  { key:'likes',       labelKey:'admin.analytics.likes',       icon:Heart },
  { key:'users',       labelKey:'admin.analytics.newUsers',    icon:Users },
  { key:'enrollments', labelKey:'admin.analytics.enrollments', icon:GraduationCap },
];

// Kontent turi → admin panelidagi bo'lim va tarjima kaliti
const TYPE_META: Record<EngagementTarget, { labelKey: string; to: string; color: string }> = {
  COURSE:      { labelKey:'admin.analytics.typeCourse',      to:'/admin/courses',      color:'#9333ea' },
  BLOG_POST:   { labelKey:'admin.analytics.typePost',        to:'/admin/blog',         color:'#0891b2' },
  PROJECT:     { labelKey:'admin.analytics.typeProject',     to:'/admin/projects',     color:'#16a34a' },
  TESTIMONIAL: { labelKey:'admin.analytics.typeTestimonial', to:'/admin/testimonials', color:'#d97706' },
};

/**
 * O'zgarish foizi. Oldingi davr NOL bo'lsa foiz ma'nosiz (0 dan 5 ga o'sish
 * cheksiz foiz) — bunday holatda null qaytadi va kartada faqat "yangi" belgisi
 * ko'rinadi.
 */
function deltaPercent(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function DeltaBadge({ current, previous, t }: { current: number; previous: number; t: (k: string) => string }): React.ReactElement {
  const percent = deltaPercent(current, previous);

  if (percent === null) {
    const isNew = current > 0;
    return (
      <span style={{ fontSize:11.5, fontWeight:700, color: isNew ? '#16a34a' : '#94a3b8' }}>
        {isNew ? t('admin.analytics.deltaNew') : t('admin.analytics.deltaNone')}
      </span>
    );
  }

  const Icon = percent > 0 ? TrendingUp : percent < 0 ? TrendingDown : Minus;
  const color = percent > 0 ? '#16a34a' : percent < 0 ? '#dc2626' : '#94a3b8';
  return (
    <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11.5, fontWeight:700, color }}>
      <Icon size={12} /> {percent > 0 ? '+' : ''}{percent}%
    </span>
  );
}

export default function AdminAnalyticsPage(): React.ReactElement {
  const { t } = useTranslation();
  const [days, setDays]     = useState<AnalyticsDays>(30);
  const [data, setData]     = useState<AdminAnalytics | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  // Katta grafik bir vaqtda BITTA o'lchovni ko'rsatadi: ko'rish va yozilish
  // miqyoslari o'nlab barobar farq qiladi, bitta o'qda taqqoslash yolg'on chiqardi
  const [metric, setMetric] = useState<MetricKey>('views');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    getAdminAnalytics(days)
      .then((next) => { if (!cancelled) { setData(next); setStatus('ready'); } })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, [days]);

  const rangeSwitcher = (
    <div style={{ display:'flex', gap:6 }}>
      {RANGES.map((option) => (
        <button key={option} onClick={() => setDays(option)}
          style={{
            height:34, padding:'0 14px', borderRadius:9, fontSize:12.5, fontWeight:700, cursor:'pointer',
            border: days === option ? '1.5px solid #0ea5e9' : '1px solid #e2e8f0',
            background: days === option ? '#f0f9ff' : '#fff',
            color: days === option ? '#0284c7' : '#64748b',
          }}>
          {t('admin.analytics.rangeDays', { n: option })}
        </button>
      ))}
    </div>
  );

  return (
    <div>
      <AdminPageHeader title={t('admin.analytics.title')} sub={t('admin.analytics.sub')} actions={rangeSwitcher} />

      {status === 'loading' && <Loading />}
      {status === 'error' && <p style={{ color:'#dc2626', fontSize:14 }}>{t('common.loadFailedBackend')}</p>}

      {status === 'ready' && data && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:14, marginBottom:20 }}>
            {METRICS.map((spec) => {
              const Icon = spec.icon;
              const color = METRIC_COLORS[spec.key];
              const selected = metric === spec.key;
              return (
                <button key={spec.key} onClick={() => setMetric(spec.key)} className="card"
                  style={{
                    padding:18, textAlign:'left', cursor:'pointer', background:'#fff',
                    border: selected ? `1.5px solid ${color}` : '1.5px solid #e2e8f0',
                  }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                    <Icon size={15} style={{ color }} />
                    <p style={{ flex:1, fontSize:12.5, fontWeight:700, color:'#475569' }}>{t(spec.labelKey)}</p>
                    <DeltaBadge current={data.totals[spec.key]} previous={data.previous[spec.key]} t={t} />
                  </div>
                  <p style={{ fontFamily:'var(--font-sans)', fontSize:26, fontWeight:800, color:'#0f172a', lineHeight:1 }}>
                    {formatNumber(data.totals[spec.key])}
                  </p>
                  <p style={{ fontSize:11, color:'#94a3b8', margin:'5px 0 10px' }}>
                    {t('admin.analytics.vsPrevious', { n: formatNumber(data.previous[spec.key]) })}
                  </p>
                  <Sparkline values={data.series.map((point) => point[spec.key])} color={color} />
                </button>
              );
            })}
          </div>

          <div className="card" style={{ padding:20, marginBottom:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
              <span style={{ width:9, height:9, borderRadius:3, background:METRIC_COLORS[metric], flexShrink:0 }} />
              <p style={{ fontSize:14, fontWeight:800, color:'#0f172a' }}>
                {t('admin.analytics.dailyTitle', { metric: t(METRICS.find((m) => m.key === metric)!.labelKey) })}
              </p>
            </div>
            <ColumnChart
              points={toColumnPoints(data, metric)}
              color={METRIC_COLORS[metric]}
              valueLabel={t(METRICS.find((m) => m.key === metric)!.labelKey)}
              emptyText={t('admin.analytics.noData')}
            />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:14 }}>
            <div className="card" style={{ padding:20 }}>
              <p style={{ fontSize:14, fontWeight:800, color:'#0f172a', marginBottom:4 }}>{t('admin.analytics.byTypeTitle')}</p>
              <p style={{ fontSize:11.5, color:'#94a3b8', marginBottom:16 }}>{t('admin.analytics.byTypeSub')}</p>
              <TypeBreakdown
                rows={data.byType.map((row) => ({
                  label: t(TYPE_META[row.type].labelKey),
                  value: row.views,
                  color: TYPE_META[row.type].color,
                }))}
                emptyText={t('admin.analytics.noData')}
              />
            </div>

            <div className="card" style={{ padding:20 }}>
              <p style={{ fontSize:14, fontWeight:800, color:'#0f172a', marginBottom:4 }}>{t('admin.analytics.topTitle')}</p>
              <p style={{ fontSize:11.5, color:'#94a3b8', marginBottom:14 }}>{t('admin.analytics.topSub')}</p>
              {data.topContent.length === 0 && <p style={{ fontSize:13, color:'#94a3b8' }}>{t('admin.analytics.noData')}</p>}
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {data.topContent.map((item, i) => <TopRow key={`${item.type}:${item.id}`} item={item} rank={i + 1} />)}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function TopRow({ item, rank }: { item: AnalyticsTopItem; rank: number }): React.ReactElement {
  const { t } = useTranslation();
  const meta = TYPE_META[item.type];
  return (
    <Link to={meta.to} style={{
      display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:10,
      border:'1px solid #f1f5f9', textDecoration:'none',
    }}>
      <span style={{ fontFamily:'var(--font-mono)', fontSize:11, fontWeight:700, color:'#cbd5e1', flexShrink:0 }}>{rank}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:12.5, fontWeight:600, color:'#334155', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          {item.title}
        </p>
        <p style={{ fontSize:10.5, color:'#94a3b8' }}>{t(meta.labelKey)}</p>
      </div>
      <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11.5, color:'#0891b2', fontWeight:700, flexShrink:0 }}>
        <Eye size={12}/> {formatNumber(item.views)}
      </span>
      <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11.5, color:'#f43f5e', fontWeight:700, flexShrink:0 }}>
        <Heart size={12}/> {formatNumber(item.likes)}
      </span>
    </Link>
  );
}

/** Kunlik qatorni grafik nuqtalariga aylantiradi (sanalar foydalanuvchi tilida) */
function toColumnPoints(data: AdminAnalytics, metric: MetricKey): ColumnPoint[] {
  return data.series.map((point) => ({
    label: point.day,
    fullLabel: formatDate(`${point.day}T00:00:00Z`, { day:'numeric', month:'short' }),
    value: point[metric],
  }));
}
