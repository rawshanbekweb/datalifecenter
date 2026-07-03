import { motion } from 'framer-motion';

export default function SectionHeader({ pill, title, accent, sub }) {
  return (
    <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
      style={{ textAlign:'center', marginBottom:52 }}>
      <span className="pill">{pill}</span>
      <h2 className="h-section" style={{ marginBottom:10 }}>{title} <span className="accent">{accent}</span></h2>
      {sub && <p className="sub">{sub}</p>}
    </motion.div>
  );
}
