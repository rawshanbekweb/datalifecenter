import './index.css'
import './i18n/i18n'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import * as Sentry from '@sentry/react'
import { createAppRouter } from './router'
import { AuthProvider } from './context/AuthContext'
import { LocaleProvider } from './context/LocaleContext'
import { detectLocale } from './i18n/locale'

// VITE_SENTRY_DSN berilgan bo'lsa frontend xatolari Sentry'ga yuboriladi
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
  })
}

const { locale, basename } = detectLocale()
const router = createAppRouter(basename)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocaleProvider locale={locale} basename={basename}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </LocaleProvider>
  </StrictMode>,
)
