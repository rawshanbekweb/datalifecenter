import React from 'react';
import Hero from '../components/Hero';
import About from '../components/About';
import Courses from '../components/Courses';
import Services from '../components/Services';
import Projects from '../components/Projects';
import WhyUs from '../components/WhyUs';
import Testimonials from '../components/Testimonials';
import Blog from '../components/Blog';
import Contact from '../components/Contact';
import { useSiteSettings } from '../hooks/useSiteSettings';

export default function HomePage(): React.ReactElement {
  const settings = useSiteSettings();

  return (
    <>
      <Hero settings={settings.hero} />
      <About settings={settings.about} />
      <Courses/>
      <Services settings={settings.services} />
      <Projects/>
      <WhyUs settings={settings.why_us} />
      <Testimonials/>
      <Blog/>
      <Contact settings={settings.contact} />
    </>
  );
}
