import React, { useState } from 'react';
import { m } from 'framer-motion';
import { Building2 } from 'lucide-react';

export interface PartnerCardData {
  id: string | number;
  name: string;
  category: string;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  [key: string]: unknown;
}

interface PartnerCardProps {
  partner: PartnerCardData;
  index?: number;
}

export default function PartnerCard({ partner, index = 0 }: PartnerCardProps): React.ReactElement {
  /**
   * Logotip yuklanmasa zaxira ikonka ko'rsatiladi.
   *
   * Ilgari bu `e.currentTarget.style.display` orqali qilinardi — React
   * komponentni qayta render qilganda o'sha imperativ o'zgarish yo'qolib,
   * buzuq rasm qaytib chiqardi. Holat orqali bu barqaror.
   *
   * Bu real muammo: hamkor logotipi tashqi saytga (masalan Instagram CDN)
   * ishora qilsa, o'sha xizmat begona saytdan yuklashni bloklaydi (403).
   */
  const [logoFailed, setLogoFailed] = useState(false);
  const showLogo = Boolean(partner.logoUrl) && !logoFailed;

  const content = (
    <m.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, margin:'-30px' }}
      transition={{ duration:0.4, delay:(index%4)*0.08 }} whileHover={{ y:-4 }} className="card"
      style={{ padding:24, display:'flex', flexDirection:'column', alignItems:'center', gap:12, textAlign:'center' }}>
      {showLogo ? (
        <img src={partner.logoUrl!} alt={partner.name}
          onError={() => setLogoFailed(true)}
          style={{ maxWidth:'100%', height:40, objectFit:'contain' }} />
      ) : (
        <div style={{ display:'flex', width:40, height:40, borderRadius:10, alignItems:'center', justifyContent:'center', background:'#f0f9ff', border:'1.5px solid #bae6fd' }}>
          <Building2 size={18} style={{ color:'#0ea5e9' }} />
        </div>
      )}
      <p style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>{partner.name}</p>
      <span className="tag" style={{ background:'#f8fafc', borderColor:'#e2e8f0', color:'#64748b' }}>{partner.category}</span>
    </m.div>
  );

  return partner.websiteUrl
    ? <a href={partner.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none' }}>{content}</a>
    : content;
}
