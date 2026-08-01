import React from 'react';
import { useTranslation } from 'react-i18next';
import Contact from '../components/Contact';
import Seo from '../components/common/Seo';

export default function ContactPage(): React.ReactElement {
  const { t } = useTranslation();
  return (
    <>
      <Seo title={t('seo.contact.title')} description={t('seo.contact.description')} />
      <Contact/>
    </>
  );
}
