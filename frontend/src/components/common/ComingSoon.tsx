import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Construction } from 'lucide-react';

interface ComingSoonProps {
  title: string;
  sub: string;
}

export default function ComingSoon({ title, sub }: ComingSoonProps): React.ReactElement {
  return (
    <section style={{ minHeight:'70vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'160px 24px 80px' }}>
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        style={{ textAlign:'center', maxWidth:480 }}>
        <div className="icon-box" style={{ margin:'0 auto 20px' }}>
          <Construction size={20} style={{ color:'#0ea5e9' }} />
        </div>
        <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:'clamp(28px,4vw,38px)', fontWeight:800, color:'#0f172a', marginBottom:10 }}>
          {title}
        </h1>
        <p style={{ color:'#64748b', fontSize:15, lineHeight:1.75, marginBottom:28 }}>{sub}</p>
        <Link to="/">
          <button className="btn-outline" style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
            <ArrowLeft size={15}/> Bosh sahifaga qaytish
          </button>
        </Link>
      </motion.div>
    </section>
  );
}
