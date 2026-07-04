import React from 'react';
import Hero from '../components/Hero';
import About from '../components/About';
import Courses from '../components/Courses';
import Services from '../components/Services';
import Projects from '../components/Projects';
import WhyUs from '../components/WhyUs';
import Blog from '../components/Blog';
import Contact from '../components/Contact';

export default function HomePage(): React.ReactElement {
  return (
    <>
      <Hero/>
      <About/>
      <Courses/>
      <Services/>
      <Projects/>
      <WhyUs/>
      <Blog/>
      <Contact/>
    </>
  );
}
