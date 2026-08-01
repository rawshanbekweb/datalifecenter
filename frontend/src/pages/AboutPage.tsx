import React from 'react';
import { useTranslation } from 'react-i18next';
import About from '../components/About';
import Seo from '../components/common/Seo';

export default function AboutPage(): React.ReactElement {
  const { t } = useTranslation();
  return (
    <>
      <Seo title={t('seo.about.title')} description={t('seo.about.description')} />
      <About/>
    </>
  );
}
