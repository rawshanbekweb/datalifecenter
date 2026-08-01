import React, { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import Hero from '../components/Hero';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { lazyWithRetry } from '../utils/lazyWithRetry';
import Seo from '../components/common/Seo';
import JsonLd from '../components/common/JsonLd';
import { SITE_URL } from '../api/config';

// Hero'dan pastdagi seksiyalar alohida chunk'larda — kirish bundle'i faqat
// birinchi ekranda ko'rinadigan kodni olib keladi, qolganlari parallel yuklanadi.
const About = lazyWithRetry(() => import('../components/About'));
const Courses = lazyWithRetry(() => import('../components/Courses'));
const Services = lazyWithRetry(() => import('../components/Services'));
const Projects = lazyWithRetry(() => import('../components/Projects'));
const WhyUs = lazyWithRetry(() => import('../components/WhyUs'));
const Testimonials = lazyWithRetry(() => import('../components/Testimonials'));
const Blog = lazyWithRetry(() => import('../components/Blog'));
const Contact = lazyWithRetry(() => import('../components/Contact'));

// anchorId: seksiya chunk'i hali kelmagan qisqa oraliqda ham #contact kabi
// havolalar ishlashi uchun placeholder o'sha id'ni ushlab turadi
function SectionFallback({ anchorId }: { anchorId?: string }): React.ReactElement {
  return <div id={anchorId} style={{ minHeight: 280 }} />;
}

function s(el: React.ReactElement, anchorId?: string): React.ReactElement {
  return <Suspense fallback={<SectionFallback anchorId={anchorId} />}>{el}</Suspense>;
}

export default function HomePage(): React.ReactElement {
  const settings = useSiteSettings();
  const { t } = useTranslation();

  return (
    <>
      {/* Bosh sahifada sarlavha berilmaydi — brendning to'liq nomi qoladi */}
      <Seo description={t('seo.home.description')} />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'EducationalOrganization',
          name: 'DATA LIFE',
          url: SITE_URL,
          logo: `${SITE_URL}/assets/logotype.png`,
          description: t('seo.home.description'),
        }}
      />
      <Hero settings={settings.hero} />
      {s(<About settings={settings.about} />, 'about')}
      {s(<Courses />, 'courses')}
      {s(<Services settings={settings.services} />, 'services')}
      {s(<Projects />, 'projects')}
      {s(<WhyUs settings={settings.why_us} />, 'why-us')}
      {s(<Testimonials />, 'testimonials')}
      {s(<Blog />, 'blog')}
      {s(<Contact settings={settings.contact} />, 'contact')}
    </>
  );
}
