import React from 'react';
import { useTranslation } from 'react-i18next';
import Contact from '../components/Contact';
import Seo from '../components/common/Seo';
import { useSiteSettings } from '../hooks/useSiteSettings';

export default function ContactPage(): React.ReactElement {
  const { t } = useTranslation();
  // Sozlamalarsiz `<Contact/>` komponentning ichidagi qat'iy fallback
  // qiymatlarini ko'rsatardi: admin sayt sozlamalarida telefon yoki manzilni
  // o'zgartirsa, bosh sahifadagi bo'lim yangilanardi-yu, aynan shu — kontakt
  // sahifasi eski raqamda qolib ketardi.
  const settings = useSiteSettings();
  return (
    <>
      <Seo title={t('seo.contact.title')} description={t('seo.contact.description')} />
      <Contact settings={settings.contact} />
    </>
  );
}
