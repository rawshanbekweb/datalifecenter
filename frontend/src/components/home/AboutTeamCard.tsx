import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TeamMember } from '../../types/team';
import { departmentMeta, initials } from '../team/departments';
import FocusImage from '../common/FocusImage';

/**
 * "Biz haqimizda" bo'limining o'ng ustuni — jamoaning yuzlari.
 *
 * ILGARI bu yerda ko'nikma foizlari ("Backend 85%") va ikkita "mamnunlik"
 * raqami turardi. Ikkalasi ham o'lchanmaydigan, ya'ni ishonchsiz ko'rsatkich
 * edi; ustiga-ustak shu bo'limning O'ZIDA, pastroqda to'rtta statistika
 * kartasi bor — raqam ikki marta takrorlanardi.
 *
 * Yuzlar esa haqiqiy: bazadan keladi, o'zi yangilanadi va "kim o'rgatadi?"
 * degan savolga javob beradi. Jamoa bo'limi bosh sahifada ATAYIN yo'q
 * (HomePage izohiga qarang), shuning uchun bu blok hech narsani takrorlamaydi
 * va to'liq ro'yxatga yo'l ochadi.
 */

/** Kartaga sig'adigan yuzlar soni — qolgani "+N" bo'lib ko'rsatiladi. */
const MAX_FACES = 10;
const FACE_SIZE = 54;

interface AboutTeamCardProps {
  members: TeamMember[];
}

function Face({ member }: { member: TeamMember }): React.ReactElement {
  const theme = departmentMeta(member.department);
  // Rasm yuklanmasa bosh harflar — TeamMemberCard bilan bir xil sabab:
  // bepul hostingda /uploads fayllari deploy oralig'ida yo'qolib ketishi mumkin
  const [photoFailed, setPhotoFailed] = useState<boolean>(false);
  const showPhoto = Boolean(member.photoUrl) && !photoFailed;

  const frame: React.CSSProperties = {
    border: `2px solid ${theme.border}`,
    boxShadow: '0 2px 8px rgba(15,23,42,0.08)',
  };

  return (
    <Link to={`/team/${member.slug}`} title={`${member.name} — ${member.position}`}
      style={{ textDecoration:'none', display:'block' }}>
      {showPhoto ? (
        <FocusImage
          src={member.photoUrl as string}
          alt={member.name}
          size={FACE_SIZE}
          radius="circle"
          focus={member}
          loading="lazy"
          style={frame}
          onError={() => setPhotoFailed(true)}
        />
      ) : (
        <span style={{
          display:'flex', alignItems:'center', justifyContent:'center',
          width:FACE_SIZE, height:FACE_SIZE, borderRadius:'50%',
          background:theme.bg, color:theme.color, fontSize:15, fontWeight:800,
          ...frame,
        }}>
          {initials(member.name)}
        </span>
      )}
    </Link>
  );
}

export default function AboutTeamCard({ members }: AboutTeamCardProps): React.ReactElement {
  const { t } = useTranslation();
  const faces = members.slice(0, MAX_FACES);
  const hidden = members.length - faces.length;

  // Jamoada qaysi yo'nalishlar borligi — takrorlanmagan holda, kirgan tartibda.
  // A'zolar soni emas, TARKIBI ko'rsatiladi: "12 kishi" pastdagi statistika
  // kartasida allaqachon bor.
  const departments = [...new Set(members.map((m) => m.department))]
    .map((d) => t(departmentMeta(d).labelKey));

  return (
    <div className="card" style={{ padding:28, boxShadow:'0 8px 32px rgba(0,0,0,0.08)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
        <img src="/assets/logotype-96.png" alt="DATA LIFE IT Center" width={42} height={42}
          loading="lazy" decoding="async"
          style={{ width:42, height:42, borderRadius:'50%', objectFit:'cover' }} />
        <div>
          <p style={{ fontWeight:700, color:'#0f172a' }}>{t('home.about.team.title')}</p>
          <p style={{ fontSize:11, color:'#0ea5e9', fontFamily:'var(--font-mono)' }}>DATA LIFE</p>
        </div>
      </div>

      <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
        {faces.map((member) => <Face key={member.id} member={member} />)}
        {hidden > 0 && (
          <Link to="/team" aria-label={t('home.about.team.all')}
            style={{
              display:'flex', alignItems:'center', justifyContent:'center',
              width:FACE_SIZE, height:FACE_SIZE, borderRadius:'50%',
              background:'#f1f5f9', border:'2px solid #e2e8f0', color:'#64748b',
              fontSize:13, fontWeight:800, textDecoration:'none',
            }}>
            +{hidden}
          </Link>
        )}
      </div>

      {departments.length > 0 && (
        <p style={{ fontSize:12.5, color:'#94a3b8', lineHeight:1.7, marginTop:18, paddingTop:18, borderTop:'1px solid #f1f5f9' }}>
          {departments.join(' · ')}
        </p>
      )}

      <Link to="/team" className="btn-outline"
        style={{ display:'inline-flex', alignItems:'center', gap:8, marginTop:18, fontSize:13, padding:'9px 16px', textDecoration:'none' }}>
        {t('home.about.team.all')} <ArrowRight size={14} />
      </Link>
    </div>
  );
}
