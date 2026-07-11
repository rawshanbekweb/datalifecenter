import './index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { LazyMotion } from 'framer-motion'
import { createAppRouter } from './router'
import { AuthProvider } from './context/AuthContext'
import { LocaleProvider } from './context/LocaleContext'
import { detectLocale } from './i18n/locale'
import { initI18n } from './i18n/i18n'

// VITE_SENTRY_DSN berilgan bo'lsa frontend xatolari Sentry'ga yuboriladi.
// Dinamik import — Sentry SDK'si (~90 kB) kirish bundle'iga kirmaydi; SDK
// yuklangunga qadar (~birinchi soniya) yuz bergan xatolar qayd etilmaydi,
// bu ongli tanlov.
if (import.meta.env.VITE_SENTRY_DSN) {
  void import('@sentry/react').then((Sentry) => {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      tracesSampleRate: 0.1,
    })
  })
}

const { locale, basename } = detectLocale()
// SEO va screen-reader'lar uchun hujjat tili URL'dagi localega mos bo'lishi kerak
document.documentElement.lang = locale
const router = createAppRouter(basename)

// Animatsiya dvigateli (domAnimation) alohida chunk'da kechiktirib yuklanadi —
// komponentlar `m.` ishlatadi, dvigatel kelguncha kontent statik ko'rinadi
const loadMotionFeatures = () => import('./motionFeatures').then((mod) => mod.default)

function mount(): void {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <LazyMotion features={loadMotionFeatures}>
        <LocaleProvider locale={locale} basename={basename}>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </LocaleProvider>
      </LazyMotion>
    </StrictMode>,
  )
}

// Tarjimalar yuklanmasidan render qilinsa matnlar kalit ko'rinishida chiqadi —
// shu sabab initI18n kutiladi (faqat faol til + uz fallback yuklanadi).
// Til chunk'i yuklanmasa (tarmoq/eski deploy) ham baribir mount qilamiz:
// i18next fallback kalit yoki matnsiz ishlayveradi — oq ekran ko'rsatilmaydi.
void initI18n(locale).catch(() => undefined).then(mount)
