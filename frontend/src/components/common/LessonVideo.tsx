import { useState } from 'react';
import { Play } from 'lucide-react';

// Dars videosini sayt dizayniga mos ko'rinishda ochadi:
//  - to'g'ridan-to'g'ri fayl (mp4/webm) -> <video>
//  - YouTube -> "facade": avval maxsus muqova (thumbnail + o'z play tugmasi),
//    bosilganda tozalangan parametrli iframe (brend/tavsiyalar kamaytiriladi).
//    Bu ham brend chromesini yashiradi, ham sahifa yuklanishini tezlashtiradi.
//  - Vimeo/boshqa -> tozalangan iframe.

interface ParsedVideo {
  kind: 'file' | 'youtube' | 'vimeo' | 'other';
  embed: string;
  youtubeId?: string;
}

function isDirectFile(url: string): boolean {
  return /\.(mp4|webm)(\?|$)/i.test(url) || url.includes('/uploads/videos/');
}

// Brendi kamaytirilgan YouTube embed parametrlari (rel=0 tavsiyalarni faqat shu
// kanal bilan cheklaydi, iv_load_policy=3 izohlarni yashiradi, modestbranding
// logotipni kichraytiradi). autoplay=1 — foydalanuvchi muqovani bosgani uchun.
const YT_PARAMS = 'autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&color=white&playsinline=1';

function parseVideo(url: string): ParsedVideo | null {
  if (isDirectFile(url)) return { kind: 'file', embed: url };
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v') || u.pathname.match(/^\/(?:shorts|live|embed)\/([\w-]{6,})/)?.[1];
      if (id) return { kind: 'youtube', embed: `https://www.youtube-nocookie.com/embed/${id}`, youtubeId: id };
      return { kind: 'other', embed: url };
    }
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.replace('/', '');
      if (id) return { kind: 'youtube', embed: `https://www.youtube-nocookie.com/embed/${id}`, youtubeId: id };
    }
    if (u.hostname.includes('vimeo.com') && !u.hostname.includes('player.')) {
      const id = u.pathname.match(/\/(\d+)/)?.[1];
      return { kind: 'vimeo', embed: id ? `https://player.vimeo.com/video/${id}` : url };
    }
    return { kind: 'other', embed: url };
  } catch {
    return null;
  }
}

const FRAME: React.CSSProperties = { borderRadius: 14, overflow: 'hidden', background: '#0f172a', marginBottom: 18 };

export default function LessonVideo({ url, title }: { url: string; title: string }): React.ReactElement | null {
  const [playing, setPlaying] = useState(false);
  const v = parseVideo(url);
  if (!v) return null;

  if (v.kind === 'file') {
    return (
      <div style={FRAME}>
        <video src={v.embed} controls controlsList="nodownload" playsInline
          style={{ display: 'block', width: '100%', maxHeight: 480 }} />
      </div>
    );
  }

  // YouTube facade — muqova bosilmaguncha iframe yuklanmaydi
  if (v.kind === 'youtube' && !playing) {
    const thumb = `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`;
    return (
      <button type="button" onClick={() => setPlaying(true)} aria-label={title} className="lesson-video-facade"
        style={{ ...FRAME, position: 'relative', paddingTop: '56.25%', width: '100%', border: 'none', cursor: 'pointer', padding: 0 }}>
        <img src={thumb} alt={title} loading="lazy"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,23,42,0.55), rgba(15,23,42,0.15))' }} />
        <span className="lesson-video-play"
          style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 66, height: 66, borderRadius: '50%', background: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 30px rgba(14,165,233,0.5)', transition: 'transform 0.2s, background 0.2s' }}>
          <Play size={26} fill="#fff" style={{ color: '#fff', marginLeft: 3 }} />
        </span>
        <style>{`
          .lesson-video-facade:hover .lesson-video-play{transform:translate(-50%,-50%) scale(1.08);background:#0284c7}
        `}</style>
      </button>
    );
  }

  const src = v.kind === 'youtube' ? `${v.embed}?${YT_PARAMS}` : v.embed;
  return (
    <div style={{ ...FRAME, position: 'relative', paddingTop: '56.25%' }}>
      <iframe src={src} title={title} allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }} />
    </div>
  );
}
