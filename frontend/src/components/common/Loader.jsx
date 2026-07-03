import { motion } from 'framer-motion';

export default function Loader() {
  return (
    <motion.div initial={{ opacity:1 }} animate={{ opacity:0 }} transition={{ duration:0.6, delay:1.6 }}
      style={{ position:'fixed', inset:0, zIndex:9999, background:'#ffffff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20, pointerEvents:'none' }}>
      <motion.div animate={{ scale:[1,1.08,1] }} transition={{ duration:1, repeat:1 }}
        style={{ width:64, height:64, borderRadius:18, background:'#0ea5e9', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 32px rgba(14,165,233,0.3)' }}>
        <span style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:800, color:'#fff', fontSize:18 }}>DL</span>
      </motion.div>
      <div style={{ width:160, height:3, borderRadius:3, background:'#f1f5f9', overflow:'hidden' }}>
        <motion.div style={{ height:'100%', background:'#0ea5e9', borderRadius:3 }}
          initial={{ width:0 }} animate={{ width:'100%' }} transition={{ duration:1.4, ease:'easeOut' }}/>
      </div>
      <p style={{ fontSize:11, fontFamily:'JetBrains Mono,monospace', color:'#94a3b8', letterSpacing:'0.12em' }}>
        INITIALIZING DATA LIFE...
      </p>
    </motion.div>
  );
}
