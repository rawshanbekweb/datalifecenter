/**
 * Kirish splash ekrani — ATAYIN sof CSS animatsiyasida.
 *
 * Ilgari bu framer-motion (`m.div`) bilan yozilgan edi va shu sabab jiddiy
 * xavf bor edi: `m.` komponentlari animatsiya dvigateli (LazyMotion features
 * chunk'i) yuklanmaguncha `initial` holatida qotib turadi. Ya'ni dvigatel
 * chunk'i kech kelsa yoki umuman kelmasa (eski keshlangan index.html yangi
 * deploy'dan keyin mavjud bo'lmagan chunk'ni so'raydi — tez-tez uchraydi)
 * oq qoplama HECH QACHON yo'qolmasdi va sayt butunlay oq ekran bo'lib qolardi.
 * CSS animatsiyasi hech qanday JS'ga bog'liq emas — brauzer uni doim tugatadi.
 *
 * Shu sababdan bu yerda hech qachon JS animatsiya kutubxonasi ishlatilmasin.
 *
 * Davomiylik qisqa (~1.15s): splash kontent tayyorligini kutmaydi, shunchaki
 * bezak — uzoq turishi qayta tashriflarda sayt sekin ishlayotgandek taassurot
 * qoldirardi.
 */

import { Z } from '../../utils/zLayers';

// Harflar bittalab chiqishi uchun massiv sifatida beriladi. Bo'sh joy alohida
// element bo'lib qoladi — u ham umumiy kechikish ritmini saqlaydi.
const TITLE = [...'DATA LIFE'];

export default function Loader(): React.ReactElement {
  return (
    <div className="dl-splash" aria-hidden="true">
      <style>{`
        @keyframes dl-splash-out { to { opacity: 0; visibility: hidden; } }
        @keyframes dl-splash-bar { from { width: 0 } to { width: 100% } }
        /* Logo atrofidagi halqa: nur tarqalib so'nadi — "signal uzatilyapti" hissi */
        @keyframes dl-splash-ring {
          0%   { transform: scale(.8); opacity: .55; }
          100% { transform: scale(1.9); opacity: 0; }
        }
        @keyframes dl-splash-logo {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.06); }
        }
        /* Har bir harf pastdan ko'tarilib paydo bo'ladi */
        @keyframes dl-splash-char {
          from { opacity: 0; transform: translateY(9px); }
          to   { opacity: 1; transform: none; }
        }
        /* Ma'lumot zarrachalari yuqoriga oqadi */
        @keyframes dl-splash-dot {
          0%   { opacity: 0; transform: translateY(10px); }
          35%  { opacity: 1; }
          100% { opacity: 0; transform: translateY(-16px); }
        }
        @keyframes dl-splash-caret { 50% { opacity: 0; } }

        .dl-splash {
          position: fixed; inset: 0; z-index: ${Z.splash};
          background: #fff;
          /* Nozik "data grid" fon — texnologik his beradi, lekin oq saytdan
             ajralib turmaydi, shuning uchun splash yo'qolganda sakrash bo'lmaydi */
          background-image:
            linear-gradient(rgba(14,165,233,.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(14,165,233,.055) 1px, transparent 1px);
          background-size: 44px 44px;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 18px; pointer-events: none;
          animation: dl-splash-out .45s ease-out .7s forwards;
        }

        .dl-splash__badge { position: relative; display: grid; place-items: center; }
        .dl-splash__badge::before,
        .dl-splash__badge::after {
          content: ''; position: absolute; inset: 0;
          border-radius: 20px; border: 1.5px solid #0ea5e9;
          animation: dl-splash-ring 1.6s ease-out infinite;
        }
        .dl-splash__badge::after { animation-delay: .55s; }

        .dl-splash__logo {
          position: relative; z-index: 1;
          width: 64px; height: 64px; border-radius: 18px; overflow: hidden;
          box-shadow: 0 8px 32px rgba(14,165,233,.3);
          animation: dl-splash-logo 1.6s ease-in-out infinite;
        }
        .dl-splash__logo img { width: 100%; height: 100%; object-fit: cover; display: block; }

        .dl-splash__title {
          display: flex; gap: 1px;
          font-family: var(--font-sans);
          font-size: 19px; font-weight: 800; letter-spacing: .34em;
          color: #0f172a;
          /* letter-spacing oxirgi harfdan keyin ham bo'shliq qo'shadi —
             matn optik markazda turishi uchun shuni qoplaymiz */
          text-indent: .34em;
        }
        .dl-splash__char {
          opacity: 0;
          animation: dl-splash-char .32s ease-out forwards;
        }
        .dl-splash__char--space { width: .4em; }

        .dl-splash__track {
          width: 190px; height: 3px; border-radius: 3px; background: #e8f4fb; overflow: hidden;
        }
        .dl-splash__bar {
          height: 100%; border-radius: 3px;
          background: linear-gradient(90deg, #0ea5e9, #6366f1);
          animation: dl-splash-bar .95s cubic-bezier(.4,0,.2,1) forwards;
        }

        .dl-splash__dots { display: flex; gap: 7px; height: 6px; }
        .dl-splash__dot {
          width: 4px; height: 4px; border-radius: 50%; background: #7dd3fc;
          animation: dl-splash-dot 1.1s ease-out infinite;
        }

        .dl-splash__label {
          display: flex; align-items: center; gap: 2px;
          font-size: 11px; font-family: var(--font-mono); color: #94a3b8; letter-spacing: .1em;
        }
        .dl-splash__caret {
          display: inline-block; width: 6px; height: 11px; background: #0ea5e9;
          animation: dl-splash-caret .8s steps(1) infinite;
        }

        /* Animatsiyani o'chirganlarda (Windows'da "Animatsiya effektlari"
           o'chiq bo'lsa ham shu rejim yoqiladi — bu juda keng tarqalgan)
           splash BUTUNLAY YASHIRILMAYDI, faqat harakat olib tashlanadi:
           logo pulsi, halqalar, harflarning chiqishi va zarrachalar o'rniga
           tayyor holat ko'rsatiladi.

           Yo'qolish uchun opacity animatsiyasi ATAYIN qoldirilgan — u
           harakat emas, va usiz qoplama ekranda abadiy qolib ketardi.
           Animatsiyasi o'chirilgan elementlarga yakuniy holat qo'lda
           beriladi, aks holda ular "opacity: 0" da qotib qolardi. */
        @media (prefers-reduced-motion: reduce) {
          .dl-splash { animation: dl-splash-out .3s linear .7s forwards; }
          .dl-splash__badge::before,
          .dl-splash__badge::after { display: none; }
          .dl-splash__logo { animation: none; }
          .dl-splash__char { opacity: 1; animation: none; transform: none; }
          .dl-splash__bar { width: 100%; animation: none; }
          .dl-splash__dot { opacity: 1; animation: none; transform: none; }
          .dl-splash__caret { animation: none; }
        }
      `}</style>

      <div className="dl-splash__badge">
        <div className="dl-splash__logo">
          <img src="/assets/favicon.jpg" alt="" />
        </div>
      </div>

      <p className="dl-splash__title">
        {TITLE.map((char, i) => (
          <span
            key={i}
            className={`dl-splash__char${char === ' ' ? ' dl-splash__char--space' : ''}`}
            // Harflar ketma-ket chiqishi — ritm shu kechikishdan hosil bo'ladi
            style={{ animationDelay: `${0.05 + i * 0.045}s` }}
          >
            {char === ' ' ? ' ' : char}
          </span>
        ))}
      </p>

      <div className="dl-splash__track"><div className="dl-splash__bar" /></div>

      <div className="dl-splash__dots">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="dl-splash__dot" style={{ animationDelay: `${i * 0.14}s` }} />
        ))}
      </div>

      <p className="dl-splash__label">
        &gt;&nbsp;initializing<span className="dl-splash__caret" />
      </p>
    </div>
  );
}
