import { motion } from 'framer-motion';
import { Building2 } from 'lucide-react';

export default function PartnerCard({ partner, index = 0 }) {
  const content = (
    <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, margin:'-30px' }}
      transition={{ duration:0.4, delay:(index%4)*0.08 }} whileHover={{ y:-4 }} className="card"
      style={{ padding:24, display:'flex', flexDirection:'column', alignItems:'center', gap:12, textAlign:'center' }}>
      {partner.logoUrl ? (
        <img src={partner.logoUrl} alt={partner.name}
          onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
          style={{ maxWidth:'100%', height:40, objectFit:'contain' }} />
      ) : null}
      <div style={{ display: partner.logoUrl ? 'none' : 'flex', width:40, height:40, borderRadius:10, alignItems:'center', justifyContent:'center', background:'#f0f9ff', border:'1.5px solid #bae6fd' }}>
        <Building2 size={18} style={{ color:'#0ea5e9' }} />
      </div>
      <p style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>{partner.name}</p>
      <span className="tag" style={{ background:'#f8fafc', borderColor:'#e2e8f0', color:'#64748b' }}>{partner.category}</span>
    </motion.div>
  );

  return partner.websiteUrl
    ? <a href={partner.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none' }}>{content}</a>
    : content;
}
