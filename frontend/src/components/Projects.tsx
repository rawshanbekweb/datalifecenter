import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ExternalLink, GitBranch } from 'lucide-react';
import { listProjects } from '../api/projects';

interface ProjectItem {
  id: string;
  title: string;
  category: string;
  description: string;
  techStack: string[];
  screenshotUrl: string;
  liveUrl?: string | null;
  repoUrl?: string | null;
  liveEmbed: boolean;
  featured: boolean;
}

type Status = 'loading' | 'ready' | 'error';

function hostnameOf(url?: string | null): string {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function ProjCard({ p, i }: { p: ProjectItem; i: number }): React.ReactElement {
  const { t } = useTranslation();
  const host = hostnameOf(p.liveUrl);
  return (
    <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.5, delay: (i % 3) * 0.1 }} className="card"
      style={{ overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' }}>

      {/* Brauzer oynasi ko'rinishidagi skrinshot ramka */}
      <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 12px' }}>
          {(['#f87171', '#fbbf24', '#34d399'] as string[]).map((c: string) => (
            <span key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'inline-block', flexShrink: 0 }} />
          ))}
          {host && (
            <span style={{ marginLeft: 8, fontSize: 10.5, color: '#94a3b8', fontFamily: 'JetBrains Mono,monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {host}
            </span>
          )}
        </div>
        {(() => {
          const isLive = p.liveEmbed && !!p.liveUrl;

          // Skrinshot rejimida butun blok o'zi havola; live iframe rejimida esa
          // iframe pointer-events:none bo'lgani uchun ustiga alohida havola qatlami kerak
          // (aks holda ikkita <a> ichma-ich bo'lib, HTML buzilardi).
          const Wrapper = isLive ? 'div' : (p.liveUrl ? 'a' : 'div');
          const wrapperProps = !isLive && p.liveUrl
            ? { href: p.liveUrl, target: '_blank', rel: 'noopener noreferrer' }
            : {};

          return (
            <Wrapper {...wrapperProps}
              style={{ display: 'block', position: 'relative', aspectRatio: '16/10', overflow: 'hidden', cursor: p.liveUrl ? 'pointer' : 'default', background: '#fff' }}
              className="proj-shot-link">
              {isLive ? (
                <iframe src={p.liveUrl!} title={p.title} loading="lazy" sandbox="allow-scripts allow-same-origin"
                  style={{ width: '100%', height: '100%', border: 'none', display: 'block', pointerEvents: 'none' }} />
              ) : (
                <img src={p.screenshotUrl} alt={p.title} loading="lazy" className="proj-shot-img"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block', transition: 'transform 0.4s ease' }} />
              )}
              {p.liveUrl && (
                isLive ? (
                  <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" className="proj-shot-overlay" style={{
                    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(15,23,42,0.45)', opacity: 0, transition: 'opacity 0.25s', textDecoration: 'none',
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 50, background: '#fff', fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>
                      {t('home.projects.visitSite')} <ExternalLink size={13} />
                    </span>
                  </a>
                ) : (
                  <div className="proj-shot-overlay" style={{
                    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(15,23,42,0.45)', opacity: 0, transition: 'opacity 0.25s',
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 50, background: '#fff', fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>
                      {t('home.projects.visitSite')} <ExternalLink size={13} />
                    </span>
                  </div>
                )
              )}
              {isLive && (
                <span style={{ position: 'absolute', top: 8, right: 8, display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, background: 'rgba(22,163,74,0.92)', color: '#fff', fontSize: 9.5, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono,monospace', pointerEvents: 'none' }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', display: 'inline-block' }} /> Live
                </span>
              )}
            </Wrapper>
          );
        })()}
      </div>

      {/* Kontent */}
      <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <span className="tag" style={{ alignSelf: 'flex-start', marginBottom: 10 }}>{p.category}</span>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>{p.title}</h3>
        <p style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.7, marginBottom: 14, flex: 1 }}>{p.description}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: p.repoUrl || p.liveUrl ? 14 : 0 }}>
          {p.techStack.map((t: string) => (
            <span key={t} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 12, background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', fontFamily: 'JetBrains Mono,monospace' }}>{t}</span>
          ))}
        </div>
        {(p.liveUrl || p.repoUrl) && (
          <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
            {p.liveUrl && (
              <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', flex: 1 }}>
                <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 12, padding: '8px 12px' }}>
                  {t('home.projects.view')} <ExternalLink size={12} />
                </button>
              </a>
            )}
            {p.repoUrl && (
              <a href={p.repoUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <button className="btn-outline" style={{ fontSize: 12, padding: '8px 12px' }}>
                  <GitBranch size={12} />
                </button>
              </a>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function Projects(): React.ReactElement | null {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [status, setStatus]     = useState<Status>('loading');
  // 'ALL' — maxsus qiymat, ko'rsatilganda t('home.projects.all') bilan tarjima qilinadi
  const [active, setActive]     = useState<string>('ALL');

  useEffect(() => {
    let cancelled = false;
    listProjects()
      .then((data: ProjectItem[]) => { if (!cancelled) { setProjects(data); setStatus('ready'); } })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, []);

  const categories = useMemo(() => ['ALL', ...Array.from(new Set(projects.map((p) => p.category)))], [projects]);
  const list = active === 'ALL' ? projects : projects.filter((p) => p.category === active);

  if (status !== 'loading' && projects.length === 0) return null;

  return (
    <section id="projects" className="section-light" style={{ padding: '104px 0' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: 48 }}>
          <span className="pill" style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#16a34a' }}>{t('home.projects.pill')}</span>
          <h2 className="h-section" style={{ marginBottom: 10 }}>{t('home.projects.titleStart')}<span className="accent">{t('home.projects.titleAccent')}</span></h2>
          <p className="sub">{t('home.projects.subtitle')}</p>
        </motion.div>

        {status === 'loading' && <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>{t('common.loading')}</p>}
        {status === 'error' && <p style={{ textAlign: 'center', color: '#dc2626', fontSize: 14 }}>{t('home.projects.loadError')}</p>}

        {status === 'ready' && (
          <>
            {categories.length > 2 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 40 }}>
                {categories.map((c: string) => (
                  <button key={c} onClick={() => setActive(c)} style={{
                    padding: '7px 20px', borderRadius: 50, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.25s',
                    background: active === c ? '#0f172a' : '#fff', color: active === c ? '#fff' : '#475569',
                    border: active === c ? 'none' : '1.5px solid #e2e8f0', boxShadow: active === c ? '0 4px 14px rgba(0,0,0,0.15)' : 'none',
                  }}>
                    {c === 'ALL' ? t('home.projects.all') : c}
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }} className="proj-grid">
              {list.map((p: ProjectItem, i: number) => <ProjCard key={p.id} p={p} i={i} />)}
            </div>
          </>
        )}
      </div>
      <style>{`
        @media(max-width:1024px){.proj-grid{grid-template-columns:1fr 1fr!important}}
        @media(max-width:600px){.proj-grid{grid-template-columns:1fr!important}}
        .proj-shot-link:hover .proj-shot-img{transform:scale(1.06)}
        .proj-shot-link:hover .proj-shot-overlay{opacity:1}
      `}</style>
    </section>
  );
}
