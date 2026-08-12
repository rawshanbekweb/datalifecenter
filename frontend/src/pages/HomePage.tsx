import React from 'react';
import { useTranslation } from 'react-i18next';
import Hero from '../components/Hero';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { lazyWithRetry } from '../utils/lazyWithRetry';
import LazySection from '../components/common/LazySection';
import Seo from '../components/common/Seo';
import JsonLd from '../components/common/JsonLd';
import { SITE_URL } from '../api/config';

// Hero'dan pastdagi seksiyalar alohida chunk'larda — kirish bundle'i faqat
// birinchi ekranda ko'rinadigan kodni olib keladi. Chunk'lar sahifa bilan
// birga emas, LazySection orqali ekranga yaqinlashganda tortiladi.
const About = lazyWithRetry(() => import('../components/About'));
const Courses = lazyWithRetry(() => import('../components/Courses'));
const Mentors = lazyWithRetry(() => import('../components/Mentors'));
const Services = lazyWithRetry(() => import('../components/Services'));
const Projects = lazyWithRetry(() => import('../components/Projects'));
const WhyUs = lazyWithRetry(() => import('../components/WhyUs'));
const Testimonials = lazyWithRetry(() => import('../components/Testimonials'));
const Blog = lazyWithRetry(() => import('../components/Blog'));
const Contact = lazyWithRetry(() => import('../components/Contact'));

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
      <LazySection anchorId="about"><About settings={settings.about} /></LazySection>
      <LazySection anchorId="courses"><Courses /></LazySection>
      {/* Kurslardan keyin: tashrifchi avval nimani o'rganishini, so'ng kim
          o'rgatishini ko'radi. Jamoa (xodimlar) bo'limi bosh sahifada
          ATAYIN yo'q — to'liq ro'yxat /team sahifasida. */}
      <LazySection anchorId="mentors"><Mentors /></LazySection>
      <LazySection anchorId="services"><Services settings={settings.services} /></LazySection>
      <LazySection anchorId="projects"><Projects /></LazySection>
      <LazySection anchorId="why-us"><WhyUs settings={settings.why_us} /></LazySection>
      <LazySection anchorId="testimonials"><Testimonials /></LazySection>
      <LazySection anchorId="blog"><Blog /></LazySection>
      <LazySection anchorId="contact"><Contact settings={settings.contact} /></LazySection>
    </>
  );
}
