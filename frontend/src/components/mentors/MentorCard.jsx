import { motion } from 'framer-motion';
import { GitBranch, Briefcase, Send } from 'lucide-react';

const PALETTE = [
  { color:'#0ea5e9', bg:'#f0f9ff', border:'#bae6fd' },
  { color:'#9333ea', bg:'#faf5ff', border:'#e9d5ff' },
  { color:'#16a34a', bg:'#f0fdf4', border:'#bbf7d0' },
  { color:'#d97706', bg:'#fffbeb', border:'#fde68a' },
  { color:'#db2777', bg:'#fdf2f8', border:'#fbcfe8' },
];

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function MentorCard({ mentor, index = 0 }) {
  const theme = PALETTE[index % PALETTE.length];
  const socials = [
    mentor.githubUrl && { icon: GitBranch, href: mentor.githubUrl },
    mentor.linkedinUrl && { icon: Briefcase, href: mentor.linkedinUrl },
    mentor.telegramUrl && { icon: Send, href: mentor.telegramUrl },
  ].filter(Boolean);

  return (
    <motion.div initial={{ opacity:0, y:28 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, margin:'-30px' }}
      transition={{ duration:0.5, delay:(index%3)*0.1 }} className="card"
      style={{ padding:24, textAlign:'center', background:theme.bg, border:`1.5px solid ${theme.border}` }}>

      {mentor.photoUrl ? (
        <img src={mentor.photoUrl} alt={mentor.name} onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
          style={{ width:72, height:72, borderRadius:'50%', objectFit:'cover', margin:'0 auto 16px', border:`2px solid ${theme.border}` }} />
      ) : null}
      <div style={{ display: mentor.photoUrl ? 'none' : 'flex', width:72, height:72, borderRadius:'50%', margin:'0 auto 16px', alignItems:'center', justifyContent:'center', background:'#fff', border:`2px solid ${theme.border}`, fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:22, color:theme.color }}>
        {initials(mentor.name)}
      </div>

      <h3 style={{ fontSize:16, fontWeight:800, color:'#0f172a', marginBottom:3 }}>{mentor.name}</h3>
      <p style={{ fontSize:12, color:theme.color, fontWeight:700, marginBottom:12 }}>{mentor.specialty}</p>
      <p style={{ fontSize:13, color:'#64748b', lineHeight:1.75, marginBottom:14 }}>{mentor.bio}</p>

      {mentor.courses?.length > 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:5, justifyContent:'center', marginBottom:14 }}>
          {mentor.courses.map(c => <span key={c.id} className="tag" style={{ background:'#fff', borderColor:theme.border, color:theme.color }}>{c.title}</span>)}
        </div>
      )}

      {socials.length > 0 && (
        <div style={{ display:'flex', gap:8, justifyContent:'center', paddingTop:14, borderTop:`1px solid ${theme.border}` }}>
          {socials.map(({ icon:Icon, href }, i) => (
            <a key={i} href={href} target="_blank" rel="noopener noreferrer"
              style={{ width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', background:'#fff', border:`1px solid ${theme.border}`, color:theme.color, textDecoration:'none' }}>
              <Icon size={14}/>
            </a>
          ))}
        </div>
      )}
    </motion.div>
  );
}
