import React, { Suspense, lazy } from 'react';
import Hero from '../components/Hero';
import { useSiteSettings } from '../hooks/useSiteSettings';

// Hero'dan pastdagi seksiyalar alohida chunk'larda — kirish bundle'i faqat
// birinchi ekranda ko'rinadigan kodni olib keladi, qolganlari parallel yuklanadi.
const About = lazy(() => import('../components/About'));
const Courses = lazy(() => import('../components/Courses'));
const Services = lazy(() => import('../components/Services'));
const Projects = lazy(() => import('../components/Projects'));
const WhyUs = lazy(() => import('../components/WhyUs'));
const Testimonials = lazy(() => import('../components/Testimonials'));
const Blog = lazy(() => import('../components/Blog'));
const Contact = lazy(() => import('../components/Contact'));

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

  return (
    <>
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
