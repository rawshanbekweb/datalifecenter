import { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { ChevronUp } from 'lucide-react';

export default function ScrollTop(): React.ReactElement {
  const [show, setShow] = useState<boolean>(false);
  useEffect(() => {
    const fn = (): void => setShow(window.scrollY > 500);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <m.button initial={{ opacity:0, scale:0.5 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.5 }}
          whileHover={{ scale:1.1 }} whileTap={{ scale:0.92 }}
          onClick={() => window.scrollTo({ top:0, behavior:'smooth' })}
          aria-label="Scroll to top"
          style={{ position:'fixed', bottom:24, right:24, zIndex:99, width:44, height:44, borderRadius:'50%', border:'none', cursor:'pointer', background:'#0f172a', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 20px rgba(0,0,0,0.2)' }}>
          <ChevronUp size={20}/>
        </m.button>
      )}
    </AnimatePresence>
  );
}
