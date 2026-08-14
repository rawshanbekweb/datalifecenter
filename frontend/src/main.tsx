import './index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { LazyMotion } from 'framer-motion'
import { createAppRouter } from './router'
import { FeedbackProvider } from './components/common/Feedback'
import ServerWakeBanner from './components/common/ServerWakeBanner'
import SessionKeepAlive from './components/common/SessionKeepAlive'
import { AuthProvider } from './context/AuthContext'
import EngagementProvider from './context/EngagementProvider'
import { LocaleProvider } from './context/LocaleContext'
import { canonicalizeDefaultLocalePath, detectLocale } from './i18n/locale'
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

// Eski /kaa/... havolalari (asosiy til prefiksli edi) prefikssiz shaklga
// keltiriladi — router yaratilishidan OLDIN, aks holda basename mos kelmasdi
canonicalizeDefaultLocalePath()
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
            <FeedbackProvider>
              {/* Yoqtirish/ko'rish hisoblagichlari — barcha sahifalarda
                  ko'rinadigani uchun router'dan tashqarida turadi */}
              <EngagementProvider>
                <RouterProvider router={router} />
              </EngagementProvider>
              <ServerWakeBanner />
              {/* Seansni tirik ushlab turadi (ko'rinmas) */}
              <SessionKeepAlive />
            </FeedbackProvider>
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
