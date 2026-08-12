import React from 'react';

/**
 * Dars matnini formatlab ko'rsatadi: sarlavhalar, ro'yxatlar, kod bloklari,
 * havolalar, qalin/qiyshiq matn.
 *
 * NEGA O'Z RENDERERI: sayt bo'ylab tashqi markdown kutubxonasi ishlatilmaydi,
 * kerak bo'ladigan belgilar esa sanoqli — kutubxona bundle'ga bir necha o'n
 * kilobayt qo'shardi. Muhimi: bu yerda `dangerouslySetInnerHTML` YO'Q, hamma
 * narsa React elementiga aylantiriladi. Ya'ni mentor yozgan matn orqali HTML
 * yoki skript in'ektsiya qilib bo'lmaydi.
 */

const CODE_BLOCK: React.CSSProperties = {
  display: 'block', padding: '14px 16px', borderRadius: 12, background: '#0f172a', color: '#e2e8f0',
  fontFamily: 'var(--font-mono)', fontSize: 12.5, lineHeight: 1.75, overflowX: 'auto', whiteSpace: 'pre',
};

const CODE_INLINE: React.CSSProperties = {
  padding: '2px 6px', borderRadius: 6, background: '#f1f5f9', color: '#0f172a',
  fontFamily: 'var(--font-mono)', fontSize: 12.5,
};

const HEADING_SIZE = [17, 15.5, 14.5];

// Qalin, qiyshiq, kod va havola — bir o'tishda ajratiladi
const INLINE = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`\n]+`|\[[^\]]+\]\([^)\s]+\))/g;

// `javascript:` kabi manzillar o'tkazilmaydi
function isSafeHref(href: string): boolean {
  return /^(https?:\/\/|\/|mailto:|tel:)/i.test(href);
}

function renderInline(text: string, keyBase: string): React.ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    const key = `${keyBase}-${i}`;
    if (!part) return null;
    if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) {
      return <strong key={key} style={{ fontWeight: 800, color: '#0f172a' }}>{part.slice(2, -2)}</strong>;
    }
    if (part.length > 2 && part.startsWith('`') && part.endsWith('`')) {
      return <code key={key} style={CODE_INLINE}>{part.slice(1, -1)}</code>;
    }
    if (part.length > 2 && part.startsWith('*') && part.endsWith('*')) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('[')) {
      const m = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
      if (m && isSafeHref(m[2])) {
        return (
          <a key={key} href={m[2]} target="_blank" rel="noreferrer noopener"
            style={{ color: '#0284c7', fontWeight: 600, textDecoration: 'underline' }}>
            {m[1]}
          </a>
        );
      }
    }
    return part;
  });
}

export default function LessonContent({ text }: { text: string }): React.ReactElement {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // ``` bilan o'ralgan kod bloki
    if (line.trimStart().startsWith('```')) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        body.push(lines[i]);
        i++;
      }
      i++; // yopuvchi ```
      blocks.push(<pre key={`c${blocks.length}`} style={{ margin: '0 0 14px' }}><code style={CODE_BLOCK}>{body.join('\n')}</code></pre>);
      continue;
    }

    // # / ## / ### sarlavhalar.
    //
    // h3'dan boshlanadi: sahifada h1 — kurs nomi, h2 — dars nomi. Kontent
    // ichidagi sarlavha ulardan past turishi kerak, aks holda ekran
    // o'quvchisidagi sahifa tuzilishi buziladi.
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const key = `h${blocks.length}`;
      blocks.push(
        React.createElement(
          `h${level + 2}`,
          {
            key,
            style: { fontFamily: 'var(--font-sans)', fontSize: HEADING_SIZE[level - 1], fontWeight: 800, color: '#0f172a', margin: '18px 0 8px' },
          },
          renderInline(heading[2], key)
        )
      );
      i++;
      continue;
    }

    // Belgili yoki raqamli ro'yxat — ketma-ket qatorlar bitta ro'yxatga yig'iladi
    const isBullet = (s: string): boolean => /^\s*[-*+]\s+/.test(s);
    const isNumber = (s: string): boolean => /^\s*\d+[.)]\s+/.test(s);
    if (isBullet(line) || isNumber(line)) {
      const ordered = isNumber(line);
      const items: string[] = [];
      while (i < lines.length && (ordered ? isNumber(lines[i]) : isBullet(lines[i]))) {
        items.push(lines[i].replace(ordered ? /^\s*\d+[.)]\s+/ : /^\s*[-*+]\s+/, ''));
        i++;
      }
      const key = `l${blocks.length}`;
      const listStyle: React.CSSProperties = { margin: '0 0 14px', paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 5 };
      const children = items.map((item, n) => (
        <li key={`${key}-${n}`} style={{ listStyleType: ordered ? 'decimal' : 'disc' }}>{renderInline(item, `${key}-${n}`)}</li>
      ));
      blocks.push(ordered ? <ol key={key} style={listStyle}>{children}</ol> : <ul key={key} style={listStyle}>{children}</ul>);
      continue;
    }

    // > iqtibos
    if (/^\s*>\s?/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        quote.push(lines[i].replace(/^\s*>\s?/, ''));
        i++;
      }
      blocks.push(
        <blockquote key={`q${blocks.length}`}
          style={{ margin: '0 0 14px', padding: '10px 14px', borderLeft: '3px solid #cbd5e1', background: '#f8fafc', borderRadius: '0 10px 10px 0', color: '#475569' }}>
          {renderInline(quote.join('\n'), `q${blocks.length}`)}
        </blockquote>
      );
      continue;
    }

    // Bo'sh qator — abzatslarni ajratadi
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Oddiy abzats: keyingi bo'sh qatorgacha bo'lgan qatorlar birga qoladi
    const para: string[] = [];
    while (
      i < lines.length && lines[i].trim() !== '' &&
      !lines[i].trimStart().startsWith('```') && !/^(#{1,3})\s+/.test(lines[i]) &&
      !isBullet(lines[i]) && !isNumber(lines[i]) && !/^\s*>\s?/.test(lines[i])
    ) {
      para.push(lines[i]);
      i++;
    }
    blocks.push(
      <p key={`p${blocks.length}`} style={{ margin: '0 0 14px', whiteSpace: 'pre-wrap' }}>
        {renderInline(para.join('\n'), `p${blocks.length}`)}
      </p>
    );
  }

  return <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.9 }}>{blocks}</div>;
}
