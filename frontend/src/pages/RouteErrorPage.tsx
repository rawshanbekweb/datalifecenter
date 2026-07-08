import { useRouteError } from 'react-router-dom';

// Bu sahifa boshqa hamma narsa qulaganda ham chizilishi kerak, shuning uchun
// lucide-react, framer-motion va Link ishlatilmaydi — faqat oddiy HTML.
export default function RouteErrorPage(): React.ReactElement {
  const error = useRouteError();
  const message = error instanceof Error ? error.message : String(error ?? '');

  return (
    <section style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'80px 24px' }}>
      <div style={{ textAlign:'center', maxWidth:520 }}>
        <div style={{ fontSize:36, marginBottom:16 }}>⚠️</div>
        <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:'clamp(28px,4vw,38px)', fontWeight:800, color:'#0f172a', marginBottom:10 }}>
          Kutilmagan xatolik yuz berdi
        </h1>
        <p style={{ color:'#64748b', fontSize:15, lineHeight:1.75, marginBottom:12 }}>
          Sahifani qayta yuklab ko'ring. Muammo takrorlansa, brauzer kengaytmalarini o'chirib yoki inkognito oynasida ochib ko'ring.
        </p>
        {message && (
          <p style={{ color:'#94a3b8', fontSize:13, fontFamily:'monospace', marginBottom:28, wordBreak:'break-word' }}>{message}</p>
        )}
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <button className="btn-outline" onClick={() => window.location.reload()}>
            Qayta yuklash
          </button>
          <a href="/">
            <button className="btn-outline">Bosh sahifaga qaytish</button>
          </a>
        </div>
      </div>
    </section>
  );
}
