import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp } from 'lucide-react';

import Navbar   from './components/Navbar';
import Hero     from './components/Hero';
import About    from './components/About';
import Courses  from './components/Courses';
import Services from './components/Services';
import Projects from './components/Projects';
import WhyUs   from './components/WhyUs';
import Blog     from './components/Blog';
import Contact  from './components/Contact';
import Footer   from './components/Footer';

function Loader() {
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

function ScrollTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const fn = () => setShow(window.scrollY > 500);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.button initial={{ opacity:0, scale:0.5 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.5 }}
          whileHover={{ scale:1.1 }} whileTap={{ scale:0.92 }}
          onClick={() => window.scrollTo({ top:0, behavior:'smooth' })}
          aria-label="Scroll to top"
          style={{ position:'fixed', bottom:24, right:24, zIndex:99, width:44, height:44, borderRadius:'50%', border:'none', cursor:'pointer', background:'#0f172a', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 20px rgba(0,0,0,0.2)' }}>
          <ChevronUp size={20}/>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <div style={{ minHeight:'100vh', background:'#ffffff' }}>
      <Loader/>
      <Navbar/>
      <main>
        <Hero/>
        <About/>
        <Courses/>
        <Services/>
        <Projects/>
        <WhyUs/>
        <Blog/>
        <Contact/>
      </main>
      <Footer/>
      <ScrollTop/>
    </div>
  );
}
